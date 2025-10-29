package com.zoneBlog.blog.dataTransferObj;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

class ProfileUpdateRequest {
    @NotBlank(message = "Username is required")
    @Size(max = 30, message = "Username cannot exceed 30 characters")
    private String username;

    @Size(max = 200, message = "Bio cannot exceed 200 characters")
    private String bio;

    // Getters and setters
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
}
