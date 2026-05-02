import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

export function Skeleton({ className, width, height, borderRadius = '0.5rem', style }: SkeletonProps) {
  return (
    <div
      className={`skeleton-pulse ${className ?? ''}`}
      style={{
        width: width ?? '100%',
        height: height ?? '1rem',
        borderRadius: borderRadius,
        ...style,
        background: 'linear-gradient(90deg, var(--bg-surface) 25%, var(--border) 50%, var(--bg-surface) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
      }}
    />
  );
}


export function CardSkeleton() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Skeleton width="40%" height="1.25rem" />
      <Skeleton width="100%" height="4rem" />
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Skeleton width="30%" height="2rem" />
        <Skeleton width="30%" height="2rem" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number, cols?: number }) {
  return (
    <div className="card">
      <Skeleton width="30%" height="1.25rem" style={{ marginBottom: '1.5rem' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: '1rem' }}>
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} width={`${100 / cols}%`} height="1.5rem" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
