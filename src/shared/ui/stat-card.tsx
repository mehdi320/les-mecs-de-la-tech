interface StatCardProps {
  label: string;
  value: string | number;
  detail?: string;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, detail, icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {icon && <div className="text-slate-300">{icon}</div>}
      </div>
      <p className="mt-1.5 text-2xl font-semibold text-slate-900">{value}</p>
      {detail && <p className="mt-1 text-xs text-slate-400">{detail}</p>}
    </div>
  );
}
