package com.zoneBlog.blog.controller;

import com.zoneBlog.blog.dataTransferObj.CommentRequest;
import com.zoneBlog.blog.model.Comment;
import com.zoneBlog.blog.service.Posts;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller responsible for comment-related operations
 * Handles comment CRUD operations on posts
 */
@RestController
@RequestMapping("/api/comments")
// @CrossOrigin(origins = "http://localhost:4200")
public class CommentController {

    private final Posts postsService;

    public CommentController(Posts postsService) {
        this.postsService = postsService;
    }


    @PostMapping
    public ResponseEntity<Comment> createComment(
            Authentication authentication,
            @Valid @RequestBody CommentRequest request) {
        Comment comment = postsService.createComment(authentication, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }


    @GetMapping("/post/{postId}")
    public ResponseEntity<List<Comment>> getPostComments(
            Authentication authentication,
            @PathVariable Long postId) {
        List<Comment> comments = postsService.getPostComments(authentication, postId);
        return ResponseEntity.ok(comments);
    }


    @PatchMapping("/{commentId}")
    public ResponseEntity<Comment> updateComment(
            Authentication authentication,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequest request) {
        Comment comment = postsService.updateComment(authentication, commentId, request);
        return ResponseEntity.ok(comment);
    }


    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(Authentication authentication, @PathVariable Long commentId) {
        postsService.deleteComment(authentication, commentId);
        return ResponseEntity.ok(Map.of("message", "Comment deleted successfully"));
    }
}
