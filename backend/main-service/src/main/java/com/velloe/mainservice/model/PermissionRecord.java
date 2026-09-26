package com.velloe.mainservice.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "permission_records")
public class PermissionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "employee_id", nullable = false)
    private String employeeId;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    private String service;

    @Column(nullable = false)
    private String scope;

    @Column(name = "granted_at", nullable = false)
    private Instant grantedAt;

    public PermissionRecord() {}

    public PermissionRecord(String employeeId, String role, String service, String scope, Instant grantedAt) {
        this.employeeId = employeeId;
        this.role = role;
        this.service = service;
        this.scope = scope;
        this.grantedAt = grantedAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getService() {
        return service;
    }

    public void setService(String service) {
        this.service = service;
    }

    public String getScope() {
        return scope;
    }

    public void setScope(String scope) {
        this.scope = scope;
    }

    public Instant getGrantedAt() {
        return grantedAt;
    }

    public void setGrantedAt(Instant grantedAt) {
        this.grantedAt = grantedAt;
    }
}
