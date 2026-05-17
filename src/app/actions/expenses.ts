'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addExpense(formData: FormData) {
  try {
    const supabase: any = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== 'owner') throw new Error('Unauthorized');

    const amount = parseFloat(formData.get('amount') as string);
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const date = formData.get('date') as string;

    if (isNaN(amount) || !description || !category || !date) {
      throw new Error('All fields are required.');
    }

    const { error } = await (supabase as any).from('expenses').insert({
      amount,
      description,
      category: category as 'Repair' | 'Tax' | 'Utility' | 'Supplies' | 'Other',
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
    const supabase: any = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== 'owner') throw new Error('Unauthorized');
    const { error } = await (supabase as any).from('expenses').delete().eq('id', expenseId);
    if (error) throw error;
    revalidatePath('/owner/expenses');
    revalidatePath('/owner');
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}
