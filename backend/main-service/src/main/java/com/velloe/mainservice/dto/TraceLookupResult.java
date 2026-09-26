package com.velloe.mainservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

public class TraceLookupResult {

    private boolean found;

    @JsonProperty("trace_id")
    private String traceId;

    private String service;
    private String span;
    private Object status;

    @JsonProperty("duration_ms")
    private Double durationMs;

    private Map<String, Object> tags;

    @JsonProperty("jaeger_url")
    private String jaegerUrl;

    public TraceLookupResult() {
    }

    public static TraceLookupResult notFound() {
        TraceLookupResult res = new TraceLookupResult();
        res.setFound(false);
        return res;
    }

    public TraceLookupResult(boolean found, String traceId, String service, String span,
                             Object status, Double durationMs, Map<String, Object> tags, String jaegerUrl) {
        this.found = found;
        this.traceId = traceId;
        this.service = service;
        this.span = span;
        this.status = status;
        this.durationMs = durationMs;
        this.tags = tags;
        this.jaegerUrl = jaegerUrl;
    }

    public boolean isFound() {
        return found;
    }

    public void setFound(boolean found) {
        this.found = found;
    }

    public String getTraceId() {
        return traceId;
    }

    public void setTraceId(String traceId) {
        this.traceId = traceId;
    }

    public String getService() {
        return service;
    }

    public void setService(String service) {
        this.service = service;
    }

    public String getSpan() {
        return span;
    }

    public void setSpan(String span) {
        this.span = span;
    }

    public Object getStatus() {
        return status;
    }

    public void setStatus(Object status) {
        this.status = status;
    }

    public Double getDurationMs() {
        return durationMs;
    }

    public void setDurationMs(Double durationMs) {
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
