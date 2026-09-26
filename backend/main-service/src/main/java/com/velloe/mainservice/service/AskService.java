package com.velloe.mainservice.service;

import com.velloe.mainservice.dto.AskResponse;
import com.velloe.mainservice.dto.ScoredDocument;
import com.velloe.mainservice.service.llm.LlmService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AskService {

    private static final String SYSTEM_PROMPT =
            "Answer using only the provided documents. Cite which document (by title) supports each claim. " +
            "If the documents don't answer the question, say so.";

    private final Bm25Service bm25Service;
    private final LlmService llmService;

    public AskService(Bm25Service bm25Service, LlmService llmService) {
        this.bm25Service = bm25Service;
        this.llmService = llmService;
    }

    public AskResponse ask(String question) {
        if (question == null || question.isBlank()) {
            return new AskResponse("Please provide a valid question.", List.of(), List.of());
        }

        List<ScoredDocument> topDocs = bm25Service.search(question, 5);

        if (topDocs.isEmpty()) {
            return new AskResponse(
                    "The provided internal documents do not contain sufficient evidence to answer this question.",
                    List.of(),
                    List.of()
            );
        }

        StringBuilder contextBuilder = new StringBuilder();
        for (int i = 0; i < topDocs.size(); i++) {
            ScoredDocument doc = topDocs.get(i);
            contextBuilder.append(String.format("--- Document %d: \"%s\" [%s] (BM25 score: %.2f) ---\n%s\n\n",
                    i + 1, doc.getTitle(), doc.getType(), doc.getScore(), doc.getContent()));
        }

        String userPrompt = "Provided Documents:\n" + contextBuilder + "\nQuestion: " + question;
        String answer = llmService.complete(SYSTEM_PROMPT, userPrompt);

        List<String> citedTitles = new ArrayList<>();
        for (ScoredDocument doc : topDocs) {
            String title = doc.getTitle();
            if (answer != null && (answer.toLowerCase().contains(title.toLowerCase()) || 
                    answer.toLowerCase().contains(title.split(" ")[0].toLowerCase()))) {
                if (!citedTitles.contains(title)) {
                    citedTitles.add(title);
                }
            }
        }

        if (citedTitles.isEmpty() && !topDocs.isEmpty()) {
            citedTitles.add(topDocs.get(0).getTitle());
        }

        return new AskResponse(answer, citedTitles, topDocs);
    }
}
