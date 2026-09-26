"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  Database,
  Loader2,
  Filter
} from "lucide-react";
import { searchDocs, fetchDocs, SEEDED_DOCUMENTS } from "@/services/api";

export default function GleanCorpusView() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [docs, setDocs] = useState(SEEDED_DOCUMENTS);
  const [searchedDocs, setSearchedDocs] = useState(null);

  useEffect(() => {
    fetchDocs()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setDocs(data);
      })
      .catch((e) => console.warn(e));
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setSearchedDocs(null);
      return;
    }
    setIsLoading(true);
    try {
      const results = await searchDocs(query.trim(), 10);
      setSearchedDocs(results);
    } finally {
      setIsLoading(false);
    }
  };

  const displayDocs = (searchedDocs || docs).filter((doc) => {
    if (activeFilter === "ALL") return true;
    return doc.type === activeFilter;
  });

  return (
    <div className="space-y-4 font-sans">
      {/* Top Corpus Header Card */}
      <div className="raised-card p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#111216]/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
              Corpus Index &amp; Document Explorer
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
              {docs.length} Documents Indexed
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-1">
            Search runbooks, postmortems (including danluu/post-mortems), and internal policy documents
          </p>
        </div>

        {/* Free-Text Search Bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search runbooks, post-mortems, scopes..."
              className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-md py-1.5 pl-8 pr-3 text-xs text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-cyan-500/60 transition"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-mono transition cursor-pointer font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 flex items-center gap-1.5"
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Search"}
          </button>
        </form>
      </div>

      {/* Corpus Breakdown Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60">
          <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Runbooks</div>
          <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">8 Runbooks</div>
          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Billing, Pods, Redis, DB</div>
        </div>
        <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60">
          <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Policies</div>
          <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">5 Policies</div>
          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">RBAC, Secrets, Audits</div>
        </div>
        <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60">
          <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Post-Mortems</div>
          <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">3 Post-Mortems</div>
          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">403 Outage, Kafka, Memory</div>
        </div>
        <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60">
          <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Permission Specs</div>
          <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">2 Specs</div>
          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">billing.read / billing.view</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 font-mono text-xs">
        {[
          { id: "ALL", label: `All (${docs.length})` },
          { id: "RUNBOOK", label: "Runbooks (8)" },
          { id: "POLICY", label: "Policies (5)" },
          { id: "POSTMORTEM", label: "Post-Mortems (3)" },
          { id: "PERMISSION_DOC", label: "Permissions (2)" }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex-shrink-0 ${
              activeFilter === f.id
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold"
                : "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayDocs.map((doc, idx) => (
          <div
            key={doc.id || idx}
            className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-xs flex flex-col justify-between space-y-2.5"
          >
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold">
                  {doc.type}
                </span>
                {doc.score && (
                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold">
                    Score: {doc.score}
                  </span>
                )}
              </div>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                {doc.title}
              </h3>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-2 font-sans line-clamp-3 leading-relaxed">
                {doc.content}
              </p>
            </div>
            <div className="text-[10px] font-mono text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
              Corpus: PostgreSQL Document Index
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
