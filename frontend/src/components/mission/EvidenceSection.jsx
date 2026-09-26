"use client";

import React, { useState } from "react";
import { 
  Activity, 
  BookOpen, 
  Lock, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  CheckCircle2,
  Code
} from "lucide-react";

export default function EvidenceSection({ 
  isExpanded = false, 
  onToggleExpand, 
  ticketId = "TCK-1001",
  traceId = "36180b4737a0ae1bcd582bdc95b0baa1"
}) {
  const [activeTab, setActiveTab] = useState("trace"); // 'trace' | 'docs' | 'permissions'

  return (
    <div id="investigation-evidence" className="raised-card rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#111216]/95 backdrop-blur-md shadow-xs overflow-hidden font-sans">
      {/* Collapsible Header */}
      <div
        onClick={onToggleExpand}
        className="p-3.5 sm:p-4 bg-zinc-50/60 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-mono text-xs">
            <Code className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                Investigation Evidence
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold">
                3 Sources
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
          <span>{isExpanded ? "Hide Evidence" : "Expand Evidence (Trace, Docs, Permissions)"}</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </div>
      </div>

      {/* Expanded Content with 3 Tabs */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Sub-Tabs: Trace, Docs, Permissions */}
          <div className="flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
            {[
              { id: "trace", label: "Trace (Jaeger)", icon: Activity },
              { id: "docs", label: "Docs (Runbooks)", icon: BookOpen },
              { id: "permissions", label: "Permissions (Delta)", icon: Lock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: TRACE */}
          {activeTab === "trace" && (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold">Jaeger Span Telemetry</div>
                  <div className="text-zinc-900 dark:text-zinc-100 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>HTTP 403 Forbidden · /billing/dashboard</span>
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Trace ID: {traceId}
                  </div>
                </div>

                <a
                  href={`http://localhost:16686/trace/${traceId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:opacity-90 transition cursor-pointer"
                >
                  <span>Open in Jaeger UI</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="p-3 rounded-lg bg-[#0c0d10] border border-zinc-800 text-zinc-300 font-mono text-[11px] space-y-1">
                <div className="text-zinc-500">{"// OpenTelemetry Span Error Tags:"}</div>
                <div>service.name: &quot;billing-api&quot;</div>
                <div>http.route: &quot;/billing/dashboard&quot;</div>
                <div>http.response.status_code: 403</div>
                <div className="text-red-400 font-bold">missing_scope: &quot;billing.read&quot;</div>
                <div>employee.id: &quot;rohan&quot;</div>
                <div>employee.scopes: &quot;billing.view, reports.view&quot;</div>
                <div className="text-zinc-400">otel.status_description: &quot;Scope billing.read is missing for employee rohan&quot;</div>
              </div>
            </div>
          )}

          {/* TAB 2: DOCS */}
          {activeTab === "docs" && (
            <div className="space-y-3 font-sans text-xs">
              {/* Citation 1: Runbook */}
              <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase">
                  <span>Matched Runbook</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold">BM25 Score: 1.82</span>
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                  Billing API Scope Requirements &amp; Troubleshooting
                </h4>
                <p className="text-[11.5px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono bg-white dark:bg-zinc-900 p-2.5 rounded border border-zinc-200 dark:border-zinc-800">
                  &ldquo;billing-api requires scope billing.read; commonly missing after role template changes. When callers report 403 Forbidden with missing_scope error on /billing/dashboard, inspect the employee&apos;s assigned scopes and ensure billing.read is provisioned in the authorization server.&rdquo;
                </p>
              </div>

              {/* Citation 2: Post-Mortem */}
              <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase">
                  <span>Historical Post-Mortem</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold">PR #341 Root Cause</span>
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                  POSTMORTEM-2026-03-12: Billing Dashboard 403 Permissions Outage
                </h4>
                <p className="text-[11.5px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono bg-white dark:bg-zinc-900 p-2.5 rounded border border-zinc-200 dark:border-zinc-800">
                  &ldquo;Root cause analysis of intermittent 403 Forbidden errors encountered by billing analysts. A template refactoring PR (#341) inadvertently dropped default read scopes for the billing-analyst role profile.&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: PERMISSIONS */}
          {activeTab === "permissions" && (
            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between text-[11px] text-zinc-500 font-semibold uppercase">
                <span>Permission Delta for Employee: rohan</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">+1 Scope Added</span>
              </div>

              {/* Preserved Code-Block View */}
              <div className="p-3.5 rounded-lg bg-[#0c0d10] border border-zinc-800 text-zinc-300 font-mono text-[11.5px] space-y-1">
                <div className="text-zinc-500">{"// Existing scopes for rohan:"}</div>
                <div className="text-zinc-400">&nbsp;&nbsp;&quot;billing.view&quot;,</div>
                <div className="text-zinc-400">&nbsp;&nbsp;&quot;reports.view&quot;</div>
                <div className="text-emerald-400 font-bold">
                  {'+ "billing.read"                                  // [PROPOSED REMEDIATION]'}
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 font-sans">
                Target service: <code className="text-zinc-700 dark:text-zinc-300">billing-api</code>. Re-aligns user scopes with the billing-analyst profile requirements.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
