package com.velloe.mainservice.service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.velloe.mainservice.dto.TicketExplanationResponse;
import com.velloe.mainservice.model.AgentStep;
import com.velloe.mainservice.model.Ticket;
import com.velloe.mainservice.repository.AgentStepRepository;
import com.velloe.mainservice.repository.TicketRepository;
import com.velloe.mainservice.service.llm.LlmService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@Service
public class TicketExplanationService {

    private static final Logger log = LoggerFactory.getLogger(TicketExplanationService.class);

    private final TicketRepository ticketRepository;
    private final AgentStepRepository agentStepRepository;
    private final LlmService llmService;
    private final ObjectMapper objectMapper;

    public TicketExplanationService(TicketRepository ticketRepository,
                                  AgentStepRepository agentStepRepository,
                                  LlmService llmService,
                                  ObjectMapper objectMapper) {
        this.ticketRepository = ticketRepository;
        this.agentStepRepository = agentStepRepository;
        this.llmService = llmService;
        this.objectMapper = objectMapper;
    }

    public TicketExplanationResponse explainTicket(UUID ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found: " + ticketId));

        List<AgentStep> steps = agentStepRepository.findByTicketIdOrderByStartedAtAsc(ticketId);

        Map<String, Object> agentInsights = new HashMap<>();
        String category = "UNKNOWN";
        String classifierReasoning = "";
        String rootCauseHypothesis = "";
        String proposedFix = "";
        String fixType = "";

        for (AgentStep step : steps) {
            String name = step.getAgentName() != null ? step.getAgentName().name() : "UNKNOWN";
            Map<String, Object> parsedMap = step.getParsedOutput();
            if (parsedMap != null && !parsedMap.isEmpty()) {
                try {
                    agentInsights.put(name, parsedMap);

                    if ("CLASSIFIER".equalsIgnoreCase(name)) {
                        if (parsedMap.get("category") != null) category = parsedMap.get("category").toString();
                        if (parsedMap.get("reasoning") != null) classifierReasoning = parsedMap.get("reasoning").toString();
                    } else if ("CORRELATOR".equalsIgnoreCase(name)) {
                        if (parsedMap.get("root_cause_hypothesis") != null) rootCauseHypothesis = parsedMap.get("root_cause_hypothesis").toString();
                    } else if ("RESOLVER".equalsIgnoreCase(name)) {
                        if (parsedMap.get("proposed_fix") != null) proposedFix = parsedMap.get("proposed_fix").toString();
                        if (parsedMap.get("fix_type") != null) fixType = parsedMap.get("fix_type").toString();
                    }
                } catch (Exception e) {
                    agentInsights.put(name, parsedMap.toString());
                }
            }
        }

        String systemPrompt =
                "You are an AI Support & SRE Explanation Agent for an enterprise platform.\n" +
                "You explain ticket decisions clearly and empathetically to the employee and engineering team.\n" +
                "Given a ticket's status (e.g. REJECTED, RESOLVED, AWAITING_APPROVAL), user description, and agent findings:\n" +
                "- If the ticket was REJECTED: Explain specifically WHY it was rejected or closed by the administrative/SRE gate.\n" +
                "  For example, if it is a USER_ERROR (like a password reset or VPN credential issue), explain that automated system privilege grants or code fixes were rejected because the problem is a user credential/configuration issue rather than a service failure or missing backend permission.\n" +
                "- Provide clear, numbered next_steps for the employee to resolve their issue.\n" +
                "- Provide a concise headline, high-level summary, and root_cause_analysis.\n\n" +
                "Respond ONLY with valid JSON in this exact format:\n" +
                "{\n" +
                "  \"headline\": \"...\",\n" +
                "  \"summary\": \"...\",\n" +
                "  \"rejection_reason\": \"...\",\n" +
                "  \"root_cause_analysis\": \"...\",\n" +
                "  \"next_steps\": [\"Step 1...\", \"Step 2...\"]\n" +
                "}";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Ticket ID: ").append(ticket.getId()).append("\n");
        userPrompt.append("Title: ").append(ticket.getTitle()).append("\n");
        userPrompt.append("Description: ").append(ticket.getDescription()).append("\n");
        userPrompt.append("Employee ID: ").append(ticket.getEmployeeId()).append("\n");
        userPrompt.append("Ticket Status: ").append(ticket.getStatus()).append("\n");
        userPrompt.append("Classified Category: ").append(category).append("\n");
        userPrompt.append("Classifier Reasoning: ").append(classifierReasoning).append("\n");
        userPrompt.append("Correlator Hypothesis: ").append(rootCauseHypothesis).append("\n");
        userPrompt.append("Resolver Proposed Fix: ").append(proposedFix).append("\n");
        userPrompt.append("Resolver Fix Type: ").append(fixType).append("\n");

        TicketExplanationResponse response = null;
        try {
            String rawLlm = llmService.complete(systemPrompt, userPrompt.toString());
            response = tryParseExplanation(rawLlm);
        } catch (Exception e) {
            log.warn("Failed to generate AI explanation: {}", e.getMessage());
        }

        if (response == null) {
            response = buildFallbackExplanation(ticket, category, classifierReasoning, rootCauseHypothesis, fixType);
        }

        response.setTicketId(ticket.getId());
        response.setStatus(ticket.getStatus() != null ? ticket.getStatus().name() : "UNKNOWN");
        response.setCategory(category);
        response.setAgentInsights(agentInsights);

        return response;
    }

