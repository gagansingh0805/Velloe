package com.velloe.mainservice.dto;

import com.velloe.mainservice.model.UserRole;
import java.util.List;

public class AuthUser {
    private String id;
    private String username;
    private String name;
    private String email;
    private UserRole role;
    private String title;
    private String roleTitle;
    private String department;
    private String avatar;
    private List<String> activeScopes;
    private List<String> missingScopes;
    private List<String> permissions;

    public AuthUser() {}

    public AuthUser(String id, String username, String name, String email, UserRole role, 
                    String title, String roleTitle, String department, String avatar, 
                    List<String> activeScopes, List<String> missingScopes, List<String> permissions) {
        this.id = id;
        this.username = username;
        this.name = name;
        this.email = email;
        this.role = role;
        this.title = title;
        this.roleTitle = roleTitle;
        this.department = department;
        this.avatar = avatar;
        this.activeScopes = activeScopes;
        this.missingScopes = missingScopes;
        this.permissions = permissions;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getRoleTitle() {
        return roleTitle;
    }

    public void setRoleTitle(String roleTitle) {
        this.roleTitle = roleTitle;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public List<String> getActiveScopes() {
        return activeScopes;
    }

    public void setActiveScopes(List<String> activeScopes) {
        this.activeScopes = activeScopes;
    }

    public List<String> getMissingScopes() {
        return missingScopes;
    }

    public void setMissingScopes(List<String> missingScopes) {
        this.missingScopes = missingScopes;
    }

    public List<String> getPermissions() {
        return permissions;
    }

    public void setPermissions(List<String> permissions) {
        this.permissions = permissions;
    }
}
