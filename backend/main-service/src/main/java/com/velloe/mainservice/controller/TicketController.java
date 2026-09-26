package com.velloe.mainservice.controller;

import com.velloe.mainservice.dto.CreateTicketRequest;
import com.velloe.mainservice.dto.TicketExplanationResponse;
import com.velloe.mainservice.model.AgentStep;
import com.velloe.mainservice.model.Ticket;
import com.velloe.mainservice.model.TicketStatus;
import com.velloe.mainservice.repository.AgentStepRepository;
import com.velloe.mainservice.repository.TicketRepository;
import com.velloe.mainservice.service.TicketExplanationService;
import com.velloe.mainservice.service.pipeline.TicketPipelineService;
import com.velloe.mainservice.service.sse.TicketSseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*")
public class TicketController {

    private final TicketRepository ticketRepository;
    private final AgentStepRepository agentStepRepository;
    private final TicketPipelineService ticketPipelineService;
    private final TicketSseService ticketSseService;
    private final TicketExplanationService ticketExplanationService;

    public TicketController(TicketRepository ticketRepository,
                            AgentStepRepository agentStepRepository,
                            TicketPipelineService ticketPipelineService,
                            TicketSseService ticketSseService,
                            TicketExplanationService ticketExplanationService) {
        this.ticketRepository = ticketRepository;
        this.agentStepRepository = agentStepRepository;
        this.ticketPipelineService = ticketPipelineService;
        this.ticketSseService = ticketSseService;
        this.ticketExplanationService = ticketExplanationService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Ticket createTicket(@RequestBody CreateTicketRequest request) {
        Ticket ticket = new Ticket();
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setEmployeeId(request.getEmployeeId());
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setCreatedAt(Instant.now());
        ticket.setUpdatedAt(Instant.now());
        Ticket saved = ticketRepository.save(ticket);

        // Asynchronously kick off the agent pipeline without blocking HTTP response
        ticketPipelineService.executePipeline(saved.getId());

        return saved;
    }

    @GetMapping
    public List<Ticket> getAllTickets(@RequestParam(required = false) String employeeId) {
        if (employeeId != null && !employeeId.isBlank()) {
            return ticketRepository.findByEmployeeId(employeeId);
        }
        return ticketRepository.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/{id}")
    public Ticket getTicketById(@PathVariable UUID id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found: " + id));
    }

    @GetMapping("/{id}/steps")
    public List<AgentStep> getTicketSteps(@PathVariable UUID id) {
        return agentStepRepository.findByTicketIdOrderByStartedAtAsc(id);
    }

    @GetMapping(value = "/{id}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamTicket(@PathVariable UUID id) {
        return ticketSseService.subscribe(id);
    }

    @PatchMapping("/{id}/approve")
    public Ticket approveTicket(@PathVariable UUID id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found: " + id));
        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setUpdatedAt(Instant.now());
        return ticketRepository.save(ticket);
    }

    @PatchMapping("/{id}/reject")
    public Ticket rejectTicket(@PathVariable UUID id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found: " + id));
        ticket.setStatus(TicketStatus.REJECTED);
        ticket.setUpdatedAt(Instant.now());
        return ticketRepository.save(ticket);
    }

    @GetMapping("/{id}/explain")
    public TicketExplanationResponse explainTicket(@PathVariable UUID id) {
        return ticketExplanationService.explainTicket(id);
    }
}
