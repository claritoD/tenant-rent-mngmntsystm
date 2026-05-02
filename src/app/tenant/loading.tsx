import { CardSkeleton, Skeleton } from '@/components/shared/Skeleton';

export default function Loading() {
  return (
    <div className="animate-enter">
      <div className="page-header">
        <Skeleton width="180px" height="2rem" />
        <Skeleton width="250px" height="1rem" style={{ marginTop: '0.5rem' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <CardSkeleton />
        <CardSkeleton />
        <div className="card">
          <Skeleton width="40%" height="1.25rem" style={{ marginBottom: '1rem' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Skeleton width="100%" height="1rem" />
            <Skeleton width="90%" height="1rem" />
            <Skeleton width="95%" height="1rem" />
          </div>
        </div>
      </div>
    </div>
  );
}
