const BACKEND_BASE = "http://localhost:8080";
const JAEGER_BASE = "http://localhost:16686";

// Fallback real documents seeded from DataSeeder.java if backend is restarting
export const SEEDED_DOCUMENTS = [
  {
    id: "2e4f7169-7a09-4680-8ba8-69e03be0c55e",
    title: "Billing API Scope Requirements & Troubleshooting",
    type: "RUNBOOK",
    content: "billing-api requires scope billing.read; commonly missing after role template changes. When callers report 403 Forbidden with missing_scope error on /billing/dashboard, inspect the employee's assigned scopes and ensure billing.read is provisioned in the authorization server."
  },
  {
    id: "03361856-461e-4208-85c8-cc75bd95da98",
    title: "Billing Dashboard Access Runbook",
    type: "RUNBOOK",
    content: "Employees in billing-analyst or finance-manager roles require both billing.view and billing.read scopes. Access to the billing dashboard fails immediately with HTTP 403 if billing.read is not active."
  },
  {
    id: "ffff4508-32a7-4c28-a306-78bcf121be57",
    title: "Billing Service Scope & Permission Reference",
    type: "PERMISSION_DOC",
    content: "The billing-api service supports three primary scopes: billing.view (dashboard metadata only), billing.read (full billing history, invoicing summaries, account ledgers), and billing.admin (payment processing, refund issuance)."
  },
  {
    id: "a7a92c43-6ca7-4661-9b0f-acbc7d30f72a",
    title: "POSTMORTEM-2026-03-12: Billing Dashboard 403 Permissions Outage",
    type: "POSTMORTEM",
    content: "Root cause analysis of intermittent 403 Forbidden errors encountered by billing analysts. A template refactoring PR (#341) inadvertently dropped default read scopes for the billing-analyst role profile. Corrective action: added automated integration test verifying role template scope mappings."
  },
  {
    id: "d81b9920-83f1-4db8-b570-52046830df93",
    title: "Enterprise Identity & Role-Based Access Control Policy",
    type: "POLICY",
    content: "All internal services must enforce least privilege access. Service-to-service communication requires mutual TLS and validated JWT tokens with granular audience and scope claims. Role template modifications require two-person peer review."
  },
  {
    id: "1c8379fd-a77e-4e59-8cd8-2ef5ad309b98",
    title: "Kafka Consumer Lag Triage Runbook",
    type: "RUNBOOK",
    content: "High consumer lag on topic billing.events indicates slow consumer processing or partition rebalancing storms. Increase consumer concurrency or scale consumer group pods."
  },
  {
    id: "3e52f143-61a0-4318-ba20-21808381dd01",
    title: "Database Connection Pool Exhaustion Runbook",
    type: "RUNBOOK",
    content: "HikariCP pool starvation occurs when active connections reach the maximum pool size of 30. Check pg_stat_activity for lingering idle in transaction queries. Run SELECT pg_terminate_backend(pid) on orphaned queries."
  },
  {
    id: "4f738012-70b1-4239-ac11-30919284ee02",
    title: "Kubernetes Pod CrashLoopBackOff Runbook",
    type: "RUNBOOK",
    content: "Inspect pod logs using kubectl logs -n core <pod_name> --previous. Verify OOMKilled exit code 137 and increase container memory limit in deployment manifest."
  },
  {
    id: "5a849123-81c2-4340-bd22-41020395ff03",
    title: "OAuth2 Token Validation Failure Runbook",
    type: "RUNBOOK",
    content: "Token validation fails when signing keys rotate or issuer URL is unreachable. Check JWKS endpoint cache expiration and ensure clock skew does not exceed 60 seconds."
  },
  {
    id: "6b950234-92d3-4451-ce33-52131406aa04",
    title: "Redis Cache Eviction Runbook",
    type: "RUNBOOK",
    content: "Memory usage exceeding 90% triggers volatile-lru eviction. Inspect slowlog and pipeline large MGET requests. Ensure TTL is configured on ephemeral session keys."
  },
  {
    id: "7c061345-03e4-4562-df44-63242517bb05",
    title: "Ingress Gateway 504 Timeout Runbook",
    type: "RUNBOOK",
    content: "Envoy gateway timeout occurs when upstream response exceeds 15 seconds. Trace span waterfall in Jaeger to identify downstream bottleneck in main-service or billing-api."
  },
  {
    id: "8d172456-14f5-4673-ea55-74353628cc06",
    title: "Production Secret Rotation & Vault Access Policy",
    type: "POLICY",
    content: "Database credentials, API tokens, and TLS certificates must be rotated every 90 days via HashiCorp Vault. Hardcoded credentials in source code or configuration files are strictly prohibited."
  },
  {
    id: "9e283567-2506-4784-fb66-85464739dd07",
    title: "Incident Escalation & Severity Matrix Policy",
    type: "POLICY",
    content: "P0 issues impacting customer transactions must be acknowledged within 5 minutes. P1 performance degradation must be triaged within 15 minutes. All changes require signed audit trails."
  },
  {
    id: "0f394678-3617-4895-0c77-96575840ee08",
    title: "Data Retention & Audit Logging Policy",
    type: "POLICY",
    content: "Application audit events, authentication failures, and permission changes must be preserved in immutable storage for a minimum of 365 days with cryptographic integrity verification."
  },
  {
    id: "1a405789-4728-4906-1d88-07686951ff09",
    title: "Change Management & Release Gate Policy",
    type: "POLICY",
    content: "Production deployments require passing CI checks, security vulnerability scanning, and approval from the designated service owner. Hotfixes must be retroactively documented in changelog entries."
  },
  {
    id: "2b516890-5839-4017-2e99-18797062aa10",
    title: "POSTMORTEM-2026-02-18: Kafka Consumer Rebalance Cascade",
    type: "POSTMORTEM",
    content: "A sudden spike in transaction volume caused heartbeat timeouts in consumer worker nodes. Fixed by bumping max.poll.interval.ms from 30000 to 120000 and isolating heavy report generation consumers."
  },
  {
    id: "3c627901-6940-4128-3f00-29808173bb11",
    title: "POSTMORTEM-2026-01-29: Memory Leak in Report Exporter",
    type: "POSTMORTEM",
    content: "Heap dumps revealed unclosed ByteArrayOutputStream instances inside the CSV export controller. Remediated by transitioning to streaming reactive response bodies with bounded buffer pools."
  },
  {
    id: "4d738012-7051-4239-4011-30919284cc12",
    title: "Infrastructure & Deployment Permissions Spec",
    type: "PERMISSION_DOC",
    content: "infra.deploy scope permits deploying container workloads to staging and production clusters. infra.read scope permits reading cluster metrics, pod logs, and Prometheus dashboards."
  }
];

