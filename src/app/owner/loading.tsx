import { CardSkeleton, TableSkeleton } from '@/components/shared/Skeleton';

export default function Loading() {
  return (
    <div className="animate-enter">
      <div className="page-header">
        <div style={{ height: '2rem', width: '200px', background: 'var(--border)', borderRadius: '0.5rem', marginBottom: '0.5rem' }} />
        <div style={{ height: '1rem', width: '300px', background: 'var(--border)', borderRadius: '0.4rem' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      <TableSkeleton rows={8} cols={5} />
    </div>
  );
}
