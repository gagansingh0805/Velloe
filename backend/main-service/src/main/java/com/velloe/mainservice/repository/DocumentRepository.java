package com.velloe.mainservice.repository;

import com.velloe.mainservice.model.Document;
import com.velloe.mainservice.model.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {
    List<Document> findByType(DocumentType type);
}
