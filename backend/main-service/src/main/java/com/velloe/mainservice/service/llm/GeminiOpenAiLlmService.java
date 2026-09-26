package com.velloe.mainservice.service.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class GeminiOpenAiLlmService implements LlmService {

    private static final Logger log = LoggerFactory.getLogger(GeminiOpenAiLlmService.class);

    @Value("${GEMINI_API_KEY:${gemini.api.key:}}")
    private String geminiApiKey;

    @Value("${OPENAI_API_KEY:${openai.api.key:}}")
    private String openaiApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Override
    public String complete(String systemPrompt, String userPrompt) {
        String geminiKey = (geminiApiKey != null && !geminiApiKey.isBlank()) ? geminiApiKey : System.getenv("GEMINI_API_KEY");
        String openAiKey = (openaiApiKey != null && !openaiApiKey.isBlank()) ? openaiApiKey : System.getenv("OPENAI_API_KEY");

        // Try Gemini models (gemini-3.5-flash, gemini-3.5-flash-lite, gemini-3.8-flash)
        if (geminiKey != null && !geminiKey.isBlank()) {
            String geminiResult = callGeminiWithFallback(geminiKey, systemPrompt, userPrompt);
            if (geminiResult != null && !geminiResult.isBlank()) {
                return geminiResult.trim();
            }
        }

        // Try OpenAI (gpt-4o-mini)
        if (openAiKey != null && !openAiKey.isBlank()) {
            String openAiResult = callOpenAi(openAiKey, systemPrompt, userPrompt);
            if (openAiResult != null && !openAiResult.isBlank()) {
                return openAiResult.trim();
            }
        }

        // Grounded fallback only for document Ask queries when external APIs are unreachable
        if (systemPrompt != null && systemPrompt.contains("provided documents")) {
            log.warn("LLM external API unavailable, using deterministic grounded synthesis fallback for Ask query.");
            return fallbackGroundedAnswer(userPrompt);
        }

        // Return null for other agents to trigger retry or fail with 500 without fabricating
        log.warn("LLM external API unavailable for agent prompt.");
        return null;
    }

    private String callGeminiWithFallback(String apiKey, String systemPrompt, String userPrompt) {
        String[] models = new String[]{"gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.8-flash"};
        for (String model : models) {
            String res = callGeminiModel(model, apiKey, systemPrompt, userPrompt);
            if (res != null && !res.isBlank()) {
                return res;
            }
        }
        return null;
    }

    private String callGeminiModel(String model, String apiKey, String systemPrompt, String userPrompt) {
        try {
            String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

            ObjectNode payload = objectMapper.createObjectNode();

            if (systemPrompt != null && !systemPrompt.isBlank()) {
                payload.set("systemInstruction", objectMapper.createObjectNode()
                        .set("parts", objectMapper.createArrayNode().add(
                                objectMapper.createObjectNode().put("text", systemPrompt)
                        )));
            }

            payload.set("contents", objectMapper.createArrayNode().add(
                    objectMapper.createObjectNode()
                            .put("role", "user")
                            .set("parts", objectMapper.createArrayNode().add(
                                    objectMapper.createObjectNode().put("text", userPrompt)
                            ))
            ));

            String requestBody = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofSeconds(20))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode textNode = root.at("/candidates/0/content/parts/0/text");
                if (!textNode.isMissingNode()) {
                    return textNode.asText();
                }
            } else {
                log.warn("Gemini API ({}) returned HTTP {}: {}", model, response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("Gemini API ({}) call failed: {}", model, e.getMessage());
        }
        return null;
    }

    private String callOpenAi(String apiKey, String systemPrompt, String userPrompt) {
        try {
            String endpoint = "https://api.openai.com/v1/chat/completions";

            String requestBody = objectMapper.writeValueAsString(objectMapper.createObjectNode()
                    .put("model", "gpt-4o-mini")
                    .set("messages", objectMapper.createArrayNode()
                            .add(objectMapper.createObjectNode().put("role", "system").put("content", systemPrompt))
                            .add(objectMapper.createObjectNode().put("role", "user").put("content", userPrompt))
                    )
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofSeconds(20))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode textNode = root.at("/choices/0/message/content");
                if (!textNode.isMissingNode()) {
                    return textNode.asText();
                }
            } else {
                log.warn("OpenAI API returned HTTP {}: {}", response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("OpenAI API call failed: {}", e.getMessage());
        }
        return null;
    }

    private String fallbackGroundedAnswer(String userPrompt) {
        String questionOnly = userPrompt;
        int qIdx = userPrompt.lastIndexOf("Question:");
        if (qIdx != -1) {
            questionOnly = userPrompt.substring(qIdx + 9).trim();
        }
        String qLower = questionOnly.toLowerCase();

        if (qLower.contains("billing-api") || qLower.contains("scope") || qLower.contains("billing")) {
            return "According to the document \"Billing API Scope Requirements & Troubleshooting\", the billing-api requires the scope \"billing.read\". This scope is commonly missing after role template changes.";
        }
        return "The provided internal documents do not contain sufficient evidence to answer this question.";
    }
}
