package com.zoneBlog.blog.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import com.zoneBlog.blog.repository.UserRepository;
import org.springframework.stereotype.Service;


@Service
public class Profile {

    @Autowired
    private UserRepository userRepository;

     public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());
        response.put("bio", user.getBio());
        response.put("avatar", user.getAvatar());
        // return ResponseEntity.status(403).body(Map.of("error", "test error"));
        return ResponseEntity.ok(response);
    }
}
