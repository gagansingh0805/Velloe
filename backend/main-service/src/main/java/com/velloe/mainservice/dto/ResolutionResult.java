package com.velloe.mainservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ResolutionResult {

    @JsonProperty("proposed_fix")
    private String proposedFix;

    @JsonProperty("fix_type")
    private String fixType;

    @JsonProperty("risk_note")
    private String riskNote;

    private Double confidence;

    public ResolutionResult() {
    }

    public ResolutionResult(String proposedFix, String fixType, String riskNote, Double confidence) {
        this.proposedFix = proposedFix;
        this.fixType = fixType;
        this.riskNote = riskNote;
        this.confidence = confidence;
    }

    public String getProposedFix() {
        return proposedFix;
    }

    public void setProposedFix(String proposedFix) {
        this.proposedFix = proposedFix;
    }

    public String getFixType() {
        return fixType;
    }

    public void setFixType(String fixType) {
        this.fixType = fixType;
    }

    public String getRiskNote() {
        return riskNote;
    }

    public void setRiskNote(String riskNote) {
        this.riskNote = riskNote;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }
}
