package com.zoneBlog.blog.controller;

import com.zoneBlog.blog.model.User;
import com.zoneBlog.blog.service.Profile;
import com.zoneBlog.blog.service.Users;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/users")
// @CrossOrigin(origins = "http://localhost:4200")
public class UserController {

    private final Profile profileService;
    private final Users usersService;

    public UserController(Profile profileService, Users usersService) {
        this.profileService = profileService;
        this.usersService = usersService;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        Map<String, Object> profile = profileService.getCurrentUser(authentication);
        return ResponseEntity.ok(profile);
    }


    @GetMapping("/{username}")
    public ResponseEntity<Map<String, Object>> getUserProfile(
            Authentication authentication,
            @PathVariable String username) {
        Map<String, Object> userInfo = profileService.getInfoUser(authentication, username);
        return ResponseEntity.ok(userInfo);
    }


    @PostMapping("/me")
    public ResponseEntity<User> updateProfile(
            Authentication authentication,
            @RequestPart(value = "avatarFile", required = false) MultipartFile avatarFile,
            @RequestPart("username") String username,
            @RequestPart(value = "bio", required = false) String bio,
            @RequestPart(value = "removeImage", required = false) String removeImage) {

        User user = profileService.updateProfile(authentication, username, bio, removeImage, avatarFile);
        return ResponseEntity.ok(user);
    }


    @GetMapping
    public ResponseEntity<Page<Map<String, Object>>> getAllUsers(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Map<String, Object>> users = usersService.getAllUsers(authentication, page, size);
        return ResponseEntity.ok(users);
    }

    /**
     * Search users by username or email
     * @param searchTerm Search query
     * @param authentication Current user authentication
     * @return List of matching users
     */
    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> searchUsers(
            @RequestParam(required = false, defaultValue = "") String searchTerm,
            Authentication authentication) {

        List<Map<String, Object>> users = usersService.searchUsers(authentication, searchTerm);
        return ResponseEntity.ok(users);
    }

    /**
     * Follow or unfollow a user
     * @param authentication Current user authentication
     * @param payload Request body containing userId
     * @return Success message
     */
    @PostMapping("/follow")
    public ResponseEntity<?> followUser(Authentication authentication, @RequestBody Map<String, Long> payload) {
        Long userId = payload.get("userId");
        usersService.follow(authentication, userId);
        return ResponseEntity.ok(Map.of("message", "User followed successfully"));
    }
}
