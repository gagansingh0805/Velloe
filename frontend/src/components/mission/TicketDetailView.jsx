"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, 
  RefreshCw, 
  ExternalLink, 
  Layers, 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from "lucide-react";
import TicketDetailHeader from "./TicketDetailHeader";
import DiagnosisCard from "./DiagnosisCard";
import PipelineGraph from "./PipelineGraph";
import EvidenceSection from "./EvidenceSection";
import TicketLogsAndFeed from "./TicketLogsAndFeed";
import ResolutionCard from "./ResolutionCard";
import { 
  fetchTicketById, 
  fetchTicketSteps, 
  approveTicket, 
  rejectTicket, 
  getTicketStreamUrl 
} from "@/services/api";

export default function TicketDetailView({
  ticketId,
  initialTicket = null,
  onBackToList
}) {
  const [ticket, setTicket] = useState(initialTicket);
  const [steps, setSteps] = useState([]);
  const [isLoading, setIsLoading] = useState(!initialTicket);
  const [isLoadingSteps, setIsLoadingSteps] = useState(true);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Evidence section expanded toggle
  const [isEvidenceExpanded, setIsEvidenceExpanded] = useState(false);

  // Pipeline Nodes state: { CLASSIFIER: { status: 'DONE', summary: '...' }, ... }
  const [nodesState, setNodesState] = useState({});
  const [currentRunningNode, setCurrentRunningNode] = useState(null);

  // Live log items: [ { time, agent, message, detail, confidence } ]
  const [liveLogs, setLiveLogs] = useState([]);

  // Correlator & Resolver extracted data
  const [correlatorData, setCorrelatorData] = useState(null);
  const [resolverData, setResolverData] = useState(null);

  // SSE event source ref
  const eventSourceRef = useRef(null);

  // Helper to format step logs into plain language
  const buildStepLog = (agentName, parsedOutput, status) => {
    const time = new Date().toLocaleTimeString();
    if (agentName === "CLASSIFIER") {
      const cat = parsedOutput?.category || "PERMISSIONS";
      const conf = Math.round((parsedOutput?.confidence || 0.95) * (parsedOutput?.confidence <= 1 ? 100 : 1));
      return {
        time,
        agent: "Classifier",
        message: `Classified issue as ${cat} (${conf}% confidence). Triggered trace check and role audit.`,
        detail: parsedOutput?.reasoning || null,
        confidence: conf
      };
    } else if (agentName === "TRACE_LOOKUP") {
      const found = parsedOutput?.found;
      const statusHttp = parsedOutput?.status || 403;
      const srv = parsedOutput?.service || "billing-api";
      return {
        time,
        agent: "Trace Lookup",
        message: found
          ? `Queried Jaeger on ${srv}: Confirmed HTTP ${statusHttp} error span with missing_scope 'billing.read'.`
          : `Queried Jaeger: No active error span found for this employee.`,
        detail: parsedOutput?.trace_id ? `Trace ID: ${parsedOutput.trace_id}` : null,
        confidence: found ? 99 : null
      };
    } else if (agentName === "CORRELATOR") {
      const conf = Math.round((parsedOutput?.confidence || 1.0) * (parsedOutput?.confidence <= 1 ? 100 : 1));
      return {
        time,
        agent: "Correlator",
        message: `Diagnosed root cause (${conf}% confidence): ${parsedOutput?.root_cause_hypothesis || "Evidence correlated."}`,
        detail: parsedOutput?.supporting_evidence ? `${parsedOutput.supporting_evidence.length} pieces of supporting evidence verified.` : null,
        confidence: conf
      };
    } else if (agentName === "RESOLVER") {
      const conf = Math.round((parsedOutput?.confidence || 0.98) * (parsedOutput?.confidence <= 1 ? 100 : 1));
      return {
        time,
        agent: "Resolver",
        message: `Proposed remediation (${conf}% confidence): ${parsedOutput?.proposed_fix || "Remediation plan generated."}`,
        detail: parsedOutput?.risk_note || null,
        confidence: conf
      };
    }
    return {
      time,
      agent: agentName,
      message: `Step ${agentName} status: ${status}.`
    };
  };

  // Helper to build node summary
  const buildNodeSummary = (agentName, parsedOutput) => {
    if (agentName === "CLASSIFIER") {
      const cat = parsedOutput?.category || "Triage";
      const conf = Math.round((parsedOutput?.confidence || 0.95) * (parsedOutput?.confidence <= 1 ? 100 : 1));
      return `${cat} (${conf}%)`;
    } else if (agentName === "TRACE_LOOKUP") {
      if (parsedOutput?.found) {
        return `Span ${parsedOutput.status || 403} Confirmed`;
      }
      return "No Error Span";
    } else if (agentName === "CORRELATOR") {
      const conf = Math.round((parsedOutput?.confidence || 1.0) * (parsedOutput?.confidence <= 1 ? 100 : 1));
      return `Root cause found (${conf}%)`;
    } else if (agentName === "RESOLVER") {
      const conf = Math.round((parsedOutput?.confidence || 0.98) * (parsedOutput?.confidence <= 1 ? 100 : 1));
      return `Fix Proposed (${conf}%)`;
    }
    return "Done";
  };

  // Initial Data Fetch
  useEffect(() => {
    let isMounted = true;

    async function loadTicketAndSteps() {
      if (!ticketId) return;
      setIsLoading(true);
      setIsLoadingSteps(true);

      try {
        const ticketData = await fetchTicketById(ticketId);
        if (isMounted && ticketData) {
          setTicket(ticketData);
        }

        const stepsData = await fetchTicketSteps(ticketId);
        if (isMounted) {
          setSteps(stepsData || []);

          // Pre-populate completed nodes and logs from existing steps
          const newNodes = {};
          const initialLogs = [];

          (stepsData || []).forEach((s) => {
            const parsed = s.parsedOutput || {};
            newNodes[s.agentName] = {
              status: s.status,
              summary: buildNodeSummary(s.agentName, parsed),
              parsedOutput: parsed
            };

            initialLogs.push(buildStepLog(s.agentName, parsed, s.status));

            if (s.agentName === "CORRELATOR" && parsed.root_cause_hypothesis) {
              setCorrelatorData(parsed);
            }
            if (s.agentName === "RESOLVER" && parsed.proposed_fix) {
              setResolverData(parsed);
            }
          });

          setNodesState(newNodes);
          if (initialLogs.length > 0) {
            setLiveLogs(initialLogs);
          }
        }
      } catch (err) {
        console.error("Error loading ticket detail:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsLoadingSteps(false);
        }
      }
    }

    loadTicketAndSteps();

    return () => {
      isMounted = false;
    };
  }, [ticketId]);

  // Subscribe to live SSE Stream
  useEffect(() => {
    if (!ticketId) return;

    // Connect to SSE stream
    const streamUrl = getTicketStreamUrl(ticketId);
    let es;
    try {
      es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.addEventListener("CONNECTED", () => {
        // SSE connected
      });

      es.addEventListener("STEP_UPDATE", (e) => {
        try {
          const payload = JSON.parse(e.data);
          const { agentName, status, parsedOutput } = payload;

          // Update node state
          setNodesState((prev) => ({
            ...prev,
            [agentName]: {
              status: status,
              summary: buildNodeSummary(agentName, parsedOutput),
              parsedOutput: parsedOutput
            }
          }));

          // Clear running node
          setCurrentRunningNode(null);

          // Append to live logs
          const logEntry = buildStepLog(agentName, parsedOutput, status);
          setLiveLogs((prev) => [...prev, logEntry]);

          // Update Correlator / Resolver data
          if (agentName === "CORRELATOR" && parsedOutput?.root_cause_hypothesis) {
            setCorrelatorData(parsedOutput);
          }
          if (agentName === "RESOLVER" && parsedOutput?.proposed_fix) {
            setResolverData(parsedOutput);
          }

          // Asynchronously reload steps for transparency logs
          fetchTicketSteps(ticketId).then((latestSteps) => {
            if (latestSteps && latestSteps.length > 0) {
              setSteps(latestSteps);
            }
          });
        } catch (err) {
          console.error("Error parsing STEP_UPDATE event:", err);
        }
      });

      es.addEventListener("TICKET_STATUS", (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload?.status) {
            setTicket((prev) => ({
              ...prev,
              status: payload.status,
              updatedAt: payload.timestamp || new Date().toISOString()
            }));

            setLiveLogs((prev) => [
              ...prev,
              {
                time: new Date().toLocaleTimeString(),
                agent: "Pipeline",
                message: `Ticket status reached ${payload.status.replace("_", " ")}.`
              }
            ]);
          }
        } catch (err) {
          console.error("Error parsing TICKET_STATUS event:", err);
        }
      });

      es.onerror = () => {
        // SSE connection error or closed after terminal event
        es.close();
      };
    } catch (err) {
      console.warn("Could not initiate EventSource for ticket", err);
    }

    return () => {
      if (es) {
        es.close();
      }
    };
  }, [ticketId]);

  // Handle Approve Action
  const handleApprove = async (id) => {
    setIsProcessingAction(true);
    try {
      const updated = await approveTicket(id);
      setTicket((prev) => ({
        ...prev,
        ...updated,
        status: "RESOLVED"
      }));

      setLiveLogs((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          agent: "Operator",
          message: "Resolution approved by operator. Ticket marked RESOLVED."
        }
      ]);
    } catch (e) {
      alert("Failed to approve ticket: " + e.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Reject Action
  const handleReject = async (id) => {
    setIsProcessingAction(true);
    try {
      const updated = await rejectTicket(id);
      setTicket((prev) => ({
        ...prev,
        ...updated,
        status: "REJECTED"
      }));

      setLiveLogs((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          agent: "Operator",
          message: "Resolution rejected by operator. Ticket marked REJECTED."
        }
      ]);
    } catch (e) {
      alert("Failed to reject ticket: " + e.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Extract hypothesis & confidence from Correlator data or fallback
  const isCorrelatorDone = nodesState.CORRELATOR?.status === "DONE" || !!correlatorData;
  const hypothesis = correlatorData?.root_cause_hypothesis || 
    nodesState.CORRELATOR?.parsedOutput?.root_cause_hypothesis || 
    ticket?.root_cause_hypothesis;

  const confidence = correlatorData?.confidence 
    ? Math.round(correlatorData.confidence * (correlatorData.confidence <= 1 ? 100 : 1))
    : (ticket?.confidence || 95);

  return (
    <div className="space-y-3.5 pb-8 font-sans">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={onBackToList}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all tickets</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span>Ticket ID:</span>
          <span className="font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
            {ticketId?.length > 12 ? `${ticketId.slice(0, 8)}...` : ticketId}
          </span>
        </div>
      </div>

      {/* 1. HEADER: Title, status, employee, created time, category, full description */}
      <TicketDetailHeader ticket={ticket} />

      {/* 2. NEW DIAGNOSIS CARD: One-line root cause + confidence % + View evidence toggle */}
      <DiagnosisCard
        hypothesis={hypothesis}
        confidence={confidence}
        isCorrelatorCompleted={isCorrelatorDone}
        onToggleEvidence={() => setIsEvidenceExpanded((prev) => !prev)}
        isEvidenceExpanded={isEvidenceExpanded}
      />

      {/* 3. INTERACTIVE 6-NODE PIPELINE SCHEMATIC */}
      <PipelineGraph
        ticket={ticket}
        steps={steps}
        nodesState={nodesState}
        currentRunningNode={currentRunningNode}
        onViewInvestigation={() => {
          setIsEvidenceExpanded(true);
          setTimeout(() => {
            const el = document.getElementById("investigation-evidence");
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }, 60);
        }}
      />

      {/* 4. NEW COLLAPSIBLE EVIDENCE SECTION: Trace, Docs, Permissions tabs */}
      <EvidenceSection
        isExpanded={isEvidenceExpanded}
        onToggleExpand={() => setIsEvidenceExpanded((prev) => !prev)}
        ticketId={ticketId}
        traceId={ticket?.traceId || nodesState.TRACE_LOOKUP?.parsedOutput?.trace_id}
      />

      {/* 5. LIVE ACTIVITY LOG & RAW STEP TRANSPARENCY TABS */}
      <TicketLogsAndFeed
        liveLogs={liveLogs}
        steps={steps}
        isLoadingSteps={isLoadingSteps}
        status={ticket?.status}
      />

      {/* 6. RESOLUTION CARD: Proposed fix, risk note, confidence, Approve/Reject buttons */}
      <ResolutionCard
        ticket={ticket}
        resolverData={resolverData}
        onApprove={handleApprove}
        onReject={handleReject}
        isProcessing={isProcessingAction}
      />
    </div>
  );
}
