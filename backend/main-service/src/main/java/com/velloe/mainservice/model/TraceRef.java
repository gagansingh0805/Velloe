package com.velloe.mainservice.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "trace_refs")
public class TraceRef {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "ticket_id", nullable = false)
    private UUID ticketId;

    @Column(name = "jaeger_trace_id", nullable = false)
    private String jaegerTraceId;

    @Column(nullable = false)
    private String service;

    @Column(name = "span_name", nullable = false)
    private String spanName;

    @Column(name = "http_status")
    private Integer httpStatus;

    @Column(name = "duration_ms")
    private Long durationMs;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tags", columnDefinition = "jsonb")
    private Map<String, Object> tags;

    @Column(name = "jaeger_url")
    private String jaegerUrl;

    public TraceRef() {}

    public TraceRef(UUID ticketId, String jaegerTraceId, String service, String spanName,
                    Integer httpStatus, Long durationMs, Map<String, Object> tags, String jaegerUrl) {
        this.ticketId = ticketId;
        this.jaegerTraceId = jaegerTraceId;
        this.service = service;
        this.spanName = spanName;
        this.httpStatus = httpStatus;
        this.durationMs = durationMs;
        this.tags = tags;
        this.jaegerUrl = jaegerUrl;
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

    public String getJaegerTraceId() {
        return jaegerTraceId;
    }

    public void setJaegerTraceId(String jaegerTraceId) {
        this.jaegerTraceId = jaegerTraceId;
    }

    public String getService() {
        return service;
    }

    public void setService(String service) {
        this.service = service;
    }

    public String getSpanName() {
        return spanName;
    }

    public void setSpanName(String spanName) {
        this.spanName = spanName;
    }

    public Integer getHttpStatus() {
        return httpStatus;
    }

    public void setHttpStatus(Integer httpStatus) {
        this.httpStatus = httpStatus;
    }

    public Long getDurationMs() {
        return durationMs;
    }

    public void setDurationMs(Long durationMs) {
        this.durationMs = durationMs;
    }

    public Map<String, Object> getTags() {
        return tags;
    }

    public void setTags(Map<String, Object> tags) {
        this.tags = tags;
    }

    public String getJaegerUrl() {
        return jaegerUrl;
    }

    public void setJaegerUrl(String jaegerUrl) {
        this.jaegerUrl = jaegerUrl;
    }
}
