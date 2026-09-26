package com.velloe.mainservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class CorrelationResult {

    @JsonProperty("root_cause_hypothesis")
    private String rootCauseHypothesis;

    @JsonProperty("supporting_evidence")
    private List<String> supportingEvidence;

    private Double confidence;

    @JsonProperty("evidence_sufficient")
    private Boolean evidenceSufficient;

    public CorrelationResult() {
    }

    public CorrelationResult(String rootCauseHypothesis, List<String> supportingEvidence,
                             Double confidence, Boolean evidenceSufficient) {
        this.rootCauseHypothesis = rootCauseHypothesis;
        this.supportingEvidence = supportingEvidence;
        this.confidence = confidence;
        this.evidenceSufficient = evidenceSufficient;
    }

    public String getRootCauseHypothesis() {
        return rootCauseHypothesis;
    }

    public void setRootCauseHypothesis(String rootCauseHypothesis) {
        this.rootCauseHypothesis = rootCauseHypothesis;
    }

    public List<String> getSupportingEvidence() {
        return supportingEvidence;
    }

    public void setSupportingEvidence(List<String> supportingEvidence) {
        this.supportingEvidence = supportingEvidence;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public Boolean getEvidenceSufficient() {
        return evidenceSufficient;
    }

    public void setEvidenceSufficient(Boolean evidenceSufficient) {
        this.evidenceSufficient = evidenceSufficient;
    }
}
