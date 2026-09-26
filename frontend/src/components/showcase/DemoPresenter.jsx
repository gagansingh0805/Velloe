"use client";

import React, { useState } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Sparkles,
  Eye,
  Clock,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function DemoPresenter({
  step = 0,
  totalSteps = 5,
  currentStage = {},
  isPaused = false,
  onTogglePause,
  onNext,
  onPrev,
  onExit,
  progress = 0,
  secondsRemaining = 10,
  currentTrace = {}
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    title = "Autonomous Swarm Showcase Tour",
    narrative = "Evaluating multi-agent response...",
    tag = "DEMO",
    target = "Primary Mission Control",
    whatToNotice = "Observe the highlighted components on screen."
  } = currentStage;

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:bottom-auto sm:top-16 sm:right-6 sm:left-auto sm:w-[380px] z-50 max-h-[calc(100vh-5rem)] flex flex-col rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden select-none animate-fadeIn font-sans">
      {/* Animated Progress Bar along top border */}
      <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
        <div
          className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      {/* Scrollable Body Content */}
      <div className="p-3 sm:p-4 overflow-y-auto space-y-2 sm:space-y-3 flex-1">
        {/* Top Header: Step Counter, Tag Badge, Timer, Exit Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-indigo-500" />
              <span>Tour Step {step + 1}/{totalSteps}</span>
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 truncate">
              {tag}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Mobile Details Toggle */}
            <button
              onClick={() => setIsExpanded((p) => !p)}
              className="sm:hidden flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
              title={isExpanded ? "Collapse Details" : "Expand Details"}
            >
              <span>{isExpanded ? "Less" : "Details"}</span>
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>

            <div className="flex items-center gap-1 font-mono text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
              <Clock className="w-3 h-3 text-zinc-500" />
              <span className="tabular-nums font-semibold">{secondsRemaining}s</span>
            </div>
            <button
              onClick={onExit}
              className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Exit Showcase Tour"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Stage Title and Narrative Text */}
        <div className="space-y-0.5 sm:space-y-1">
          <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">
            {title}
          </h3>
          <p className={`text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed ${isExpanded ? "" : "line-clamp-2 sm:line-clamp-none"}`}>
            {narrative}
          </p>
        </div>

        {/* What to Notice Callout Box */}
        <div className={`${isExpanded ? "block" : "hidden sm:block"} rounded-lg p-2.5 sm:p-3 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 space-y-1.5`}>
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            <Eye className="w-3.5 h-3.5 text-emerald-500" />
            <span>What to notice on screen:</span>
          </div>
          <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
            {whatToNotice}
          </p>
          <div className="pt-0.5 flex items-center gap-1 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Target Area:</span>
            <span className="truncate">{target}</span>
          </div>
        </div>

        {/* Live Swarm Snapshot Telemetry Chips */}
        <div className={`${isExpanded ? "grid" : "hidden sm:grid"} grid-cols-3 gap-1.5 pt-0.5 text-center font-mono text-[10px]`}>
          <div className="p-1.5 rounded bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
            <span className="text-zinc-500 dark:text-zinc-400 block text-[9px]">SERVICES</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
              14 Mesh
            </span>
          </div>
          <div className="p-1.5 rounded bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
            <span className="text-zinc-500 dark:text-zinc-400 block text-[9px]">THROUGHPUT</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
              3,500 req/s
            </span>
          </div>
          <div className="p-1.5 rounded bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
            <span className="text-zinc-500 dark:text-zinc-400 block text-[9px]">SAVED</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              +$253,799
            </span>
          </div>
        </div>
      </div>

      {/* Footer Navigation & Controls */}
      <div className="p-2.5 sm:p-3 bg-zinc-50/70 dark:bg-zinc-950/70 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0 space-y-1.5 sm:space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={onPrev}
              disabled={step === 0}
              className="p-1.5 rounded-md bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 transition-colors cursor-pointer"
              title="Previous Demo Stage (Left Arrow)"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onTogglePause}
              className="p-1.5 rounded-md bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              title={isPaused ? "Resume Countdown (Space)" : "Pause Countdown (Space)"}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
            </button>
            <button
              onClick={onNext}
              className="p-1.5 rounded-md bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              title="Next Demo Stage (Right Arrow)"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onNext}
              className="px-3 py-1 rounded-md text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-sm transition cursor-pointer"
            >
              {step === totalSteps - 1 ? "Finish Tour" : "Next Stage →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

