package com.velloe.mainservice.service.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.velloe.mainservice.dto.CorrelationResult;
import com.velloe.mainservice.dto.ResolutionResult;
import com.velloe.mainservice.dto.ResolveRequest;
import com.velloe.mainservice.dto.ScoredDocument;
import com.velloe.mainservice.model.ChangeLogEntry;
import com.velloe.mainservice.repository.ChangeLogEntryRepository;
import com.velloe.mainservice.service.Bm25Service;
import com.velloe.mainservice.service.llm.LlmService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ResolverAgentService {

    private static final Logger log = LoggerFactory.getLogger(ResolverAgentService.class);

    public static final String RESOLVER_SYSTEM_PROMPT =
            "You are a resolution-proposal agent. Given a diagnosed root cause, its \n" +
            "evidence, and relevant change history, propose the smallest fix that \n" +
            "addresses the confirmed root cause. You do not execute anything — your \n" +
            "output goes to a human for approval. If evidence_sufficient was false, \n" +
            "set fix_type to INSUFFICIENT_EVIDENCE and explain what's missing rather \n" +
            "than guessing. If the fix changes permissions/config, include a risk_note \n" +
            "on what could go wrong if the diagnosis is incorrect.\n\n" +
            "Respond ONLY with valid JSON:\n" +
            "{\n" +
            "  \"proposed_fix\": \"...\",\n" +
            "  \"fix_type\": \"PERMISSION_GRANT | CONFIG_REVERT | SERVICE_RESTART | ESCALATE_TO_HUMAN | INSUFFICIENT_EVIDENCE\",\n" +
            "  \"risk_note\": \"...\",\n" +
            "  \"confidence\": <float>\n" +
            "}";

    private final ChangeLogEntryRepository changeLogEntryRepository;
    private final Bm25Service bm25Service;
    private final LlmService llmService;
    private final ObjectMapper objectMapper;

    public ResolverAgentService(ChangeLogEntryRepository changeLogEntryRepository,
                                Bm25Service bm25Service,
                                LlmService llmService,
                                ObjectMapper objectMapper) {
        this.changeLogEntryRepository = changeLogEntryRepository;
        this.bm25Service = bm25Service;
        this.llmService = llmService;
        this.objectMapper = objectMapper;
    }

    public ResolutionResult resolve(ResolveRequest request) {
        CorrelationResult correlator = request.getCorrelatorOutput();
        String description = request.getDescription() != null ? request.getDescription() : "";

        if (correlator == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "correlatorOutput must be provided");
        }

        // Fetch relevant change log entries
        List<ChangeLogEntry> changeLogs = changeLogEntryRepository.findAll();

        // Fetch relevant doc excerpts using hypothesis and description
        String searchInput = (correlator.getRootCauseHypothesis() != null ? correlator.getRootCauseHypothesis() : "")
                + " " + description;
        List<ScoredDocument> relevantDocs = bm25Service.search(searchInput.trim(), 3);

        // Build User Prompt
        StringBuilder promptBuilder = new StringBuilder();

        if (!description.isBlank()) {
            promptBuilder.append("Issue Description:\n\"").append(description).append("\"\n\n");
        }

        promptBuilder.append("Diagnosed Root Cause Hypothesis:\n")
                .append(correlator.getRootCauseHypothesis()).append("\n\n");

        promptBuilder.append("Supporting Evidence:\n");
        if (correlator.getSupportingEvidence() != null) {
            for (String ev : correlator.getSupportingEvidence()) {
                promptBuilder.append("- ").append(ev).append("\n");
            }
        }
        promptBuilder.append(String.format("Evidence Sufficient: %s\n\n", correlator.getEvidenceSufficient()));

        promptBuilder.append("Relevant Documentation & Runbooks:\n");
        for (ScoredDocument d : relevantDocs) {
            promptBuilder.append(String.format("- [%s] \"%s\": %s\n", d.getId(), d.getTitle(), d.getContent()));
        }
        promptBuilder.append("\n");

        promptBuilder.append("Relevant Change Log Entries:\n");
        for (ChangeLogEntry cle : changeLogs) {
            promptBuilder.append(String.format("- Service: %s, PR: %s, Timestamp: %s, Description: %s\n",
                    cle.getService(), cle.getPrLink(), cle.getTimestamp(), cle.getDescription()));
        }
        promptBuilder.append("\n");

        promptBuilder.append("Instructions: Propose the smallest fix to resolve the confirmed root cause. If a recent change log entry (such as a PR) caused or is related to this permission change, explicitly reference the PR in your proposed_fix text.\n");

        String userPrompt = promptBuilder.toString();
        log.info("Invoking Resolver agent...");

        String rawOutput = llmService.complete(RESOLVER_SYSTEM_PROMPT, userPrompt);
        ResolutionResult result = tryParseJson(rawOutput);

        if (result == null) {
            log.warn("First JSON parse failed for resolver output: [{}]. Retrying once...", rawOutput);
            String retryPrompt = userPrompt + "\nYour last response was not valid JSON. Return ONLY the JSON object.";
            String retryOutput = llmService.complete(RESOLVER_SYSTEM_PROMPT, retryPrompt);
            result = tryParseJson(retryOutput);

            if (result == null) {
                log.error("Second JSON parse attempt failed for resolver. Output: [{}]", retryOutput);
                throw new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Failed to obtain valid JSON resolution from LLM after retry. Raw response: " + retryOutput
                );
            }
        }

        return result;
    }

    private ResolutionResult tryParseJson(String raw) {
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
            ResolutionResult result = objectMapper.readValue(cleaned, ResolutionResult.class);
            if (result.getProposedFix() != null && result.getFixType() != null) {
                return result;
            }
        } catch (Exception e) {
            log.debug("JSON parse exception on resolver output '{}': {}", cleaned, e.getMessage());
        }

        return null;
    }
}
