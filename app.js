const form = document.getElementById("report-form");
const listEl = document.getElementById("list");
const tabs = document.querySelectorAll(".tab");
const reportKind = document.getElementById("report-kind");
const searchInput = document.getElementById("search");
const filterKind = document.getElementById("filter-kind");
const filterDate = document.getElementById("filter-date");
const statTotal = document.getElementById("stat-total");
const statLost = document.getElementById("stat-lost");
const statFound = document.getElementById("stat-found");
const exportBtn = document.getElementById("export-json");
const clearBtn = document.getElementById("clear-all");
const adminToggle = document.getElementById("admin-toggle");
const adminPanel = document.getElementById("admin-panel");

const CONFIG_KEY = "supabase-config";

const readStoredConfig = () => {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY)) || {};
  } catch {
    return {};
  }
};

const storedConfig = readStoredConfig();

const SUPABASE_URL =
  window.SUPABASE_URL ||
  window.__SUPABASE_URL__ ||
  document.querySelector('meta[name="supabase-url"]')?.content ||
  storedConfig.url;
const SUPABASE_ANON_KEY =
  window.SUPABASE_ANON_KEY ||
  window.__SUPABASE_ANON_KEY__ ||
  document.querySelector('meta[name="supabase-anon-key"]')?.content ||
  storedConfig.anonKey;

const ALLOW_PUBLIC_DELETE =
  window.SUPABASE_ALLOW_PUBLIC_DELETE === true ||
  document.querySelector('meta[name="supabase-allow-public-delete"]')?.content === "true";

const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase);
const supabaseClient = supabaseReady
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

let reportsCache = [];

const persistConfig = (url, anonKey) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ url, anonKey }));
};

const showConfigError = () => {
  listEl.innerHTML = `
    <div class="item">
      <h3>Connect Supabase</h3>
      <p class="muted">Paste your project URL and anon key. This will be saved in your browser.</p>
      <label>
        Supabase URL
        <input type="text" id="sb-url" placeholder="https://xxxx.supabase.co" />
      </label>
      <label>
        Supabase anon key
        <input type="text" id="sb-key" placeholder="eyJhbGciOi..." />
      </label>
      <div class="item-actions">
        <button class="primary" id="save-sb-config" type="button">Save & Reload</button>
      </div>
    </div>
  `;

  const saveBtn = document.getElementById("save-sb-config");
  saveBtn?.addEventListener("click", () => {
    const url = document.getElementById("sb-url").value.trim();
    const key = document.getElementById("sb-key").value.trim();
    if (!url || !key) {
      alert("Please enter both Supabase URL and anon key.");
      return;
    }
    persistConfig(url, key);
    window.location.reload();
  });
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const renderStats = (reports) => {
  const lostCount = reports.filter((r) => r.kind === "lost").length;
  const foundCount = reports.filter((r) => r.kind === "found").length;
  statTotal.textContent = reports.length;
  statLost.textContent = lostCount;
  statFound.textContent = foundCount;
};

const createContactLink = (email, itemName) => {
  const subject = encodeURIComponent(`Regarding ${itemName}`);
  const body = encodeURIComponent("Hi, I am reaching out about the reported item.");
  return `mailto:${email}?subject=${subject}&body=${body}`;
};

const renderList = () => {
  const reports = reportsCache;
  const query = searchInput.value.trim().toLowerCase();
  const kindFilter = filterKind.value;
  const dateFilter = filterDate.value;

  const filtered = reports.filter((report) => {
    const matchesQuery = [report.name, report.description, report.location]
      .join(" ")
      .toLowerCase()
      .includes(query);
    const matchesKind = kindFilter === "all" || report.kind === kindFilter;
    const matchesDate = !dateFilter || report.report_date === dateFilter;
    return matchesQuery && matchesKind && matchesDate;
  });

  if (filtered.length === 0) {
    listEl.innerHTML = "<p class=\"muted\">No reports yet. Submit the first one.</p>";
    renderStats(reports);
    return;
  }

  listEl.innerHTML = filtered
    .map((report) => {
      const emailText = report.hideEmail ? "Hidden" : report.email;
      const contactLink = createContactLink(report.email, report.name);
      return `
        <article class="item">
          <header>
            <div>
              <h3>${report.name}</h3>
              <small>${formatDate(report.report_date)} - ${report.location}</small>
            </div>
            <span class="badge ${report.kind}">${report.kind}</span>
          </header>
          <p>${report.description}</p>
          <p><strong>Contact:</strong> ${emailText}</p>
          <div class="item-actions">
            <a class="ghost" href="${contactLink}">Email Reporter</a>
          </div>
        </article>
      `;
    })
    .join("");

  renderStats(reports);
};

const resetForm = () => {
  form.reset();
  reportKind.value = document.querySelector(".tab.active").dataset.kind;
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!supabaseReady) {
    showConfigError();
    return;
  }

  const report = {
    kind: reportKind.value,
    name: document.getElementById("item-name").value.trim(),
    description: document.getElementById("item-desc").value.trim(),
    location: document.getElementById("item-location").value.trim(),
    report_date: document.getElementById("item-date").value,
    email: document.getElementById("item-email").value.trim(),
    hide_email: document.getElementById("item-anon").checked,
  };

  supabaseClient
    .from("reports")
    .insert(report)
    .then(({ error }) => {
      if (error) {
        listEl.innerHTML = `<p class="muted">Error saving report: ${error.message}</p>`;
        return;
      }
      resetForm();
      refreshReports();
    });
});

[searchInput, filterKind, filterDate].forEach((el) => {
  el.addEventListener("input", renderList);
});

const setActiveTab = (kind) => {
  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.kind === kind);
  });
  reportKind.value = kind;
};

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setActiveTab(tab.dataset.kind);
  });
});

exportBtn.addEventListener("click", () => {
  const data = reportsCache;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "lost-found-reports.json";
  link.click();
  URL.revokeObjectURL(url);
});

clearBtn.addEventListener("click", () => {
  if (!supabaseReady) {
    showConfigError();
    return;
  }
  if (!ALLOW_PUBLIC_DELETE) {
    alert("Admin delete is disabled in public mode. Enable it in Supabase and set SUPABASE_ALLOW_PUBLIC_DELETE=true.");
    return;
  }
  if (!confirm("Delete all reports? This cannot be undone.")) return;
  supabaseClient
    .from("reports")
    .delete()
    .neq("id", "")
    .then(({ error }) => {
      if (error) {
        listEl.innerHTML = `<p class="muted">Error clearing reports: ${error.message}</p>`;
        return;
      }
      refreshReports();
    });
});

adminToggle.addEventListener("click", () => {
  adminPanel.classList.toggle("hidden");
  adminToggle.textContent = adminPanel.classList.contains("hidden")
    ? "Show Admin"
    : "Hide Admin";
});

const init = () => {
  document.getElementById("item-date").valueAsDate = new Date();
  if (!supabaseReady) {
    showConfigError();
    return;
  }
  refreshReports();
};

const refreshReports = () => {
  supabaseClient
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .then(({ data, error }) => {
      if (error) {
        listEl.innerHTML = `<p class="muted">Error loading reports: ${error.message}</p>`;
        return;
      }
      reportsCache = (data || []).map((row) => ({
        ...row,
        hideEmail: row.hide_email,
      }));
      renderList();
    });
};

init();
