package com.zoneBlog.blog.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.zoneBlog.blog.dataTransferObj.RegisterRequest;
import com.zoneBlog.blog.exception.BusinessException;
import com.zoneBlog.blog.exception.DuplicateResourceException;
import com.zoneBlog.blog.model.User;
import com.zoneBlog.blog.repository.UserRepository;

@Service
public class Register {

    private static final String DEFAULT_USER_ROLE = "ROLE_USER";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public Register(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User register(RegisterRequest request) {
        String email = request.getEmail().trim();
        String username = request.getUsername().trim();

        // Check for existing email
        if (userRepository.findByEmail(email).isPresent()) {
            throw new DuplicateResourceException("Email already exists");
        }

        // Check for existing username
        if (userRepository.findByUsername(username).isPresent()) {
            throw new DuplicateResourceException("Username already exists");
        }

        // Validate password match
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BusinessException("Passwords do not match");
        }

        // Create and save user
        User user = createUser(username, email, request.getPassword());
        return userRepository.save(user);
    }

    private User createUser(String username, String email, String password) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(DEFAULT_USER_ROLE);
        user.setIsBanned(false);
        return user;
    }
}