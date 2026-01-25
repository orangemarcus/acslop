import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  titleAction?: ReactNode;
}

export default function Card({ children, className = '', title, titleAction }: CardProps) {
  return (
    <div className={`bg-card border border-border rounded-xl p-6 ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">{title}</h2>
          {titleAction && <div>{titleAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

// Specialized card variants
export function MetricCard({
  label,
  value,
  change,
  changePercent,
  className = '',
}: {
  label: string;
  value: string | number;
  change?: number;
  changePercent?: number;
  className?: string;
}) {
  const isPositive = change !== undefined ? change >= 0 : true;

  return (
    <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
      <div className="text-sm text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {change !== undefined && changePercent !== undefined && (
        <div className={`text-sm mt-1 ${isPositive ? 'text-success' : 'text-danger'}`}>
          {isPositive ? '+' : ''}
          {change.toFixed(2)} ({changePercent.toFixed(2)}%)
        </div>
      )}
    </div>
  );
}
