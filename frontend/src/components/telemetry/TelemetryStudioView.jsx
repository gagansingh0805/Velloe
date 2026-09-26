"use client";

import React, { useState } from "react";
import { 
  Activity, 
  Terminal, 
  ExternalLink, 
  Zap, 
  ShieldCheck, 
  RefreshCw, 
  Radio, 
  Layers,
  Cpu,
  Clock,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import LiveSwarmStream from "./LiveSwarmStream";
import JaegerEmbeddedConsole from "./JaegerEmbeddedConsole";

export default function TelemetryStudioView({ steps = [], isSwarmRunning = false, currentTrace = null }) {
  const [activeSubTab, setActiveSubTab] = useState("STREAM"); // 'STREAM' | 'JAEGER'

  const selfCorrectionCount = steps.filter((s) => s.status === "REJECTED" || s.status === "REPLANNING").length;
  const passedCount = steps.filter((s) => s.status === "VERIFIED" || s.status === "APPROVED" || s.status === "COMPLETED").length;
  const executionTimeMs = steps.reduce((acc, s) => acc + (s.durationMs || 45), 0);

  return (
    <div className="space-y-4 font-sans">
      {/* 1. Contextual Header: Telemetry & Protocol Studio */}
      <div className="raised-card p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#111216]/95 backdrop-blur-md shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                  Live Swarm Telemetry &amp; Protocol Studio
                </h2>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                  isSwarmRunning
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 animate-pulse"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700"
                }`}>
                  {isSwarmRunning ? "SSE BROADCAST ACTIVE" : "STANDBY"}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                Real-time Server-Sent Events stream: Chain-of-Thought logs, agent-to-agent protocol handoffs, and OpenTelemetry spans
              </p>
            </div>
          </div>

          {/* Jaeger Trace Quick Link */}
          {/* Mode Switcher: Live Stream vs In-App Jaeger Console */}
          <div className="flex items-center gap-2">
            <a
              href="http://localhost:16686"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-mono font-semibold transition hover:bg-zinc-800 dark:hover:bg-zinc-200 flex items-center gap-1.5 shadow-sm"
              title="Open Jaeger Tracing Waterfall"
            >
              <span>View in Jaeger UI</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <div className="flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 font-mono text-xs">
              <button
                onClick={() => setActiveSubTab("STREAM")}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === "STREAM"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Live Terminal Stream</span>
              </button>
              <button
                onClick={() => setActiveSubTab("JAEGER")}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === "JAEGER"
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold shadow-sm"
                    : "text-cyan-700 dark:text-cyan-400 hover:text-cyan-900 dark:hover:text-cyan-200 font-bold"
                }`}
              >
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>In-App Jaeger OTel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Studio Telemetry KPI Deck (Replaces duplicate Mission Control metrics) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60">
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Streamed Events</div>
            <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
              {steps.length} Hops
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
              {passedCount} Verified &bull; {selfCorrectionCount} Self-Corrections
            </div>
          </div>

          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60">
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Protocol Pipeline</div>
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              SSE + OTLP 4317
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
              Full Jaeger gRPC Export
            </div>
          </div>

          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60">
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Autonomous Loop</div>
            <div className="text-lg font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-0.5">
              {selfCorrectionCount > 0 ? "Self-Corrected" : "Nominal"}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
              Strict Gatekeeper &bull; Zero Human Intervention
            </div>
          </div>

          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60">
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Total Trace Latency</div>
            <div className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400 mt-0.5">
              ~{executionTimeMs} ms
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
              End-to-End Swarm Cycle
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Live Telemetry Stream Body */}
      {/* 2. Main Live Telemetry Stream Body vs In-App Jaeger Console */}
      <div className="min-h-[620px]">
        <LiveSwarmStream steps={steps} isSwarmRunning={isSwarmRunning} />
        {activeSubTab === "STREAM" ? (
          <LiveSwarmStream steps={steps} isSwarmRunning={isSwarmRunning} />
        ) : (
          <JaegerEmbeddedConsole currentTrace={currentTrace} />
        )}
      </div>
    </div>
  );
}

