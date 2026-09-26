package com.velloe.mainservice.repository;

import com.velloe.mainservice.model.PermissionRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PermissionRecordRepository extends JpaRepository<PermissionRecord, UUID> {
    List<PermissionRecord> findByEmployeeId(String employeeId);
    List<PermissionRecord> findByEmployeeIdAndService(String employeeId, String service);
}
