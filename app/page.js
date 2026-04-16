"use client";

import { useEffect, useMemo, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
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
    return [
      "Authorized mobile service center",
      "Verified local smartphone technician",
      "Doorstep mobile repair partner",
    ];
  }
  if (/(laptop|notebook|macbook)/.test(value)) {
    return [
      "Authorized laptop service center",
      "Motherboard specialist repair shop",
      "On-site laptop support",
    ];
  }
  if (/(tv|monitor|television)/.test(value)) {
    return [
      "Brand TV service center",
      "Display panel specialist",
      "Home visit electronics technician",
    ];
  }
  if (/(fridge|refrigerator|ac|air conditioner|washing machine)/.test(value)) {
    return [
      "Authorized appliance service center",
      "Verified neighborhood appliance repair",
      "Doorstep appliance engineer",
    ];
  }
  return [
    "Brand-authorized service center",
    "Verified local technician",
    "Trusted doorstep repair service",
  ];
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
  const { user, isSignedIn } = useUser();
  const { addToast } = useToast();
  const [warranties, setWarranties] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return warranties.filter((item) => [item.product_name, item.brand, item.notes].join(" ").toLowerCase().includes(q));
  }, [warranties, query]);

  const reminders = useMemo(() => warranties.filter((item) => {
    const days = daysLeft(item.expiry_date);
    return days >= 0 && days <= 30;
  }), [warranties]);

  const stats = useMemo(() => {
    const expired = warranties.filter((item) => daysLeft(item.expiry_date) < 0).length;
    return {
      total: warranties.length,
      active: warranties.length - expired,
      expired,
      dueSoon: reminders.length,
    };
  }, [warranties, reminders]);

  const loadWarranties = async (mine = false) => {
    setError("");
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (mine) params.set("mine", "true");
      const res = await fetch(`/api/warranties?${params.toString()}`, { cache: "no-store" });
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

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      addToast("Document must be under 10MB.", "error");
      return;
    }
    setFile(selected);
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

  const uploadBill = async () => {
    if (!file) return "";
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "File upload failed.");
    return data.url;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!isSignedIn) {
      addToast("Please sign in to add warranty records.", "error");
      return;
    }

    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSubmitting(true);
    try {
      const invoiceUrl = await uploadBill();
      const res = await fetch("/api/warranties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, invoice_url: invoiceUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save warranty.");
        return;
      }
      setForm((prev) => ({ ...prev, product_name: "", brand: "", notes: "", warranty_months: "12" }));
      setFile(null);
      addToast("Warranty saved successfully.", "success");
      await loadWarranties();
    } catch (err) {
      setError(err.message || "Failed to save warranty.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (warranty) => {
    try {
      const res = await fetch(`/api/warranties/${warranty.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Failed to delete warranty.", "error");
        return;
      }
      addToast("Warranty deleted.", "success");
      await loadWarranties();
    } catch {
      addToast("Failed to delete warranty.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="page">
        <header className="rounded-3xl border border-white/50 bg-white/70 p-8 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">Warranty Manager</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900 md:text-4xl">Reparix</h1>
              <p className="mt-3 max-w-xl text-sm text-slate-600 md:text-base">
                Never lose your warranty again. Store documents, track expiry, and find repair options.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard label="Total Products" value={stats.total} />
              <StatCard label="Active" value={stats.active} />
              <StatCard label="Expired" value={stats.expired} />
              <StatCard label="Due In 30 Days" value={stats.dueSoon} />
            </div>
          </div>
        </header>

        <main className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_1.4fr]">
          <section className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur">
            {!isSignedIn ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-6 text-center">
                <p className="text-sm text-slate-600">Sign in to add and manage your warranties.</p>
                <div className="mt-4 inline-flex">
                  <SignInButton />
                </div>
              </div>
            ) : null}

            <h2 className="text-xl font-semibold text-slate-900">Add Warranty</h2>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-semibold text-slate-700">Product name</label>
                <input type="text" value={form.product_name} onChange={handleChange("product_name")} placeholder="iPhone 14" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Brand</label>
                <input type="text" value={form.brand} onChange={handleChange("brand")} placeholder="Apple" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Purchase date</label>
                  <input type="date" value={form.purchase_date} onChange={handleChange("purchase_date")} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" required />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Warranty months</label>
                  <input type="number" min="1" max="120" value={form.warranty_months} onChange={handleChange("warranty_months")} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" required />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Upload bill (PDF or image)</label>
                <input type="file" accept="application/pdf,image/*" onChange={handleFileChange} className="mt-2 w-full text-sm text-slate-600" />
                {file ? <p className="mt-2 text-xs text-slate-500">Selected: {file.name}</p> : null}
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Notes</label>
                <textarea value={form.notes} onChange={handleChange("notes")} placeholder="Any extra details" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
              </div>
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <button type="submit" disabled={!isSignedIn || submitting} className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                {submitting ? "Saving..." : "Save Warranty"}
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Warranty Dashboard</h2>
                <p className="text-sm text-slate-500">Track expiring products and repair options.</p>
              </div>
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by product, brand, notes" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm sm:w-72" />
            </div>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-700">Expiry reminders</h3>
              {reminders.length === 0 ? (
                <p className="mt-2 text-sm text-amber-700">No warranties expiring in the next 30 days.</p>
              ) : (
                <ul className="mt-2 list-disc pl-5 text-sm text-amber-800">
                  {reminders.map((item) => (
                    <li key={item.id}>{item.product_name} expires on {item.expiry_date}</li>
                  ))}
                </ul>
              )}
            </div>

            {loading ? (
              <p className="mt-6 text-sm text-slate-500">Loading warranties...</p>
            ) : filtered.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">No warranties added yet.</p>
            ) : (
              <div className="mt-6 grid gap-4">
                {filtered.map((item) => (
                  <ReportCard key={item.id} report={item} isOwner={Boolean(user?.id && item.user_id === user.id)} onResolve={handleDelete} />
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
