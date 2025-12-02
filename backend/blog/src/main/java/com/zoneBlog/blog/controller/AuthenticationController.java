package com.zoneBlog.blog.controller;

import com.zoneBlog.blog.dataTransferObj.LoginRequest;
import com.zoneBlog.blog.dataTransferObj.RegisterRequest;
import com.zoneBlog.blog.service.Login;
import com.zoneBlog.blog.service.Register;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;


@RestController
@RequestMapping("/api/auth")
// @CrossOrigin(origins = "http://localhost:4200")
public class AuthenticationController {

    private final Login loginService;
    private final Register registerService;

    public AuthenticationController(Login loginService, Register registerService) {
        this.loginService = loginService;
        this.registerService = registerService;
    }


    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        String token = loginService.login(request);
        return ResponseEntity.ok(Map.of(
                "message", "Login successful",
                "token", token));
    }


    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        registerService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Registration successful"));
    }
}
