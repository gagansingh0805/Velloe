"use client";

import React from "react";
import { 
  Layers, 
  BookOpen, 
  Activity, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Loader2,
  ArrowRight
} from "lucide-react";

export default function AgentTopology({ activeStepIndex = 4, isRunning = false }) {
  const AGENT_NODES = [
    {
      id: "CLASSIFIER",
      stepNumber: 1,
      name: "Triage",
      agentName: "Classifier",
      statusSummary: "Permissions, 95%",
      icon: Layers,
      color: "#10b981", // emerald
      accentBg: "rgba(16, 185, 129, 0.12)",
      accentBorder: "rgba(16, 185, 129, 0.3)",
    },
    {
      id: "CORRELATOR",
      stepNumber: 2,
      name: "Investigate",
      agentName: "Correlator",
      statusSummary: "PR #341 Correlated",
      icon: BookOpen,
      color: "#06b6d4", // cyan
      accentBg: "rgba(6, 182, 212, 0.12)",
      accentBorder: "rgba(6, 182, 212, 0.3)",
    },
    {
      id: "TRACE_LOOKUP",
      stepNumber: 3,
      name: "Trace Check",
      agentName: "Trace Lookup",
      statusSummary: "Span 403 Confirmed",
      icon: Activity,
      color: "#6366f1", // indigo
      accentBg: "rgba(99, 102, 241, 0.12)",
      accentBorder: "rgba(99, 102, 241, 0.3)",
    },
    {
      id: "RESOLVER",
      stepNumber: 4,
      name: "Resolution",
      agentName: "Resolver",
      statusSummary: "Awaiting Sign-Off",
      icon: ShieldCheck,
      color: "#a855f7", // purple
      accentBg: "rgba(168, 85, 247, 0.12)",
      accentBorder: "rgba(168, 85, 247, 0.3)",
    },
  ];

  return (
    <div className="raised-card p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#111216]/95 backdrop-blur-md shadow-xs font-sans">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 relative">
        {AGENT_NODES.map((node, index) => {
          const Icon = node.icon;
          const isCompleted = activeStepIndex >= node.stepNumber;
          const isCurrent = isRunning && activeStepIndex === node.stepNumber;

          return (
            <div
              key={node.id}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between relative ${
                isCompleted
                  ? "bg-zinc-50/90 dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-700/80 shadow-xs"
                  : "bg-zinc-50/40 dark:bg-zinc-950/40 border-zinc-100 dark:border-zinc-800/60 opacity-55"
              }`}
              style={{
                borderLeftWidth: "3px",
                borderLeftColor: isCompleted ? node.color : "transparent",
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{
                    backgroundColor: isCompleted ? node.accentBg : "rgba(113, 113, 122, 0.1)",
                    border: `1px solid ${isCompleted ? node.accentBorder : "transparent"}`,
                  }}
                >
                  <Icon
                    className="w-3.5 h-3.5"
                    style={{ color: isCompleted ? node.color : "#71717a" }}
                  />
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {node.name}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                    {node.statusSummary}
                  </div>
                </div>
              </div>

              {/* Status indicator: checkmark, spinner, or pending clock */}
              <div className="flex-shrink-0 ml-1">
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                )}
              </div>

              {/* Connecting arrow for desktop */}
              {index < AGENT_NODES.length - 1 && (
                <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-3.5 h-3.5 rounded-full bg-zinc-200 dark:bg-zinc-700 items-center justify-center text-zinc-500 shadow-xs">
                  <ArrowRight className="w-2 h-2" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
