package com.velloe.mainservice.repository;

import com.velloe.mainservice.model.ChangeLogEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChangeLogEntryRepository extends JpaRepository<ChangeLogEntry, UUID> {
    List<ChangeLogEntry> findAllByOrderByTimestampDesc();
    List<ChangeLogEntry> findByServiceOrderByTimestampDesc(String service);
}
