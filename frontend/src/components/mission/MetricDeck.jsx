"use client";

import React from "react";
import CountUp from "react-countup";
import { Inbox, Clock, CheckCircle } from "lucide-react";

export default function MetricDeck({ 
  openCount = 2, 
  awaitingApprovalCount = 1, 
  resolvedTodayCount = 1 
}) {
  return (
    <div className="font-sans">
      {/* Exactly 3 Stat Cards: Open, Awaiting Approval, Resolved Today */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Open */}
        <div className="raised-card p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#14151a]/95 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
              Open
            </span>
            <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
              <Inbox className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 font-mono tracking-tight tabular-nums">
              <CountUp end={openCount} duration={1} />
            </span>
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">tickets</span>
          </div>
          <div className="text-[10.5px] font-mono text-zinc-400 mt-1">
            OPEN, TRIAGED, INVESTIGATING
          </div>
        </div>

        {/* 2. Awaiting Approval */}
        <div className="raised-card p-4 rounded-xl border border-amber-500/20 dark:border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
              Awaiting Approval
            </span>
            <div className="w-6 h-6 rounded-md bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 font-mono tracking-tight tabular-nums">
              <CountUp end={awaitingApprovalCount} duration={1} />
            </span>
            <span className="text-xs font-mono text-amber-600/80 dark:text-amber-400/80">pending sign-off</span>
          </div>
          <div className="text-[10.5px] font-mono text-amber-600/70 dark:text-amber-400/70 mt-1">
            Requires human action
          </div>
        </div>

        {/* 3. Resolved Today */}
        <div className="raised-card p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#14151a]/95 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
              Resolved Today
            </span>
            <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight tabular-nums">
              <CountUp end={resolvedTodayCount} duration={1} />
            </span>
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">completed</span>
          </div>
          <div className="text-[10.5px] font-mono text-zinc-400 mt-1">
            Updated today
          </div>
        </div>
      </section>
    </div>
  );
}
