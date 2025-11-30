package com.zoneBlog.blog.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.zoneBlog.blog.dataTransferObj.LoginRequest;
import com.zoneBlog.blog.exception.BannedUserException;
import com.zoneBlog.blog.exception.ResourceNotFoundException;
import com.zoneBlog.blog.model.User;
import com.zoneBlog.blog.repository.UserRepository;
import com.zoneBlog.blog.security.JwtUtil;

@Service
public class Login {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public Login(AuthenticationManager authenticationManager,
            JwtUtil jwtUtil,
            UserRepository userRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    public String login(LoginRequest request) {
        String email = request.getEmail().trim();
        String password = request.getPassword();

        // Authenticate user
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password));

        // Check if user is banned
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (Boolean.TRUE.equals(user.getIsBanned())) {
            throw new BannedUserException("Your account has been banned");
        }

        // Generate and return JWT token with ban status
        return jwtUtil.generateToken(email, user.getId());
    }
}