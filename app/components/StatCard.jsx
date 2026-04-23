export default function StatCard({ label, value }) {
  return (
    <div className="rp-stat-card">
      <p className="rp-stat-value">{value}</p>
      <p className="rp-stat-label">{label}</p>
    </div>
  );
}
