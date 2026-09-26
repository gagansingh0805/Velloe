package com.velloe.mainservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class TicketExplanationResponse {
    private UUID ticketId;
    private String status;
    private String category;
    private String headline;
    private String summary;

    @JsonProperty("rejection_reason")
    private String rejectionReason;

    @JsonProperty("root_cause_analysis")
    private String rootCauseAnalysis;

    @JsonProperty("next_steps")
    private List<String> nextSteps;

    @JsonProperty("agent_insights")
    private Map<String, Object> agentInsights;

    public TicketExplanationResponse() {}

    public UUID getTicketId() { return ticketId; }
    public void setTicketId(UUID ticketId) { this.ticketId = ticketId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getHeadline() { return headline; }
    public void setHeadline(String headline) { this.headline = headline; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getRootCauseAnalysis() { return rootCauseAnalysis; }
    public void setRootCauseAnalysis(String rootCauseAnalysis) { this.rootCauseAnalysis = rootCauseAnalysis; }

    public List<String> getNextSteps() { return nextSteps; }
    public void setNextSteps(List<String> nextSteps) { this.nextSteps = nextSteps; }

    public Map<String, Object> getAgentInsights() { return agentInsights; }
    public void setAgentInsights(Map<String, Object> agentInsights) { this.agentInsights = agentInsights; }
}
