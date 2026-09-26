"use client";

import React, { useState } from "react";
import { 
  Search, 
  BookOpen, 
  GitCommit, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Layers,
  ArrowRight,
  Filter,
  Loader2,
  Bot
} from "lucide-react";

export default function GleanBrainCard({ evidence = [], onSearch, isLoading }) {
  const [searchTerm, setSearchTerm] = useState("billing-api");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [localSearching, setLocalSearching] = useState(false);

  // Normalize data whether passed as an Array or Object with results & synthesis
  const docs = Array.isArray(evidence) ? evidence : (evidence?.results || []);
  const synthesizedAnswer = !Array.isArray(evidence) ? evidence?.synthesizedAnswer : null;
  const totalIndexed = !Array.isArray(evidence) ? (evidence?.totalIndexed || 18) : 18;

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    if (onSearch) {
      setLocalSearching(true);
      try {
        await onSearch(searchTerm.trim());
      } finally {
        setLocalSearching(false);
      }
    }
  };

  const handleQuickTag = async (tag) => {
    setSearchTerm(tag);
    if (onSearch) {
      setLocalSearching(true);
      try {
        await onSearch(tag);
      } finally {
        setLocalSearching(false);
      }
    }
  };

  // Functional Source Filtering
  const filteredDocs = docs.filter((doc) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "POSTMORTEM") return doc.source?.includes("Confluence") || doc.docId?.startsWith("CONF");
    if (activeFilter === "MSA") return doc.source?.includes("Legal") || doc.docId?.startsWith("VEND");
    if (activeFilter === "GIT") return doc.source?.includes("Git") || doc.docId?.match(/^[a-f0-9]{7}$/);
    if (activeFilter === "TOPOLOGY") return doc.source?.includes("Topology") || doc.docId?.startsWith("SVC");
    return true;
  });

  const isThinking = isLoading || localSearching;

  return (
    <div className="raised-card rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#111216]/95 backdrop-blur-md shadow-sm font-sans flex flex-col h-full transition-all">
      {/* Header & Free-Text Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-zinc-200 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs border border-cyan-500/20">
            <Sparkles className="w-4 h-4 text-cyan-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-wide uppercase">
                Query Search Engine
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-semibold">
                BM25 RAG
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Inverted index across Confluence, Git, MSAs &amp; Topology ({totalIndexed} Docs)
            </p>
          </div>
        </div>

        {/* Free-Text Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-1.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search enterprise corpus..."
              className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-md py-1.5 pl-7 pr-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-cyan-500/60 font-mono transition"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2 top-2 pointer-events-none" />
          </div>
          <button
            type="submit"
            disabled={isThinking}
            className="px-2.5 py-1.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-mono font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
          >
            {isThinking ? <Loader2 className="w-3 h-3 animate-spin" /> : "Search"}
          </button>
        </form>
      </div>

      {/* Functional Source Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 text-[10.5px] font-mono scrollbar-none">
        <span className="text-zinc-400 flex items-center gap-1 text-[10px]">
          <Filter className="w-3 h-3" /> Filter:
        </span>
        {[
          { id: "ALL", label: "All Sources" },
          { id: "POSTMORTEM", label: "Post-Mortems" },
          { id: "MSA", label: "Vendor MSAs" },
          { id: "GIT", label: "Git Commits" },
          { id: "TOPOLOGY", label: "Mesh Topology" },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFilter(f.id)}
            className={`px-2 py-0.5 rounded transition cursor-pointer border flex-shrink-0 ${
              activeFilter === f.id
                ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-700 dark:text-cyan-300 font-semibold"
                : "bg-zinc-100/70 dark:bg-zinc-850/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* AI Synthesized Answer Card with Citations */}
      {synthesizedAnswer && !isThinking && (
        <div className="mb-3 p-3 rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-zinc-900/40 to-indigo-500/10 text-xs font-sans animate-fadeIn relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-1.5 font-mono text-[10.5px] text-cyan-600 dark:text-cyan-400">
            <span className="flex items-center gap-1 font-bold">
              <Bot className="w-3.5 h-3.5" />
              Glean Synthesized Grounding &amp; Root-Cause Answer:
            </span>
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-[9px] uppercase tracking-wider font-semibold border border-cyan-500/30">
              Verified Context
            </span>
          </div>
          <p className="text-zinc-800 dark:text-zinc-200 text-xs leading-relaxed font-sans">
            {synthesizedAnswer}
          </p>
        </div>
      )}

      {/* Thinking State */}
      {isThinking && (
        <div className="p-3 mb-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-xs font-mono text-cyan-600 dark:text-cyan-400 flex items-center gap-2 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
          <span>Executing Okapi BM25 inverted index scan across {totalIndexed} documents...</span>
        </div>
      )}

      {/* Document Stats Header */}
      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mb-2 px-1">
        <span>Scanned Evidence ({filteredDocs.length} Results Filtered)</span>
        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
          <CheckCircle2 className="w-3 h-3" />
          BM25 Scored &amp; Ranked
        </span>
      </div>

      {/* Ranked Documents Scrollable List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[380px]">
        {filteredDocs.length > 0 ? (
          filteredDocs.map((doc, idx) => {
            const isClosedLoopPostMortem = doc.docId === "CONF-PM-2026-89";
            const isKeyPostMortem = doc.docId === "CONF-PM-2025-44";
            const scorePercent = Math.round((doc.relevanceScore || 0.85) * 100);

            return (
              <div
                key={doc.docId || idx}
                className={`p-3 rounded-lg border text-xs transition-all duration-150 ${
                  isClosedLoopPostMortem
                    ? "bg-emerald-500/10 border-emerald-500/30 text-zinc-900 dark:text-zinc-100"
                    : isKeyPostMortem
                    ? "bg-amber-500/10 border-amber-500/30 text-zinc-900 dark:text-zinc-100"
                    : "bg-zinc-50/70 dark:bg-zinc-850/60 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                }`}
              >
                {/* Meta Header */}
                <div className="flex items-center justify-between gap-2 mb-1.5 font-mono text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    {doc.source?.includes("Git") ? (
                      <GitCommit className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                    ) : doc.source?.includes("Legal") ? (
                      <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    ) : doc.source?.includes("Topology") ? (
                      <Layers className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                    ) : (
                      <BookOpen className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    )}
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{doc.docId}</span>
                    <span className="text-zinc-400">·</span>
                    <span className="text-zinc-500 dark:text-zinc-400 truncate">{doc.source}</span>
                  </div>

                  {/* BM25 Relevance Score Badge */}
                  <span className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] text-zinc-700 dark:text-zinc-300 font-mono flex-shrink-0 border border-zinc-300 dark:border-zinc-700 font-semibold">
                    BM25: {scorePercent}%
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1 leading-snug">{doc.title}</h3>

                {/* Excerpt */}
                <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed line-clamp-3 mb-2 font-mono">
                  {doc.excerpt}
                </p>

                {/* Root Cause Insight / Gotcha Badge */}
                {isClosedLoopPostMortem ? (
                  <div className="mt-1.5 pt-1.5 border-t border-emerald-500/20 flex items-start gap-1.5 text-[10.5px] text-emerald-700 dark:text-emerald-300 font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>Closed-Loop Organizational Memory: Auto-indexed from current swarm sign-off.</span>
                  </div>
                ) : doc.rootCauseInsight ? (
                  <div className="mt-1.5 pt-1.5 border-t border-amber-500/20 flex items-start gap-1.5 text-[10.5px] text-amber-700 dark:text-amber-300 font-mono">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>Historical Lesson: {doc.rootCauseInsight}</span>
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="h-44 flex flex-col items-center justify-center text-center text-zinc-400 font-mono text-xs">
            <Search className="w-8 h-8 text-zinc-600 mb-2 opacity-50" />
            <span className="font-medium text-zinc-500 dark:text-zinc-400">
              No relevant documents found for this query
            </span>
            <span className="text-[10px] text-zinc-400 mt-1">
              Try searching for &quot;billing-api&quot;, &quot;missing_scope&quot;, &quot;runbook&quot;, or &quot;postmortem&quot;
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
