package com.zoneBlog.blog.exception;

// Resource not found (User, Post, Comment, etc.)
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}