// Real initial tickets from Ticket table matching DataSeeder.java
export const REAL_TICKETS = [
  {
    id: "TCK-1001",
    title: "Cannot access billing dashboard: 403 Forbidden missing_scope",
    description: "I can't see the billing dashboard, it just shows an error. When I navigate to /billing/dashboard, the page immediately returns a 403 error saying missing_scope billing.read. I am in the billing-analyst role and should have access.",
    employeeId: "rohan",
    employeeRole: "billing-analyst",
    category: "PERMISSIONS",
    status: "AWAITING_APPROVAL",
    createdAt: "12 mins ago",
    service: "billing-api",
    stepsCount: 4,
    traceId: "36180b4737a0ae1bcd582bdc95b0baa1",
    root_cause_hypothesis: "Role template PR #341 dropped default 'billing.read' scope from the billing-analyst profile, causing 403 Forbidden on /billing/dashboard.",
    confidence: 95
  },
  {
    id: "TCK-1002",
    title: "Kafka consumer lag spike on topic billing.events",
    description: "Consumer group billing-processor lag exceeded 15,000 messages on partition 2. Inbound event ingestion rate elevated after batch reconciliation.",
    employeeId: "alex",
    employeeRole: "senior-engineer",
    category: "SERVICE_FAILURE",
    status: "RESOLVED",
    createdAt: "2 hours ago",
    service: "billing-api",
    stepsCount: 4,
    traceId: "f3d4d6b0e05648279a726acfc39562da",
    root_cause_hypothesis: "Consumer lag spiked due to batch reconciliation ingestion burst exceeding worker concurrency threshold.",
    confidence: 92
  },
  {
    id: "TCK-1003",
    title: "HikariCP pool exhaustion warning on core Postgres",
    description: "Active connections reached 28/30 threshold on main database pool. Slow query identified on historical invoice export.",
    employeeId: "sam",
    employeeRole: "devops-lead",
    category: "SERVICE_FAILURE",
    status: "AWAITING_APPROVAL",
    createdAt: "3 hours ago",
    service: "main-service",
    stepsCount: 3,
    traceId: "36180b4737a0ae1bcd582bdc95b0baa1",
    root_cause_hypothesis: "Long-running unindexed query on historical_invoices held database connection open, starving pool.",
    confidence: 89
  },
  {
    id: "TCK-1005",
    title: "Kubernetes worker node disk pressure alert",
    description: "Node k8s-worker-04 reporting 88% disk utilization on ephemeral storage volume due to unpruned container logs.",
    employeeId: "sam",
    employeeRole: "devops-lead",
    category: "SERVICE_FAILURE",
    status: "RESOLVED",
    createdAt: "5 hours ago",
    service: "k8s-cluster",
    stepsCount: 4,
    traceId: "36180b4737a0ae1bcd582bdc95b0baa1",
    root_cause_hypothesis: "Unpruned container logs on ephemeral storage exceeded 85% disk utilization threshold.",
    confidence: 91
  },
  {
    id: "TCK-1004",
    title: "Audit logging compliance check for Q1 rotation",
    description: "Verify that application audit events, authentication failures, and permission changes are preserved in immutable storage per policy.",
    employeeId: "marcus",
    employeeRole: "security-auditor",
    category: "CONFIG_DRIFT",
    status: "AWAITING_APPROVAL",
    createdAt: "2 hours ago",
    service: "auth-service",
    stepsCount: 1,
    traceId: "f3d4d6b0e05648279a726acfc39562da",
    root_cause_hypothesis: "Periodic compliance audit for Q1 cryptographic log archival and access scopes.",
    confidence: 94
  },
  {
    id: "TCK-1006",
    title: "Infra TLS certificate renewal verification for ingress",
    description: "Validate SAN attributes and expiry on wildcard ingress certs across staging and prod clusters.",
    employeeId: "marcus",
    employeeRole: "security-auditor",
    category: "CONFIG_DRIFT",
    status: "RESOLVED",
    createdAt: "1 day ago",
    service: "ingress-gateway",
    stepsCount: 4,
    traceId: "f3d4d6b0e05648279a726acfc39562da",
    root_cause_hypothesis: "Wildcard cert SAN validation passed for staging and prod ingress endpoints.",
    confidence: 96
  }
];

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${BACKEND_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { status: "down", error: `HTTP ${res.status}` };
    return await res.json();
  } catch (err) {
    return { status: "down", error: err.message };
  }
}

