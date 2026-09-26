package com.velloe.mainservice.controller;

import com.velloe.mainservice.dto.ClassificationResult;
import com.velloe.mainservice.dto.ClassifyRequest;
import com.velloe.mainservice.dto.CorrelateRequest;
import com.velloe.mainservice.dto.CorrelationResult;
import com.velloe.mainservice.dto.ResolveRequest;
import com.velloe.mainservice.dto.ResolutionResult;
import com.velloe.mainservice.dto.TraceLookupResult;
import com.velloe.mainservice.service.agent.ClassifierAgentService;
import com.velloe.mainservice.service.agent.CorrelatorAgentService;
import com.velloe.mainservice.service.agent.ResolverAgentService;
import com.velloe.mainservice.service.trace.TraceLookupService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/agents")
@CrossOrigin(origins = "*")
public class AgentController {

    private final ClassifierAgentService classifierAgentService;
    private final CorrelatorAgentService correlatorAgentService;
    private final ResolverAgentService resolverAgentService;
    private final TraceLookupService traceLookupService;

    public AgentController(ClassifierAgentService classifierAgentService,
                           CorrelatorAgentService correlatorAgentService,
                           ResolverAgentService resolverAgentService,
                           TraceLookupService traceLookupService) {
        this.classifierAgentService = classifierAgentService;
        this.correlatorAgentService = correlatorAgentService;
        this.resolverAgentService = resolverAgentService;
        this.traceLookupService = traceLookupService;
    }

    @PostMapping("/classify")
    public ClassificationResult classify(@RequestBody ClassifyRequest request) {
        return classifierAgentService.classify(request);
    }

    @PostMapping("/correlate")
    public CorrelationResult correlate(@RequestBody CorrelateRequest request) {
        return correlatorAgentService.correlate(request);
    }

    @PostMapping("/resolve")
    public ResolutionResult resolve(@RequestBody ResolveRequest request) {
        return resolverAgentService.resolve(request);
    }

    @GetMapping("/trace/find")
    public TraceLookupResult findTrace(
            @RequestParam(required = false, defaultValue = "rohan") String employeeId,
            @RequestParam(required = false, defaultValue = "billing-api") String service,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant end) {
        return traceLookupService.findTrace(employeeId, service, start, end);
    }
}
