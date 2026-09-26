package com.velloe.mainservice.controller;

import com.velloe.mainservice.dto.ScoredDocument;
import com.velloe.mainservice.model.Document;
import com.velloe.mainservice.model.DocumentType;
import com.velloe.mainservice.repository.DocumentRepository;
import com.velloe.mainservice.service.Bm25Service;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/docs")
@CrossOrigin(origins = "*")
public class DocumentController {

    private final DocumentRepository documentRepository;
    private final Bm25Service bm25Service;

    public DocumentController(DocumentRepository documentRepository, Bm25Service bm25Service) {
        this.documentRepository = documentRepository;
        this.bm25Service = bm25Service;
    }

    @GetMapping
    public ResponseEntity<List<Document>> getAllDocs(@RequestParam(required = false) DocumentType type) {
        if (type != null) {
            return ResponseEntity.ok(documentRepository.findByType(type));
        }
        return ResponseEntity.ok(documentRepository.findAll());
    }

    /**
     * Requirement 2: GET /api/docs/search?q={query} returns top-k Documents with scores
     */
    @GetMapping("/search")
    public ResponseEntity<List<ScoredDocument>> searchDocs(
            @RequestParam("q") String query,
            @RequestParam(value = "k", defaultValue = "5") int topK
    ) {
        List<ScoredDocument> results = bm25Service.search(query, topK);
        return ResponseEntity.ok(results);
    }
}
