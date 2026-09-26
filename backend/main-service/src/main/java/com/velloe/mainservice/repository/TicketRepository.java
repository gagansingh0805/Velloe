package com.velloe.mainservice.repository;

import com.velloe.mainservice.model.Ticket;
import com.velloe.mainservice.model.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    List<Ticket> findAllByOrderByCreatedAtDesc();
    List<Ticket> findByEmployeeId(String employeeId);
    List<Ticket> findByStatus(TicketStatus status);
}
