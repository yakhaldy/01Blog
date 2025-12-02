package com.zoneBlog.blog.controller;

import com.zoneBlog.blog.model.Post;
import com.zoneBlog.blog.model.Report;
import com.zoneBlog.blog.model.User;
import com.zoneBlog.blog.service.Admin;
import com.zoneBlog.blog.service.Posts;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/admin")
// @CrossOrigin(origins = "http://localhost:4200")
public class AdminController {

    private final Admin adminService;
    private final Posts postsService;

    public AdminController(Admin adminService, Posts postsService) {
        this.adminService = adminService;
        this.postsService = postsService;
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Long>> getDashboardStats(Authentication authentication) {
        Map<String, Long> stats = adminService.getDashboardStats(authentication);
        return ResponseEntity.ok(stats);
    }


    @GetMapping("/reports")
    public ResponseEntity<List<Report>> getReports(Authentication authentication) {
        List<Report> reports = adminService.getReports(authentication);
        return ResponseEntity.ok(reports);
    }


    @DeleteMapping("/reports/{id}")
    public ResponseEntity<?> deleteReport(Authentication authentication, @PathVariable Long id) {
        adminService.deleteReport(authentication, id);
        return ResponseEntity.ok(Map.of("message", "Report deleted successfully"));
    }


    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, Authentication authentication) {
        adminService.deleteUser(authentication, id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }


    @PostMapping("/users/ban")
    public ResponseEntity<User> banUser(Authentication authentication, @RequestBody Map<String, Long> payload) {
        Long userId = payload.get("userId");
        User user = adminService.banUser(authentication, userId);
        return ResponseEntity.ok(user);
    }


    @PatchMapping("/posts/{id}/status")
    public ResponseEntity<Post> updatePostStatus(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {

        String status = payload.get("statue");
        Post post = postsService.updatePostStatue(id, status);
        return ResponseEntity.ok(post);
    }
}
