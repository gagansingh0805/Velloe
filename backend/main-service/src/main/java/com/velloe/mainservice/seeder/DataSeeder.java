package com.velloe.mainservice.seeder;

import com.velloe.mainservice.model.*;
import com.velloe.mainservice.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final DocumentRepository documentRepository;
    private final PermissionRecordRepository permissionRecordRepository;
    private final ChangeLogEntryRepository changeLogEntryRepository;
    private final TicketRepository ticketRepository;

    public DataSeeder(DocumentRepository documentRepository,
                      PermissionRecordRepository permissionRecordRepository,
                      ChangeLogEntryRepository changeLogEntryRepository,
                      TicketRepository ticketRepository) {
        this.documentRepository = documentRepository;
        this.permissionRecordRepository = permissionRecordRepository;
        this.changeLogEntryRepository = changeLogEntryRepository;
        this.ticketRepository = ticketRepository;
    }

    @Override
    public void run(String... args) {
        seedDocuments();
        seedPermissions();
        seedChangeLogs();
        seedTickets();
    }

    private void seedDocuments() {
        if (documentRepository.count() > 0) {
            log.info("Documents already seeded (count={}). Skipping.", documentRepository.count());
            return;
        }

        List<Document> docs = List.of(
                new Document(
                        "Billing API Scope Requirements & Troubleshooting",
                        DocumentType.RUNBOOK,
                        "billing-api requires scope billing.read; commonly missing after role template changes. When callers report 403 Forbidden with missing_scope error on /billing/dashboard, inspect the employee's assigned scopes and ensure billing.read is provisioned in the authorization server."
                ),
                new Document(
                        "Billing Dashboard Access Runbook",
                        DocumentType.RUNBOOK,
                        "Employees in billing-analyst or finance-manager roles require both billing.view and billing.read scopes. Access to the billing dashboard fails immediately with HTTP 403 if billing.read is not active."
                ),
                new Document(
                        "Billing Service Scope & Permission Reference",
                        DocumentType.PERMISSION_DOC,
                        "The billing-api service supports three primary scopes: billing.view (dashboard metadata only), billing.read (full billing history, invoicing summaries, account ledgers), and billing.admin (payment processing, refund issuance)."
                ),
                new Document(
                        "POSTMORTEM-2026-03-12: Billing Dashboard 403 Permissions Outage",
                        DocumentType.POSTMORTEM,
                        "Root cause analysis of intermittent 403 Forbidden errors encountered by billing analysts. A template refactoring PR (#341) inadvertently dropped default read scopes for the billing-analyst role profile. Corrective action: added automated integration test verifying role template scope mappings."
                ),
                new Document(
                        "Enterprise Identity & Role-Based Access Control Policy",
                        DocumentType.POLICY,
                        "All internal services must enforce least privilege access. Service-to-service communication requires mutual TLS and validated JWT tokens with granular audience and scope claims. Role template modifications require two-person peer review."
                ),
                new Document(
                        "Kafka Consumer Lag Triage Runbook",
                        DocumentType.RUNBOOK,
                        "High consumer lag on topic billing.events indicates slow consumer processing or partition rebalancing storms. Increase consumer concurrency or scale consumer group pods."
                ),
                new Document(
                        "Database Connection Pool Exhaustion Runbook",
                        DocumentType.RUNBOOK,
                        "HikariCP pool starvation occurs when active connections reach the maximum pool size of 30. Check pg_stat_activity for lingering idle in transaction queries. Run SELECT pg_terminate_backend(pid) on orphaned queries."
                ),
                new Document(
                        "Kubernetes Pod CrashLoopBackOff Runbook",
                        DocumentType.RUNBOOK,
                        "Inspect pod logs using kubectl logs -n core <pod_name> --previous. Verify OOMKilled exit code 137 and increase container memory limit in deployment manifest."
                ),
                new Document(
                        "OAuth2 Token Validation Failure Runbook",
                        DocumentType.RUNBOOK,
                        "Token validation fails when signing keys rotate or issuer URL is unreachable. Check JWKS endpoint cache expiration and ensure clock skew does not exceed 60 seconds."
                ),
                new Document(
                        "Redis Cache Eviction Runbook",
                        DocumentType.RUNBOOK,
                        "Memory usage exceeding 90% triggers volatile-lru eviction. Inspect slowlog and pipeline large MGET requests. Ensure TTL is configured on ephemeral session keys."
                ),
                new Document(
                        "Ingress Gateway 504 Timeout Runbook",
                        DocumentType.RUNBOOK,
                        "Envoy gateway timeout occurs when upstream response exceeds 15 seconds. Trace span waterfall in Jaeger to identify downstream bottleneck in main-service or billing-api."
                ),
                new Document(
                        "Production Secret Rotation & Vault Access Policy",
                        DocumentType.POLICY,
                        "Database credentials, API tokens, and TLS certificates must be rotated every 90 days via HashiCorp Vault. Hardcoded credentials in source code or configuration files are strictly prohibited."
                ),
                new Document(
                        "Incident Escalation & Severity Matrix Policy",
                        DocumentType.POLICY,
                        "P0 issues impacting customer transactions must be acknowledged within 5 minutes. P1 performance degradation must be triaged within 15 minutes. All changes require signed audit trails."
                ),
                new Document(
                        "Data Retention & Audit Logging Policy",
                        DocumentType.POLICY,
                        "Application audit events, authentication failures, and permission changes must be preserved in immutable storage for a minimum of 365 days with cryptographic integrity verification."
                ),
                new Document(
                        "Change Management & Release Gate Policy",
                        DocumentType.POLICY,
                        "Production deployments require passing CI checks, security vulnerability scanning, and approval from the designated service owner. Hotfixes must be retroactively documented in changelog entries."
                ),
                new Document(
                        "POSTMORTEM-2026-02-18: Kafka Consumer Rebalance Cascade",
                        DocumentType.POSTMORTEM,
                        "A sudden spike in transaction volume caused heartbeat timeouts in consumer worker nodes. Fixed by bumping max.poll.interval.ms from 30000 to 120000 and isolating heavy report generation consumers."
                ),
                new Document(
                        "POSTMORTEM-2026-01-29: Memory Leak in Report Exporter",
                        DocumentType.POSTMORTEM,
                        "Heap dumps revealed unclosed ByteArrayOutputStream instances inside the CSV export controller. Remediated by transitioning to streaming reactive response bodies with bounded buffer pools."
                ),
                new Document(
                        "Infrastructure & Deployment Permissions Spec",
                        DocumentType.PERMISSION_DOC,
                        "infra.deploy scope permits deploying container workloads to staging and production clusters. infra.read scope permits reading cluster metrics, pod logs, and Prometheus dashboards."
                ),
                new Document(
                        "Corporate VPN Access & Self-Service Password Reset Policy",
                        DocumentType.POLICY,
                        "Employees requesting VPN access credentials or password resets must utilize the corporate Identity Provider (IdP) self-service portal. SRE and Platform infrastructure pipelines do not process user password resets or credential modifications. For locked accounts, contact IT Helpdesk."
                ),
                new Document(
                        "Identity Provider (IdP) Account Recovery & MFA Troubleshooting Runbook",
                        DocumentType.RUNBOOK,
                        "When users report authentication failure on VPN or SSO gateways due to expired passwords or lost MFA tokens, direct them to https://idp.corp.internal/recovery. Platform engineers must not grant infrastructure scopes to bypass authentication gates."
                ),
                new Document(
                    "Analytics Dashboard Access Runbook",
                    DocumentType.RUNBOOK,
                    "Analytics dashboard requires 'analytics.read' scope. 403 occurs if missing."
                ),
                new Document(
                    "Infra Service Permission Runbook",
                    DocumentType.RUNBOOK,
                    "Infra service API endpoints require 'infra.admin' scope. 403 returned when absent."
                ),
                new Document(
                    "Auth Service 403 Scope Runbook",
                    DocumentType.RUNBOOK,
                    "Auth service endpoints return 403 if token lacks required 'auth.manage' scope."
                )
        );

        documentRepository.saveAll(docs);
        log.info("Successfully seeded {} documents.", docs.size());
    }

    private void seedPermissions() {
        if (permissionRecordRepository.count() > 0) {
            log.info("Permissions already seeded (count={}). Skipping.", permissionRecordRepository.count());
            return;
        }

        Instant now = Instant.now();

        List<PermissionRecord> permissions = List.of(
                new PermissionRecord("rohan", "billing-analyst", "billing-api", "billing.view", now.minus(Duration.ofDays(10))),
                new PermissionRecord("rohan", "billing-analyst", "analytics-api", "reports.view", now.minus(Duration.ofDays(15))),
                new PermissionRecord("alex", "senior-engineer", "billing-api", "billing.read", now.minus(Duration.ofDays(30))),
                new PermissionRecord("alex", "senior-engineer", "billing-api", "billing.admin", now.minus(Duration.ofDays(30))),
                new PermissionRecord("sam", "devops-lead", "infra-service", "infra.deploy", now.minus(Duration.ofDays(60))),
                new PermissionRecord("sam", "devops-lead", "infra-service", "infra.read", now.minus(Duration.ofDays(60))),
                new PermissionRecord("marcus", "security-auditor", "auth-service", "audit.read", now.minus(Duration.ofDays(45))),
                new PermissionRecord("marcus", "security-auditor", "auth-service", "compliance.view", now.minus(Duration.ofDays(45)))
        );

        permissionRecordRepository.saveAll(permissions);
        log.info("Successfully seeded {} permission records.", permissions.size());
    }

    private void seedChangeLogs() {
        if (changeLogEntryRepository.count() > 0) {
            log.info("ChangeLogs already seeded (count={}). Skipping.", changeLogEntryRepository.count());
            return;
        }

        Instant now = Instant.now();

        List<ChangeLogEntry> logs = List.of(
                new ChangeLogEntry("billing-api", "cleanup of role template permissions", "#341", now.minus(Duration.ofDays(2))),
                new ChangeLogEntry("billing-api", "Bump Spring Boot to 3.2.0 and instrument OpenTelemetry traces", "#339", now.minus(Duration.ofDays(5))),
                new ChangeLogEntry("auth-service", "Add compliance.view scope to security-auditor role template", "#412", now.minus(Duration.ofDays(1))),
                new ChangeLogEntry("infra-service", "Extend infra.read to DevOps roles for Prometheus dashboards", "#388", now.minus(Duration.ofDays(7)))
        );

        changeLogEntryRepository.saveAll(logs);
        log.info("Successfully seeded {} changelog entries.", logs.size());
    }

    private void seedTickets() {
        if (ticketRepository.count() > 0) {
            log.info("Tickets already seeded (count={}). Skipping.", ticketRepository.count());
            return;
        }

        Instant now = Instant.now();

        // Rohan's tickets (billing analyst)
        Ticket t1 = new Ticket(
                "Cannot access billing dashboard: 403 Forbidden missing_scope",
                "When I navigate to /billing/dashboard, the page immediately returns a 403 error saying missing_scope billing.read. I am in the billing-analyst role and should have access.",
                TicketStatus.AWAITING_APPROVAL,
                "rohan"
        );
        t1.setCreatedAt(now.minus(Duration.ofMinutes(30)));
        t1.setUpdatedAt(now.minus(Duration.ofMinutes(5)));

        // Alex's tickets (senior engineer)
        Ticket t2 = new Ticket(
                "Kafka consumer lag spike on topic billing.events",
                "Consumer group billing-processor lag exceeded 15,000 messages on partition 2. Inbound event ingestion rate elevated after batch reconciliation.",
                TicketStatus.RESOLVED,
                "alex"
        );
        t2.setCreatedAt(now.minus(Duration.ofHours(2)));
        t2.setUpdatedAt(now.minus(Duration.ofHours(1)));

        // Sam's tickets (devops lead)
        Ticket t3 = new Ticket(
                "HikariCP pool exhaustion warning on core Postgres",
                "Active connections reached 28/30 threshold on main database pool. Slow query identified on historical invoice export endpoint.",
                TicketStatus.AWAITING_APPROVAL,
                "sam"
        );
        t3.setCreatedAt(now.minus(Duration.ofHours(3)));
        t3.setUpdatedAt(now.minus(Duration.ofMinutes(25)));

        Ticket t4 = new Ticket(
                "Kubernetes worker node disk pressure alert",
                "Node k8s-worker-04 reporting 88% disk utilization on ephemeral storage volume due to unpruned container logs.",
                TicketStatus.RESOLVED,
                "sam"
        );
        t4.setCreatedAt(now.minus(Duration.ofHours(5)));
        t4.setUpdatedAt(now.minus(Duration.ofHours(4)));

        // Marcus's tickets (security auditor)
        Ticket t5 = new Ticket(
                "Audit logging compliance check for Q1 rotation",
                "Verify that application audit events, authentication failures, and permission changes are preserved in immutable storage per policy.",
                TicketStatus.AWAITING_APPROVAL,
                "marcus"
        );
        t5.setCreatedAt(now.minus(Duration.ofHours(2)));
        t5.setUpdatedAt(now.minus(Duration.ofMinutes(10)));

        Ticket t6 = new Ticket(
                "Infra TLS certificate renewal verification for ingress",
                "Validate SAN attributes and expiry on wildcard ingress certs across staging and prod clusters.",
                TicketStatus.RESOLVED,
                "marcus"
        );
        t6.setCreatedAt(now.minus(Duration.ofDays(1)));
        t6.setUpdatedAt(now.minus(Duration.ofDays(1)).plus(Duration.ofHours(2)));

        ticketRepository.saveAll(List.of(t1, t2, t3, t4, t5, t6));
        log.info("Successfully seeded 6 initial tickets.");
    }
}
