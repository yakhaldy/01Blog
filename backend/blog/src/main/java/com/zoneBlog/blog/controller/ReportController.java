package com.zoneBlog.blog.controller;

import com.zoneBlog.blog.dataTransferObj.ReportRequest;
import com.zoneBlog.blog.service.Posts;
import com.zoneBlog.blog.service.Profile;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller responsible for handling report-related operations
 * Handles reporting of users and posts
 */
@RestController
@RequestMapping("/api/reports")
// @CrossOrigin(origins = "http://localhost:4200")
public class ReportController {

    private final Profile profileService;
    private final Posts postsService;


    public ReportController(Profile profileService, Posts postsService) {
        this.profileService = profileService;
        this.postsService = postsService;
    }


    @PostMapping("/user")
    public ResponseEntity<?> reportUser(Authentication authentication, @Valid @RequestBody ReportRequest request) {
        profileService.report(authentication, request);
        return ResponseEntity.ok(Map.of("message", "User reported successfully"));
    }


    @PostMapping("/post")
    public ResponseEntity<?> reportPost(Authentication authentication, @Valid @RequestBody ReportRequest request) {
        postsService.reportPost(authentication, request);
        return ResponseEntity.ok(Map.of("message", "Post reported successfully"));
    }
}
