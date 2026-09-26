"use client";

import React, { useState } from "react";
import { 
  Download, 
  Copy, 
  Check, 
  Clock, 
  Layers, 
  ChevronDown, 
  ChevronRight,
  Search,
  BookOpen,
  Activity,
  ShieldCheck,
  CheckCircle2, 
  ExternalLink, 
  ArrowRight,
  Filter,
  User,
  LayoutDashboard
} from "lucide-react";
import { REAL_TICKETS } from "@/services/api";

// Real step logs grounded in the actual codebase for the 4 tickets
const TICKETS_STEP_LOGS = {
  "TCK-1001": [
    {
      stepNumber: 1,
      agentRole: "Classifier",
      actionName: "Triage & Route Steps",
      status: "COMPLETED",
      duration: "310ms",
      promptSent: `System: You are an issue triage agent for an internal IT support system. You 
will be given an employee's free-text issue description. Classify the 
issue and decide which investigation steps are needed. Do not diagnose 
or solve — only classify and route.

Valid categories: PERMISSIONS, SERVICE_FAILURE, CONFIG_DRIFT, USER_ERROR, OTHER

Decide whether these are needed:
- needs_doc_search: should internal docs/runbooks be searched?
- needs_trace_lookup: should a Jaeger trace be pulled?
- needs_permission_check: should permission records be checked?

Be conservative — if ambiguous, flag more steps rather than fewer. Be 
honest about confidence; do not inflate it.

Respond ONLY with valid JSON, no markdown fences, no preamble:
{
  "category": "...",
  "confidence": <float>,
  "needs_doc_search": <bool>,
  "needs_trace_lookup": <bool>,
  "needs_permission_check": <bool>,
  "reasoning": "<one sentence>"
}

User:
Issue description: "I can't see the billing dashboard, it just shows an error. When I navigate to /billing/dashboard, the page immediately returns a 403 error saying missing_scope billing.read."
Employee role: "billing-analyst"
Employee ID: "rohan"`,
      rawOutput: `{
  "category": "PERMISSIONS",
  "confidence": 0.95,
  "needs_doc_search": true,
  "needs_trace_lookup": true,
  "needs_permission_check": true,
  "reasoning": "The employee reports an error accessing the billing dashboard which is likely caused by missing scopes or permissions."
}`
    },
    {
      stepNumber: 2,
      agentRole: "Correlator",
      actionName: "Cross-Reference Runbooks & Changelog",
      status: "COMPLETED",
      duration: "420ms",
      promptSent: `System: You are an investigation correlator agent. Retrieve relevant runbooks and check recent changelog entries for breaking changes.

Query: "billing-api dashboard 403 missing_scope"
Employee ID: "rohan" (Role: billing-analyst)
Assigned Service: "billing-api"

Corpus:
- Runbook: "Billing API Scope Requirements & Troubleshooting"
- Policy: "Enterprise Identity & Role-Based Access Control Policy"
- Postmortem: "POSTMORTEM-2026-03-12: Billing Dashboard 403 Permissions Outage"
- Changelog: PR #341 ("cleanup of role template permissions")`,
      rawOutput: `{
  "matched_documents": [
    {
      "title": "Billing API Scope Requirements & Troubleshooting",
      "type": "RUNBOOK",
      "summary": "billing-api requires scope billing.read; commonly missing after role template changes."
    },
    {
      "title": "POSTMORTEM-2026-03-12: Billing Dashboard 403 Permissions Outage",
      "type": "POSTMORTEM",
      "summary": "PR #341 dropped default read scopes for billing-analyst role profile."
    }
  ],
  "permission_status": {
    "employeeId": "rohan",
    "role": "billing-analyst",
    "current_scopes": ["billing.view", "reports.view"],
    "required_scope": "billing.read",
    "is_missing": true
  },
  "finding": "Rohan holds billing.view but lacks billing.read, which was accidentally removed in role template PR #341."
}`
    },
    {
      stepNumber: 3,
      agentRole: "Trace Lookup",
      actionName: "Query Jaeger Distributed Spans",
      status: "COMPLETED",
      duration: "180ms",
      promptSent: `System: Query Jaeger distributed trace records for service 'billing-api' matching employee 'rohan'.

Filter:
- service: "billing-api"
- endpoint: "/billing/dashboard"
- tag: error=true
- time: past 1 hour`,
      rawOutput: `{
  "trace_id": "36180b4737a0ae1bcd582bdc95b0baa1",
  "spans_analyzed": 3,
  "failing_span": {
    "span_id": "4852d2399ecfb793",
    "operation": "GET /billing/dashboard",
    "status_code": 403,
    "tags": {
      "employee.id": "rohan",
      "error": true,
      "missing_scope": "billing.read",
      "employee.scopes": "billing.view,reports.view",
      "required.scope": "billing.read",
      "otel.status_description": "Scope billing.read is missing for employee rohan"
    }
  },
  "verified_at": "2026-09-26T07:02:37Z"
}`
    },
    {
      stepNumber: 4,
      agentRole: "Resolver",
      actionName: "Synthesize Remediation & Approval Gate",
      status: "COMPLETED",
      duration: "510ms",
      promptSent: `System: You are the resolution synthesis agent. Combine findings from Classifier, Correlator, and Trace Lookup to formulate an actionable remediation proposal.

Incident context:
- Employee: rohan (billing-analyst)
- Issue: 403 Forbidden on /billing/dashboard
- Trace: 36180b4737a0ae1bcd582bdc95b0baa1 (confirmed missing_scope: billing.read)
- Historical: PR #341 dropped default read scopes for billing-analyst`,
      rawOutput: `{
  "root_cause": "Employee rohan is missing the required 'billing.read' scope on service 'billing-api'. Access was revoked during role template cleanup (PR #341).",
  "proposed_action": "Grant 'billing.read' scope to rohan for 'billing-api' and restore default scope mapping in billing-analyst role template.",
  "risk_level": "LOW",
  "requires_approval": true,
  "status": "AWAITING_APPROVAL",
  "remediation_payload": {
    "target_user": "rohan",
    "service": "billing-api",
    "grant_scope": "billing.read"
  }
}`
    }
  ],
  "TCK-1002": [
    {
      stepNumber: 1,
      agentRole: "Classifier",
      actionName: "Triage & Intent Routing",
      status: "COMPLETED",
      duration: "290ms",
      promptSent: `System: Classify issue: "Kafka consumer lag spike on topic billing.events". Role: senior-engineer, Employee: alex.`,
      rawOutput: `{\n  "category": "SERVICE_FAILURE",\n  "confidence": 0.92,\n  "needs_doc_search": true,\n  "needs_trace_lookup": false,\n  "needs_permission_check": false,\n  "reasoning": "High consumer lag indicates message backlog or consumer partition stall."\n}`
    },
    {
      stepNumber: 2,
      agentRole: "Correlator",
      actionName: "Runbook Search",
      status: "COMPLETED",
      duration: "340ms",
      promptSent: `System: Search runbooks for Kafka consumer lag on billing.events.`,
      rawOutput: `{\n  "matched_runbook": "Kafka Consumer Lag Triage Runbook",\n  "postmortem": "POSTMORTEM-2026-02-18: Kafka Consumer Rebalance Cascade",\n  "recommended_action": "Increase consumer concurrency or bump max.poll.interval.ms."\n}`
    },
    {
      stepNumber: 3,
      agentRole: "Resolver",
      actionName: "Remediation Applied",
      status: "COMPLETED",
      duration: "400ms",
      promptSent: `System: Propose remediation for consumer lag backlog.`,
      rawOutput: `{\n  "root_cause": "Batch reconciliation caused temporary ingestion burst.",\n  "remediation": "Autoscaled consumer pod replica count from 2 to 4.",\n  "status": "RESOLVED"\n}`
    }
  ],
  "TCK-1003": [
    {
      stepNumber: 1,
      agentRole: "Classifier",
      actionName: "Triage & Intent Routing",
      status: "COMPLETED",
      duration: "280ms",
      promptSent: `System: Classify issue: "HikariCP pool exhaustion warning on core Postgres". Role: devops-lead, Employee: sam.`,
      rawOutput: `{\n  "category": "SERVICE_FAILURE",\n  "confidence": 0.89,\n  "needs_doc_search": true,\n  "needs_trace_lookup": true,\n  "needs_permission_check": false,\n  "reasoning": "Connection pool saturation indicates idle queries or connection leak."\n}`
    },
    {
      stepNumber: 2,
      agentRole: "Trace Lookup",
      actionName: "Trace Check & Database Queries",
      status: "COMPLETED",
      duration: "350ms",
      promptSent: `System: Check active connections in HikariCP telemetry.`,
      rawOutput: `{\n  "active_connections": 28,\n  "max_pool_size": 30,\n  "lingering_queries": ["SELECT * FROM historical_invoices WHERE exported_at IS NULL"]\n}`
    }
  ],
  "TCK-1004": [
    {
      stepNumber: 1,
      agentRole: "Classifier",
      actionName: "Triage & Intent Routing",
      status: "COMPLETED",
      duration: "250ms",
      promptSent: `System: Classify issue: "Audit logging compliance check for Q1 rotation". Role: security-auditor, Employee: marcus.`,
      rawOutput: `{\n  "category": "OTHER",\n  "confidence": 0.94,\n  "needs_doc_search": true,\n  "needs_trace_lookup": false,\n  "needs_permission_check": true,\n  "reasoning": "Audit compliance check over data retention policies."\n}`
    }
  ]
};

