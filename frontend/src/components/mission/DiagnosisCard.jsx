"use client";

import React from "react";
import { Sparkles, ArrowDown, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";

export default function DiagnosisCard({
  hypothesis,
  confidence = 95,
  isCorrelatorCompleted = true,
  onToggleEvidence,
  isEvidenceExpanded
}) {
  if (!isCorrelatorCompleted) {
    return (
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#14151a]/95 backdrop-blur-md shadow-xs flex items-center justify-between font-sans">
        <div className="flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />
          <div>
            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              Investigating Root Cause...
            </div>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
              Correlator scanning runbooks, post-mortems, and permission records
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-semibold">
          LIVE
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 rounded-xl border border-cyan-500/30 dark:border-cyan-500/30 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 dark:from-cyan-950/20 dark:via-blue-950/20 dark:to-purple-950/20 backdrop-blur-md shadow-xs font-sans space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-cyan-700 dark:text-cyan-300">
            Automated Diagnosis
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-zinc-500 text-[11px]">Confidence:</span>
          <span className="px-2 py-0.5 rounded font-bold text-xs bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
            {confidence}%
          </span>
        </div>
      </div>

      {/* Prominent Root Cause Hypothesis */}
      <div className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-relaxed">
        <span className="font-bold text-zinc-900 dark:text-white">Diagnosis: </span>
        {hypothesis || "Role template PR #341 dropped default 'billing.read' scope from the billing-analyst profile, causing 403 Forbidden on /billing/dashboard."}
      </div>

      {/* View Evidence Toggle Link */}
      <div className="pt-1 flex items-center justify-end">
        <button
          type="button"
          onClick={onToggleEvidence}
          className="text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center gap-1 transition cursor-pointer"
        >
          <span>{isEvidenceExpanded ? "Hide Investigation Evidence" : "View Investigation Evidence (Trace, Docs, Permissions)"}</span>
          <ArrowDown className={`w-3.5 h-3.5 transition-transform ${isEvidenceExpanded ? "rotate-180" : ""}`} />
        </button>
      </div>
    </div>
  );
}