    private TicketExplanationResponse tryParseExplanation(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String cleaned = raw.trim();
        if (cleaned.startsWith("```json")) cleaned = cleaned.substring(7);
        else if (cleaned.startsWith("```")) cleaned = cleaned.substring(3);
        if (cleaned.endsWith("```")) cleaned = cleaned.substring(0, cleaned.length() - 3);
        cleaned = cleaned.trim();

        int start = cleaned.indexOf('{');
        int end = cleaned.lastIndexOf('}');
        if (start != -1 && end != -1 && end > start) {
            cleaned = cleaned.substring(start, end + 1);
        }

        try {
            return objectMapper.readValue(cleaned, TicketExplanationResponse.class);
        } catch (Exception e) {
            log.warn("Error parsing explanation JSON: {}", e.getMessage());
            return null;
        }
    }

    private TicketExplanationResponse buildFallbackExplanation(Ticket ticket, String category,
                                                              String classifierReasoning,
                                                              String rootCauseHypothesis,
                                                              String fixType) {
        TicketExplanationResponse resp = new TicketExplanationResponse();
        boolean isRejected = ticket.getStatus() != null && "REJECTED".equalsIgnoreCase(ticket.getStatus().name());

        if (isRejected) {
            resp.setHeadline("Request Rejected by Administrative Safety Gate");
            if ("USER_ERROR".equalsIgnoreCase(category)) {
                resp.setRejectionReason("Automated permission grants and infrastructure changes were rejected because this issue was identified as a user-side configuration or credential reset request, rather than an infrastructure or permission defect.");
                resp.setSummary("The triage pipeline analyzed your request and detected that no infrastructure services are degraded and no elevated role modifications are required.");
                resp.setRootCauseAnalysis(classifierReasoning.isBlank() ? "Request classified as self-service user error." : classifierReasoning);
                resp.setNextSteps(List.of(
                        "Visit the Internal Identity Self-Service Portal at https://auth.corp.internal/self-service to reset your password or MFA tokens.",
                        "Verify your VPN client profile settings and ensure you are using the latest corporate configuration profile.",
                        "If you are locked out of your account, contact the IT Service Desk directly on Slack (#it-support)."
                ));
            } else {
                resp.setRejectionReason("The proposed automated resolution was rejected by the SRE approval gate due to insufficient corroborating evidence or elevated risk profile.");
                resp.setSummary("The investigation did not find conclusive telemetry to warrant automated production changes.");
                resp.setRootCauseAnalysis(rootCauseHypothesis.isBlank() ? "No conclusive root cause identified." : rootCauseHypothesis);
                resp.setNextSteps(List.of(
                        "Review ticket diagnostic logs and trace spans.",
                        "Escalate manually to the on-call SRE team if system degradation persists."
                ));
            }
        } else {
            resp.setHeadline("Automated Ticket Diagnostic Summary");
            resp.setSummary("Multi-agent automated investigation evaluated telemetry and documentation for this incident.");
            resp.setRejectionReason("N/A - Ticket is currently " + ticket.getStatus());
            resp.setRootCauseAnalysis(rootCauseHypothesis.isBlank() ? "Investigation completed." : rootCauseHypothesis);
            resp.setNextSteps(List.of("Review proposed resolution and await SRE operator confirmation."));
        }

        return resp;
    }
}
