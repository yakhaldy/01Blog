package com.zoneBlog.blog.exception;

// Banned user attempting access
public class BannedUserException extends RuntimeException {
    public BannedUserException(String message) {
        super(message);
    }
}