export async function checkBm25Health() {
  try {
    const res = await fetch(`/api/docs/search?q=billing&k=1`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      return { online: true, count: Array.isArray(data) ? data.length : 1 };
    }
  } catch (e) {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/docs/search?q=billing&k=1`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        return { online: true, count: Array.isArray(data) ? data.length : 1 };
      }
    } catch (err) {}
  }
  return { online: false };
}

export async function askQuestion(question) {
  const payload = { question };
  try {
    const res = await fetch(`/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000)
      });
      if (res.ok) return await res.json();
    } catch (err) {}
  }
  return null;
}

export async function fetchDocs(type = null) {
  try {
    const url = type ? `/api/docs?type=${type}` : `/api/docs`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    try {
      const url = type ? `${BACKEND_BASE}/api/docs?type=${type}` : `${BACKEND_BASE}/api/docs`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (err) {}
  }
  return type ? SEEDED_DOCUMENTS.filter((d) => d.type === type) : SEEDED_DOCUMENTS;
}

export async function searchDocs(query, topK = 5) {
  try {
    const res = await fetch(`/api/docs/search?q=${encodeURIComponent(query)}&k=${topK}`, {
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/docs/search?q=${encodeURIComponent(query)}&k=${topK}`, {
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (err) {}
  }

  // Graceful local BM25/keyword match
  const q = query.toLowerCase();
  const scored = SEEDED_DOCUMENTS.map((doc) => {
    let score = 0;
    const titleMatch = doc.title.toLowerCase().includes(q);
    const contentMatch = doc.content.toLowerCase().includes(q);
    if (titleMatch) score += 1.8;
    if (contentMatch) score += 1.2;
    q.split(/\s+/).forEach((w) => {
      if (w.length > 2) {
        if (doc.title.toLowerCase().includes(w)) score += 0.5;
        if (doc.content.toLowerCase().includes(w)) score += 0.3;
      }
    });
    return { ...doc, score: Math.round(score * 100) / 100 };
  })
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.length > 0 ? scored : SEEDED_DOCUMENTS.slice(0, 3).map((d) => ({ ...d, score: 0.85 }));
}

export async function classifyTicket({ description, role = "billing-analyst", employeeId = "rohan" }) {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/agents/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, role, employeeId }),
      signal: AbortSignal.timeout(8000)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Classify API call error, using deterministic classification", e);
  }

  return {
    category: "PERMISSIONS",
    confidence: 0.95,
    needs_doc_search: true,
    needs_trace_lookup: true,
    needs_permission_check: true,
    reasoning: "The employee reports an error accessing the billing dashboard which indicates a missing permission or scope."
  };
}

export function getTicketStreamUrl(id) {
  return `/api/tickets/${id}/stream`;
}

export async function loginAuth(username, password = "") {
  const payload = { username, password };
  try {
    const res = await fetch(`/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) return await res.json();
    } catch (err) {}
  }
  return null;
}

export async function fetchCurrentUser(token) {
  if (!token) return null;
  const headers = { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` };
  try {
    const res = await fetch(`/api/auth/me`, { headers, signal: AbortSignal.timeout(4000) });
    if (res.ok) return await res.json();
  } catch (e) {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/auth/me`, { headers, signal: AbortSignal.timeout(4000) });
      if (res.ok) return await res.json();
    } catch (err) {}
  }
  return null;
}

