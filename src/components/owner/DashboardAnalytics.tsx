'use client';

import { formatPeso } from '@/utils/format';
import { BarChart3, TrendingUp, Users, AlertCircle, Droplet, Calendar } from 'lucide-react';

interface DashboardAnalyticsProps {
  occupancy: {
    total: number;
    active: number;
    rate: number;
  };
  revenue: {
    total: number;
    paid: number;
    unpaid: number;
    collectionRate: number;
    monthlyRevenue: number;
    monthlyUtilities: number;
  };
  arrears: {
    total: number;
    count: number;
  };
  credit: {
    total: number;
    count: number;
  };
  payments: {
    total: number;
    verified: number;
    pending: number;
    verificationRate: number;
  };
  pending: {
    waterRefills: number;
    dueDateRequests: number;
  };
}

export function AnalyticCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'var(--brand-600)',
  trend 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon?: any;
  color?: string;
  trend?: { value: number; label: string; up: boolean };
}) {
  return (
    <div className="card-sm" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <p className="section-title" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{title}</p>
        <p className="text-lg font-semibold" style={{ color, margin: '0.25rem 0' }}>
          {value}
        </p>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        {trend && (
          <p className="text-xs" style={{ color: trend.up ? 'var(--success)' : 'var(--danger)', marginTop: '0.25rem' }}>
            {trend.up ? '↑' : '↓'} {trend.value}% {trend.label}
          </p>
        )}
      </div>
      {Icon && (
        <div style={{ 
          width: '40px', height: '40px', 
          background: `${color}15`, borderRadius: '0.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={20} color={color} />
        </div>
      )}
    </div>
  );
}

export function DashboardAnalytics({ 
  occupancy, 
  revenue, 
  arrears, 
  credit, 
  payments, 
  pending 
}: DashboardAnalyticsProps) {
  return (
    <>
      {/* Key Metrics Overview */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="font-semibold text-sm" style={{ marginBottom: '1rem' }}>Key Metrics</h2>
        <div className="grid-cols-auto" style={{ '--min-w': '180px' } as React.CSSProperties}>
          <AnalyticCard
            title="Tenant Occupancy"
            value={`${occupancy.active}/${occupancy.total}`}
            subtitle={`${occupancy.rate}% occupied`}
            icon={Users}
            color="var(--brand-600)"
          />
          <AnalyticCard
            title="Total Revenue"
            value={formatPeso(revenue.total)}
            subtitle={`${revenue.collectionRate}% collected`}
            icon={TrendingUp}
            color="var(--success)"
          />
          <AnalyticCard
            title="Outstanding Arrears"
            value={formatPeso(arrears.total)}
            subtitle={`${arrears.count} tenant(s)`}
            icon={AlertCircle}
            color="var(--danger)"
          />
          <AnalyticCard
            title="Credit Balance"
            value={formatPeso(credit.total)}
            subtitle={`${credit.count} tenant(s)`}
            icon={BarChart3}
            color="var(--info)"
          />
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="font-semibold text-sm" style={{ marginBottom: '1rem' }}>Revenue Analysis</h2>
        <div className="grid-2">
          <div>
            <p className="section-title">Monthly Revenue</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--success)', margin: '0.5rem 0' }}>
              {formatPeso(revenue.monthlyRevenue)}
            </p>
            <p className="text-xs text-muted">Current month rent</p>
          </div>
          <div>
            <p className="section-title">Monthly Utilities</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--info)', margin: '0.5rem 0' }}>
              {formatPeso(revenue.monthlyUtilities)}
            </p>
            <p className="text-xs text-muted">Electric + Water</p>
          </div>
        </div>
      </div>

      {/* Payment Status */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="font-semibold text-sm" style={{ marginBottom: '1rem' }}>Payment Status</h2>
        <div className="grid-cols-auto" style={{ '--min-w': '160px' } as React.CSSProperties}>
          <AnalyticCard
            title="Total Payments"
            value={payments.total}
            subtitle={`${payments.verificationRate}% verified`}
            color="var(--brand-600)"
          />
          <AnalyticCard
            title="Verified"
            value={payments.verified}
            subtitle="Approved"
            color="var(--success)"
          />
          <AnalyticCard
            title="Pending"
            value={payments.pending}
            subtitle="Awaiting review"
            color="var(--warning)"
          />
        </div>
      </div>

      {/* Pending Requests */}
      <div className="card">
        <h2 className="font-semibold text-sm" style={{ marginBottom: '1rem' }}>Pending Actions</h2>
        <div className="grid-cols-auto" style={{ '--min-w': '160px' } as React.CSSProperties}>
          <AnalyticCard
            title="Water Refill Requests"
            value={pending.waterRefills}
            subtitle="Awaiting completion"
            icon={Droplet}
            color="var(--info)"
          />
          <AnalyticCard
            title="Due Date Requests"
            value={pending.dueDateRequests}
            subtitle="Awaiting review"
            icon={Calendar}
            color="var(--warning)"
          />
        </div>
      </div>
    </>
  );
}
