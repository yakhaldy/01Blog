package com.zoneBlog.blog.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

import com.zoneBlog.blog.dataTransferObj.LoginRequest;
import com.zoneBlog.blog.security.JwtUtil;

@Service
public class Login {

    @Autowired
    public AuthenticationManager authenticationManager;
    @Autowired
    public JwtUtil jwtUtil;

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
}
