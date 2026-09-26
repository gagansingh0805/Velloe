"use client";

import React from "react";
import { ArrowRight, CheckCircle2, ShieldCheck, Cpu, KeyRound, Radio, Zap } from "lucide-react";
import { HARDENING_PILLARS } from "@/constants/hardeningPillars";

export default function HardeningView({ pitchData }) {
  const pillars = HARDENING_PILLARS;

  return (
    <div className="space-y-3.5 font-sans">
      {/* Top Banner Contextual Header */}
      <div className="raised-card p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#111216]/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
              Production Hardening Roadmap (Deliverable 4)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-bold">
              Enterprise Scale
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-1">
            Four architectural pillars addressing formal verification, microVM isolation, cryptographic governance, and event clustering
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Presentation Deck Ready</span>
        </div>
      </div>

      {/* Contextual Hardening Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">Pillar 1: Verification</div>
          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">OPA / Rego</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">100% Deterministic</div>
        </div>
        <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">Pillar 2: Sandbox</div>
          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">Firecracker eBPF</div>
          <div className="text-[10px] text-cyan-600 dark:text-cyan-400 mt-1">&lt;5ms Boot Time</div>
        </div>
        <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">Pillar 3: Governance</div>
          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">M-of-N MPC</div>
          <div className="text-[10px] text-purple-600 dark:text-purple-400 mt-1">Multi-Party Keys</div>
        </div>
        <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">Pillar 4: Red-Teaming</div>
          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">Chaos Mesh</div>
          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1">Continuous Fuzzing</div>
        </div>
      </div>

      {/* Pillars Grid with tightened spacing & visual separators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {pillars.map((p, idx) => {
          const Icon = p.icon;
          return (
            <div
              key={idx}
              className="raised-card glass-card p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#18191e]/95 flex flex-col justify-between shadow-sm hover:border-cyan-500/30 transition-all duration-150"
            >
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs tracking-tight">
                    {p.title}
                  </h3>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-mono leading-relaxed mb-3">
                  {p.description}
                </p>
              </div>

              {/* Visual Divider & Impact Statement */}
              <div className="pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800/80 flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 -mx-4 -mb-4 p-3 rounded-b-xl border-t">
                <Zap className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />
                <span className="font-semibold text-[11.5px]">Impact: {p.impact}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
