package com.zoneBlog.blog.controller;

import com.zoneBlog.blog.dataTransferObj.*;
import com.zoneBlog.blog.model.*;
import com.zoneBlog.blog.service.*;
import jakarta.validation.Valid;
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
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        String token = loginService.login(request);
        return ResponseEntity.ok(Map.of(
                "message", "Login successful",
                "token", token));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        User user = registerService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Registration successful"));
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        Map<String, Object> profile = profileService.getCurrentUser(authentication);
        return ResponseEntity.ok(profile);
    }

    @PostMapping(value = "/posts", consumes = "multipart/form-data")
    public ResponseEntity<?> createPost(
            Authentication authentication,
            @Valid @RequestPart("post") PostRequest request,
            @RequestPart(value = "mediaFile", required = false) MultipartFile mediaFile) {

        Post post = postsService.createPost(authentication, request, mediaFile);
        return ResponseEntity.status(HttpStatus.CREATED).body(post);
    }

    @GetMapping("/posts")
    public ResponseEntity<Page<Post>> getPosts(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        Page<Post> posts = postsService.getPosts(authentication, pageable);
        return ResponseEntity.ok(posts);
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id, Authentication authentication) {
        postsService.deletePost(id, authentication);
        return ResponseEntity.ok(Map.of("message", "Post deleted successfully"));
    }

    @PatchMapping("/posts/{id}")
    public ResponseEntity<Post> updatePost(
            @PathVariable Long id,
            Authentication authentication,
            @RequestPart(value = "mediaFile", required = false) MultipartFile mediaFile,
            @RequestPart("description") String description,
            @RequestPart("title") String title,
            @RequestPart(value = "removeImage", required = false) String removeImage) {

        PostRequest request = new PostRequest();
        request.setDescription(description);
        request.setTitle(title);

        Post post = postsService.updatePost(id, authentication, request, mediaFile, removeImage);
        return ResponseEntity.ok(post);
    }

    @PostMapping("/posts/like")
    public ResponseEntity<Post> likePost(@RequestBody PostRequest request, Authentication authentication) {
        Post post = postsService.likePost(request.getPostId(), authentication);
        return ResponseEntity.ok(post);
    }

    @GetMapping("/posts/CurrentUserPost")
    public ResponseEntity<Page<Post>> getMyPosts(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        Page<Post> posts = postsService.getMyPosts(authentication, pageable);
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/posts/{username}")
    public ResponseEntity<Page<Post>> getPostsUser(
            Authentication authentication,
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        Page<Post> posts = postsService.getPostsUser(authentication, username, pageable);
        return ResponseEntity.ok(posts);
    }

    @PostMapping("/posts/comment")
    public ResponseEntity<Comment> createComment(
            Authentication authentication,
            @Valid @RequestBody CommentRequest request) {
        Comment comment = postsService.createComment(authentication, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @GetMapping("/posts/getComment/{postId}")
    public ResponseEntity<List<Comment>> getPostComments(
            Authentication authentication,
            @PathVariable Long postId) {
        List<Comment> comments = postsService.getPostComments(authentication, postId);
        return ResponseEntity.ok(comments);
    }

    @PatchMapping("/posts/comment/{commentId}")
    public ResponseEntity<Comment> updateComment(
            Authentication authentication,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequest request) {
        Comment comment = postsService.updateComment(authentication, commentId, request);
        return ResponseEntity.ok(comment);
    }

    @DeleteMapping("/posts/comment/{commentId}")
    public ResponseEntity<?> deleteComment(Authentication authentication, @PathVariable Long commentId) {
        postsService.deleteComment(authentication, commentId);
        return ResponseEntity.ok(Map.of("message", "Comment deleted successfully"));
    }

    @GetMapping("/users")
    public ResponseEntity<Page<Map<String, Object>>> getAllUsers(Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Map<String, Object>> users = usersService.getAllUsers(authentication, page, size);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/search")
    public ResponseEntity<List<Map<String, Object>>> searchUsers(
            @RequestParam(required = false, defaultValue = "") String searchTerm,
            Authentication authentication) {

        List<Map<String, Object>> users = usersService.searchUsers(authentication, searchTerm);
        return ResponseEntity.ok(users);
    }

    @PostMapping("/users/follow")
    public ResponseEntity<?> follow(Authentication authentication, @RequestBody Map<String, Long> payload) {
        Long userId = payload.get("userId");
        usersService.follow(authentication, userId);
        return ResponseEntity.ok(Map.of("message", "User followed successfully"));
    }

    @PostMapping("/profile")
    public ResponseEntity<User> updateProfile(
            Authentication authentication,
            @RequestPart(value = "avatarFile", required = false) MultipartFile avatarFile,
            @RequestPart("username") String username,
            @RequestPart(value = "bio", required = false) String bio,
            @RequestPart(value = "removeImage", required = false) String removeImage) {

        User user = profileService.updateProfile(authentication, username, bio, removeImage, avatarFile);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/profile/{username}")
    public ResponseEntity<Map<String, Object>> getInfoUser(
            Authentication authentication,
            @PathVariable String username) {
        Map<String, Object> userInfo = profileService.getInfoUser(authentication, username);
        return ResponseEntity.ok(userInfo);
    }

    @PostMapping("/profile/report")
    public ResponseEntity<?> report(Authentication authentication, @Valid @RequestBody ReportRequest request) {
        profileService.report(authentication, request);
        return ResponseEntity.ok(Map.of("message", "Profile reported successfully"));
    }

    @GetMapping("/post/{id}")
    public ResponseEntity<Post> getPost(Authentication authentication, @PathVariable Long id) {
        System.out.println("📄 Fetching post with ID: " + id + " for user: " + authentication.getName());
        Post post = postsService.getPost(authentication, id);
        return ResponseEntity.ok(post);
    }

    @GetMapping("/admin/getReports")
    public ResponseEntity<List<Report>> getReports(Authentication authentication) {
        List<Report> reports = adminService.getReports(authentication);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/admin/dashboardStats")
    public ResponseEntity<Map<String, Long>> getDashboardStats(Authentication authentication) {
        Map<String, Long> stats = adminService.getDashboardStats(authentication);
        return ResponseEntity.ok(stats);
    }

    @DeleteMapping("/admin/deleteUser/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, Authentication authentication) {
        adminService.deleteUser(authentication, id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    @PostMapping("/admin/banUser")
    public ResponseEntity<User> banUser(Authentication authentication, @RequestBody Map<String, Long> payload) {
        Long userId = payload.get("userId");
        User user = adminService.banUser(authentication, userId);
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/admin/report/{id}")
    public ResponseEntity<?> deleteReport(Authentication authentication, @PathVariable Long id) {
        adminService.deleteReport(authentication, id);
        return ResponseEntity.ok(Map.of("message", "Report deleted successfully"));
    }

    @GetMapping("/notification")
    public ResponseEntity<List<Notification>> getNotifications(Authentication authentication) {
        List<Notification> notifications = notificationService.getNotifications(authentication);
        return ResponseEntity.ok(notifications);
    }

    @PostMapping("/notification/markAsRead")
    public ResponseEntity<?> markNotificationsAsRead(
            Authentication authentication,
            @RequestBody Map<String, List<Long>> payload) {
        List<Long> ids = payload.get("ids");
        notificationService.markNotificationsAsRead(authentication, ids);
        return ResponseEntity.ok(Map.of("message", "Notifications marked as read"));
    }

    @PatchMapping("/admin/updateStatusP/{id}")
    public ResponseEntity<Post> updatePostStatue(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {

        String statue = payload.get("statue");
        Post post = postsService.updatePostStatue(id, statue);
        return ResponseEntity.ok(post);
    }

    @PostMapping("/posts/report")
    public ResponseEntity<?> reportPost(Authentication authentication, @Valid @RequestBody ReportRequest request) {
        postsService.reportPost(authentication, request);
        return ResponseEntity.ok(Map.of("message", "Post reported successfully"));
    }
}