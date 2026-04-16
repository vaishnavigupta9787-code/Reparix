export default function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/40 bg-white/70 px-4 py-4 shadow-sm backdrop-blur">
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
    </div>
  );
}
