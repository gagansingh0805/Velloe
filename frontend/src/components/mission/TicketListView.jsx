"use client";

import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  User, 
  X, 
  Sparkles,
  Layers,
  HelpCircle
} from "lucide-react";
import MetricDeck from "./MetricDeck";

// Relative time formatting helper
function formatRelativeTime(dateInput) {
  if (!dateInput) return "Recently";
  if (typeof dateInput === "string" && (dateInput.includes("ago") || dateInput.includes("today"))) {
    return dateInput;
  }
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 45) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  } catch (e) {
    return "Recently";
  }
}

export default function TicketListView({
  tickets = [],
  onSelectTicket,
  onCreateTicket,
  onRefresh,
  isLoading = false
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New ticket form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [employeeId, setEmployeeId] = useState("rohan");

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.employeeId && t.employeeId.toLowerCase().includes(q)) ||
      (t.id && t.id.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (statusFilter === "ALL") return true;
    if (statusFilter === "OPEN") return ["OPEN", "TRIAGED", "INVESTIGATING", "PROPOSED"].includes(t.status);
    return t.status === statusFilter;
  });

  // Calculate 3 Top Stat counts
  const openCount = tickets.filter((t) =>
    ["OPEN", "TRIAGED", "INVESTIGATING", "PROPOSED"].includes(t.status)
  ).length;
  const awaitingApprovalCount = tickets.filter(
    (t) => t.status === "AWAITING_APPROVAL"
  ).length;
  const resolvedTodayCount = tickets.filter(
    (t) => t.status === "RESOLVED"
  ).length;

  const handleApplyTemplate = (type) => {
    if (type === "rohan" || type === "priya") {
      setTitle("Cannot access billing dashboard: 403 Forbidden missing_scope");
      setDescription("When I navigate to /billing/dashboard, the page immediately returns a 403 error saying missing_scope billing.read. I am in the billing-analyst role and should have access.");
      setEmployeeId("rohan");
    } else if (type === "alex") {
      setTitle("Kafka consumer lag spike on topic billing.events");
      setDescription("Consumer group billing-processor lag exceeded 15,000 messages on partition 2. Inbound event ingestion rate elevated after batch reconciliation.");
      setEmployeeId("alex");
    } else if (type === "sam" || type === "sarah") {
      setTitle("HikariCP pool exhaustion warning on core Postgres");
      setDescription("Active connections reached 28/30 threshold on main database pool. Slow query identified on historical invoice export.");
      setEmployeeId("sam");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateTicket({ title, description, employeeId });
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
      setEmployeeId("rohan");
    } catch (err) {
      alert("Error creating ticket: " + (err.message || "Failed to communicate with server"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "AWAITING_APPROVAL":
        return {
          label: "Awaiting Approval",
          classes: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
          dot: "bg-amber-500"
        };
      case "RESOLVED":
        return {
          label: "Resolved",
          classes: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          dot: "bg-emerald-500"
        };
      case "REJECTED":
        return {
          label: "Rejected",
          classes: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
          dot: "bg-rose-500"
        };
      case "INVESTIGATING":
      case "PROPOSED":
        return {
          label: status === "PROPOSED" ? "Proposed" : "Investigating",
          classes: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
          dot: "bg-blue-500 animate-pulse"
        };
      case "TRIAGED":
        return {
          label: "Triaged",
          classes: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
          dot: "bg-purple-500"
        };
      case "OPEN":
      default:
        return {
          label: "Open",
          classes: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
          dot: "bg-zinc-400"
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP OF PAGE: EXACTLY 3 SIMPLIFIED STAT CARDS */}
      <MetricDeck
        openCount={openCount}
        awaitingApprovalCount={awaitingApprovalCount}
        resolvedTodayCount={resolvedTodayCount}
      />

      {/* 2. TOOLBAR & ACTIONS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter by title, employee, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="hidden md:flex items-center gap-1.5 border-l border-zinc-200 dark:border-zinc-800 pl-3">
            {[
              { id: "ALL", label: "All" },
              { id: "OPEN", label: "Open" },
              { id: "AWAITING_APPROVAL", label: "Needs Approval" },
              { id: "RESOLVED", label: "Resolved" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  statusFilter === f.id
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh tickets"
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-500" : ""}`} />
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            id="btn-new-ticket"
            className="flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Ticket</span>
          </button>
        </div>
      </div>

      {/* 3. TICKET TABLE */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Created Time</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                    <p className="font-medium text-sm">No tickets found</p>
                    <p className="text-xs text-zinc-400 mt-1">Try changing your search filter or create a new ticket.</p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => {
                  const badge = getStatusBadge(t.status);
                  const displayId = t.id?.length > 12 ? `${t.id.slice(0, 8)}...` : t.id;

                  return (
                    <tr
                      key={t.id}
                      onClick={() => onSelectTicket(t.id)}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors group"
                    >
                      {/* Ticket Title & ID */}
                      <td className="py-3.5 px-4 min-w-[260px]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-zinc-400 dark:text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                            {displayId}
                          </span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                            {t.title}
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${badge.classes}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </td>

                      {/* Employee */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                        <div className="flex items-center gap-1.5 font-medium">
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{t.employeeId || "rohan"}</span>
                          {t.employeeRole && (
                            <span className="text-[10px] text-zinc-400">({t.employeeRole})</span>
                          )}
                        </div>
                      </td>

                      {/* Created Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>{formatRelativeTime(t.createdAt)}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 group-hover:underline">
                          View Detail <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. NEW TICKET MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    File New Ticket
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Kicks off the automated 4-agent triage pipeline.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Template Fill Buttons */}
            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                <Layers className="w-3 h-3" /> Quick Test Templates
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyTemplate("rohan")}
                  className="px-2 py-1 text-[11px] rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
                >
                  Rohan: Billing 403 (missing_scope)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate("alex")}
                  className="px-2 py-1 text-[11px] rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
                >
                  Alex: Kafka Lag
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate("sam")}
                  className="px-2 py-1 text-[11px] rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
                >
                  Sam: HikariCP Pool
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Issue Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cannot access billing dashboard: 403 Forbidden"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Employee ID <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    required
                    placeholder="e.g. rohan, alex, sam"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                  <div className="flex gap-1 text-[11px]">
                    {["rohan", "alex", "sam"].map((emp) => (
                      <button
                        type="button"
                        key={emp}
                        onClick={() => setEmployeeId(emp)}
                        className={`px-2 py-1.5 rounded border ${
                          employeeId === emp
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold"
                            : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {emp}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe what error was observed, service path, and symptoms..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 leading-relaxed font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Submit & Start Investigation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
