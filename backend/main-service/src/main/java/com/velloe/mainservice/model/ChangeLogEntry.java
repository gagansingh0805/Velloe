package com.velloe.mainservice.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "changelog_entries")
public class ChangeLogEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String service;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "pr_link")
    private String prLink;

    @Column(nullable = false)
    private Instant timestamp;

    public ChangeLogEntry() {}

    public ChangeLogEntry(String service, String description, String prLink, Instant timestamp) {
        this.service = service;
        this.description = description;
        this.prLink = prLink;
        this.timestamp = timestamp;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getService() {
        return service;
    }

    public void setService(String service) {
        this.service = service;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPrLink() {
        return prLink;
    }

    public void setPrLink(String prLink) {
        this.prLink = prLink;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
