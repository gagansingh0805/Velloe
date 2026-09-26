package com.velloe.mainservice.dto;

public class LoginResponse {
    private boolean success;
    private String token;
    private AuthUser user;
    private String message;

    public LoginResponse() {}

    public LoginResponse(boolean success, String token, AuthUser user, String message) {
        this.success = success;
        this.token = token;
        this.user = user;
        this.message = message;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public AuthUser getUser() {
        return user;
    }

    public void setUser(AuthUser user) {
        this.user = user;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
