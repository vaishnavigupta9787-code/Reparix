const formatDateLabel = (reportDate, kind) => {
  if (!reportDate) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(reportDate);
  date.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return `${kind === "found" ? "Found" : "Lost"} today`;
  if (diffDays === 1) return `${kind === "found" ? "Found" : "Lost"} yesterday`;
  if (diffDays > 1) return `${kind === "found" ? "Found" : "Lost"} ${diffDays} days ago`;
  return "";
};

export default function ReportCard({ report, isOwner, onResolve }) {
  const emailText = report.hide_email ? "Hidden" : report.email;
  const contactLink = `mailto:${report.email}?subject=${encodeURIComponent(
    `Regarding ${report.name}`
  )}&body=${encodeURIComponent("Hi, I am reaching out about the reported item.")}`;

  return (
    <article className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-slate-900">{report.name}</p>
          <p className="text-sm text-slate-500">
            {formatDateLabel(report.report_date, report.kind)} • {report.location}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            report.kind === "lost"
              ? "bg-rose-100 text-rose-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {report.kind}
        </span>
      </header>

      {report.image_url ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <img src={report.image_url} alt={report.name} className="h-44 w-full object-cover" />
        </div>
      ) : null}

      <p className="mt-4 text-sm text-slate-600">{report.description}</p>
      <p className="mt-3 text-sm text-slate-700">
        <strong>Contact:</strong> {emailText}
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <a
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
          href={contactLink}
        >
          Email Reporter
        </a>
        {isOwner ? (
          <button
            type="button"
            onClick={() => onResolve(report)}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {report.resolved ? "Reopen" : "Mark Resolved"}
          </button>
        ) : null}
        {report.resolved ? (
          <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">Resolved</span>
        ) : null}
      </div>
    </article>
  );
}
