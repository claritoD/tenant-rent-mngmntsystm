'use client';

import { useState } from 'react';
import { Menu, X, Home } from 'lucide-react';
import { OwnerSidebar } from './OwnerSidebar';

export function OwnerHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Top Header for Mobile */}
      <header className="show-mobile" style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0.75rem 1rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '32px', height: '32px',
              background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Home size={16} color="#fff" />
            </div>
            <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>RentSeasy</p>
          </div>
          
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="btn btn-ghost" 
            style={{ padding: '0.5rem' }}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Overlay Sidebar for Mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 140,
            backdropFilter: 'blur(4px)',
          }}
        />
      )}
      
      <div style={{
        position: 'fixed',
        left: isOpen ? 0 : '-280px',
        top: 0,
        bottom: 0,
        width: '240px',
        zIndex: 150,
        transition: 'left 0.3s ease',
      }} className="show-mobile">
        <OwnerSidebar isMobile onNav={() => setIsOpen(false)} />
      </div>
    </>
  );
}
