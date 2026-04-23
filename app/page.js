"use client";

import { useEffect, useMemo, useState } from "react";
import ToastProvider, { useToast } from "./components/ToastProvider";
import ReportCard from "./components/ReportCard";
import StatCard from "./components/StatCard";

const initialForm = {
  product_name: "",
  brand: "",
  purchase_date: "",
  warranty_months: "12",
  notes: "",
};

const suggestionsByProduct = (name = "") => {
  const value = name.toLowerCase();
  if (/(phone|mobile|iphone|android)/.test(value)) {
    return ["Authorized mobile service center", "Verified local smartphone technician", "Doorstep mobile repair partner"];
  }
  if (/(laptop|notebook|macbook)/.test(value)) {
    return ["Authorized laptop service center", "Motherboard specialist repair shop", "On-site laptop support"];
  }
  if (/(tv|monitor|television)/.test(value)) {
    return ["Brand TV service center", "Display panel specialist", "Home visit electronics technician"];
  }
  if (/(fridge|refrigerator|ac|air conditioner|washing machine)/.test(value)) {
    return ["Authorized appliance service center", "Verified neighborhood appliance repair", "Doorstep appliance engineer"];
  }
  return ["Brand-authorized service center", "Verified local technician", "Trusted doorstep repair service"];
};

const attachSuggestions = (items = []) => items.map((item) => ({ ...item, repair_suggestions: suggestionsByProduct(item.product_name) }));

const daysLeft = (expiryDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  return Math.floor((exp - today) / (1000 * 60 * 60 * 24));
};

const DashboardContent = () => {
  const { addToast } = useToast();
  const [warranties, setWarranties] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return warranties.filter((item) => [item.product_name, item.brand, item.notes].join(" ").toLowerCase().includes(q));
  }, [warranties, query]);

  const reminders = useMemo(
    () => warranties.filter((item) => {
      const days = daysLeft(item.expiry_date);
      return days >= 0 && days <= 30;
    }),
    [warranties]
  );

  const stats = useMemo(() => {
    const expired = warranties.filter((item) => daysLeft(item.expiry_date) < 0).length;
    return {
      total: warranties.length,
      active: warranties.length - expired,
      expired,
      dueSoon: reminders.length,
    };
  }, [warranties, reminders]);

  const loadWarranties = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/warranties", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load warranties.");
        return;
      }
      setWarranties(attachSuggestions(data.warranties || []));
    } catch {
      setError("Failed to load warranties. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const today = new Date();
    setForm((prev) => ({ ...prev, purchase_date: today.toISOString().slice(0, 10) }));
    loadWarranties();
  }, []);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const validateForm = () => {
    if (!form.product_name || !form.purchase_date || !form.warranty_months) {
      return "Please fill product name, purchase date, and warranty months.";
    }
    const months = Number(form.warranty_months);
    if (!Number.isInteger(months) || months < 1 || months > 120) {
      return "Warranty months must be between 1 and 120.";
    }
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/warranties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save warranty.");
        return;
      }
      setForm((prev) => ({ ...prev, product_name: "", brand: "", notes: "", warranty_months: "12" }));
      addToast("Warranty saved successfully.", "success");
      await loadWarranties();
    } catch (err) {
      setError(err.message || "Failed to save warranty.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rp-app-bg">
      <div className="rp-shell">
        <header className="rp-hero-card">
          <div className="rp-hero-grid">
            <div className="rp-hero-copy">
              <p className="rp-eyebrow">Warranty Manager</p>
              <h1 className="rp-title">Reparix</h1>
              <p className="rp-subtitle">Never lose your warranty again. Store documents, track expiry, and find repair options.</p>
            </div>
            <div className="rp-stats-grid">
              <StatCard label="Total Products" value={stats.total} />
              <StatCard label="Active" value={stats.active} />
              <StatCard label="Expired" value={stats.expired} />
              <StatCard label="Due In 30 Days" value={stats.dueSoon} />
            </div>
          </div>
        </header>

        <main className="rp-main-grid">
          <section className="rp-card rp-form-card">
            <h2 className="rp-section-title">Add Warranty</h2>
            <p className="rp-section-text">Set Clerk env keys to enable account-based saving/deleting in production.</p>
            <form className="rp-form" onSubmit={handleSubmit}>
              <div>
                <label className="rp-label">Product name</label>
                <input type="text" value={form.product_name} onChange={handleChange("product_name")} placeholder="iPhone 14" className="rp-input" required />
              </div>
              <div>
                <label className="rp-label">Brand</label>
                <input type="text" value={form.brand} onChange={handleChange("brand")} placeholder="Apple" className="rp-input" />
              </div>
              <div className="rp-grid-2">
                <div>
                  <label className="rp-label">Purchase date</label>
                  <input type="date" value={form.purchase_date} onChange={handleChange("purchase_date")} className="rp-input" required />
                </div>
                <div>
                  <label className="rp-label">Warranty months</label>
                  <input type="number" min="1" max="120" value={form.warranty_months} onChange={handleChange("warranty_months")} className="rp-input" required />
                </div>
              </div>
              <div>
                <label className="rp-label">Notes</label>
                <textarea value={form.notes} onChange={handleChange("notes")} placeholder="Any extra details" className="rp-input rp-textarea" />
              </div>
              {error ? <p className="rp-error">{error}</p> : null}
              <button type="submit" disabled={submitting} className="rp-btn-primary">
                {submitting ? "Saving..." : "Save Warranty"}
              </button>
            </form>
          </section>

          <section className="rp-card rp-dashboard-card">
            <div className="rp-dashboard-head">
              <div>
                <h2 className="rp-section-title">Warranty Dashboard</h2>
                <p className="rp-section-text">Track expiring products and repair options.</p>
              </div>
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by product, brand, notes" className="rp-search" />
            </div>

            <div className="rp-reminder-box">
              <h3 className="rp-reminder-title">Expiry reminders</h3>
              {reminders.length === 0 ? (
                <p className="rp-reminder-text">No warranties expiring in the next 30 days.</p>
              ) : (
                <ul className="rp-reminder-list">
                  {reminders.map((item) => (
                    <li key={item.id}>{item.product_name} expires on {item.expiry_date}</li>
                  ))}
                </ul>
              )}
            </div>

            {loading ? (
              <p className="rp-empty-text">Loading warranties...</p>
            ) : filtered.length === 0 ? (
              <p className="rp-empty-text">No warranties added yet.</p>
            ) : (
              <div className="rp-report-list">
                {filtered.map((item) => (
                  <ReportCard key={item.id} report={item} isOwner={false} onResolve={() => {}} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default function HomePage() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  );
}
