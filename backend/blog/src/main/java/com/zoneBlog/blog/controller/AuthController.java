package com.zoneBlog.blog.controller;

import com.zoneBlog.blog.dataTransferObj.LoginRequest;
import com.zoneBlog.blog.dataTransferObj.PostRequest;
import com.zoneBlog.blog.dataTransferObj.RegisterRequest;
import com.zoneBlog.blog.model.Post;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;

import com.zoneBlog.blog.service.Login;
import com.zoneBlog.blog.service.Register;
import com.zoneBlog.blog.service.Profile;
import com.zoneBlog.blog.service.Posts;
import java.util.List;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

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

    @Autowired
    private Profile profile;

    @GetMapping("/profile")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        return profile.getCurrentUser(authentication);

    }

    @Autowired
    private Posts Posts;

    @PostMapping(value = "/posts", consumes = "multipart/form-data")
    public ResponseEntity<?> createPost(
            Authentication authentication,
            @RequestPart("description") String description,
            @RequestPart(value = "mediaFile", required = false) MultipartFile mediaFile) {
        try {
            PostRequest request = new PostRequest();
            request.setDescription(description);
            Post post = Posts.createPost(authentication, request, mediaFile);
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to create post: " + e.getMessage()));
        }
    }

    @GetMapping("/posts")
    public ResponseEntity<?> getAllPosts() {
        try {
            List<Post> posts = Posts.getAllPosts();
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id, Authentication authentication) {
        try {
            Posts.deletePost(id, authentication);
            return ResponseEntity.ok(Map.of("message", "Post deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/posts/{id}")
    public ResponseEntity<?> updatePost(@PathVariable Long id, Authentication authentication,
            @RequestPart(value = "mediaFile", required = false) MultipartFile mediaFile,
            @RequestPart("description") String description,
            @RequestPart(value = "removeImage", required = false) String removeImage) {
        try {
            PostRequest request = new PostRequest();
            request.setDescription(description);
            Post post =  Posts.updatePost(id, authentication,request, mediaFile, removeImage);
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
