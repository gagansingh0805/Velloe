package com.velloe.mainservice.service;

import com.velloe.mainservice.dto.ScoredDocument;
import com.velloe.mainservice.model.Document;
import com.velloe.mainservice.repository.DocumentRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class Bm25Service {

    private static final double K1 = 1.2;
    private static final double B = 0.75;
    private static final Pattern WORD_SPLIT = Pattern.compile("[\\s,;:.?!()\"'/\\[\\]{}]+");

    private final DocumentRepository documentRepository;

    public Bm25Service(DocumentRepository documentRepository) {
        this.documentRepository = documentRepository;
    }

    /**
     * Performs BM25 ranking over all documents.
     * Both the Ask endpoint and the Correlator agent call this same function.
     */
    public List<ScoredDocument> search(String query, int topK) {
        if (query == null || query.isBlank()) {
            return Collections.emptyList();
        }

        List<Document> allDocs = documentRepository.findAll();
        if (allDocs.isEmpty()) {
            return Collections.emptyList();
        }

        int N = allDocs.size();
        List<String> queryTerms = tokenize(query);
        if (queryTerms.isEmpty()) {
            return Collections.emptyList();
        }

        // Tokenize documents and calculate document lengths
        Map<UUID, List<String>> docTokens = new HashMap<>();
        Map<UUID, Map<String, Integer>> docTermFreqs = new HashMap<>();
        long totalLength = 0;

        for (Document doc : allDocs) {
            String combinedText = doc.getTitle() + " " + (doc.getContent() != null ? doc.getContent() : "");
            List<String> tokens = tokenize(combinedText);
            docTokens.put(doc.getId(), tokens);
            totalLength += tokens.size();

            Map<String, Integer> tf = new HashMap<>();
            for (String t : tokens) {
                tf.put(t, tf.getOrDefault(t, 0) + 1);
            }
            docTermFreqs.put(doc.getId(), tf);
        }

        double avgdl = (double) totalLength / N;

        // Calculate Document Frequency (n(q)) for each query term
        Map<String, Integer> docFreqs = new HashMap<>();
        for (String q : queryTerms) {
            int df = 0;
            for (Map<String, Integer> tf : docTermFreqs.values()) {
                if (tf.containsKey(q)) {
                    df++;
                }
            }
            docFreqs.put(q, df);
        }

        // Calculate BM25 score for each document
        List<ScoredDocument> scored = new ArrayList<>();

        for (Document doc : allDocs) {
            UUID docId = doc.getId();
            int docLen = docTokens.get(docId).size();
            Map<String, Integer> tfMap = docTermFreqs.get(docId);
            double score = 0.0;

            for (String q : queryTerms) {
                int n_q = docFreqs.getOrDefault(q, 0);
                if (n_q == 0) continue;

                int f_q = tfMap.getOrDefault(q, 0);
                if (f_q == 0) continue;

                // Robertson-Spärck Jones IDF with smoothing
                double idf = Math.log(1.0 + (N - n_q + 0.5) / (n_q + 0.5));

                // BM25 term weight
                double numerator = f_q * (K1 + 1.0);
                double denominator = f_q + K1 * (1.0 - B + B * ((double) docLen / avgdl));

                score += idf * (numerator / denominator);
            }

            if (score > 0.0) {
                scored.add(new ScoredDocument(doc, score));
            }
        }

        // Sort descending by score and limit to topK
        return scored.stream()
                .sorted(Comparator.comparingDouble(ScoredDocument::getScore).reversed())
                .limit(topK)
                .collect(Collectors.toList());
    }

    public List<String> tokenize(String text) {
        if (text == null || text.isBlank()) {
            return Collections.emptyList();
        }

        String[] rawTokens = WORD_SPLIT.split(text.toLowerCase());
        List<String> tokens = new ArrayList<>();

        for (String raw : rawTokens) {
            String clean = raw.replaceAll("[^a-z0-9_-]", "").trim();
            if (clean.length() >= 2) {
                tokens.add(clean);
                // If hyphenated like "billing-api", also add sub-words "billing" and "api"
                if (clean.contains("-")) {
                    for (String sub : clean.split("-")) {
                        if (sub.length() >= 2) {
                            tokens.add(sub);
                        }
                    }
                }
            }
        }

        return tokens;
    }
}
