package com.velloe.mainservice.service.sse;

import com.velloe.mainservice.model.AgentName;
import com.velloe.mainservice.model.StepStatus;
import com.velloe.mainservice.model.TicketStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class TicketSseService {

    private static final Logger log = LoggerFactory.getLogger(TicketSseService.class);

    // Timeout: 5 minutes (300,000 ms)
    private static final long EMITTER_TIMEOUT = 5 * 60 * 1000L;

    private final Map<UUID, CopyOnWriteArrayList<SseEmitter>> emitterRegistry = new ConcurrentHashMap<>();

    public SseEmitter subscribe(UUID ticketId) {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT);

        emitter.onCompletion(() -> {
            log.debug("SSE completed for ticket {}", ticketId);
            removeEmitter(ticketId, emitter);
        });

        emitter.onTimeout(() -> {
            log.debug("SSE timed out for ticket {}", ticketId);
            emitter.complete();
            removeEmitter(ticketId, emitter);
        });

        emitter.onError((ex) -> {
            log.debug("SSE error for ticket {}: {}", ticketId, ex.getMessage());
            removeEmitter(ticketId, emitter);
        });

        emitterRegistry.computeIfAbsent(ticketId, k -> new CopyOnWriteArrayList<>()).add(emitter);
        log.info("Registered new SSE emitter for ticket: {}. Active emitters: {}",
                ticketId, emitterRegistry.get(ticketId).size());

        // Send initial connection event
        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data(Map.of(
                            "ticketId", ticketId.toString(),
                            "status", "CONNECTED",
                            "timestamp", Instant.now().toString()
                    )));
        } catch (Exception e) {
            removeEmitter(ticketId, emitter);
        }

        return emitter;
    }

    public void sendStepEvent(UUID ticketId, AgentName agentName, StepStatus status, Map<String, Object> parsedOutput) {
        List<SseEmitter> emitters = emitterRegistry.get(ticketId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("agentName", agentName.name());
        payload.put("status", status.name());
        payload.put("parsedOutput", parsedOutput);
        payload.put("timestamp", Instant.now().toString());

        log.info("Broadcasting SSE STEP_UPDATE for ticket {} [{} - {}]", ticketId, agentName, status);

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("STEP_UPDATE")
                        .data(payload));
            } catch (Exception e) {
                log.warn("Failed to send SSE event to an emitter for ticket {}: {}", ticketId, e.getMessage());
                emitter.completeWithError(e);
                removeEmitter(ticketId, emitter);
            }
        }
    }

    public void sendFinalTicketEvent(UUID ticketId, TicketStatus status) {
        List<SseEmitter> emitters = emitterRegistry.get(ticketId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("ticketId", ticketId.toString());
        payload.put("status", status.name());
        payload.put("timestamp", Instant.now().toString());

        log.info("Broadcasting final SSE TICKET_STATUS for ticket {} [{}]", ticketId, status);

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("TICKET_STATUS")
                        .data(payload));
                // Complete emitter cleanly upon reaching final/awaiting approval state
                emitter.complete();
            } catch (Exception e) {
                emitter.completeWithError(e);
            } finally {
                removeEmitter(ticketId, emitter);
            }
        }
    }

    private void removeEmitter(UUID ticketId, SseEmitter emitter) {
        List<SseEmitter> list = emitterRegistry.get(ticketId);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) {
                emitterRegistry.remove(ticketId);
            }
        }
    }
}
