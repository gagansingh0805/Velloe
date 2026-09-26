"use client";

import React, { useState } from "react";
import { 
  Inbox, 
  Layers, 
  Sparkles, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink, 
  X, 
  Copy, 
  Check, 
  Terminal, 
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Code,
  ArrowDown
} from "lucide-react";

// Real duration calculation helper (completedAt - startedAt)
function calculateDurationMs(startedAt, completedAt) {
  if (!startedAt || !completedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return null;
  const diff = end - start;
  return `${diff.toLocaleString()} ms`;
}

// Format timestamp safely
function formatTime(isoString) {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch (e) {
    return String(isoString);
  }
}

export default function PipelineGraph({
  ticket,
  steps = [],
  nodesState = {},
  currentRunningNode = null,
  onViewInvestigation
}) {
  const [selectedStepModal, setSelectedStepModal] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Extract individual steps by agent name
  const classifierStep = steps.find((s) => s.agentName === "CLASSIFIER");
  const correlatorStep = steps.find((s) => s.agentName === "CORRELATOR");
  const traceStep = steps.find((s) => s.agentName === "TRACE_LOOKUP");
  const resolverStep = steps.find((s) => s.agentName === "RESOLVER");

  // Determine Classifier Outputs & Flags
  const classifierParsed = classifierStep?.parsedOutput || nodesState.CLASSIFIER?.parsedOutput || {};
  const needsDocSearch = classifierParsed.needs_doc_search ?? classifierParsed.needsDocSearch;
  const needsTraceLookup = classifierParsed.needs_trace_lookup ?? classifierParsed.needsTraceLookup;
  const needsPermissionCheck = classifierParsed.needs_permission_check ?? classifierParsed.needsPermissionCheck;
  const classifierConfidence = classifierParsed.confidence 
    ? Math.round(classifierParsed.confidence * (classifierParsed.confidence <= 1 ? 100 : 1)) 
    : null;

  // Correlator Outputs & Flags
  const correlatorParsed = correlatorStep?.parsedOutput || nodesState.CORRELATOR?.parsedOutput || {};
  const correlatorConfidence = correlatorParsed.confidence 
    ? Math.round(correlatorParsed.confidence * (correlatorParsed.confidence <= 1 ? 100 : 1)) 
    : null;
  const evidenceSufficient = correlatorParsed.evidence_sufficient ?? correlatorParsed.evidenceSufficient;

  // Trace Outputs & Flags
  const traceParsed = traceStep?.parsedOutput || nodesState.TRACE_LOOKUP?.parsedOutput || {};
  const isTraceSkipped = classifierStep?.status === "DONE" && needsTraceLookup === false;

  // Resolver Outputs & Flags
  const resolverParsed = resolverStep?.parsedOutput || nodesState.RESOLVER?.parsedOutput || {};

  // Card Step Statuses
  const getCardStatus = (agentName, stepObj) => {
    if (stepObj?.status === "DONE") return "DONE";
    if (stepObj?.status === "FAILED") return "FAILED";
    if (nodesState[agentName]?.status === "DONE") return "DONE";
    if (nodesState[agentName]?.status === "FAILED") return "FAILED";
    if (currentRunningNode === agentName || stepObj?.status === "RUNNING") return "RUNNING";
    return "PENDING";
  };

  const classifierStatus = getCardStatus("CLASSIFIER", classifierStep);
  const correlatorStatus = getCardStatus("CORRELATOR", correlatorStep);
  const traceStatus = isTraceSkipped ? "SKIPPED" : getCardStatus("TRACE_LOOKUP", traceStep);
  const resolverStatus = getCardStatus("RESOLVER", resolverStep);

  // Ticket Status & Approval Gate Status
  const ticketStatus = ticket?.status || "OPEN";
  const isTicketActive = ["OPEN", "TRIAGED", "INVESTIGATING", "PROPOSED", "AWAITING_APPROVAL"].includes(ticketStatus);

  // Check if pipeline has failed
  const isFailed = classifierStatus === "FAILED" || correlatorStatus === "FAILED" || traceStatus === "FAILED" || resolverStatus === "FAILED";

  // Check connectors (solid once data has flowed through / next step started or done, dotted while pending)
  const isConn1Solid = classifierStatus !== "PENDING";
  const isConn2Solid = correlatorStatus !== "PENDING";
  const isConn3Solid = traceStatus !== "PENDING";
  const isConn4Solid = resolverStatus !== "PENDING";
  const isConn5Solid = ["AWAITING_APPROVAL", "RESOLVED", "REJECTED"].includes(ticketStatus);

  return (
    <div className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#111216]/95 backdrop-blur-md shadow-xs p-3.5 sm:p-4 font-sans relative overflow-hidden">
      {/* Schematic Architectural Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(120, 120, 128, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(120, 120, 128, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px"
        }}
      />

      {/* Schematic Header Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Pipeline Topology Schematic
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
            SSE Flow · 6 Nodes
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10.5px] font-mono text-zinc-400">
          {onViewInvestigation && (
            <button
              type="button"
              onClick={onViewInvestigation}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-[11px] font-mono font-semibold transition cursor-pointer"
            >
              <Code className="w-3 h-3" />
              <span>View Investigation</span>
              <ArrowDown className="w-3 h-3" />
            </button>
          )}
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-emerald-500 inline-block" /> Solid = Active / Done
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 border-t border-dashed border-zinc-400 inline-block" /> Dotted = Pending
          </span>
          <span className="hidden md:inline text-zinc-500">· Click card to inspect raw step</span>
        </div>
      </div>

      {/* Horizontal Flow Container with Horizontal Scroll on smaller viewports */}
      <div className="relative z-10 overflow-x-auto pb-2 pt-1 scrollbar-thin">
        <div className="min-w-[1240px] flex items-center justify-between gap-1 relative py-1">

          {/* CARD 1: TICKET INTAKE */}
          <div
            id="schematic-card-intake"
            className="w-[185px] min-w-[185px] min-h-[250px] h-auto rounded-xl border p-3 flex flex-col justify-between transition-all bg-zinc-50/90 dark:bg-zinc-950/80 border-zinc-200 dark:border-zinc-800/90 shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-6 h-6 rounded-md bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                  <Inbox className="w-3.5 h-3.5" />
                </div>
                {isTicketActive ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700">
                    CLOSED
                  </span>
                )}
              </div>

              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate mb-1">
                1. Ticket Intake
              </div>
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
                Ingest Gateway
              </div>

              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed font-sans bg-white dark:bg-zinc-900/60 p-2 rounded border border-zinc-100 dark:border-zinc-800/70">
                {ticket?.description || "No description provided."}
              </p>
            </div>

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
              <span>Received:</span>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{formatTime(ticket?.createdAt)}</span>
            </div>
          </div>

          {/* CONNECTOR 1 -> 2 */}
          <div className="flex-1 px-1 flex items-center justify-center">
            <svg className="w-full h-4" viewBox="0 0 40 16" fill="none">
              <line
                x1="0"
                y1="8"
                x2="32"
                y2="8"
                className={isConn1Solid ? "stroke-emerald-500" : "stroke-zinc-300 dark:stroke-zinc-700"}
                strokeWidth="2"
                strokeDasharray={isConn1Solid ? "none" : "4 3"}
              />
              <polyline
                points="30,4 38,8 30,12"
                className={isConn1Solid ? "stroke-emerald-500 fill-emerald-500" : "stroke-zinc-300 dark:stroke-zinc-700 fill-zinc-300 dark:fill-zinc-700"}
                strokeWidth="1.5"
              />
            </svg>
          </div>

          {/* CARD 2: TRIAGE (CLASSIFIER) */}
          <div
            id="schematic-card-classifier"
            onClick={() => classifierStep && setSelectedStepModal({ title: "Triage · Classifier Agent", step: classifierStep })}
            className={`w-[195px] min-w-[195px] min-h-[250px] h-auto rounded-xl border p-3 flex flex-col justify-between transition-all cursor-pointer group ${
              classifierStatus === "DONE"
                ? "bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500 shadow-xs hover:border-emerald-400"
                : classifierStatus === "RUNNING"
                ? "bg-cyan-500/5 dark:bg-cyan-950/20 border-cyan-500 animate-pulse"
                : classifierStatus === "FAILED"
                ? "bg-rose-500/5 dark:bg-rose-950/20 border-rose-500"
                : "bg-zinc-50/50 dark:bg-zinc-950/40 border-dashed border-zinc-200 dark:border-zinc-800 opacity-60"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-6 h-6 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                {classifierStatus === "DONE" ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> DONE
                  </span>
                ) : classifierStatus === "RUNNING" ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> RUNNING
                  </span>
                ) : classifierStatus === "FAILED" ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                    FAILED
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 border border-zinc-300 dark:border-zinc-700">
                    PENDING
                  </span>
                )}
              </div>

              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                2. Triage (Classifier)
              </div>
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
                Intent &amp; Routing
              </div>

              {classifierStatus === "DONE" ? (
                <div className="space-y-1.5 font-mono text-[10.5px]">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Category:</span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20 text-[10px]">
                      {classifierParsed.category || "PERMISSIONS"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Confidence:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {classifierConfidence ? `${classifierConfidence}%` : "—"}
                    </span>
                  </div>

                  {/* Checklist Rows */}
                  <div className="pt-1.5 space-y-0.5 border-t border-zinc-100 dark:border-zinc-800 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className={needsDocSearch ? "text-emerald-500 font-bold" : "text-zinc-400"}>
                        {needsDocSearch ? "✓" : "—"}
                      </span>
                      <span className={needsDocSearch ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400"}>
                        needs_doc_search
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={needsTraceLookup ? "text-emerald-500 font-bold" : "text-zinc-400"}>
                        {needsTraceLookup ? "✓" : "—"}
                      </span>
                      <span className={needsTraceLookup ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400"}>
                        needs_trace_lookup
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={needsPermissionCheck ? "text-emerald-500 font-bold" : "text-zinc-400"}>
                        {needsPermissionCheck ? "✓" : "—"}
                      </span>
                      <span className={needsPermissionCheck ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400"}>
                        needs_permission_check
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-zinc-400 font-mono text-[10.5px]">
                  {classifierStatus === "RUNNING" ? "Classifying ticket..." : "Awaiting triage trigger"}
                </div>
              )}
            </div>

            <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-800/80 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
              <span>Duration:</span>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {calculateDurationMs(classifierStep?.startedAt, classifierStep?.completedAt) || "—"}
              </span>
            </div>
          </div>

          {/* CONNECTOR 2 -> 3 */}
          <div className="flex-1 px-1 flex items-center justify-center">
            <svg className="w-full h-4" viewBox="0 0 40 16" fill="none">
              <line
                x1="0"
                y1="8"
                x2="32"
                y2="8"
                className={isConn2Solid ? "stroke-emerald-500" : "stroke-zinc-300 dark:stroke-zinc-700"}
                strokeWidth="2"
                strokeDasharray={isConn2Solid ? "none" : "4 3"}
              />
              <polyline
                points="30,4 38,8 30,12"
                className={isConn2Solid ? "stroke-emerald-500 fill-emerald-500" : "stroke-zinc-300 dark:stroke-zinc-700 fill-zinc-300 dark:fill-zinc-700"}
                strokeWidth="1.5"
              />
            </svg>
          </div>

          {/* CARD 3: INVESTIGATE (CORRELATOR) */}
          <div
            id="schematic-card-correlator"
            onClick={() => correlatorStep && setSelectedStepModal({ title: "Investigate · Correlator Agent", step: correlatorStep })}
            className={`w-[195px] min-w-[195px] min-h-[250px] h-auto rounded-xl border p-3 flex flex-col justify-between transition-all cursor-pointer group ${
              correlatorStatus === "DONE"
                ? "bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500 shadow-xs hover:border-emerald-400"
                : correlatorStatus === "RUNNING"
                ? "bg-cyan-500/5 dark:bg-cyan-950/20 border-cyan-500 animate-pulse"
                : correlatorStatus === "FAILED"
                ? "bg-rose-500/5 dark:bg-rose-950/20 border-rose-500"
                : "bg-zinc-50/50 dark:bg-zinc-950/40 border-dashed border-zinc-200 dark:border-zinc-800 opacity-60"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-6 h-6 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                {correlatorStatus === "DONE" ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> DONE
                  </span>
                ) : correlatorStatus === "RUNNING" ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> RUNNING
                  </span>
                ) : correlatorStatus === "FAILED" ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                    FAILED
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 border border-zinc-300 dark:border-zinc-700">
                    PENDING
                  </span>
                )}
              </div>

              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">
                3. Investigate (Correlator)
              </div>
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
                Root Cause Synthesis
              </div>

              {correlatorStatus === "DONE" ? (
                <div className="space-y-1.5 font-mono text-[10.5px]">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Confidence:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {correlatorConfidence ? `${correlatorConfidence}%` : "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Sufficient:</span>
                    <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                      evidenceSufficient 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/10 text-amber-600"
                    }`}>
                      {String(evidenceSufficient ?? true)}
                    </span>
                  </div>

                  {/* Evidence Checklist */}
                  <div className="pt-1.5 space-y-0.5 border-t border-zinc-100 dark:border-zinc-800 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span className="text-zinc-700 dark:text-zinc-300">Docs Runbook Match</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span className="text-zinc-700 dark:text-zinc-300">Permission Delta</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={traceStep ? "text-emerald-500 font-bold" : "text-zinc-400"}>
                        {traceStep ? "✓" : "—"}
                      </span>
                      <span className={traceStep ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400"}>
                        Jaeger Span Link
                      </span>
                    </div>
                  </div>

                  {/* View Investigation Action Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewInvestigation?.();
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 font-medium text-[10px] border border-cyan-200 dark:border-cyan-800 transition-colors cursor-pointer group-hover:border-cyan-500/50 shadow-xs"
                    >
                      <Code className="w-3 h-3" />
                      <span>View Investigation</span>
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-zinc-400 font-mono text-[10.5px]">
                  {correlatorStatus === "RUNNING" ? "Correlating evidence..." : "Awaiting classifier data"}
                </div>
              )}
            </div>

            <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-800/80 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
              <span>Duration:</span>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {calculateDurationMs(correlatorStep?.startedAt, correlatorStep?.completedAt) || "—"}
              </span>
            </div>
          </div>

          {/* CONNECTOR 3 -> 4 */}
          <div className="flex-1 px-1 flex items-center justify-center">
            <svg className="w-full h-4" viewBox="0 0 40 16" fill="none">
              <line
                x1="0"
                y1="8"
                x2="32"
                y2="8"
                className={isConn3Solid ? "stroke-emerald-500" : "stroke-zinc-300 dark:stroke-zinc-700"}
                strokeWidth="2"
                strokeDasharray={isConn3Solid ? "none" : "4 3"}
              />
              <polyline
                points="30,4 38,8 30,12"
                className={isConn3Solid ? "stroke-emerald-500 fill-emerald-500" : "stroke-zinc-300 dark:stroke-zinc-700 fill-zinc-300 dark:fill-zinc-700"}
                strokeWidth="1.5"
              />
            </svg>
          </div>

          {/* CARD 4: TRACE CHECK (JAEGER LOOKUP) */}
          <div
            id="schematic-card-trace"
            onClick={() => !isTraceSkipped && traceStep && setSelectedStepModal({ title: "Trace Check · Jaeger Lookup", step: traceStep })}
            className={`w-[195px] min-w-[195px] min-h-[250px] h-auto rounded-xl border p-3 flex flex-col justify-between transition-all ${
              isTraceSkipped
                ? "bg-zinc-100/50 dark:bg-zinc-950/20 border-dashed border-zinc-300 dark:border-zinc-800 opacity-50 cursor-default"
                : traceStatus === "DONE"
                ? "bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500 shadow-xs hover:border-emerald-400 cursor-pointer group"
                : traceStatus === "RUNNING"
                ? "bg-cyan-500/5 dark:bg-cyan-950/20 border-cyan-500 animate-pulse cursor-pointer"
                : "bg-zinc-50/50 dark:bg-zinc-950/40 border-dashed border-zinc-200 dark:border-zinc-800 opacity-60 cursor-pointer"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Search className="w-3.5 h-3.5" />
                </div>
                {isTraceSkipped ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 border border-zinc-300 dark:border-zinc-700">
                    SKIPPED
                  </span>
                ) : traceStatus === "DONE" ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> DONE
                  </span>
                ) : traceStatus === "RUNNING" ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> RUNNING
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 border border-zinc-300 dark:border-zinc-700">
                    PENDING
                  </span>
                )}
              </div>

              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                4. Trace Check
              </div>
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
                Jaeger Telemetry
              </div>

              {isTraceSkipped ? (
                <div className="py-6 px-1 text-center text-zinc-400 dark:text-zinc-500 font-mono text-[11px] leading-tight">
                  Skipped — not required for this issue type
                </div>
              ) : traceStatus === "DONE" ? (
                <div className="space-y-1.5 font-mono text-[10.5px]">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Trace ID:</span>
                    <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      {traceParsed.trace_id ? `${traceParsed.trace_id.slice(0, 8)}...` : "Confirmed"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">HTTP Status:</span>
                    <span className="px-1.5 py-0.2 rounded font-bold text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      HTTP {traceParsed.status || 403}
                    </span>
                  </div>

                  <div className="pt-2">
                    <a
                      href={traceParsed.jaeger_url || `http://localhost:16686/trace/${traceParsed.trace_id || ""}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-medium text-[10px] border border-indigo-200 dark:border-indigo-800 transition-colors"
                    >
                      <span>Open in Jaeger</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-zinc-400 font-mono text-[10.5px]">
                  {traceStatus === "RUNNING" ? "Querying spans..." : "Pending investigation"}
                </div>
              )}
            </div>

            <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-800/80 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
              <span>Duration:</span>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {isTraceSkipped ? "0 ms" : calculateDurationMs(traceStep?.startedAt, traceStep?.completedAt) || "—"}
              </span>
            </div>
          </div>

          {/* CONNECTOR 4 -> 5 */}
          <div className="flex-1 px-1 flex items-center justify-center">
            <svg className="w-full h-4" viewBox="0 0 40 16" fill="none">
              <line
                x1="0"
                y1="8"
                x2="32"
                y2="8"
                className={isConn4Solid ? "stroke-emerald-500" : "stroke-zinc-300 dark:stroke-zinc-700"}
                strokeWidth="2"
                strokeDasharray={isConn4Solid ? "none" : "4 3"}
              />
              <polyline
                points="30,4 38,8 30,12"
                className={isConn4Solid ? "stroke-emerald-500 fill-emerald-500" : "stroke-zinc-300 dark:stroke-zinc-700 fill-zinc-300 dark:fill-zinc-700"}
                strokeWidth="1.5"
              />
            </svg>
          </div>

          {/* CARD 5: RESOLUTION (RESOLVER) */}
          <div
            id="schematic-card-resolver"
            onClick={() => resolverStep && setSelectedStepModal({ title: "Resolution · Resolver Agent", step: resolverStep })}
            className={`w-[195px] min-w-[195px] min-h-[250px] h-auto rounded-xl border p-3 flex flex-col justify-between transition-all cursor-pointer group ${
              resolverStatus === "DONE"
                ? "bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500 shadow-xs hover:border-emerald-400"
                : resolverStatus === "RUNNING"
                ? "bg-cyan-500/5 dark:bg-cyan-950/20 border-cyan-500 animate-pulse"
                : resolverStatus === "FAILED"
                ? "bg-rose-500/5 dark:bg-rose-950/20 border-rose-500"
                : "bg-zinc-50/50 dark:bg-zinc-950/40 border-dashed border-zinc-200 dark:border-zinc-800 opacity-60"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                {resolverStatus === "DONE" ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> DONE
                  </span>
                ) : resolverStatus === "RUNNING" ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> RUNNING
                  </span>
                ) : resolverStatus === "FAILED" ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                    FAILED
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 border border-zinc-300 dark:border-zinc-700">
                    PENDING
                  </span>
                )}
              </div>

              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                5. Resolution (Resolver)
              </div>
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
                Remediation Plan
              </div>

              {resolverStatus === "DONE" ? (
                <div className="space-y-1.5 font-mono text-[10.5px]">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Fix Type:</span>
                    <span className="px-1.5 py-0.2 rounded font-bold text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {resolverParsed.fix_type || "PERMISSION_GRANT"}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-500 block mb-0.5">Risk Note:</span>
                    <p className="text-[10.5px] text-zinc-700 dark:text-zinc-300 line-clamp-2 leading-tight font-sans bg-white dark:bg-zinc-900/60 p-1.5 rounded border border-zinc-100 dark:border-zinc-800/80">
                      {resolverParsed.risk_note ? resolverParsed.risk_note.slice(0, 65) + "..." : "Low operational risk"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-zinc-400 font-mono text-[10.5px]">
                  {resolverStatus === "RUNNING" ? "Generating fix..." : "Awaiting evidence correlation"}
                </div>
              )}
            </div>

            <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-800/80 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
              <span>Duration:</span>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {calculateDurationMs(resolverStep?.startedAt, resolverStep?.completedAt) || "—"}
              </span>
            </div>
          </div>

          {/* CONNECTOR 5 -> 6 */}
          <div className="flex-1 px-1 flex items-center justify-center">
            <svg className="w-full h-4" viewBox="0 0 40 16" fill="none">
              <line
                x1="0"
                y1="8"
                x2="32"
                y2="8"
                className={isConn5Solid ? "stroke-emerald-500" : "stroke-zinc-300 dark:stroke-zinc-700"}
                strokeWidth="2"
                strokeDasharray={isConn5Solid ? "none" : "4 3"}
              />
              <polyline
                points="30,4 38,8 30,12"
                className={isConn5Solid ? "stroke-emerald-500 fill-emerald-500" : "stroke-zinc-300 dark:stroke-zinc-700 fill-zinc-300 dark:fill-zinc-700"}
                strokeWidth="1.5"
              />
            </svg>
          </div>

          {/* CARD 6: APPROVAL GATE */}
          <div
            id="schematic-card-approval"
            className={`w-[185px] min-w-[185px] min-h-[250px] h-auto rounded-xl border p-3 flex flex-col justify-between transition-all ${
              ticketStatus === "RESOLVED"
                ? "bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500 shadow-xs"
                : ticketStatus === "REJECTED"
                ? "bg-rose-500/10 dark:bg-rose-950/30 border-rose-500"
                : ticketStatus === "AWAITING_APPROVAL"
                ? "bg-amber-500/10 dark:bg-amber-950/20 border-amber-500 shadow-xs ring-1 ring-amber-500/20"
                : "bg-zinc-50/50 dark:bg-zinc-950/40 border-dashed border-zinc-200 dark:border-zinc-800 opacity-60"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold ${
                  ticketStatus === "RESOLVED"
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : ticketStatus === "REJECTED"
                    ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                    : ticketStatus === "AWAITING_APPROVAL"
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  ticketStatus === "RESOLVED"
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : ticketStatus === "REJECTED"
                    ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30"
                    : ticketStatus === "AWAITING_APPROVAL"
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 border-zinc-300 dark:border-zinc-700"
                }`}>
                  {ticketStatus}
                </span>
              </div>

              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate mb-1">
                6. Approval Gate
              </div>
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
                Human Sign-off
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80 font-mono text-[10.5px]">
                {ticketStatus === "RESOLVED" ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold block leading-tight">
                    Approved &amp; Remediated
                  </span>
                ) : ticketStatus === "REJECTED" ? (
                  <span className="text-rose-600 dark:text-rose-400 font-bold block leading-tight">
                    Rejected by Operator
                  </span>
                ) : ticketStatus === "AWAITING_APPROVAL" ? (
                  <span className="text-amber-600 dark:text-amber-400 font-bold block leading-tight animate-pulse">
                    Awaiting Operator Sign-off
                  </span>
                ) : (
                  <span className="text-zinc-400 block leading-tight">
                    Pipeline In Progress
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
              <span>Updated:</span>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{formatTime(ticket?.updatedAt)}</span>
            </div>
          </div>

        </div>
      </div>

      {/* INTERACTIVE SLIDE-OVER DRAWER FOR AGENT STEP DETAIL */}
      {selectedStepModal && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-bold">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {selectedStepModal.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 mt-0.5">
                    <span>Agent: {selectedStepModal.step.agentName}</span>
                    <span>·</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedStepModal.step.status}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedStepModal(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Execution Metadata Bar */}
            <div className="px-5 py-2.5 bg-zinc-100/60 dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-mono grid grid-cols-3 gap-2 text-zinc-500">
              <div>
                <span className="block text-[10px] uppercase text-zinc-400">Started</span>
                <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{formatTime(selectedStepModal.step.startedAt)}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-zinc-400">Completed</span>
                <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{formatTime(selectedStepModal.step.completedAt)}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-zinc-400">Duration</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {calculateDurationMs(selectedStepModal.step.startedAt, selectedStepModal.step.completedAt) || "—"}
                </span>
              </div>
            </div>

            {/* Drawer Body: Prompt & Output Payloads */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-mono text-xs">
              {/* Prompt Sent Block */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> promptSent (LLM Context)
                  </span>
                  {selectedStepModal.step.promptSent && (
                    <button
                      onClick={() => handleCopy(selectedStepModal.step.promptSent, "modal-prompt")}
                      className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                      {copiedKey === "modal-prompt" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Prompt</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <pre className="p-3 rounded-lg bg-zinc-950 text-zinc-200 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-56 border border-zinc-800">
                  {selectedStepModal.step.promptSent || "No promptSent recorded (Deterministic System Step)."}
                </pre>
              </div>

              {/* Raw Output Block */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> rawOutput (LLM / Tool Response)
                  </span>
                  {selectedStepModal.step.rawOutput && (
                    <button
                      onClick={() => handleCopy(selectedStepModal.step.rawOutput, "modal-raw")}
                      className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                      {copiedKey === "modal-raw" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Output</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <pre className="p-3 rounded-lg bg-zinc-950 text-emerald-400 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-64 border border-zinc-800">
                  {selectedStepModal.step.rawOutput || "No output recorded."}
                </pre>
              </div>

              {/* Parsed Output JSON View */}
              {selectedStepModal.step.parsedOutput && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500" /> parsedOutput (Structured JSON)
                    </span>
                    <button
                      onClick={() => handleCopy(JSON.stringify(selectedStepModal.step.parsedOutput, null, 2), "modal-json")}
                      className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                      {copiedKey === "modal-json" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500">Copied JSON</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 rounded-lg bg-zinc-950 text-zinc-300 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-64 border border-zinc-800">
                    {JSON.stringify(selectedStepModal.step.parsedOutput, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end bg-zinc-50 dark:bg-zinc-950/60">
              <button
                type="button"
                onClick={() => setSelectedStepModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
