"use client";

import { useEffect, useMemo, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import ToastProvider, { useToast } from "./components/ToastProvider";
import ReportCard from "./components/ReportCard";
import StatCard from "./components/StatCard";

const initialForm = {
  kind: "lost",
  name: "",
  description: "",
  location: "",
  report_date: "",
  email: "",
  hide_email: false,
};

const isFutureDate = (value) => {
  if (!value) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  date.setHours(0, 0, 0, 0);
  return date > today;
};

const DashboardContent = () => {
  const { user, isSignedIn } = useUser();
  const { addToast } = useToast();
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [activeTab, setActiveTab] = useState("lost");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((report) => {
      const matchesQuery = [report.name, report.description, report.location]
        .join(" ")
        .toLowerCase()
        .includes(q);
      const matchesKind = kindFilter === "all" || report.kind === kindFilter;
      const matchesDate = !dateFilter || report.report_date === dateFilter;
      return matchesQuery && matchesKind && matchesDate;
    });
  }, [reports, query, kindFilter, dateFilter]);

  const stats = useMemo(() => {
    const lostCount = reports.filter((r) => r.kind === "lost").length;
    const foundCount = reports.filter((r) => r.kind === "found").length;
    return {
      total: reports.length,
      lost: lostCount,
      found: foundCount,
    };
  }, [reports]);

  const loadReports = async (mine = false) => {
    setError("");
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (mine) params.set("mine", "true");
      const res = await fetch(`/api/reports?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load reports.");
        return;
      }
      setReports(data.reports || []);
    } catch (err) {
      setError("Failed to load reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const today = new Date();
    setForm((prev) => ({
      ...prev,
      report_date: today.toISOString().slice(0, 10),
    }));
    loadReports();
  }, []);

  const handleChange = (field) => (event) => {
    const value = field === "hide_email" ? event.target.checked : event.target.value;
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (event) => {
    const fileValue = event.target.files?.[0];
    if (!fileValue) {
      setFile(null);
      setPreview("");
      return;
    }
    if (fileValue.size > 5 * 1024 * 1024) {
      addToast("Image must be under 5MB.", "error");
      return;
    }
    setFile(fileValue);
    setPreview(URL.createObjectURL(fileValue));
  };

  const validateForm = () => {
    if (!form.name || !form.description || !form.location || !form.report_date || !form.email) {
      return "Please fill in all required fields.";
    }
    if (isFutureDate(form.report_date)) {
      return "Report date cannot be in the future.";
    }
    return "";
  };

  const uploadImage = async () => {
    if (!file) return "";
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/uploads", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Image upload failed.");
    }
    return data.url;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!isSignedIn) {
      addToast("Please sign in to submit a report.", "error");
      return;
    }

    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSubmitting(true);
    try {
      const imageUrl = await uploadImage();
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          kind: activeTab,
          image_url: imageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save report.");
        return;
      }
      setForm((prev) => ({ ...prev, name: "", description: "", location: "", email: "", hide_email: false }));
      setFile(null);
      setPreview("");
      addToast("Report submitted successfully.", "success");
      await loadReports();
    } catch (err) {
      setError(err.message || "Failed to save report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (report) => {
    try {
      const res = await fetch(`/api/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: !report.resolved }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Failed to update report.", "error");
        return;
      }
      addToast(report.resolved ? "Report reopened." : "Marked as resolved.", "success");
      await loadReports();
    } catch (err) {
      addToast("Failed to update report.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="page">
        <header className="rounded-3xl border border-white/50 bg-white/70 p-8 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">Campus Utility</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900 md:text-4xl">College Lost & Found Tracker</h1>
              <p className="mt-3 max-w-xl text-sm text-slate-600 md:text-base">
                Report lost or found items fast, search by location and date, and contact the reporter.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="Total Reports" value={stats.total} />
              <StatCard label="Lost" value={stats.lost} />
              <StatCard label="Found" value={stats.found} />
            </div>
          </div>
        </header>

        <main className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_1.4fr]">
          <section className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur">
            <div className="flex gap-3 rounded-full bg-slate-100 p-1">
              <button
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === "lost" ? "bg-blue-600 text-white" : "text-slate-500"
                }`}
                type="button"
                onClick={() => setActiveTab("lost")}
              >
                Report Lost
              </button>
              <button
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === "found" ? "bg-blue-600 text-white" : "text-slate-500"
                }`}
                type="button"
                onClick={() => setActiveTab("found")}
              >
                Report Found
              </button>
            </div>

            {!isSignedIn ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white/80 p-6 text-center">
                <p className="text-sm text-slate-600">Sign in to submit a report.</p>
                <div className="mt-4 inline-flex">
                  <SignInButton />
                </div>
              </div>
            ) : null}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-semibold text-slate-700">Item name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="Blue backpack"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={handleChange("description")}
                  placeholder="Brand, color, special marks"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={handleChange("location")}
                  placeholder="Library - 2nd floor"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Date</label>
                  <input
                    type="date"
                    value={form.report_date}
                    onChange={handleChange("report_date")}
                    max={new Date().toISOString().slice(0, 10)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Contact email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    placeholder="name@college.edu"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Upload image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-2 w-full text-sm text-slate-600"
                />
                {preview ? (
                  <img src={preview} alt="Preview" className="mt-3 h-32 w-full rounded-2xl object-cover" />
                ) : null}
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.hide_email}
                  onChange={handleChange("hide_email")}
                />
                Hide my email from list (users can still contact via mail link)
              </label>
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <button
                type="submit"
                disabled={!isSignedIn || submitting}
                className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Reported Items</h2>
                <p className="text-sm text-slate-500">Search, filter, and contact the reporter.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name, description, or location"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm sm:w-64"
                />
                <select
                  value={kindFilter}
                  onChange={(event) => setKindFilter(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <option value="all">All</option>
                  <option value="lost">Lost</option>
                  <option value="found">Found</option>
                </select>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
            </div>

            {loading ? (
              <p className="mt-6 text-sm text-slate-500">Loading reports...</p>
            ) : filtered.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">No reports yet. Submit the first one.</p>
            ) : (
              <div className="mt-6 grid gap-4">
                {filtered.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    isOwner={Boolean(user?.id && report.user_id === user.id)}
                    onResolve={handleResolve}
                  />
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
