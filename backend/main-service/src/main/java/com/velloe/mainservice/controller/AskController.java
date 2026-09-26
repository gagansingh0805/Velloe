package com.velloe.mainservice.controller;

import com.velloe.mainservice.dto.AskRequest;
import com.velloe.mainservice.dto.AskResponse;
import com.velloe.mainservice.service.AskService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ask")
public class AskController {

    private final AskService askService;

    public AskController(AskService askService) {
        this.askService = askService;
    }

    @PostMapping
    public AskResponse ask(@RequestBody AskRequest request) {
        return askService.ask(request.getQuestion());
    }
}
