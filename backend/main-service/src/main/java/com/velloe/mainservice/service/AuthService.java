package com.velloe.mainservice.service;

import com.velloe.mainservice.dto.AuthUser;
import com.velloe.mainservice.dto.LoginRequest;
import com.velloe.mainservice.dto.LoginResponse;
import com.velloe.mainservice.model.UserRole;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    // In-memory token → user store (persona-switcher, no DB needed)
    private final Map<String, AuthUser> activeTokens = new ConcurrentHashMap<>();

    // Static persona registry matching frontend PERSONAS constant
    private static final List<AuthUser> ALL_PERSONAS = List.of(
        new AuthUser("admin", "admin", "SRE Admin", "sre-oncall@corp.internal",
            UserRole.ADMIN, "Site Reliability Lead", "sre-lead",
            "Platform Infrastructure & Reliability", "⚡",
            List.of(),
            List.of(),
            List.of("ACCESS_ALL_TICKETS","APPROVE_REMEDIATION","REJECT_REMEDIATION",
                    "VIEW_TRACES","VIEW_CONNECTORS","SEARCH_CORPUS","MANAGE_PIPELINE")),

        new AuthUser("rohan", "rohan", "Rohan Sharma", "rohan.sharma@corp.internal",
            UserRole.EMPLOYEE, "Billing Analyst", "billing-analyst",
            "Finance & Invoicing", "RS",
            List.of("billing.view"),
            List.of("billing.read"),
            List.of("VIEW_OWN_TICKETS","CREATE_TICKET","SEARCH_CORPUS","VIEW_OWN_PERMISSIONS")),

        new AuthUser("alex", "alex", "Alex Chen", "alex.chen@corp.internal",
            UserRole.EMPLOYEE, "Senior Engineer", "senior-engineer",
            "Event Platform Engineering", "AC",
            List.of("events.read","kafka.consume"),
            List.of(),
            List.of("VIEW_OWN_TICKETS","CREATE_TICKET","SEARCH_CORPUS","VIEW_OWN_PERMISSIONS")),

        new AuthUser("sam", "sam", "Sam Jenkins", "sam.jenkins@corp.internal",
            UserRole.EMPLOYEE, "DevOps Lead", "devops-lead",
            "Cloud Operations", "SJ",
            List.of("infra.read","logs.view"),
            List.of(),
            List.of("VIEW_OWN_TICKETS","CREATE_TICKET","SEARCH_CORPUS","VIEW_OWN_PERMISSIONS")),

        new AuthUser("marcus", "marcus", "Marcus Vance", "marcus.vance@corp.internal",
            UserRole.EMPLOYEE, "Security Auditor", "security-auditor",
            "InfoSec Compliance", "MV",
            List.of("audit.read","compliance.view"),
            List.of(),
            List.of("VIEW_OWN_TICKETS","CREATE_TICKET","SEARCH_CORPUS","VIEW_OWN_PERMISSIONS"))
    );

    private static final Map<String, AuthUser> PERSONA_MAP;
    static {
        PERSONA_MAP = new HashMap<>();
        for (AuthUser u : ALL_PERSONAS) {
            PERSONA_MAP.put(u.getId(), u);
            PERSONA_MAP.put(u.getUsername(), u);
        }
        // backward-compat aliases
        PERSONA_MAP.put("priya", PERSONA_MAP.get("rohan"));
        PERSONA_MAP.put("sarah", PERSONA_MAP.get("sam"));
    }

    public LoginResponse login(LoginRequest request) {
        String identifier = request.getUsername();
        if (identifier == null || identifier.isBlank()) {
            identifier = "admin";
        }

        AuthUser user = PERSONA_MAP.get(identifier.trim().toLowerCase());
        if (user == null) {
            LoginResponse fail = new LoginResponse();
            fail.setSuccess(false);
            fail.setMessage("Unknown persona: " + identifier);
            return fail;
        }

        String token = "velloe_auth_" + UUID.randomUUID().toString().replace("-", "");
        activeTokens.put(token, user);

        LoginResponse response = new LoginResponse();
        response.setSuccess(true);
        response.setToken(token);
        response.setUser(user);
        response.setMessage("Authentication successful");
        return response;
    }

    public Optional<AuthUser> validateToken(String authHeader) {
        if (authHeader == null || authHeader.isBlank()) return Optional.empty();
        String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
        return Optional.ofNullable(activeTokens.get(token));
    }

    public boolean logout(String authHeader) {
        if (authHeader == null || authHeader.isBlank()) return false;
        String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
        return activeTokens.remove(token) != null;
    }

    public List<AuthUser> getAllUsers() {
        return ALL_PERSONAS;
    }
}
