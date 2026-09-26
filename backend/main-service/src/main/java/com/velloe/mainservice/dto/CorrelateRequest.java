package com.velloe.mainservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class CorrelateRequest {

    private String description;

    @JsonProperty("classifierOutput")
    private ClassificationResult classifierOutput;

    private String employeeId;
    private String service;

    public CorrelateRequest() {
    }

    public CorrelateRequest(String description, ClassificationResult classifierOutput, String employeeId, String service) {
        this.description = description;
        this.classifierOutput = classifierOutput;
        this.employeeId = employeeId;
        this.service = service;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ClassificationResult getClassifierOutput() {
        return classifierOutput;
    }

    public void setClassifierOutput(ClassificationResult classifierOutput) {
        this.classifierOutput = classifierOutput;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getService() {
        return service;
    }

    public void setService(String service) {
        this.service = service;
    }
}
