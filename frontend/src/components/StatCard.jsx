import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({
  title,
  value,
  change,
  changeType = 'increase', // 'increase' | 'decrease' | 'neutral'
  period = 'vs last month',
  icon: Icon,
  iconBg = 'bg-indigo-50 text-indigo-600',
  className = '',
}) {
  const isPositive = changeType === 'increase';

  return (
    <div className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </h3>
      </div>

      {change !== undefined && (
        <div className="mt-3 flex items-center gap-2 text-xs font-medium">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${
              isPositive
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {change}
          </span>
          <span className="text-slate-400">{period}</span>
        </div>
      )}
    </div>
  );
}
