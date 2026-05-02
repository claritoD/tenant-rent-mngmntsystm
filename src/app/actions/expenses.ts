'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addExpense(formData: FormData) {
  try {
    const supabase = await createClient();

    const amount = parseFloat(formData.get('amount') as string);
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const date = formData.get('date') as string;

    if (isNaN(amount) || !description || !category || !date) {
      throw new Error('All fields are required.');
    }

    const { error } = await supabase.from('expenses').insert({
      amount,
      description,
      category,
      date
    });

    if (error) throw error;

    revalidatePath('/owner/expenses');
    revalidatePath('/owner'); // for dashboard charts later
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

export async function deleteExpense(expenseId: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
    if (error) throw error;
    revalidatePath('/owner/expenses');
    revalidatePath('/owner');
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}
