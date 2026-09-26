package com.velloe.mainservice.controller;

import com.velloe.mainservice.model.ChangeLogEntry;
import com.velloe.mainservice.repository.ChangeLogEntryRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/changelog")
public class ChangeLogController {

    private final ChangeLogEntryRepository changeLogEntryRepository;

    public ChangeLogController(ChangeLogEntryRepository changeLogEntryRepository) {
        this.changeLogEntryRepository = changeLogEntryRepository;
    }

    @GetMapping
    public List<ChangeLogEntry> getChangeLogs() {
        return changeLogEntryRepository.findAll();
    }
}
