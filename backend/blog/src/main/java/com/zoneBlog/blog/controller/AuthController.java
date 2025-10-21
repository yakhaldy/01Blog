package com.zoneBlog.blog.controller;

import com.zoneBlog.blog.dataTransferObj.*;
import com.zoneBlog.blog.model.*;
import com.zoneBlog.blog.service.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    private final Login loginService;
    private final Register registerService;
    private final Profile profileService;
    private final Posts postsService;
    private final Users usersService;
    private final Admin adminService;
    private final NotificationService notificationService;

    public AuthController(Login loginService, Register registerService, Profile profileService,
            Posts postsService, Users usersService, Admin adminService,
            NotificationService notificationService) {
        this.loginService = loginService;
        this.registerService = registerService;
        this.profileService = profileService;
        this.postsService = postsService;
        this.usersService = usersService;
        this.adminService = adminService;
        this.notificationService = notificationService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return loginService.login(request);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        return registerService.register(request);
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        return profileService.getCurrentUser(authentication);
    }

    @PostMapping(value = "/posts", consumes = "multipart/form-data")
    public ResponseEntity<?> createPost(
            Authentication authentication,
            @RequestPart("description") String description,
            @RequestPart("title") String title,
            @RequestPart(value = "mediaFile", required = false) MultipartFile mediaFile) {

        PostRequest request = new PostRequest();
        request.setDescription(description);
        request.setTitle(title);
        return postsService.createPost(authentication, request, mediaFile);

    }

    @GetMapping("/posts")
    public ResponseEntity<?> getPosts(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        return postsService.getPosts(authentication, pageable);

    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id, Authentication authentication) {
        // try {

        //
        // } catch (RuntimeException e) {
        // return ResponseEntity
        // .status(HttpStatus.BAD_REQUEST)
        // .body(Map.of("error", e.getMessage()));
        // }
        return postsService.deletePost(id, authentication);
    }

    @PatchMapping("/posts/{id}")
    public ResponseEntity<?> updatePost(
            @PathVariable Long id,
            Authentication authentication,
            @RequestPart(value = "mediaFile", required = false) MultipartFile mediaFile,
            @RequestPart("description") String description,
            @RequestPart("title") String title,
            @RequestPart(value = "removeImage", required = false) String removeImage) {
        PostRequest request = new PostRequest();
        request.setDescription(description);
        request.setTitle(title);

        return postsService.updatePost(id, authentication, request, mediaFile, removeImage);

    }

    @PostMapping("/posts/like")
    public ResponseEntity<?> likePost(@RequestBody PostRequest request, Authentication authentication) {
        return postsService.likePost(request.getPostId(), authentication);

    }

    @GetMapping("/posts/CurrentUserPost")
    public ResponseEntity<?> getMyPosts(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));

        return postsService.getMyPosts(authentication, pageable);
    }

    @GetMapping("/posts/{username}")
    public ResponseEntity<?> getPostsUser(
            Authentication authentication,
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));

        return postsService.getPostsUser(authentication, username, pageable);
    }

    @PostMapping("/posts/comment")
    public ResponseEntity<?> createComment(Authentication authentication, @RequestBody CommentRequest request) {
        return postsService.createComment(authentication, request.getContent(), request.getPostId());
    }

    @GetMapping("/posts/getComment/{postId}")
    public ResponseEntity<?> getPostComments(Authentication authentication, @PathVariable Long postId) {
        return postsService.getPostComments(authentication, postId);
    }

    @PatchMapping("/posts/comment/{commentId}")
    public ResponseEntity<?> updateComment(
            Authentication authentication,
            @PathVariable Long commentId,
            @RequestBody CommentRequest request) {
            return postsService.updateComment(authentication, commentId, request);
    }

    @DeleteMapping("/posts/comment/{commentId}")
    public ResponseEntity<?> deleteComment(Authentication authentication, @PathVariable Long commentId) {
        // try {
        //     postsService.deleteComment(authentication, commentId);
        //     return ResponseEntity.ok(Map.of("message", "Comment deleted successfully"));
        // } catch (RuntimeException e) {
        //     return ResponseEntity
        //             .status(HttpStatus.BAD_REQUEST)
        //             .body(Map.of("error", e.getMessage()));
        // }

        return postsService.deleteComment(authentication, commentId);
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(Authentication authentication) {
        return usersService.getAllUsers(authentication);
    }

    @PostMapping("/users/follow")
    public ResponseEntity<?> follow(Authentication authentication, @RequestBody Map<String, Long> payload) {
        Long userId = payload.get("userId");
        return usersService.follow(authentication, userId);
    }

    @PostMapping("/profile")
    public ResponseEntity<?> updateProfile(
            Authentication authentication,
            @RequestPart(value = "avatarFile", required = false) MultipartFile avatarFile,
            @RequestPart("username") String username,
            @RequestPart(value = "bio", required = false) String bio,
            @RequestPart(value = "removeImage", required = false) String removeImage) {
        return profileService.updateProfile(authentication, username, bio, removeImage, avatarFile);
    }

    @GetMapping("/profile/{username}")
    public ResponseEntity<?> getInfoUser(Authentication authentication, @PathVariable String username) {
        return profileService.getInfoUser(authentication, username);
    }

    @PostMapping("/profile/report")
    public ResponseEntity<?> report(Authentication authentication, @RequestBody ReportRequest request) {
        return profileService.report(authentication, request);
    }

    @GetMapping("/post/{id}")
    public ResponseEntity<?> getPost(Authentication authentication, @PathVariable Long id) {
        try {
            Post post = postsService.getPost(authentication, id);
            return ResponseEntity.ok(post);
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/admin/getReports")
    public ResponseEntity<?> getReports(Authentication authentication) {
        return adminService.getReports(authentication);
    }

    @GetMapping("/admin/dashboardStats")
    public ResponseEntity<?> getDashboardStats(Authentication authentication) {
        return adminService.getDashboardStats(authentication);
    }

    @DeleteMapping("/admin/deleteUser/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, Authentication authentication) {
        return adminService.deleteUser(authentication, id);
    }

    @PostMapping("/admin/banUser")
    public ResponseEntity<?> banUser(Authentication authentication, @RequestBody Map<String, Long> payload) {
        Long userId = payload.get("userId");
        return adminService.banUser(authentication, userId);
    }

    @DeleteMapping("/admin/report/{id}")
    public ResponseEntity<?> deleteReport(Authentication authentication, @PathVariable Long id) {
        return adminService.deleteReport(authentication, id);
    }

    @GetMapping("/notification")
    public ResponseEntity<?> getNotifications(Authentication authentication) {
        // try {
        // List<Notification> notifications =
        // notificationService.getNotifications(authentication);
        // return ResponseEntity.ok(notifications);
        // } catch (RuntimeException e) {
        // return ResponseEntity
        // .status(HttpStatus.BAD_REQUEST)
        // .body(Map.of("error", e.getMessage()));
        // }
        return notificationService.getNotifications(authentication);
    }
}