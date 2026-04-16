"use client";

import { useEffect, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import ToastProvider, { useToast } from "../components/ToastProvider";
import ReportCard from "../components/ReportCard";

const suggestionByProduct = (name = "") => {
  const v = name.toLowerCase();
  if (/(phone|mobile|iphone|android)/.test(v)) return ["Authorized mobile service center", "Verified phone technician", "Doorstep mobile repair"];
  if (/(laptop|notebook|macbook)/.test(v)) return ["Authorized laptop service center", "Motherboard specialist", "On-site laptop support"];
  return ["Brand-authorized service center", "Verified local technician", "Trusted doorstep repair service"];
};

const withSuggestions = (items = []) => items.map((item) => ({ ...item, repair_suggestions: suggestionByProduct(item.product_name) }));

const MyReportsContent = () => {
  const { user, isSignedIn } = useUser();
  const { addToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    if (!isSignedIn) return;
    setLoading(true);
    try {
      const res = await fetch("/api/warranties?mine=true", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Failed to load warranties.", "error");
        return;
      }
      setReports(withSuggestions(data.warranties || []));
    } catch {
      addToast("Failed to load warranties.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [isSignedIn]);

  const handleDelete = async (report) => {
    try {
      const res = await fetch(`/api/warranties/${report.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Failed to delete warranty.", "error");
        return;
      }
      addToast("Warranty deleted.", "success");
      await loadReports();
    } catch {
      addToast("Failed to delete warranty.", "error");
    }
  };

  if (!isSignedIn) {
    return (
      <div className="page">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-8 text-center shadow-lg backdrop-blur">
          <h1 className="text-2xl font-semibold text-slate-900">My Warranties</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in to view your saved warranty records.</p>
          <div className="mt-4 inline-flex">
            <SignInButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur">
        <h1 className="text-2xl font-semibold text-slate-900">My Warranties</h1>
        <p className="text-sm text-slate-500">Manage the products you have protected with Reparix.</p>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading your warranties...</p>
      ) : reports.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No warranties yet.</p>
      ) : (
        <div className="mt-6 grid gap-4">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} isOwner={Boolean(user?.id && report.user_id === user.id)} onResolve={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function MyReportsPage() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <MyReportsContent />
      </div>
    </ToastProvider>
  );
}
