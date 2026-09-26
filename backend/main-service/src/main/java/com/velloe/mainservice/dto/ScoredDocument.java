package com.velloe.mainservice.dto;

import com.velloe.mainservice.model.Document;
import com.velloe.mainservice.model.DocumentType;

import java.util.UUID;

public class ScoredDocument {
    private UUID id;
    private String title;
    private DocumentType type;
    private String content;
    private double score;

    public ScoredDocument() {}

    public ScoredDocument(Document doc, double score) {
        this.id = doc.getId();
        this.title = doc.getTitle();
        this.type = doc.getType();
        this.content = doc.getContent();
        this.score = Math.round(score * 1000.0) / 1000.0;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public DocumentType getType() {
        return type;
    }

    public void setType(DocumentType type) {
        this.type = type;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public double getScore() {
        return score;
    }

    public void setScore(double score) {
        this.score = score;
    }
}
