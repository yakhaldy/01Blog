package com.zoneBlog.blog.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;

import com.zoneBlog.blog.model.User;
import com.zoneBlog.blog.repository.FollowRepository;
import com.zoneBlog.blog.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class Profile {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private FollowRepository followRepository;
    @Autowired
    private Helper helper;

    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        User user = helper.getCurrentUser(authentication);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());
        response.put("bio", user.getBio());
        response.put("avatar", user.getAvatar());
        response.put("followingCount", user.getFollowing());
        response.put("followersCount", user.getFollowers());

        // return ResponseEntity.status(403).body(Map.of("error", "test error"));
        return ResponseEntity.ok(response);
    }

    public ResponseEntity<?> getInfoUser(Authentication authentication, String username) {
        User currentUser = helper.getCurrentUser(authentication);
        if (currentUser == null) {
            throw new RuntimeException("User not found");
        }
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());
        response.put("bio", user.getBio());
        response.put("avatar", user.getAvatar());
        response.put("followingCount", user.getFollowing());
        response.put("followersCount", user.getFollowers());
        boolean isFollowing = followRepository.existsByFollower_IdAndFollowing_Id(currentUser.getId(),
                user.getId());
        response.put("isfollowing", isFollowing);

        return ResponseEntity.ok(response);
    }

    public void updateProfile(Authentication authentication, String username, String bio, String removeImage,
            MultipartFile avatarFile) {
        User user = helper.getCurrentUser(authentication);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        if (userRepository.existsByUsername(username) && !username.equals(user.getUsername())) {
            throw new RuntimeException("Username already exists!");
        }
        if (username.length() > 30) {
            throw new RuntimeException("Username exceeds maximum character limit");
        }
        if (bio != null){
            bio = bio.replaceAll("\r\n", "\n");
            if (bio.length() > 200) {
                throw new RuntimeException("Bio exceeds maximum character limit");
            }
            user.setBio(bio);
        }
        user.setUsername(username);

        if (avatarFile != null && !avatarFile.isEmpty()) {
            helper.deleteOldMediaFile(user.getAvatar());
            String mediaPath = helper.handleFileUpload(avatarFile);
            user.setAvatar(mediaPath);
        }
        if (removeImage != null && removeImage.equals("true")) {
            helper.deleteOldMediaFile(user.getAvatar());
            user.setAvatar(null);
        }
        userRepository.save(user);
    }

}
