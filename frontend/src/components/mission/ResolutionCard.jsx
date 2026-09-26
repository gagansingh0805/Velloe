"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Clock,
  Sparkles,
  Lock
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ResolutionCard({
  ticket,
  resolverData = null,
  onApprove,
  onReject,
  isProcessing = false
}) {
  const { isAdmin } = useAuth();
  const [actionError, setActionError] = useState(null);

  if (!ticket) return null;

  const status = ticket.status || "OPEN";
  const isAwaitingApproval = status === "AWAITING_APPROVAL";
  const isResolved = status === "RESOLVED";
  const isRejected = status === "REJECTED";

  // Proposed fix text from Resolver step or ticket defaults
  const proposedFix = resolverData?.proposed_fix || 
    resolverData?.proposedFix ||
    "Grant the 'billing.read' permission scope to employee in authorization server, addressing the permission regression introduced in PR #341.";

  const riskNote = resolverData?.risk_note || 
    resolverData?.riskNote ||
    "Granting billing.read provides access to billing history and ledger metrics. Verify that the employee's role requires full ledger visibility.";

  const confidence = resolverData?.confidence 
    ? Math.round(resolverData.confidence * (resolverData.confidence <= 1 ? 100 : 1)) 
    : (ticket.confidence || 98);

  const handleApprove = async () => {
    setActionError(null);
    try {
      await onApprove(ticket.id);
    } catch (e) {
      setActionError(e.message || "Failed to approve resolution");
    }
  };

  const handleReject = async () => {
    setActionError(null);
    try {
      await onReject(ticket.id);
    } catch (e) {
      setActionError(e.message || "Failed to reject resolution");
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden font-sans">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            isResolved 
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : isRejected
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
          }`}>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Resolution Action
              {confidence && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  {confidence}% Confidence
                </span>
              )}
            </h3>
            <p className="text-[11px] text-zinc-500">
              {isResolved 
                ? "Resolution applied and verified." 
                : isRejected 
                ? "Resolution was rejected." 
                : "Awaiting your approval."}
            </p>
          </div>
        </div>

        {/* State Badge */}
        <div>
          {isResolved && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
            </span>
          )}
          {isRejected && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
              <XCircle className="w-3.5 h-3.5" /> Rejected
            </span>
          )}
          {isAwaitingApproval && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
              <Clock className="w-3.5 h-3.5" /> Pending Approval
            </span>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 sm:p-5 space-y-4">
        {actionError && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Proposed Fix */}
        <div>
          <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
            Proposed Fix
          </label>
          <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs leading-relaxed font-sans">
            {proposedFix}
          </div>
        </div>

        {/* Risk Assessment Note */}
        {riskNote && (
          <div className="p-3.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-zinc-700 dark:text-zinc-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                Risk Assessment Note
              </span>
              <p className="leading-relaxed text-[11px] text-zinc-600 dark:text-zinc-400">
                {riskNote}
              </p>
            </div>
          </div>
        )}

        {/* Action Controls for AWAITING_APPROVAL */}
        {isAwaitingApproval ? (
          isAdmin ? (
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800">
              <div className="text-[11px] text-zinc-500">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Awaiting your approval as SRE Operator.</span> Click Approve to apply fix or Reject to close.
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100/60 dark:hover:bg-rose-900/40 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>

                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Apply</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="leading-relaxed">
                  <strong>Awaiting SRE Approval</strong>: Security policy requires SRE on-call signoff for permission changes. Employee accounts cannot self-approve permission changes.
                </span>
              </div>
            </div>
          )
        ) : isResolved ? (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Remediation approved and marked resolved. Audit event recorded.</span>
          </div>
        ) : isRejected ? (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>Remediation rejected. Ticket marked closed without applying permission change.</span>
          </div>
        ) : (
          <div className="text-xs text-zinc-400 italic">
            Pipeline in progress... Resolution will become available for approval once Resolver completes.
          </div>
        )}
      </div>
    </div>
  );
}
