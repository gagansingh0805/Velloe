package com.velloe.mainservice.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "agent_steps")
public class AgentStep {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "ticket_id", nullable = false)
    private UUID ticketId;

    @Enumerated(EnumType.STRING)
    @Column(name = "agent_name", nullable = false)
    private AgentName agentName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StepStatus status = StepStatus.RUNNING;

    @Column(name = "prompt_sent", columnDefinition = "TEXT")
    private String promptSent;

    @Column(name = "raw_output", columnDefinition = "TEXT")
    private String rawOutput;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "parsed_output", columnDefinition = "jsonb")
    private Map<String, Object> parsedOutput;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @PrePersist
    public void prePersist() {
        if (this.startedAt == null) {
            this.startedAt = Instant.now();
        }
    }

    public AgentStep() {}

    public AgentStep(UUID ticketId, AgentName agentName, StepStatus status) {
        this.ticketId = ticketId;
        this.agentName = agentName;
        this.status = status;
        this.startedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getTicketId() {
        return ticketId;
    }

    public void setTicketId(UUID ticketId) {
        this.ticketId = ticketId;
    }

    public AgentName getAgentName() {
        return agentName;
    }

    public void setAgentName(AgentName agentName) {
        this.agentName = agentName;
    }

    public StepStatus getStatus() {
        return status;
    }

    public void setStatus(StepStatus status) {
        this.status = status;
    }

    public String getPromptSent() {
        return promptSent;
    }

    public void setPromptSent(String promptSent) {
        this.promptSent = promptSent;
    }

    public String getRawOutput() {
        return rawOutput;
    }

    public void setRawOutput(String rawOutput) {
        this.rawOutput = rawOutput;
    }

    public Map<String, Object> getParsedOutput() {
        return parsedOutput;
    }

    public void setParsedOutput(Map<String, Object> parsedOutput) {
        this.parsedOutput = parsedOutput;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }
}
