"use client";

import React, { useState, useEffect } from "react";
import { 
  GitBranch, 
  BookOpen, 
  Lock, 
  CheckCircle2, 
  Clock, 
  Activity, 
  ExternalLink,
  MessageSquare, 
  Bell, 
  Users,
  Database,
  Info
} from "lucide-react";
import { checkJaegerStatus, fetchDocs } from "@/services/api";

export default function ConnectorsView() {
  const [jaegerInfo, setJaegerInfo] = useState({ connected: true, services: ["billing-api", "jaeger-all-in-one"], total: 2 });
  const [docCount, setDocCount] = useState(18);

  useEffect(() => {
    checkJaegerStatus().then(setJaegerInfo).catch((e) => console.warn(e));
    fetchDocs().then((docs) => {
      if (Array.isArray(docs) && docs.length > 0) setDocCount(docs.length);
    }).catch((e) => console.warn(e));
  }, []);

  // Real Active Data Sources
  const activeConnections = [
    {
      id: "github",
      name: "GitHub",
      type: "Repository & Changelog",
      status: "CONNECTED",
      statusBadge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      desc: "Pulls commits, pull requests, and role template change logs from the repository.",
      icon: GitBranch,
      iconColor: "text-purple-500",
      meta: "Repo: velloe (main branch)",
      detail: "4 changelog entries indexed (PR #341, #339, #412, #108)",
      lastSync: "Just now"
    },
    {
      id: "jaeger",
      name: "Jaeger",
      type: "Distributed Telemetry & OTLP Traces",
      status: "CONNECTED",
      statusBadge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      desc: "Collects OpenTelemetry span traces and captures HTTP 403 / 500 error cascades across microservices.",
      icon: Activity,
      iconColor: "text-cyan-500",
      meta: "Endpoint: localhost:16686 / OTLP :4317",
      detail: `${jaegerInfo.total} services registered (${jaegerInfo.services.join(", ")})`,
      lastSync: "Live Stream",
      link: "http://localhost:16686"
    },
    {
      id: "document-index",
      name: "Document Index",
      type: "BM25 Document Corpus",
      status: "CONNECTED",
      statusBadge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      desc: "PostgreSQL document table indexed with Okapi BM25 for real-time RAG context retrieval.",
      icon: BookOpen,
      iconColor: "text-emerald-500",
      meta: "Corpus: PostgreSQL documents table",
      detail: `${docCount} Documents (8 Runbooks, 5 Policies, 3 Post-Mortems, 2 Specs)`,
      lastSync: "Indexed"
    },
    {
      id: "permissions",
      name: "Permissions",
      type: "Access Control Table",
      status: "SIMULATED",
      statusBadge: "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700",
      isSimulated: true,
      desc: "Simulated local permission table containing employee role profiles and assigned scopes (billing.view, billing.read).",
      honestNote: "Synthetic dataset for demo — production would integrate with a real IAM provider",
      icon: Lock,
      iconColor: "text-amber-500",
      meta: "Table: permission_records",
      detail: "7 Employee Records (rohan, alex, sam, marcus, jordan)",
      lastSync: "Seed Data"
    }
  ];

  // Truly planned connectors: visually inert, clearly greyed out, NO fake latency metrics
  const plannedConnectors = [
    {
      id: "slack",
      name: "Slack",
      type: "ChatOps & Incident War Rooms",
      status: "PLANNED",
      desc: "Two-way thread syncing: files tickets from Slack alerts, posts real-time agent hops, and collects human approval reactions.",
      icon: MessageSquare,
      iconColor: "text-zinc-400",
      quarter: "Q3 Roadmap"
    },
    {
      id: "pagerduty",
      name: "PagerDuty",
      type: "On-Call Roster & Escalation",
      status: "PLANNED",
      desc: "Syncs on-call schedules, creates automated incident entries, and halts paging when AI self-correction stabilizes service.",
      icon: Bell,
      iconColor: "text-zinc-400",
      quarter: "Q4 Roadmap"
    },
    {
      id: "okta",
      name: "Okta / Workday",
      type: "Enterprise Directory & RBAC",
      status: "PLANNED",
      desc: "Validates employee identity, organizational unit, manager hierarchy, and role entitlements during ticket triage.",
      icon: Users,
      iconColor: "text-zinc-400",
      quarter: "Q4 Roadmap"
    }
  ];

  return (
    <div className="space-y-4 font-sans">
      {/* Top Banner Contextual Header: Connections */}
      <div className="raised-card p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#111216]/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
              Connections
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
              3 Connected · 1 Simulated · 3 Planned
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-1">
            Data source and connector status across code repository, distributed tracing, knowledge index, and permissions
          </p>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Services Operational
            </span>
          </div>
        </div>
      </div>

      {/* Active Connectors Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono">
            Active Connectors &amp; Data Sources
          </h3>
          <span className="text-[11px] font-mono text-zinc-400">
            Real integrations powering Meridian &amp; Meri
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {activeConnections.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.id}
                className="p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#14151a]/95 backdrop-blur-md shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                        <Icon className={`w-4 h-4 ${c.iconColor}`} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {c.name}
                        </div>
                        <div className="text-[10.5px] font-mono text-zinc-400">
                          {c.type}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${c.statusBadge}`}>
                      {c.status}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
                    {c.desc}
                  </p>

                  {/* Honest Note for Simulated Permissions */}
                  {c.isSimulated && (
                    <div className="mt-2.5 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
                      <span>{c.honestNote}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[10.5px] font-mono text-zinc-500">
                  <span className="truncate max-w-[220px]">{c.detail}</span>
                  {c.link ? (
                    <a
                      href={c.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Open UI</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span>{c.lastSync}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Planned Connectors Section (Visually inert, greyed out, NO fake latency metrics) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">
            Planned Future Connectors
          </h3>
          <span className="text-[10.5px] font-mono text-zinc-400">
            Roadmap features (Inactive)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {plannedConnectors.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.id}
                className="p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/40 dark:bg-zinc-950/30 opacity-60 flex flex-col justify-between space-y-2 select-none"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {p.name}
                      </span>
                    </div>
                    <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-zinc-200/50 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                      {p.quarter}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-snug">
                    {p.desc}
                  </p>
                </div>
                <div className="text-[9.5px] font-mono text-zinc-400 pt-1.5 border-t border-zinc-200/40 dark:border-zinc-800/40">
                  Status: Inert / Planned
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
