'use client';

import { useState, useEffect } from 'react';
import { Building, Plus, X, Trash2, Edit2, Check } from 'lucide-react';
import { createProperty, updateProperty, deleteProperty } from '@/app/actions/properties';
import { createClient } from '@/lib/supabase/client';
import type { Property } from '@/types/database.types';

export function PropertyManager() {
  const [open, setOpen] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (open) loadProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function loadProperties() {
    const { data } = await supabase.from('properties').select('*').order('name');
    if (data) setProperties(data);
  }

  async function handleAdd() {
    if (!newName) return;
    setLoading(true);
    const res = await createProperty(newName, newAddress);
    if (!res.error) {
      setNewName('');
      setNewAddress('');
      loadProperties();
    }
    setLoading(false);
  }

  async function handleUpdate(id: string) {
    const prop = properties.find(p => p.id === id);
    setLoading(true);
    const res = await updateProperty(id, prop.name, prop.address);
    if (!res.error) setEditingId(null);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure? This will NOT delete the units inside, but they will become uncategorized.')) return;
    setLoading(true);
    const res = await deleteProperty(id);
    if (!res.error) loadProperties();
    setLoading(false);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-ghost" style={{ gap: '0.5rem' }}>
        <Building size={18} /> Manage Buildings
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(8px)', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.25rem' }}>Manage Buildings / Areas</h2>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Add Form */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '1rem', 
              marginBottom: '2rem', 
              padding: '1.25rem', 
              background: 'var(--bg-surface)', 
              borderRadius: '0.75rem',
              border: '1px solid var(--border)'
            }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Add New Building</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                <input className="input" style={{ flex: '1 1 200px' }} placeholder="Name (e.g. Building A)" value={newName} onChange={e => setNewName(e.target.value)} />
                <input className="input" style={{ flex: '2 1 250px' }} placeholder="Address / Location" value={newAddress} onChange={e => setNewAddress(e.target.value)} />
                <button className="btn btn-primary" onClick={handleAdd} disabled={loading} style={{ padding: '0.6rem 1.25rem' }}>
                  <Plus size={18} /> Add
                </button>
              </div>
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Existing Properties</p>
              {properties.map(p => (
                <div key={p.id} style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '0.75rem', 
                  padding: '1rem', 
                  border: '1px solid var(--border)', 
                  borderRadius: '0.75rem',
                  background: editingId === p.id ? 'rgba(99,102,241,0.03)' : 'transparent'
                }}>
                  {editingId === p.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <input className="input" style={{ flex: 1 }} value={p.name} onChange={e => setProperties(properties.map(item => item.id === p.id ? {...item, name: e.target.value} : item))} />
                        <input className="input" style={{ flex: 2 }} value={p.address} onChange={e => setProperties(properties.map(item => item.id === p.id ? {...item, address: e.target.value} : item))} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button className="btn btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
                        <button className="btn btn-success" onClick={() => handleUpdate(p.id)} style={{ gap: '0.4rem' }}>
                          <Check size={16} /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: '1rem' }}>{p.name}</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.address || 'No address set'}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="btn btn-ghost" onClick={() => setEditingId(p.id)} style={{ padding: '0.5rem' }}><Edit2 size={16} /></button>
                        <button className="btn btn-ghost" onClick={() => handleDelete(p.id)} style={{ padding: '0.5rem', color: '#ef4444' }}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {properties.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', background: 'var(--bg-base)', borderRadius: '0.75rem', border: '1px dashed var(--border)' }}>
                  <Building size={32} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <p>No buildings added yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
