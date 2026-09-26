package com.velloe.mainservice.dto;

import java.util.List;

public class AskResponse {
    private String answer;
    private List<String> citedDocuments;
    private List<ScoredDocument> retrievedDocuments;

    public AskResponse() {
    }

    public AskResponse(String answer, List<String> citedDocuments, List<ScoredDocument> retrievedDocuments) {
        this.answer = answer;
        this.citedDocuments = citedDocuments;
        this.retrievedDocuments = retrievedDocuments;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public List<String> getCitedDocuments() {
        return citedDocuments;
    }

    public void setCitedDocuments(List<String> citedDocuments) {
        this.citedDocuments = citedDocuments;
    }

    public List<ScoredDocument> getRetrievedDocuments() {
        return retrievedDocuments;
    }

    public void setRetrievedDocuments(List<ScoredDocument> retrievedDocuments) {
        this.retrievedDocuments = retrievedDocuments;
    }
}
