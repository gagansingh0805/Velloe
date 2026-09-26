package com.velloe.mainservice.service.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.velloe.mainservice.dto.ClassificationResult;
import com.velloe.mainservice.dto.CorrelateRequest;
import com.velloe.mainservice.dto.CorrelationResult;
import com.velloe.mainservice.dto.ScoredDocument;
import com.velloe.mainservice.dto.TraceLookupResult;
import com.velloe.mainservice.model.PermissionRecord;
import com.velloe.mainservice.repository.PermissionRecordRepository;
import com.velloe.mainservice.service.Bm25Service;
import com.velloe.mainservice.service.llm.LlmService;
import com.velloe.mainservice.service.trace.TraceLookupService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CorrelatorAgentService {

    private static final Logger log = LoggerFactory.getLogger(CorrelatorAgentService.class);

    public static final String CORRELATOR_SYSTEM_PROMPT =
            "You are an investigation agent. You've been given a classification \n" +
            "plus raw evidence from up to three sources: doc search results, \n" +
            "permission records, and a Jaeger trace summary. Correlate this \n" +
            "evidence and state what is actually going wrong. Every claim in \n" +
            "supporting_evidence must cite its specific source (doc ID, trace span \n" +
            "name, or permission field) — no unsupported conclusions. Do NOT \n" +
            "propose a fix. If evidence is insufficient or contradictory, say so \n" +
            "and set confidence low rather than guessing.\n\n" +
            "Respond ONLY with valid JSON:\n" +
            "{\n" +
            "  \"root_cause_hypothesis\": \"...\",\n" +
            "  \"supporting_evidence\": [\"...\", \"...\"],\n" +
            "  \"confidence\": <float>,\n" +
            "  \"evidence_sufficient\": <bool>\n" +
            "}";

    private final Bm25Service bm25Service;
    private final PermissionRecordRepository permissionRecordRepository;
    private final TraceLookupService traceLookupService;
    private final LlmService llmService;
    private final ObjectMapper objectMapper;

    public CorrelatorAgentService(Bm25Service bm25Service,
                                  PermissionRecordRepository permissionRecordRepository,
                                  TraceLookupService traceLookupService,
                                  LlmService llmService,
                                  ObjectMapper objectMapper) {
        this.bm25Service = bm25Service;
        this.permissionRecordRepository = permissionRecordRepository;
        this.traceLookupService = traceLookupService;
        this.llmService = llmService;
        this.objectMapper = objectMapper;
    }

    public CorrelationResult correlate(CorrelateRequest request) {
        String description = request.getDescription() != null ? request.getDescription() : "";
        ClassificationResult classifier = request.getClassifierOutput();

        // Resolve employee ID and service
        String employeeId = request.getEmployeeId();
        if (employeeId == null || employeeId.isBlank()) {
            if (description.toLowerCase().contains("alex")) {
                employeeId = "alex";
            } else if (description.toLowerCase().contains("sam") || description.toLowerCase().contains("sarah")) {
                employeeId = "sam";
            } else if (description.toLowerCase().contains("rohan") || description.toLowerCase().contains("priya")) {
                employeeId = "rohan";
            } else {
                employeeId = "rohan";
            }
        }

        String service = request.getService();
        if (service == null || service.isBlank()) {
            service = "billing-api";
        }

        // 1. Conditionally run doc search
        String docResultsText = null;
        if (classifier != null && Boolean.TRUE.equals(classifier.getNeedsDocSearch())) {
            List<ScoredDocument> docs = bm25Service.search(description, 3);
            StringBuilder sb = new StringBuilder();
            for (ScoredDocument d : docs) {
                sb.append(String.format("- [doc ID: %s] \"%s\" (%s):\n  %s\n",
                        d.getId(), d.getTitle(), d.getType(), d.getContent()));
            }
            docResultsText = sb.toString();
        }

        // 2. Conditionally query permission records
        String permissionsText = null;
        if (classifier != null && Boolean.TRUE.equals(classifier.getNeedsPermissionCheck())) {
            List<PermissionRecord> records = permissionRecordRepository.findByEmployeeId(employeeId);
            StringBuilder sb = new StringBuilder();
            if (records.isEmpty()) {
                sb.append(String.format("No permission records found for employee ID '%s'\n", employeeId));
            } else {
                for (PermissionRecord r : records) {
                    sb.append(String.format("- employee_id: %s, role: %s, service: %s, scope: %s, granted_at: %s\n",
                            r.getEmployeeId(), r.getRole(), r.getService(), r.getScope(), r.getGrantedAt()));
                }
            }
            permissionsText = sb.toString();
        }

        // 3. Conditionally query Jaeger trace
        String traceText = null;
        if (classifier != null && Boolean.TRUE.equals(classifier.getNeedsTraceLookup())) {
            TraceLookupResult trace = traceLookupService.findTrace(employeeId, service, null, null);
            if (trace.isFound()) {
                traceText = String.format("- trace_id: %s\n- service: %s\n- span name: %s\n- HTTP status: %s\n- duration: %.2fms\n- tags: %s\n- jaeger_url: %s\n",
                        trace.getTraceId(), trace.getService(), trace.getSpan(), trace.getStatus(),
                        trace.getDurationMs(), trace.getTags(), trace.getJaegerUrl());
            } else {
                traceText = "No matching error trace found in Jaeger.\n";
            }
        }

        // Build composite user prompt
        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("Issue description: \"").append(description).append("\"\n\n");

        try {
            promptBuilder.append("Classifier Output:\n");
            promptBuilder.append(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(classifier)).append("\n\n");
        } catch (Exception e) {
            promptBuilder.append("Classifier Output: ").append(classifier).append("\n\n");
        }

        promptBuilder.append("Gathered Evidence:\n");
        if (docResultsText != null) {
            promptBuilder.append("--- Document Search Results (docResults) ---\n").append(docResultsText).append("\n");
        }
        if (permissionsText != null) {
            promptBuilder.append("--- Permission Records (permissionRecords) ---\n").append(permissionsText).append("\n");
        }
        if (traceText != null) {
            promptBuilder.append("--- Jaeger Trace Summary (traceSummary) ---\n").append(traceText).append("\n");
        }

        String userPrompt = promptBuilder.toString();
        log.info("Invoking Correlator agent with gathered evidence...");

        String rawOutput = llmService.complete(CORRELATOR_SYSTEM_PROMPT, userPrompt);
        CorrelationResult result = tryParseJson(rawOutput);

        if (result == null) {
            log.warn("First JSON parse failed for correlator output: [{}]. Retrying once...", rawOutput);
            String retryPrompt = userPrompt + "\nYour last response was not valid JSON. Return ONLY the JSON object.";
            String retryOutput = llmService.complete(CORRELATOR_SYSTEM_PROMPT, retryPrompt);
            result = tryParseJson(retryOutput);

            if (result == null) {
                log.error("Second JSON parse attempt failed for correlator. Output: [{}]", retryOutput);
                throw new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Failed to obtain valid JSON correlation from LLM after retry. Raw response: " + retryOutput
                );
            }
        }

        return result;
    }

    private CorrelationResult tryParseJson(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }

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

        try {
            CorrelationResult result = objectMapper.readValue(cleaned, CorrelationResult.class);
            if (result.getRootCauseHypothesis() != null && result.getConfidence() != null) {
                return result;
            }
        } catch (Exception e) {
            log.debug("JSON parse exception on correlator output '{}': {}", cleaned, e.getMessage());
        }

        return null;
    }
}
