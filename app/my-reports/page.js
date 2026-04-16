"use client";

import { useEffect, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import ToastProvider, { useToast } from "../components/ToastProvider";
import ReportCard from "../components/ReportCard";

const MyReportsContent = () => {
  const { user, isSignedIn } = useUser();
  const { addToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    if (!isSignedIn) return;
    setLoading(true);
    try {
      const res = await fetch("/api/reports?mine=true", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Failed to load reports.", "error");
        return;
      }
      setReports(data.reports || []);
    } catch (err) {
      addToast("Failed to load reports.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [isSignedIn]);

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

  if (!isSignedIn) {
    return (
      <div className="page">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-8 text-center shadow-lg backdrop-blur">
          <h1 className="text-2xl font-semibold text-slate-900">My Reports</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in to view your submitted reports.</p>
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
        <h1 className="text-2xl font-semibold text-slate-900">My Reports</h1>
        <p className="text-sm text-slate-500">Manage the items you have reported.</p>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading your reports...</p>
      ) : reports.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No reports yet.</p>
      ) : (
        <div className="mt-6 grid gap-4">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              isOwner={Boolean(user?.id && report.user_id === user.id)}
              onResolve={handleResolve}
            />
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
