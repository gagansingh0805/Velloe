"use client";

import React, { useState } from "react";
import { 
  Activity, 
  Terminal, 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  Check, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  Layers,
  Search,
  ShieldCheck
} from "lucide-react";

export default function TicketLogsAndFeed({
  liveLogs = [],
  steps = [],
  isLoadingSteps = false,
  status = "OPEN"
}) {
  const [activeView, setActiveView] = useState("live"); // "live" | "raw"
  const [expandedSteps, setExpandedSteps] = useState({ 0: true, 1: true, 2: true, 3: true });
  const [copiedKey, setCopiedKey] = useState(null);

  const toggleStep = (idx) => {
    setExpandedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const getAgentIcon = (name) => {
    switch (name) {
      case "CLASSIFIER": return Layers;
      case "TRACE_LOOKUP": return Search;
      case "CORRELATOR": return Sparkles;
      case "RESOLVER": return ShieldCheck;
      default: return Terminal;
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden font-sans">
      {/* Header & Tab Selector */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950/70 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-zinc-200/60 dark:bg-zinc-800/80">
          <button
            onClick={() => setActiveView("live")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeView === "live"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span>Live Activity Feed</span>
            {liveLogs.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">
                {liveLogs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView("raw")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeView === "raw"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-500" />
            <span>Agent Transparency Logs</span>
            {steps.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono">
                {steps.length} steps
              </span>
            )}
          </button>
        </div>

        <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
          {["OPEN", "TRIAGED", "INVESTIGATING", "PROPOSED"].includes(status) ? (
            <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
              Live SSE Active
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Pipeline Complete
            </span>
          )}
        </div>
      </div>

      {/* VIEW A: LIVE ACTIVITY FEED */}
      {activeView === "live" && (
        <div className="p-4 space-y-2.5 max-h-[380px] overflow-y-auto font-mono text-xs">
          {liveLogs.length === 0 ? (
            <div className="py-8 text-center text-zinc-400 font-sans">
              <Clock className="w-5 h-5 mx-auto mb-1.5 opacity-40 animate-pulse" />
              <p className="text-xs">Waiting for agent events to arrive over live stream...</p>
            </div>
          ) : (
            liveLogs.map((log, idx) => {
              const isRecent = idx === liveLogs.length - 1;
              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border flex items-start gap-2.5 transition-colors ${
                    isRecent
                      ? "bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30 text-zinc-800 dark:text-zinc-200"
                      : "bg-zinc-50/70 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 flex-shrink-0 pt-0.5">
                    {log.time || "now"}
                  </span>
                  
                  {log.agent && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex-shrink-0">
                      {log.agent}
                    </span>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-relaxed break-words font-sans">
                      {log.message}
                    </p>
                    {log.detail && (
                      <p className="text-[11px] text-zinc-500 mt-1 font-mono">
                        {log.detail}
                      </p>
                    )}
                  </div>

                  {log.confidence && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                      {log.confidence}%
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW B: RAW TRANSPARENCY LOGS */}
      {activeView === "raw" && (
        <div className="p-3 sm:p-4 space-y-3 max-h-[460px] overflow-y-auto">
          {isLoadingSteps && steps.length === 0 ? (
            <div className="py-8 text-center text-zinc-400 font-sans">
              <Activity className="w-5 h-5 mx-auto mb-1.5 animate-spin text-indigo-500" />
              <p className="text-xs">Fetching raw agent step execution logs...</p>
            </div>
          ) : steps.length === 0 ? (
            <div className="py-8 text-center text-zinc-400 font-sans">
              <Terminal className="w-5 h-5 mx-auto mb-1.5 opacity-40" />
              <p className="text-xs">No agent steps recorded yet for this ticket.</p>
            </div>
          ) : (
            steps.map((step, idx) => {
              const isExpanded = !!expandedSteps[idx];
              const Icon = getAgentIcon(step.agentName);
              const copyPromptKey = `prompt-${idx}`;
              const copyOutputKey = `output-${idx}`;

              return (
                <div
                  key={step.id || idx}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/40"
                >
                  {/* Step Header Accordion Toggle */}
                  <button
                    onClick={() => toggleStep(idx)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            Step {idx + 1}: {step.agentName}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                            step.status === "DONE"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                          }`}>
                            {step.status}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-zinc-400">
                          {step.completedAt ? `Completed: ${new Date(step.completedAt).toLocaleTimeString()}` : "In execution"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-zinc-400">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Expanded Step Details: Prompt & Output */}
                  {isExpanded && (
                    <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3 bg-white dark:bg-zinc-900 text-xs">
                      {/* Prompt Sent */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500" /> promptSent
                          </span>
                          {step.promptSent && (
                            <button
                              onClick={() => handleCopy(step.promptSent, copyPromptKey)}
                              className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                            >
                              {copiedKey === copyPromptKey ? (
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
                        <pre className="p-2.5 rounded-lg bg-zinc-950 text-zinc-200 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48 border border-zinc-800">
                          {step.promptSent || "No prompt payload recorded for this step (Deterministic system step)."}
                        </pre>
                      </div>

                      {/* Raw Output */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> rawOutput
                          </span>
                          {step.rawOutput && (
                            <button
                              onClick={() => handleCopy(step.rawOutput, copyOutputKey)}
                              className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                            >
                              {copiedKey === copyOutputKey ? (
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
                        <pre className="p-2.5 rounded-lg bg-zinc-950 text-emerald-400 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-56 border border-zinc-800">
                          {step.rawOutput || "No output recorded."}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
