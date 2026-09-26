package com.velloe.mainservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ClassificationResult {
    private String category;
    private Double confidence;

    @JsonProperty("needs_doc_search")
    private Boolean needsDocSearch;

    @JsonProperty("needs_trace_lookup")
    private Boolean needsTraceLookup;

    @JsonProperty("needs_permission_check")
    private Boolean needsPermissionCheck;

    private String reasoning;

    public ClassificationResult() {
    }

    public ClassificationResult(String category, Double confidence, Boolean needsDocSearch,
                                Boolean needsTraceLookup, Boolean needsPermissionCheck, String reasoning) {
        this.category = category;
        this.confidence = confidence;
        this.needsDocSearch = needsDocSearch;
        this.needsTraceLookup = needsTraceLookup;
        this.needsPermissionCheck = needsPermissionCheck;
        this.reasoning = reasoning;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public Boolean getNeedsDocSearch() {
        return needsDocSearch;
    }

    public void setNeedsDocSearch(Boolean needsDocSearch) {
        this.needsDocSearch = needsDocSearch;
    }

    public Boolean getNeedsTraceLookup() {
        return needsTraceLookup;
    }

    public void setNeedsTraceLookup(Boolean needsTraceLookup) {
        this.needsTraceLookup = needsTraceLookup;
    }

    public Boolean getNeedsPermissionCheck() {
        return needsPermissionCheck;
    }

    public void setNeedsPermissionCheck(Boolean needsPermissionCheck) {
        this.needsPermissionCheck = needsPermissionCheck;
    }

    public String getReasoning() {
        return reasoning;
    }

    public void setReasoning(String reasoning) {
        this.reasoning = reasoning;
    }
}
