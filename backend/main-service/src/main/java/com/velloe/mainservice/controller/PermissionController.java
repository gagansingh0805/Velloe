package com.velloe.mainservice.controller;

import com.velloe.mainservice.model.PermissionRecord;
import com.velloe.mainservice.repository.PermissionRecordRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/permissions")
public class PermissionController {

    private final PermissionRecordRepository permissionRecordRepository;

    public PermissionController(PermissionRecordRepository permissionRecordRepository) {
        this.permissionRecordRepository = permissionRecordRepository;
    }

    @GetMapping("/{employeeId}")
    public List<PermissionRecord> getPermissionsByEmployee(@PathVariable String employeeId) {
        return permissionRecordRepository.findByEmployeeId(employeeId);
    }
}
