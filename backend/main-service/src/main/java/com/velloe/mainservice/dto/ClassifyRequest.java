package com.velloe.mainservice.dto;

public class ClassifyRequest {
    private String description;
    private String role;
    private String employeeId;

    public ClassifyRequest() {
    }

    public ClassifyRequest(String description, String role, String employeeId) {
        this.description = description;
        this.role = role;
        this.employeeId = employeeId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }
}