export default function TraceLedgerView({
  selectedTicketId = "TCK-1001",
  onSelectTicket,
  onNavigateToTicketConsole
}) {
  const [activeTicketId, setActiveTicketId] = useState(selectedTicketId);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState(null);
  const [expandedSteps, setExpandedSteps] = useState({ 1: true, 2: true, 3: true, 4: true });

  const currentTicket = REAL_TICKETS.find((t) => t.id === activeTicketId) || REAL_TICKETS[0];
  const steps = TICKETS_STEP_LOGS[activeTicketId] || TICKETS_STEP_LOGS["TCK-1001"];

  const handleTicketClick = (ticketId) => {
    setActiveTicketId(ticketId);
    if (onSelectTicket) onSelectTicket(ticketId);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const toggleStepExpand = (stepNumber) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber]
    }));
  };

  const filteredSteps = steps.filter((s) => {
    if (roleFilter === "ALL") return true;
    return s.agentRole.toLowerCase().includes(roleFilter.toLowerCase());
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case "Classifier":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "Correlator":
        return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20";
      case "Trace Lookup":
        return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
      case "Resolver":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      default:
        return "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700";
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* 1. Top Contextual Header: Trace Log */}
      <div className="raised-card p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#111216]/95 backdrop-blur-md shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
              Trace Log
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
              Prompt &amp; Output Transparency
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-1">
            Inspection ledger showing sequential promptSent and rawOutput across Classifier, Correlator, Trace Lookup, and Resolver
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToTicketConsole && (
            <button
              onClick={onNavigateToTicketConsole}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold font-mono transition flex items-center gap-1.5 cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-zinc-500" />
              <span>Ticket Console</span>
            </button>
          )}

          {/* Real Jaeger UI Deep-Link Button */}
          <a
            href={currentTicket.traceId ? `http://localhost:16686/trace/${currentTicket.traceId}` : "http://localhost:16686"}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-semibold font-mono transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Open real distributed waterfall trace in Jaeger Web UI (localhost:16686)"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Jaeger UI (:16686)</span>
          </a>
        </div>
      </div>

      {/* 2. Ticket Selector Bar (List of Tickets with Recent Activity) */}
      <div className="raised-card p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#14151a]/95 backdrop-blur-md shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">
              Recent Ticket Activity:
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              {REAL_TICKETS.length} Recorded
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">Select an incident to inspect raw step prompts and outputs</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 font-mono text-xs">
          {REAL_TICKETS.map((t) => {
            const isSelected = t.id === activeTicketId;
            return (
              <button
                key={t.id}
                onClick={() => handleTicketClick(t.id)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-md scale-[1.01]"
                    : "bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-200/60 dark:bg-zinc-800/80">
                      {t.id}
                    </span>
                    <span className="text-[10px] uppercase opacity-80">{t.service}</span>
                  </div>
                  <span className="text-[10px] opacity-70">{t.createdAt}</span>
                </div>
                <div className="text-[11px] font-sans font-medium line-clamp-2 leading-snug">
                  {t.title}
                </div>
                <div className="mt-2 pt-1.5 border-t border-zinc-200/30 dark:border-zinc-700/40 flex items-center justify-between text-[10px] opacity-80">
                  <span>{t.stepsCount} Steps</span>
                  <span className="font-bold">{t.status}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Ticket Summary Banner & Agent Role Filter */}
      <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">Selected Ticket:</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100">{currentTicket.id}</span>
          <span className="text-zinc-400">·</span>
          <span className="text-zinc-600 dark:text-zinc-300 truncate max-w-[280px]">{currentTicket.title}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-zinc-400 mr-1" />
          {["ALL", "Classifier", "Correlator", "Trace Lookup", "Resolver"].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-2 py-0.5 rounded text-[10.5px] transition cursor-pointer ${
                roleFilter === role
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Sequential Step Log Cards with promptSent and rawOutput */}
      <div className="space-y-4">
        {filteredSteps.map((step) => {
          const isExpanded = expandedSteps[step.stepNumber] !== false;
          const promptId = `${activeTicketId}-step-${step.stepNumber}-prompt`;
          const outputId = `${activeTicketId}-step-${step.stepNumber}-output`;

          return (
            <div
              key={step.stepNumber}
              className="raised-card rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#111216]/95 shadow-sm overflow-hidden"
            >
              {/* Step Card Header */}
              <div
                onClick={() => toggleStepExpand(step.stepNumber)}
                className="p-3.5 sm:p-4 bg-zinc-50/60 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-mono font-bold text-xs">
                    {step.stepNumber}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                      {step.actionName}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getRoleBadge(step.agentRole)}`}>
                      {step.agentRole}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-zinc-400">{step.duration}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{step.status}</span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  )}
                </div>
              </div>

              {/* Step Content: Prompt & Output Blocks */}
              {isExpanded && (
                <div className="p-4 space-y-4">
                  {/* Prompt Sent */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[10.5px] font-semibold uppercase text-zinc-400 tracking-wider">
                        promptSent:
                      </span>
                      <button
                        onClick={() => handleCopy(step.promptSent, promptId)}
                        className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 text-[10px] flex items-center gap-1 transition cursor-pointer"
                      >
                        {copiedId === promptId ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Prompt</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-3.5 rounded-lg bg-[#0c0d10] border border-zinc-800 text-zinc-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-60">
                      {step.promptSent}
                    </pre>
                  </div>

                  {/* Raw Output */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[10.5px] font-semibold uppercase text-zinc-400 tracking-wider">
                        rawOutput:
                      </span>
                      <button
                        onClick={() => handleCopy(step.rawOutput, outputId)}
                        className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 text-[10px] flex items-center gap-1 transition cursor-pointer"
                      >
                        {copiedId === outputId ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Output</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-3.5 rounded-lg bg-[#0c0d10] border border-zinc-800 text-emerald-400/90 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-60">
                      {step.rawOutput}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
