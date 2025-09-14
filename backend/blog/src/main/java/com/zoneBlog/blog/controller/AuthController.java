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
import com.zoneBlog.blog.service.Login;
import com.zoneBlog.blog.service.Register;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private Register r;

    @PostMapping("/register")
    private ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        return r.register(request);
    }

    @Autowired
    private Login l;

    @PostMapping("/login")
    private ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return l.login(request);
    }

    @GetMapping("/getMydata")
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
        // return ResponseEntity.status(500).body(Map.of("error", "test error"));
        return ResponseEntity.ok(response);
    }

}
