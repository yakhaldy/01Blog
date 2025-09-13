package com.zoneBlog.blog.controller;

import com.zoneBlog.blog.dataTransferObj.LoginRequest;
import com.zoneBlog.blog.dataTransferObj.RegisterRequest;
import com.zoneBlog.blog.model.User;
import com.zoneBlog.blog.repository.UserRepository;

import java.util.HashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import com.zoneBlog.blog.security.JwtUtil;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    public AuthController(AuthenticationManager authenticationManager, UserRepository userRepository, JwtUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
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


    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        String email = request.getEmail();
        String password = request.getPassword();

        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password));

            String token = jwtUtil.generateToken(email);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Login successful!");
            response.put("token", token);
            response.put("user", auth.getName());

            return ResponseEntity.ok(response);

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Something went wrong: " + e.getMessage()));
        }
    }

    @GetMapping("/getMydata")
public ResponseEntity<?> getCurrentUser(Authentication authentication) {
    // if (authentication == null || !authentication.isAuthenticated()) {
    //     return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    // }

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
// return ResponseEntity.status(500).body(Map.of("error", "test error"));

    return ResponseEntity.ok(response);
}


}
