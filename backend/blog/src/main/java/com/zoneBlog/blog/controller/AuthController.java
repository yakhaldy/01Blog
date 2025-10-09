package com.zoneBlog.blog.controller;

import com.zoneBlog.blog.dataTransferObj.CommentRequest;
import com.zoneBlog.blog.dataTransferObj.LoginRequest;
import com.zoneBlog.blog.dataTransferObj.PostRequest;
import com.zoneBlog.blog.dataTransferObj.RegisterRequest;
import com.zoneBlog.blog.dataTransferObj.ReportRequest;
import com.zoneBlog.blog.model.Comment;
import com.zoneBlog.blog.model.Post;
import com.zoneBlog.blog.model.Report;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;

import com.zoneBlog.blog.service.Login;
import com.zoneBlog.blog.service.NotificationService;
import com.zoneBlog.blog.service.Register;
import com.zoneBlog.blog.service.Profile;
import com.zoneBlog.blog.service.Posts;
import com.zoneBlog.blog.service.Users;
import com.zoneBlog.blog.service.Admin;
import com.zoneBlog.blog.service.Helper;
import com.zoneBlog.blog.model.Notification;

import java.util.List;

import java.util.Map;


@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {
    @Autowired
    private Helper helper;

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
        // return l.login(request);
        try {
            Map<String, Object> response =  l.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
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
            @RequestPart("title") String title,
            @RequestPart(value = "mediaFile", required = false) MultipartFile mediaFile) {
        try {
            PostRequest request = new PostRequest();
            request.setDescription(description);
            request.setTitle(title);
            Post post = Posts.createPost(authentication, request, mediaFile);
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to create post: " + e.getMessage()));
        }
    }

    @GetMapping("/posts")
    public ResponseEntity<?> getAllPosts(Authentication authentication) {
        try {
            List<Post> posts = Posts.getAllPosts(authentication);
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get all posts: " + e.getMessage()));
        }
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id, Authentication authentication) {
        try {
            Posts.deletePost(id, authentication);
            return ResponseEntity.ok(Map.of("message", "Post deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to delete post: " + e.getMessage()));
        }
    }

    @PatchMapping("/posts/{id}")
    public ResponseEntity<?> updatePost(@PathVariable Long id, Authentication authentication,
            @RequestPart(value = "mediaFile", required = false) MultipartFile mediaFile,
            @RequestPart("description") String description,
            @RequestPart("title") String title,
            @RequestPart(value = "removeImage", required = false) String removeImage) {
        try {
            PostRequest request = new PostRequest();
            request.setDescription(description);
            request.setTitle(title);
            Post post = Posts.updatePost(id, authentication, request, mediaFile, removeImage);
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to update post: " + e.getMessage()));

        }
    }

    @PostMapping("/posts/like")
    public ResponseEntity<?> likePost(@RequestBody PostRequest request, Authentication authentication) {
        try {
            Post post = Posts.likePost(request.getPostId(), authentication);
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to like post: " + e.getMessage()));
        }
    }

    @GetMapping("/posts/CurrentUserPost")
    public ResponseEntity<?> getMyPosts(Authentication authentication) {
        try {
            List<Post> posts = Posts.getMyPosts(authentication);
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get all posts: " + e.getMessage()));
        }
    }

    @GetMapping("/posts/{username}")
    public ResponseEntity<?> getPostsUser(Authentication authentication, @PathVariable String username) {
        try {
            List<Post> posts = Posts.getPostsUser(authentication, username);
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get all posts: " + e.getMessage()));
        }
    }

    @PostMapping("/posts/comment")
    public ResponseEntity<?> createComment(Authentication authentication, @RequestBody CommentRequest request) {
        try {
            Comment comment = Posts.createComment(authentication, request.getContent(), request.getPostId());
            return ResponseEntity.ok(comment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to Comment post: " + e.getMessage()));
        }
    }

    @GetMapping("/posts/getComment{postId}")
    public ResponseEntity<?> getPostComments(Authentication authentication, @PathVariable Long postId) {
        try {
            List<Comment> comments = Posts.getPostComments(authentication, postId);
            return ResponseEntity.ok(comments);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to Comment post: " + e.getMessage()));
        }
    }

    @PatchMapping("/posts/comment/{commentId}")
    public ResponseEntity<?> updateComment(Authentication authentication, @PathVariable Long commentId,
            @RequestBody CommentRequest request) {
        try {
            Comment comment = Posts.updateComment(authentication, commentId, request);
            return ResponseEntity.ok(comment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to  update Comment : " + e.getMessage()));
        }
    }
    @DeleteMapping("/posts/comment/{commentId}")
    public ResponseEntity<?> deleteComment(Authentication authentication, @PathVariable Long commentId) {
        try {
            Posts.deleteComment(authentication, commentId);
            return ResponseEntity.ok(Map.of("message", "Post deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to  update Comment : " + e.getMessage()));
        }
    }
    

    @Autowired
    private Users user;

    @GetMapping("users")
    public ResponseEntity<?> getAllUsers(Authentication authentication) {
        try {
           List<Map<String, Object>> response = user.getAllUsers(authentication);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get users: " + e.getMessage()));
        }
    }

    @PostMapping("users/follow")
    public ResponseEntity<?> follow(Authentication authentication, @RequestBody Map<String, Long> payload) {
        try {
            Long userId = payload.get("userId");
            user.follow(authentication, userId);
            return ResponseEntity.ok(Map.of("message", "follow user successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to follow user: " + e.getMessage()));
        }
    }

    @PostMapping("profile")
    public ResponseEntity<?> updateProfile(Authentication authentication,
            @RequestPart(value = "avatarFile", required = false) MultipartFile avatarFile,
            @RequestPart("username") String username,
            @RequestPart(value = "bio", required = false) String bio,
            @RequestPart(value = "removeImage", required = false) String removeImage) {
        try {
            profile.updateProfile(authentication, username, bio, removeImage, avatarFile);
            return ResponseEntity.ok(Map.of("message", "update Profile successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("profile/{username}")
    public ResponseEntity<?> getInfoUser(Authentication authentication, @PathVariable String username) {
        try {
            return profile.getInfoUser(authentication, username);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get info  user: " + e.getMessage()));
        }
    }

    @PostMapping("profile/report")
    public ResponseEntity<?> report(Authentication authentication, @RequestBody ReportRequest request) {
        try {
            profile.report(authentication, request);
            return ResponseEntity.ok(Map.of("message", "report Profile successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get info  user: " + e.getMessage()));
        }
    }

    @GetMapping("post/{id}")
    public ResponseEntity<?> getPost(Authentication authentication, @PathVariable Long id) {
        try {
            Post posts = Posts.getPost(authentication, id);
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get post: " + e.getMessage()));
        }
    }

    @Autowired
    private Admin Admin;

    @GetMapping("admin/getReports")
    public ResponseEntity<?> getReports(Authentication authentication) {
        try {
            List<Report> reports = Admin.getReports(authentication);
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get reports: " + e.getMessage()));
        }
    }

    @GetMapping("admin/dashboardStats")
    public ResponseEntity<?> getDashboardStats(Authentication authentication) {
        try {
            Map<String, Long> dashboardStats = Admin.getDashboardStats(authentication);
            return ResponseEntity.ok(dashboardStats);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to get Dashboard Stats: " + e.getMessage()));
        }
    }

    @DeleteMapping("admin/deleteUser/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, Authentication authentication) {
        try {
            Admin.deleteUser(authentication, id);
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to deleted user: " + e.getMessage()));
        }
    }

    @PostMapping("admin/banUser")
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> banUser(Authentication authentication, @RequestBody Map<String, Long> payload) {
        try {
            Long userId = payload.get("userId");
            Admin.banUser(authentication, userId);
            return ResponseEntity.ok(Map.of("message", "ban User successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to ban User: " + e.getMessage()));
        }
    }

    @Autowired
    private NotificationService Notification;

    @GetMapping("notification")
    public ResponseEntity<?> getnotification(Authentication authentication) {
        try {
            List<Notification> notifications = Notification.getNotifications(authentication);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed get notifications: " + e.getMessage()));
        }
    }
    
}
