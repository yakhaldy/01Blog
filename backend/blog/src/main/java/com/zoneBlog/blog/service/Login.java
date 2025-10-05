package com.zoneBlog.blog.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

import com.zoneBlog.blog.dataTransferObj.LoginRequest;
import com.zoneBlog.blog.model.User;
import com.zoneBlog.blog.repository.UserRepository;
import com.zoneBlog.blog.security.JwtUtil;

@Service
public class Login {

    @Autowired
    public AuthenticationManager authenticationManager;
    @Autowired
    public JwtUtil jwtUtil;
    @Autowired
    public UserRepository userRepository;

    public Map<String, Object> login(@RequestBody LoginRequest request) {
        String email = request.getEmail();
        String password = request.getPassword();

        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password));

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (user.getIsBanned()) {
                throw new RuntimeException("Your account is Banned.");
            }

            String token = jwtUtil.generateToken(email);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Login successful!");
            response.put("token", token);

            return response;

        } catch (BadCredentialsException e) {
            throw new RuntimeException("Invalid email or password");
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }
    }
}
