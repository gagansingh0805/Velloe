package com.velloe.mainservice.service.llm;

public interface LlmService {
    String complete(String systemPrompt, String userPrompt);
}
