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
    <article className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-slate-900">{report.product_name}</p>
          <p className="text-sm text-slate-500">
            {report.brand || "No brand"} • Purchased {report.purchase_date}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${status.style}`}>
          {status.text}
        </span>
      </header>

      <div className="mt-3 space-y-1 text-sm text-slate-600">
        <p><strong>Warranty:</strong> {report.warranty_months} months</p>
        <p><strong>Expiry:</strong> {report.expiry_date}</p>
        {report.notes ? <p><strong>Notes:</strong> {report.notes}</p> : null}
      </div>

      {report.invoice_url ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm">
          <p className="font-semibold text-slate-700">Invoice</p>
          <a className="text-blue-700 underline" href={report.invoice_url} target="_blank" rel="noreferrer">
            {isPdf(report.invoice_url) ? "Open PDF bill" : "Open uploaded bill"}
          </a>
        </div>
      ) : null}

      <div className="mt-4">
        <p className="text-sm font-semibold text-slate-700">Repair Suggestions</p>
        <ul className="mt-1 list-disc pl-5 text-sm text-slate-600">
          {(report.repair_suggestions || []).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      {isOwner ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onResolve(report)}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Delete
          </button>
        </div>
      ) : null}
    </article>
  );
}