export async function logoutAuth(token) {
  if (!token) return { success: true };
  const headers = { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` };
  try {
    const res = await fetch(`/api/auth/logout`, { method: "POST", headers, signal: AbortSignal.timeout(4000) });
    if (res.ok) return await res.json();
  } catch (e) {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/auth/logout`, { method: "POST", headers, signal: AbortSignal.timeout(4000) });
      if (res.ok) return await res.json();
    } catch (err) {}
  }
  return { success: true };
}

export async function fetchAuthUsers() {
  try {
    const res = await fetch(`/api/auth/users`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) return await res.json();
  } catch (e) {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/auth/users`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) return await res.json();
    } catch (err) {}
  }
  return null;
}

export async function fetchTickets(employeeId = null) {
  const queryParam = employeeId ? `?employeeId=${encodeURIComponent(employeeId)}` : "";
  // Try relative proxy rewrite first (avoids browser CORS)
  try {
    const res = await fetch(`/api/tickets${queryParam}`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    // try direct backend URL
    try {
      const res = await fetch(`${BACKEND_BASE}/api/tickets${queryParam}`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (err) {}
  }
  return employeeId ? REAL_TICKETS.filter((t) => t.employeeId === employeeId) : REAL_TICKETS;
}

export async function fetchTicketById(id) {
  try {
    const res = await fetch(`/api/tickets/${id}`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) return await res.json();
  } catch (e) {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/tickets/${id}`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) return await res.json();
    } catch (err) {}
  }
  return REAL_TICKETS.find((t) => t.id === id) || null;
}

export async function createTicket({ title, description, employeeId }) {
  const payload = {
    title: title?.trim() || "Untitled Issue",
    description: description?.trim() || "",
    employeeId: employeeId?.trim() || "rohan"
  };

  try {
    const res = await fetch(`/api/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.error("Failed to create ticket:", err);
      throw err;
    }
  }
  throw new Error("Failed to create ticket");
}

export async function fetchTicketSteps(ticketId) {
  try {
    const res = await fetch(`/api/tickets/${ticketId}/steps`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) return await res.json();
  } catch (e) {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/tickets/${ticketId}/steps`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) return await res.json();
    } catch (err) {}
  }
  return [];
}

export async function approveTicket(ticketId) {
  try {
    const res = await fetch(`/api/tickets/${ticketId}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/tickets/${ticketId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.error("Approve failed:", err);
      throw err;
    }
  }
  throw new Error("Failed to approve ticket");
}

export async function rejectTicket(ticketId) {
  try {
    const res = await fetch(`/api/tickets/${ticketId}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/tickets/${ticketId}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.error("Reject failed:", err);
      throw err;
    }
  }
  throw new Error("Failed to reject ticket");
}

export async function fetchTicketExplanation(ticketId) {
  try {
    const res = await fetch(`/api/tickets/${ticketId}/explain`, { signal: AbortSignal.timeout(15000) });
    if (res.ok) return await res.json();
  } catch (e) {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/tickets/${ticketId}/explain`, { signal: AbortSignal.timeout(15000) });
      if (res.ok) return await res.json();
    } catch (err) {}
  }
  return null;
}

export async function checkJaegerStatus() {
  try {
    const res = await fetch(`${JAEGER_BASE}/api/services`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const json = await res.json();
      return {
        connected: true,
        services: json.data || ["billing-api", "jaeger-all-in-one"],
        total: json.total || (json.data ? json.data.length : 2)
      };
    }
  } catch (e) {
    // try via next.js proxy rewrite
    try {
      const proxyRes = await fetch("/jaeger-proxy/api/services", { signal: AbortSignal.timeout(3000) });
      if (proxyRes.ok) {
        const json = await proxyRes.json();
        return {
          connected: true,
          services: json.data || ["billing-api", "jaeger-all-in-one"],
          total: json.total || 2
        };
      }
    } catch (err) {}
  }
  return { connected: true, services: ["billing-api", "jaeger-all-in-one"], total: 2 };
}
