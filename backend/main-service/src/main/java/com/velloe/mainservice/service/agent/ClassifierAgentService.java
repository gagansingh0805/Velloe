package com.velloe.mainservice.service.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.velloe.mainservice.dto.ClassificationResult;
import com.velloe.mainservice.dto.ClassifyRequest;
import com.velloe.mainservice.service.llm.LlmService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ClassifierAgentService {

    private static final Logger log = LoggerFactory.getLogger(ClassifierAgentService.class);

    public static final String CLASSIFIER_SYSTEM_PROMPT =
            "You are an issue triage agent for an internal IT support system. You \n" +
            "will be given an employee's free-text issue description. Classify the \n" +
            "issue and decide which investigation steps are needed. Do not diagnose \n" +
            "or solve — only classify and route.\n\n" +
            "Valid categories: PERMISSIONS, SERVICE_FAILURE, CONFIG_DRIFT, USER_ERROR, OTHER\n\n" +
            "Decide whether these are needed:\n" +
            "- needs_doc_search: should internal docs/runbooks be searched?\n" +
            "- needs_trace_lookup: should a Jaeger trace be pulled?\n" +
            "- needs_permission_check: should permission records be checked?\n\n" +
            "Be conservative — if ambiguous, flag more steps rather than fewer. Be \n" +
            "honest about confidence; do not inflate it.\n\n" +
            "Respond ONLY with valid JSON, no markdown fences, no preamble:\n" +
            "{\n" +
            "  \"category\": \"...\",\n" +
            "  \"confidence\": <float>,\n" +
            "  \"needs_doc_search\": <bool>,\n" +
            "  \"needs_trace_lookup\": <bool>,\n" +
            "  \"needs_permission_check\": <bool>,\n" +
            "  \"reasoning\": \"<one sentence>\"\n" +
            "}";

    private final LlmService llmService;
    private final ObjectMapper objectMapper;

    public ClassifierAgentService(LlmService llmService, ObjectMapper objectMapper) {
        this.llmService = llmService;
        this.objectMapper = objectMapper;
    }

    public ClassificationResult classify(ClassifyRequest request) {
        String description = request.getDescription() != null ? request.getDescription() : "";
        String role = request.getRole() != null ? request.getRole() : "";
        String employeeId = request.getEmployeeId() != null ? request.getEmployeeId() : "";

        String userPrompt = String.format(
                "Issue description: \"%s\"\nEmployee role: \"%s\"\nEmployee ID: \"%s\"",
                description, role, employeeId
        );

        log.info("Invoking Classifier agent: description='{}', role='{}', employeeId='{}'", description, role, employeeId);

        String rawOutput = llmService.complete(CLASSIFIER_SYSTEM_PROMPT, userPrompt);
        ClassificationResult result = tryParseJson(rawOutput);

        if (result == null) {
            log.warn("First JSON parse attempt failed for output: [{}]. Retrying once...", rawOutput);
            String retryPrompt = userPrompt + "\nYour last response was not valid JSON. Return ONLY the JSON object.";
            String retryOutput = llmService.complete(CLASSIFIER_SYSTEM_PROMPT, retryPrompt);
            result = tryParseJson(retryOutput);

            if (result == null) {
                log.error("Second JSON parse attempt failed. Output: [{}]", retryOutput);
                throw new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Failed to parse Classifier agent output after retry. Raw response: " + retryOutput
                );
            }
        }

        return result;
    }

    private ClassificationResult tryParseJson(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }

        String cleaned = raw.trim();
        // Remove markdown fences if present
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        cleaned = cleaned.trim();

        // Extract JSON substring if surrounded by extra text
        int startBrace = cleaned.indexOf('{');
        int endBrace = cleaned.lastIndexOf('}');
        if (startBrace != -1 && endBrace != -1 && endBrace > startBrace) {
            cleaned = cleaned.substring(startBrace, endBrace + 1);
        }

        try {
            ClassificationResult result = objectMapper.readValue(cleaned, ClassificationResult.class);
            if (result.getCategory() != null && result.getConfidence() != null) {
                return result;
            }
        } catch (Exception e) {
            log.debug("JSON parsing failed on string: {}. Error: {}", cleaned, e.getMessage());
        }

        return null;
    }
}
