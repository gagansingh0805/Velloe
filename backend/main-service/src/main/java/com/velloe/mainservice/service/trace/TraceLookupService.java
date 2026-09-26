package com.velloe.mainservice.service.trace;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.velloe.mainservice.dto.TraceLookupResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class TraceLookupService {

    private static final Logger log = LoggerFactory.getLogger(TraceLookupService.class);

    @Value("${jaeger.query.url:http://localhost:16686}")
    private String jaegerBaseUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    public TraceLookupResult findTrace(String employeeId, String service, Instant timeWindowStart, Instant timeWindowEnd) {
        if (service == null || service.isBlank()) {
            service = "billing-api";
        }

        try {
            StringBuilder urlBuilder = new StringBuilder(jaegerBaseUrl).append("/api/traces?");
            urlBuilder.append("service=").append(URLEncoder.encode(service, StandardCharsets.UTF_8));

            if (employeeId != null && !employeeId.isBlank()) {
                String tagsJson = String.format("{\"employee.id\":\"%s\"}", employeeId);
                urlBuilder.append("&tags=").append(URLEncoder.encode(tagsJson, StandardCharsets.UTF_8));
            }

            if (timeWindowStart != null) {
                long startMicros = timeWindowStart.getEpochSecond() * 1_000_000L + timeWindowStart.getNano() / 1_000L;
                urlBuilder.append("&start=").append(startMicros);
            }

            if (timeWindowEnd != null) {
                long endMicros = timeWindowEnd.getEpochSecond() * 1_000_000L + timeWindowEnd.getNano() / 1_000L;
                urlBuilder.append("&end=").append(endMicros);
            }

            urlBuilder.append("&limit=10");

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(urlBuilder.toString()))
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.warn("Jaeger query returned HTTP {}: {}", response.statusCode(), response.body());
                return TraceLookupResult.notFound();
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode dataNode = root.get("data");

            if (dataNode == null || !dataNode.isArray() || dataNode.isEmpty()) {
                log.info("No traces found in Jaeger for service='{}', employee='{}'", service, employeeId);
                return TraceLookupResult.notFound();
            }

            // Extract the first span with error=true in its tags
            for (JsonNode traceNode : dataNode) {
                String traceId = traceNode.path("traceID").asText();
                JsonNode spansNode = traceNode.get("spans");
                if (spansNode != null && spansNode.isArray()) {
                    for (JsonNode spanNode : spansNode) {
                        Map<String, Object> tagsMap = parseTags(spanNode.get("tags"));
                        boolean hasError = Boolean.TRUE.equals(tagsMap.get("error"))
                                || "true".equalsIgnoreCase(String.valueOf(tagsMap.get("error")));

                        if (hasError) {
                            String spanName = spanNode.path("operationName").asText();
                            long durationMicros = spanNode.path("duration").asLong(0);
                            double durationMs = durationMicros / 1000.0;

                            Object status = tagsMap.get("http.response.status_code");
                            if (status == null) {
                                status = tagsMap.get("http.status_code");
                            }
                            if (status == null) {
                                status = tagsMap.get("otel.status_code");
                            }
                            if (status == null) {
                                status = 500;
                            }

                            String jaegerUrl = jaegerBaseUrl + "/trace/" + traceId;

                            log.info("Found error span '{}' in trace '{}' (status: {})", spanName, traceId, status);
                            return new TraceLookupResult(
                                    true,
                                    traceId,
                                    service,
                                    spanName,
                                    status,
                                    durationMs,
                                    tagsMap,
                                    jaegerUrl
                            );
                        }
                    }
                }
            }

            log.info("No error=true spans found in matching traces for service '{}'", service);
            return TraceLookupResult.notFound();

        } catch (Exception e) {
            log.error("Failed to query Jaeger trace: {}", e.getMessage());
            return TraceLookupResult.notFound();
        }
    }

    private Map<String, Object> parseTags(JsonNode tagsNode) {
        Map<String, Object> tags = new HashMap<>();
        if (tagsNode != null && tagsNode.isArray()) {
            for (JsonNode tag : tagsNode) {
                String key = tag.path("key").asText();
                String type = tag.path("type").asText();
                if ("bool".equalsIgnoreCase(type)) {
                    tags.put(key, tag.path("value").asBoolean());
                } else if ("int64".equalsIgnoreCase(type)) {
                    tags.put(key, tag.path("value").asLong());
                } else if ("float64".equalsIgnoreCase(type)) {
                    tags.put(key, tag.path("value").asDouble());
                } else {
                    tags.put(key, tag.path("value").asText());
                }
            }
        }
        return tags;
    }
}
