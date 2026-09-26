package com.velloe.mainservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ResolveRequest {

    @JsonProperty("correlatorOutput")
    private CorrelationResult correlatorOutput;

    private String description;
    private String service;

    public ResolveRequest() {
    }

    public ResolveRequest(CorrelationResult correlatorOutput, String description) {
        this.correlatorOutput = correlatorOutput;
        this.description = description;
    }

    public CorrelationResult getCorrelatorOutput() {
        return correlatorOutput;
    }

    public void setCorrelatorOutput(CorrelationResult correlatorOutput) {
        this.correlatorOutput = correlatorOutput;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getService() {
        return service;
    }

    public void setService(String service) {
        this.service = service;
    }
}
