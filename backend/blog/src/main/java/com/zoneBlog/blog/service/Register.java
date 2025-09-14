package com.zoneBlog.blog.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.RequestBody;

import com.zoneBlog.blog.dataTransferObj.RegisterRequest;
import com.zoneBlog.blog.model.User;
import com.zoneBlog.blog.repository.UserRepository;

import org.springframework.stereotype.Service;

@Service
public class Register  {

  @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
    try {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("error", "Email is required"));
        }
        
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("error", "Username is required"));
        }
        
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("error", "Password is required"));
        }
        
        if (request.getConfirmPassword() == null || request.getConfirmPassword().trim().isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("error", "Confirm password is required"));
        }
        
        // Check for existing users
        if (userRepository.findByEmail(request.getEmail().trim()).isPresent()) {
            return ResponseEntity.status(400).body(Map.of("error", "Email already exists!"));
        }
        
        if (userRepository.findByUsername(request.getUsername().trim()).isPresent()) {
            return ResponseEntity.status(400).body(Map.of("error", "Username already exists!"));
        }
        
        // Check password match
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.status(400).body(Map.of("error", "Passwords do not match"));
        }

        // Create and save user
        User user = new User();
        user.setUsername(request.getUsername().trim());
        user.setEmail(request.getEmail().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("ROLE_USER");

        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Register successful!"));
        
    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(500).body(Map.of("error", "Internal server error: " + e.getMessage()));
    }
}
}
