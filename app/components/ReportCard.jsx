const isPdf = (url = "") => url.toLowerCase().includes(".pdf");

const daysLeft = (expiryDate) => {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  return Math.floor((exp - today) / (1000 * 60 * 60 * 24));
};

const statusLabel = (expiryDate) => {
  const days = daysLeft(expiryDate);
  if (days === null) return { text: "Unknown", style: "bg-slate-100 text-slate-700" };
  if (days < 0) return { text: `Expired ${Math.abs(days)}d ago`, style: "bg-rose-100 text-rose-700" };
  if (days === 0) return { text: "Expires today", style: "bg-amber-100 text-amber-700" };
  if (days <= 30) return { text: `${days}d left`, style: "bg-amber-100 text-amber-700" };
  return { text: `${days}d left`, style: "bg-emerald-100 text-emerald-700" };
};

export default function ReportCard({ report, isOwner, onResolve }) {
  const status = statusLabel(report.expiry_date);

  return (
    <article className="rp-report-card">
      <header className="rp-report-head">
        <div>
          <p className="rp-report-title">{report.product_name}</p>
          <p className="rp-report-subtitle">
            {report.brand || "No brand"} • Purchased {report.purchase_date}
          </p>
        </div>
        <span className={`rp-status-pill ${status.style}`}>
          {status.text}
        </span>
      </header>

      <div className="rp-report-meta">
        <p><strong>Warranty:</strong> {report.warranty_months} months</p>
        <p><strong>Expiry:</strong> {report.expiry_date}</p>
        {report.notes ? <p><strong>Notes:</strong> {report.notes}</p> : null}
      </div>

      {report.invoice_url ? (
        <div className="rp-invoice-card">
          <p className="rp-invoice-title">Invoice</p>
          <a className="rp-invoice-link" href={report.invoice_url} target="_blank" rel="noreferrer">
            {isPdf(report.invoice_url) ? "Open PDF bill" : "Open uploaded bill"}
          </a>
        </div>
      ) : null}

      <div className="rp-repair-wrap">
        <p className="rp-repair-title">Repair Suggestions</p>
        <ul className="rp-repair-list">
          {(report.repair_suggestions || []).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      {isOwner ? (
        <div className="rp-owner-actions">
          <button
            type="button"
            onClick={() => onResolve(report)}
            className="rp-delete-btn"
          >
            Delete
          </button>
        </div>
      ) : null}
    </article>
  );
}
