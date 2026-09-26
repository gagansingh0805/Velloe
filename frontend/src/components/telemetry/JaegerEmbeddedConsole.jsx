"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  Activity, 
  RefreshCw, 
  ExternalLink, 
  SlidersHorizontal, 
  Layers, 
  Search, 
  ShieldAlert, 
  BrainCircuit, 
  Terminal, 
  FolderGit2, 
  Maximize2, 
  Minimize2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function JaegerEmbeddedConsole({ currentTrace = null, defaultOperation = "" }) {
  const [iframeKey, setIframeKey] = useState(0);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [jaegerHealthy, setJaegerHealthy] = useState(true);
  const iframeRef = useRef(null);

  // Dynamic host URL pointing directly to Jaeger on port 16686
  // This allows Jaeger's <base href="/" /> to resolve ./static/... and /api/... directly to port 16686 without 404s
  const getBaseJaegerUrl = useCallback(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname || "localhost";
      return `http://${hostname}:16686`;
    }
    return "http://localhost:16686";
  }, []);

  const getTargetUrl = useCallback(() => {
    const base = getBaseJaegerUrl();
    if (currentTrace?.otelTraceId && activeFilter === "ACTIVE_TRACE") {
      return `${base}/trace/${currentTrace.otelTraceId}`;
    }

    switch (activeFilter) {
      case "PLANNER":
        return `${base}/search?service=meridian&operation=planner.decompose`;
      case "RETRIEVER":
        return `${base}/search?service=meridian&operation=retriever.extract`;
      case "EXECUTOR":
        return `${base}/search?service=meridian&operation=executor.stage`;
      case "VALIDATOR":
        return `${base}/search?service=meridian&operation=validator.audit`;
      default:
        return `${base}/search?service=meridian`;
    }
  }, [getBaseJaegerUrl, currentTrace?.otelTraceId, activeFilter]);

  const [currentUrl, setCurrentUrl] = useState(getTargetUrl());

  useEffect(() => {
    setCurrentUrl(getTargetUrl());
    setIsIframeLoading(true);
  }, [getTargetUrl]);

  // Check Jaeger health by querying the proxy or port 16686
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch("/jaeger-proxy/api/services");
        if (res.ok) {
          setJaegerHealthy(true);
        } else {
          setJaegerHealthy(false);
        }
      } catch (err) {
        setJaegerHealthy(false);
      }
    };
    checkHealth();
  }, [iframeKey]);

  const handleReload = () => {
    setIsIframeLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleFilterSelect = (filterKey) => {
    setActiveFilter(filterKey);
    setIsIframeLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const directExternalUrl = currentUrl || "http://localhost:16686/search?service=meridian";

  return (
    <div className={`space-y-3 font-sans transition-all duration-300 ${
      isFullscreen 
        ? "fixed inset-2 sm:inset-4 z-50 bg-white/98 dark:bg-[#111216]/98 backdrop-blur-2xl p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col" 
        : ""
    }`}>
      {/* 1. In-App Jaeger Console Control Bar */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#14151a]/95 backdrop-blur-md shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Left Title & Status */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                  Embedded Jaeger Distributed Tracing Console
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border flex items-center gap-1 ${
                  jaegerHealthy
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${jaegerHealthy ? "bg-emerald-500 animate-ping" : "bg-red-500"}`}></span>
                  {jaegerHealthy ? "OTEL BACKEND CONNECTED" : "JAEGER OFFLINE"}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                OpenTelemetry Collector &bull; In-app waterfall inspection &bull; OTLP gRPC 4317 &bull; Direct Port 16686
              </p>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleReload}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs font-mono transition cursor-pointer flex items-center gap-1.5"
              title="Refresh Jaeger Iframe"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs font-mono transition cursor-pointer flex items-center gap-1.5"
              title={isFullscreen ? "Exit Fullscreen" : "Expand to Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
            </button>

            <a
              href={directExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-mono font-semibold transition hover:bg-zinc-800 dark:hover:bg-zinc-200 flex items-center gap-1.5 shadow-sm"
              title="Open current trace in separate browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open in Tab</span>
            </a>
          </div>
        </div>

        {/* Quick Operation Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 font-mono text-[10.5px]">
          <span className="text-zinc-400 uppercase tracking-wider text-[9.5px] mr-1 flex items-center gap-1 flex-shrink-0">
            <SlidersHorizontal className="w-3 h-3" /> Quick Filter:
          </span>

          {currentTrace?.otelTraceId && (
            <button
              onClick={() => handleFilterSelect("ACTIVE_TRACE")}
              className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex-shrink-0 flex items-center gap-1.5 border ${
                activeFilter === "ACTIVE_TRACE"
                  ? "bg-cyan-500 text-white dark:bg-cyan-400 dark:text-black border-cyan-500 shadow-sm"
                  : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20"
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Current Incident Trace ({currentTrace.otelTraceId.substring(0, 8)}...)</span>
            </button>
          )}

          {[
            { id: "ALL", label: "All Meridian Spans", icon: Layers },
            { id: "PLANNER", label: "planner.decompose", icon: BrainCircuit },
            { id: "RETRIEVER", label: "retriever.extract", icon: FolderGit2 },
            { id: "EXECUTOR", label: "executor.stage", icon: Terminal },
            { id: "VALIDATOR", label: "validator.audit", icon: ShieldAlert },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activeFilter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleFilterSelect(item.id)}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Embedded Jaeger Iframe Viewport */}
      <div className={`relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111216] overflow-hidden shadow-sm ${
        isFullscreen ? "flex-1" : "h-[740px]"
      }`}>
        {isIframeLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 dark:bg-[#111216]/80 backdrop-blur-sm font-mono text-xs text-zinc-600 dark:text-zinc-400 space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin text-cyan-500" />
            <span>Connecting to Jaeger OTel collector &amp; rendering waterfall...</span>
          </div>
        )}

        {!jaegerHealthy && !isIframeLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-[#111216] font-sans space-y-3">
            <div className="p-3 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Jaeger Distributed Tracing Container Unreachable
            </h4>
            <p className="text-xs text-zinc-500 max-w-md font-mono">
              Ensure Jaeger is running locally on port 16686 (UI) and port 4317 (OTLP gRPC).
            </p>
            <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-xs text-cyan-600 dark:text-cyan-400">
              docker compose up jaeger -d
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReload}
                className="px-3.5 py-1.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-mono font-semibold"
              >
                Retry Connection
              </button>
              <a
                href={directExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Open in New Window
              </a>
            </div>
          </div>
        )}

        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={currentUrl}
          onLoad={() => setIsIframeLoading(false)}
          className="w-full h-full border-0 select-auto bg-white dark:bg-[#111216]"
          title="In-App Jaeger Distributed Tracing"
        />
      </div>
    </div>
  );
}
