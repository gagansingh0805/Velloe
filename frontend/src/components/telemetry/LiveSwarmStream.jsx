"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, 
  Search, 
  Pause, 
  Play, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  Check,
  Activity,
  Sparkles
} from "lucide-react";

export default function LiveSwarmStream({ steps = [], isSwarmRunning = false }) {
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const scrollRef = useRef(null);

  useEffect(() => {
    if (!isPaused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps, isPaused]);

  const handleCopyJson = (index, payload) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(steps, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `meridian_swarm_telemetry_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Category counts
  const counts = {
    ALL: steps.length,
    GLEAN: steps.filter((s) => s.agentRole === "GLEAN_BRAIN").length,
    PLANNER: steps.filter((s) => s.agentRole === "PLANNER").length,
    EXECUTOR: steps.filter((s) => s.agentRole === "EXECUTOR").length,
    VALIDATOR: steps.filter((s) => s.agentRole === "VALIDATOR").length,
  };

  const filteredSteps = steps.filter((step) => {
    if (filter === "GLEAN" && step.agentRole !== "GLEAN_BRAIN") return false;
    if (filter === "PLANNER" && step.agentRole !== "PLANNER") return false;
    if (filter === "EXECUTOR" && step.agentRole !== "EXECUTOR") return false;
    if (filter === "VALIDATOR" && step.agentRole !== "VALIDATOR") return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const action = (step.actionName || "").toLowerCase();
    const desc = (step.detailDescription || "").toLowerCase();
    const role = (step.agentRole || "").toLowerCase();
    return action.includes(q) || desc.includes(q) || role.includes(q);
  });

  return (
    <div className="raised-card rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#111216]/95 backdrop-blur-md shadow-sm font-sans flex flex-col h-full transition-all">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-zinc-200 dark:border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
          </div>
          <div className="flex items-center gap-2 ml-2 font-semibold text-xs text-zinc-900 dark:text-zinc-100 tracking-wide">
            <Terminal className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <span>Autonomous Swarm Telemetry Stream</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] text-zinc-700 dark:text-zinc-300 font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${isSwarmRunning ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`}></span>
              {isSwarmRunning ? "STREAMING" : "STANDBY"}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused((p) => !p)}
            className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition cursor-pointer"
            title={isPaused ? "Resume Auto-Scroll" : "Pause Auto-Scroll"}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleExportJSON}
            className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition cursor-pointer"
            title="Export JSON Trace"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Filter Pills & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 font-mono text-[10.5px]">
          {["ALL", "GLEAN", "PLANNER", "EXECUTOR", "VALIDATOR"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${
                filter === cat
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700"
              }`}
            >
              {cat} ({counts[cat] ?? 0})
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-44 pl-8 pr-3 py-1 rounded-md bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 font-mono"
          />
        </div>
      </div>

      {/* 3. Event Stream Feed with Framer Motion AnimatePresence & Fading Accent Border */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[440px] recessed-well p-3 rounded-lg bg-[#0c0d10] border border-zinc-200 dark:border-zinc-800/80"
      >
        <AnimatePresence initial={false}>
          {filteredSteps && filteredSteps.length > 0 ? (
            filteredSteps.map((step, idx) => {
              const isRejected = step.status === "REJECTED";
              const isReplanning = step.status === "REPLANNING";
              const isExpanded = expandedIndex === idx;

              return (
                <motion.div
                  key={step.stepNumber || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className={`relative p-3 rounded-lg border text-xs transition-all overflow-hidden ${
                    isRejected
                      ? "bg-red-950/20 border-red-500/30 text-red-200"
                      : isReplanning
                      ? "bg-amber-950/20 border-amber-500/30 text-amber-200"
                      : "bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800/90 text-zinc-800 dark:text-zinc-200"
                  }`}
                >
                  {/* Left Border Accent (4px, animates from full opacity to 0 over 1s) */}
                  <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 1.0, delay: 0.2 }}
                    className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg pointer-events-none ${
                      isRejected ? "bg-red-500" : isReplanning ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                  />

                  {/* Meta Top Line */}
                  <div className="flex items-center justify-between gap-2 mb-1.5 font-mono text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold border border-zinc-200 dark:border-zinc-700">
                        Step 0{step.stepNumber}
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {step.agentRole}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 flex items-center gap-1 text-[10px]">
                        <Clock className="w-3 h-3" />
                        {step.timestamp ? step.timestamp.substring(11, 19) : ""}
                      </span>

                      {isRejected ? (
                        <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          REJECTED
                        </span>
                      ) : isReplanning ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold flex items-center gap-1">
                          <RotateCcw className="w-3 h-3 animate-spin" />
                          SELF-CORRECTING
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          PASSED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Title */}
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs mb-1">
                    {step.actionName}
                  </h4>

                  {/* Detail Description */}
                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed mb-2 font-mono">
                    {step.detailDescription}
                  </p>

                  {/* Agent Internal Thought / Chain of Thought */}
                  {step.internalThought && (
                    <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400 mb-2">
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">Agent CoT Reasoning: </span>
                      {step.internalThought}
                    </div>
                  )}

                  {/* Metadata Expand Toggle & Copy JSON */}
                  {step.metadata && Object.keys(step.metadata).length > 0 && (
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[10.5px] font-mono">
                      <button
                        onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                        className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
                      >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        <span>{isExpanded ? "Collapse Metadata" : "View Step Metadata JSON"}</span>
                      </button>

                      <button
                        onClick={() => handleCopyJson(idx, step.metadata)}
                        className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
                        title="Copy Step Metadata JSON"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy JSON</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Expanded JSON Inspector */}
                  {isExpanded && step.metadata && (
                    <div className="mt-2 p-2.5 rounded bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-48">
                      <pre>{JSON.stringify(step.metadata, null, 2)}</pre>
                    </div>
                  )}
                </motion.div>
              );
            })
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-center text-zinc-500 font-mono text-xs">
              <Terminal className="w-8 h-8 text-zinc-600 mb-2 opacity-50" />
              <span>Awaiting swarm dispatch telemetry stream...</span>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
