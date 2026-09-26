package com.velloe.mainservice.repository;

import com.velloe.mainservice.model.TraceRef;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TraceRefRepository extends JpaRepository<TraceRef, UUID> {
    Optional<TraceRef> findByTicketId(UUID ticketId);
    List<TraceRef> findByService(String service);
}
