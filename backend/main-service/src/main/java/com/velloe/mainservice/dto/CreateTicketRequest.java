package com.velloe.mainservice.dto;

public class CreateTicketRequest {
    private String title;
    private String description;
    private String employeeId;

    public CreateTicketRequest() {}

    public CreateTicketRequest(String title, String description, String employeeId) {
        this.title = title;
        this.description = description;
        this.employeeId = employeeId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }
}
