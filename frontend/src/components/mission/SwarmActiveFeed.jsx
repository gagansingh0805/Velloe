"use client";

import React from "react";
import { 
  Layers, 
  BookOpen, 
  Activity, 
  ShieldCheck, 
  CheckCircle2, 
  FileCode,
  ArrowRight,
  Clock,
  Loader2
} from "lucide-react";

export default function SwarmActiveFeed({ 
  ticketId = "TCK-1001",
  status = "AWAITING_APPROVAL",
  isRunning = false,
  onNavigateToTraceLog 
}) {
  const isActivelyInvestigating = isRunning || status === "TRIAGED" || status === "INVESTIGATING" || status === "PROPOSED";

  const PIPELINE_STEPS = [
    {
      stepNumber: 1,
      agentName: "Classifier",
      action: "Triage & Intent Routing",
      status: "COMPLETED",
      summary: "Classified issue as PERMISSIONS (confidence 0.95). Flagged runbook search, trace lookup, and permission check.",
      duration: "310ms"
    },
    {
      stepNumber: 2,
      agentName: "Correlator",
      action: "Runbook & Changelog Cross-Reference",
      status: "COMPLETED",
      summary: "Matched 'Billing API Scope Requirements' & POSTMORTEM-2026-03-12. PR #341 dropped default read scopes.",
      duration: "420ms"
    },
    {
      stepNumber: 3,
      agentName: "Trace Lookup",
      action: "Jaeger Distributed Trace Check",
      status: "COMPLETED",
      summary: "Queried Jaeger OTLP span for billing-api. Confirmed HTTP 403 Forbidden with missing_scope [billing.read].",
      duration: "180ms"
    },
    {
      stepNumber: 4,
      agentName: "Resolver",
      action: "Remediation Synthesis & Approval Gate",
      status: "AWAITING_APPROVAL",
      summary: "Formulated resolution: Grant 'billing.read' scope to rohan and restore role template defaults.",
      duration: "510ms"
    }
  ];

  const getAgentIcon = (name) => {
    switch (name) {
      case "Classifier":
        return <Layers className="w-3.5 h-3.5 text-emerald-500" />;
      case "Correlator":
        return <BookOpen className="w-3.5 h-3.5 text-cyan-500" />;
      case "Trace Lookup":
        return <Activity className="w-3.5 h-3.5 text-indigo-500" />;
      case "Resolver":
        return <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  // If ticket is completed/awaiting approval, collapse into clean single-line bar with link to Trace Log
  if (!isActivelyInvestigating) {
    return (
      <div className="p-3 sm:p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Investigation complete · 4 agent steps executed</span>
        </div>

        {onNavigateToTraceLog && (
          <button
            type="button"
            onClick={() => onNavigateToTraceLog(ticketId)}
            className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>View full trace log</span>
          </button>
        )}
      </div>
    );
  }

  // If ticket is actively being investigated, show the active step-by-step feed
  return (
    <div className="raised-card p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#111216]/95 backdrop-blur-md shadow-xs space-y-3 font-sans">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
            Live Investigation Feed
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-semibold">
          PIPELINE ACTIVE
        </span>
      </div>

      <div className="space-y-2 font-mono text-xs">
        {PIPELINE_STEPS.map((s) => (
          <div
            key={s.stepNumber}
            className="p-2.5 rounded-lg border border-zinc-200/90 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                {getAgentIcon(s.agentName)}
              </div>
              <div className="min-w-0">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 mr-1.5">
                  Step {s.stepNumber}: {s.agentName}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 font-sans text-[11px]">
                  {s.summary}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-zinc-400 self-end sm:self-center flex-shrink-0">
              {s.duration}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
