package com.velloe.mainservice.service.pipeline;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.velloe.mainservice.dto.ClassificationResult;
import com.velloe.mainservice.dto.CorrelationResult;
import com.velloe.mainservice.dto.ResolutionResult;
import com.velloe.mainservice.dto.ScoredDocument;
import com.velloe.mainservice.dto.TraceLookupResult;
import com.velloe.mainservice.model.AgentName;
import com.velloe.mainservice.model.AgentStep;
import com.velloe.mainservice.model.ChangeLogEntry;
import com.velloe.mainservice.model.PermissionRecord;
import com.velloe.mainservice.model.StepStatus;
import com.velloe.mainservice.model.Ticket;
import com.velloe.mainservice.model.TicketStatus;
import com.velloe.mainservice.repository.AgentStepRepository;
import com.velloe.mainservice.repository.ChangeLogEntryRepository;
import com.velloe.mainservice.repository.PermissionRecordRepository;
import com.velloe.mainservice.repository.TicketRepository;
import com.velloe.mainservice.service.Bm25Service;
import com.velloe.mainservice.service.agent.ClassifierAgentService;
import com.velloe.mainservice.service.agent.CorrelatorAgentService;
import com.velloe.mainservice.service.agent.ResolverAgentService;
import com.velloe.mainservice.service.llm.LlmService;
import com.velloe.mainservice.service.sse.TicketSseService;
import com.velloe.mainservice.service.trace.TraceLookupService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class TicketPipelineService {

    private static final Logger log = LoggerFactory.getLogger(TicketPipelineService.class);

    private final TicketRepository ticketRepository;
    private final AgentStepRepository agentStepRepository;
    private final PermissionRecordRepository permissionRecordRepository;
    private final ChangeLogEntryRepository changeLogEntryRepository;
    private final Bm25Service bm25Service;
    private final TraceLookupService traceLookupService;
    private final LlmService llmService;
    private final TicketSseService ticketSseService;
    private final ObjectMapper objectMapper;

    public TicketPipelineService(TicketRepository ticketRepository,
                                 AgentStepRepository agentStepRepository,
                                 PermissionRecordRepository permissionRecordRepository,
                                 ChangeLogEntryRepository changeLogEntryRepository,
                                 Bm25Service bm25Service,
                                 TraceLookupService traceLookupService,
                                 LlmService llmService,
                                 TicketSseService ticketSseService,
                                 ObjectMapper objectMapper) {
        this.ticketRepository = ticketRepository;
        this.agentStepRepository = agentStepRepository;
        this.permissionRecordRepository = permissionRecordRepository;
        this.changeLogEntryRepository = changeLogEntryRepository;
        this.bm25Service = bm25Service;
        this.traceLookupService = traceLookupService;
        this.llmService = llmService;
        this.ticketSseService = ticketSseService;
        this.objectMapper = objectMapper;
    }

    @Async
    public void executePipeline(UUID ticketId) {
        log.info("Starting automated AI agent pipeline for ticket: {}", ticketId);

        Optional<Ticket> optTicket = ticketRepository.findById(ticketId);
        if (optTicket.isEmpty()) {
            log.error("Ticket {} not found for pipeline execution", ticketId);
            return;
        }
        Ticket ticket = optTicket.get();

        try {
            // STEP 1: CLASSIFIER
            ticket.setStatus(TicketStatus.TRIAGED);
            ticket.setUpdatedAt(Instant.now());
            ticketRepository.save(ticket);

            AgentStep classifierStep = new AgentStep(ticketId, AgentName.CLASSIFIER, StepStatus.RUNNING);
            classifierStep.setStartedAt(Instant.now());
            classifierStep = agentStepRepository.save(classifierStep);

            // Infer role from employee permissions if available
            String role = "employee";
            List<PermissionRecord> existingPermissions = permissionRecordRepository.findByEmployeeId(ticket.getEmployeeId());
            if (!existingPermissions.isEmpty() && existingPermissions.get(0).getRole() != null) {
                role = existingPermissions.get(0).getRole();
            }

            String classifierUserPrompt = String.format(
                    "Issue description: \"%s\"\nEmployee role: \"%s\"\nEmployee ID: \"%s\"",
                    ticket.getDescription(), role, ticket.getEmployeeId()
            );
            classifierStep.setPromptSent(classifierUserPrompt);

            String classifierRawOutput = llmService.complete(ClassifierAgentService.CLASSIFIER_SYSTEM_PROMPT, classifierUserPrompt);
            ClassificationResult classificationResult = parseClassificationResult(classifierRawOutput);

            if (classificationResult == null) {
                log.warn("First JSON parse failed for classifier. Retrying once...");
                String retryPrompt = classifierUserPrompt + "\nYour last response was not valid JSON. Return ONLY the JSON object.";
                classifierRawOutput = llmService.complete(ClassifierAgentService.CLASSIFIER_SYSTEM_PROMPT, retryPrompt);
                classificationResult = parseClassificationResult(classifierRawOutput);

                if (classificationResult == null) {
                    log.error("Classifier agent failed after retry. Halting pipeline.");
                    classifierStep.setStatus(StepStatus.FAILED);
                    classifierStep.setRawOutput(classifierRawOutput != null ? classifierRawOutput : "No response from LLM");
                    classifierStep.setCompletedAt(Instant.now());
                    agentStepRepository.save(classifierStep);

                    ticketSseService.sendStepEvent(ticketId, AgentName.CLASSIFIER, StepStatus.FAILED, Map.of("error", classifierStep.getRawOutput()));
                    ticketSseService.sendFinalTicketEvent(ticketId, ticket.getStatus());
                    return;
                }
            }

            classifierStep.setStatus(StepStatus.DONE);
            classifierStep.setRawOutput(classifierRawOutput);
            classifierStep.setParsedOutput(objectMapper.convertValue(classificationResult, Map.class));
            classifierStep.setCompletedAt(Instant.now());
            agentStepRepository.save(classifierStep);

            // Broadcast SSE for CLASSIFIER
            ticketSseService.sendStepEvent(ticketId, AgentName.CLASSIFIER, StepStatus.DONE, classifierStep.getParsedOutput());
            log.info("Step 1 (CLASSIFIER) completed for ticket: {}", ticketId);

            // STEP 2: INVESTIGATING (Evidence Gathering & TRACE_LOOKUP)
            ticket.setStatus(TicketStatus.INVESTIGATING);
            ticket.setUpdatedAt(Instant.now());
            ticketRepository.save(ticket);

            // Conditionally gather doc search evidence
            String docResultsText = null;
            if (Boolean.TRUE.equals(classificationResult.getNeedsDocSearch())) {
                List<ScoredDocument> docs = bm25Service.search(ticket.getDescription(), 3);
                StringBuilder sb = new StringBuilder();
                for (ScoredDocument d : docs) {
                    sb.append(String.format("- [doc ID: %s] \"%s\" (%s):\n  %s\n",
                            d.getId(), d.getTitle(), d.getType(), d.getContent()));
                }
                docResultsText = sb.toString();
            }

            // Conditionally gather permission records
            String permissionsText = null;
            if (Boolean.TRUE.equals(classificationResult.getNeedsPermissionCheck())) {
                List<PermissionRecord> records = permissionRecordRepository.findByEmployeeId(ticket.getEmployeeId());
                StringBuilder sb = new StringBuilder();
                if (records.isEmpty()) {
                    sb.append(String.format("No permission records found for employee ID '%s'\n", ticket.getEmployeeId()));
                } else {
                    for (PermissionRecord r : records) {
                        sb.append(String.format("- employee_id: %s, role: %s, service: %s, scope: %s, granted_at: %s\n",
                                r.getEmployeeId(), r.getRole(), r.getService(), r.getScope(), r.getGrantedAt()));
                    }
                }
                permissionsText = sb.toString();
            }

            // Conditionally perform and log TRACE_LOOKUP step
            String traceText = null;
            TraceLookupResult traceResult = null;
            if (Boolean.TRUE.equals(classificationResult.getNeedsTraceLookup())) {
                AgentStep traceStep = new AgentStep(ticketId, AgentName.TRACE_LOOKUP, StepStatus.RUNNING);
                traceStep.setStartedAt(Instant.now());
                traceStep.setPromptSent(null);
                traceStep = agentStepRepository.save(traceStep);

                traceResult = traceLookupService.findTrace(ticket.getEmployeeId(), "billing-api", null, null);
                String traceJson = objectMapper.writeValueAsString(traceResult);
                traceStep.setRawOutput(traceJson);
                traceStep.setParsedOutput(objectMapper.convertValue(traceResult, Map.class));
                traceStep.setStatus(StepStatus.DONE);
                traceStep.setCompletedAt(Instant.now());
                agentStepRepository.save(traceStep);

                // Broadcast SSE for TRACE_LOOKUP
                ticketSseService.sendStepEvent(ticketId, AgentName.TRACE_LOOKUP, StepStatus.DONE, traceStep.getParsedOutput());

                if (traceResult.isFound()) {
                    traceText = String.format("- trace_id: %s\n- service: %s\n- span name: %s\n- HTTP status: %s\n- duration: %.2fms\n- tags: %s\n- jaeger_url: %s\n",
                            traceResult.getTraceId(), traceResult.getService(), traceResult.getSpan(),
                            traceResult.getStatus(), traceResult.getDurationMs(), traceResult.getTags(),
                            traceResult.getJaegerUrl());
                } else {
                    traceText = "No matching error trace found in Jaeger.\n";
                }
                log.info("Step 2 (TRACE_LOOKUP) completed for ticket: {}", ticketId);
            }

            // STEP 3: CORRELATOR
            AgentStep correlatorStep = new AgentStep(ticketId, AgentName.CORRELATOR, StepStatus.RUNNING);
            correlatorStep.setStartedAt(Instant.now());
            correlatorStep = agentStepRepository.save(correlatorStep);

            StringBuilder correlatorPromptBuilder = new StringBuilder();
            correlatorPromptBuilder.append("Issue description: \"").append(ticket.getDescription()).append("\"\n\n");
            correlatorPromptBuilder.append("Classifier Output:\n")
                    .append(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(classificationResult)).append("\n\n");
            correlatorPromptBuilder.append("Gathered Evidence:\n");
            if (docResultsText != null) {
                correlatorPromptBuilder.append("--- Document Search Results (docResults) ---\n").append(docResultsText).append("\n");
            }
            if (permissionsText != null) {
                correlatorPromptBuilder.append("--- Permission Records (permissionRecords) ---\n").append(permissionsText).append("\n");
            }
            if (traceText != null) {
                correlatorPromptBuilder.append("--- Jaeger Trace Summary (traceSummary) ---\n").append(traceText).append("\n");
            }

            String correlatorUserPrompt = correlatorPromptBuilder.toString();
            correlatorStep.setPromptSent(correlatorUserPrompt);

            String correlatorRawOutput = llmService.complete(CorrelatorAgentService.CORRELATOR_SYSTEM_PROMPT, correlatorUserPrompt);
            CorrelationResult correlationResult = parseCorrelationResult(correlatorRawOutput);

            if (correlationResult == null) {
                log.warn("First JSON parse failed for correlator. Retrying once...");
                String retryPrompt = correlatorUserPrompt + "\nYour last response was not valid JSON. Return ONLY the JSON object.";
                correlatorRawOutput = llmService.complete(CorrelatorAgentService.CORRELATOR_SYSTEM_PROMPT, retryPrompt);
                correlationResult = parseCorrelationResult(correlatorRawOutput);

                if (correlationResult == null) {
                    log.error("Correlator agent failed after retry. Halting pipeline.");
                    correlatorStep.setStatus(StepStatus.FAILED);
                    correlatorStep.setRawOutput(correlatorRawOutput != null ? correlatorRawOutput : "No response from LLM");
                    correlatorStep.setCompletedAt(Instant.now());
                    agentStepRepository.save(correlatorStep);

                    ticketSseService.sendStepEvent(ticketId, AgentName.CORRELATOR, StepStatus.FAILED, Map.of("error", correlatorStep.getRawOutput()));
                    ticketSseService.sendFinalTicketEvent(ticketId, ticket.getStatus());
                    return;
                }
            }

            correlatorStep.setStatus(StepStatus.DONE);
            correlatorStep.setRawOutput(correlatorRawOutput);
            correlatorStep.setParsedOutput(objectMapper.convertValue(correlationResult, Map.class));
            correlatorStep.setCompletedAt(Instant.now());
            agentStepRepository.save(correlatorStep);

            // Broadcast SSE for CORRELATOR
            ticketSseService.sendStepEvent(ticketId, AgentName.CORRELATOR, StepStatus.DONE, correlatorStep.getParsedOutput());
            log.info("Step 3 (CORRELATOR) completed for ticket: {}", ticketId);

            // STEP 4: RESOLVER
            ticket.setStatus(TicketStatus.PROPOSED);
            ticket.setUpdatedAt(Instant.now());
            ticketRepository.save(ticket);

            AgentStep resolverStep = new AgentStep(ticketId, AgentName.RESOLVER, StepStatus.RUNNING);
            resolverStep.setStartedAt(Instant.now());
            resolverStep = agentStepRepository.save(resolverStep);

            List<ChangeLogEntry> changeLogs = changeLogEntryRepository.findAll();
            String searchInput = (correlationResult.getRootCauseHypothesis() != null ? correlationResult.getRootCauseHypothesis() : "")
                    + " " + ticket.getDescription();
            List<ScoredDocument> relevantDocs = bm25Service.search(searchInput.trim(), 3);

            StringBuilder resolverPromptBuilder = new StringBuilder();
            resolverPromptBuilder.append("Issue Description:\n\"").append(ticket.getDescription()).append("\"\n\n");
            resolverPromptBuilder.append("Diagnosed Root Cause Hypothesis:\n")
                    .append(correlationResult.getRootCauseHypothesis()).append("\n\n");
            resolverPromptBuilder.append("Supporting Evidence:\n");
            if (correlationResult.getSupportingEvidence() != null) {
                for (String ev : correlationResult.getSupportingEvidence()) {
                    resolverPromptBuilder.append("- ").append(ev).append("\n");
                }
            }
            resolverPromptBuilder.append(String.format("Evidence Sufficient: %s\n\n", correlationResult.getEvidenceSufficient()));
            resolverPromptBuilder.append("Relevant Documentation & Runbooks:\n");
            for (ScoredDocument d : relevantDocs) {
                resolverPromptBuilder.append(String.format("- [%s] \"%s\": %s\n", d.getId(), d.getTitle(), d.getContent()));
            }
            resolverPromptBuilder.append("\nRelevant Change Log Entries:\n");
            for (ChangeLogEntry cle : changeLogs) {
                resolverPromptBuilder.append(String.format("- Service: %s, PR: %s, Timestamp: %s, Description: %s\n",
                        cle.getService(), cle.getPrLink(), cle.getTimestamp(), cle.getDescription()));
            }
            resolverPromptBuilder.append("\nInstructions: Propose the smallest fix to resolve the confirmed root cause. If a recent change log entry (such as a PR) caused or is related to this permission change, explicitly reference the PR in your proposed_fix text.\n");

            String resolverUserPrompt = resolverPromptBuilder.toString();
            resolverStep.setPromptSent(resolverUserPrompt);

            String resolverRawOutput = llmService.complete(ResolverAgentService.RESOLVER_SYSTEM_PROMPT, resolverUserPrompt);
            ResolutionResult resolutionResult = parseResolutionResult(resolverRawOutput);

            if (resolutionResult == null) {
                log.warn("First JSON parse failed for resolver. Retrying once...");
                String retryPrompt = resolverUserPrompt + "\nYour last response was not valid JSON. Return ONLY the JSON object.";
                resolverRawOutput = llmService.complete(ResolverAgentService.RESOLVER_SYSTEM_PROMPT, retryPrompt);
                resolutionResult = parseResolutionResult(resolverRawOutput);

                if (resolutionResult == null) {
                    log.error("Resolver agent failed after retry. Halting pipeline.");
                    resolverStep.setStatus(StepStatus.FAILED);
                    resolverStep.setRawOutput(resolverRawOutput != null ? resolverRawOutput : "No response from LLM");
                    resolverStep.setCompletedAt(Instant.now());
                    agentStepRepository.save(resolverStep);

                    ticketSseService.sendStepEvent(ticketId, AgentName.RESOLVER, StepStatus.FAILED, Map.of("error", resolverStep.getRawOutput()));
                    ticketSseService.sendFinalTicketEvent(ticketId, ticket.getStatus());
                    return;
                }
            }

            resolverStep.setStatus(StepStatus.DONE);
            resolverStep.setRawOutput(resolverRawOutput);
            resolverStep.setParsedOutput(objectMapper.convertValue(resolutionResult, Map.class));
            resolverStep.setCompletedAt(Instant.now());
            agentStepRepository.save(resolverStep);

            // Broadcast SSE for RESOLVER
            ticketSseService.sendStepEvent(ticketId, AgentName.RESOLVER, StepStatus.DONE, resolverStep.getParsedOutput());
            log.info("Step 4 (RESOLVER) completed for ticket: {}", ticketId);

            // STEP 5: AWAITING_APPROVAL
            ticket.setStatus(TicketStatus.AWAITING_APPROVAL);
            ticket.setUpdatedAt(Instant.now());
            ticketRepository.save(ticket);

            // Broadcast final terminal event
            ticketSseService.sendFinalTicketEvent(ticketId, TicketStatus.AWAITING_APPROVAL);
            log.info("Pipeline completed successfully! Ticket {} is now AWAITING_APPROVAL", ticketId);

        } catch (Exception e) {
            log.error("Pipeline failed unexpectedly for ticket {}: {}", ticketId, e.getMessage(), e);
            ticketSseService.sendFinalTicketEvent(ticketId, ticket.getStatus());
        }
    }

    private String cleanJsonString(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String cleaned = raw.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        cleaned = cleaned.trim();
        int startBrace = cleaned.indexOf('{');
        int endBrace = cleaned.lastIndexOf('}');
        if (startBrace != -1 && endBrace != -1 && endBrace > startBrace) {
            cleaned = cleaned.substring(startBrace, endBrace + 1);
        }
        return cleaned;
    }

    private ClassificationResult parseClassificationResult(String raw) {
        String cleaned = cleanJsonString(raw);
        if (cleaned == null) return null;
        try {
            ClassificationResult res = objectMapper.readValue(cleaned, ClassificationResult.class);
            if (res.getCategory() != null) return res;
        } catch (Exception ignored) {}
        return null;
    }

    private CorrelationResult parseCorrelationResult(String raw) {
        String cleaned = cleanJsonString(raw);
        if (cleaned == null) return null;
        try {
            CorrelationResult res = objectMapper.readValue(cleaned, CorrelationResult.class);
            if (res.getRootCauseHypothesis() != null) return res;
        } catch (Exception ignored) {}
        return null;
    }

    private ResolutionResult parseResolutionResult(String raw) {
        String cleaned = cleanJsonString(raw);
        if (cleaned == null) return null;
        try {
            ResolutionResult res = objectMapper.readValue(cleaned, ResolutionResult.class);
            if (res.getProposedFix() != null) return res;
        } catch (Exception ignored) {}
        return null;
    }
}
