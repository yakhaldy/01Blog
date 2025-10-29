package com.zoneBlog.blog.exception;

// Duplicate resource (email, username already exists)
public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}