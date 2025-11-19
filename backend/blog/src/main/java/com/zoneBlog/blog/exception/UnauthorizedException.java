package com.zoneBlog.blog.exception;

// Unauthorized access
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}


