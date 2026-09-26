package com.velloe.mainservice.repository;

import com.velloe.mainservice.model.AgentStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AgentStepRepository extends JpaRepository<AgentStep, UUID> {
    List<AgentStep> findByTicketIdOrderByStartedAtAsc(UUID ticketId);
}
