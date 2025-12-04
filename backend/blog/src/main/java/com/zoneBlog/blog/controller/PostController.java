package com.zoneBlog.blog.controller;

import com.zoneBlog.blog.dataTransferObj.PostRequest;
import com.zoneBlog.blog.model.Post;
import com.zoneBlog.blog.service.Posts;
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

import java.util.Map;


@RestController
@RequestMapping("/api/posts")
// @CrossOrigin(origins = "http://localhost:4200")
public class PostController {

    private final Posts postsService;

    public PostController(Posts postsService) {
        this.postsService = postsService;
    }

 
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> createPost(
            Authentication authentication,
            @Valid @RequestPart("post") PostRequest request,
            @RequestPart(value = "mediaFiles", required = false) MultipartFile[] mediaFiles) {

        Post post = postsService.createPost(authentication, request, mediaFiles);
        return ResponseEntity.status(HttpStatus.CREATED).body(post);
    }

   
    @GetMapping
    public ResponseEntity<Page<Post>> getPosts(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        Page<Post> posts = postsService.getPosts(authentication, pageable);
        return ResponseEntity.ok(posts);
    }


    @GetMapping("/{id}")
    public ResponseEntity<Post> getPost(Authentication authentication, @PathVariable Long id) {
        Post post = postsService.getPost(authentication, id);
        return ResponseEntity.ok(post);
    }


    @PatchMapping("/{id}")
    public ResponseEntity<Post> updatePost(
            @PathVariable Long id,
            Authentication authentication,
            @RequestPart(value = "mediaFiles", required = false) MultipartFile[] mediaFiles,
            @RequestPart("description") String description,
            @RequestPart("title") String title,
            @RequestPart(value = "removeImage", required = false) String removeImage,
            @RequestPart(value = "keepImages", required = false) String keepImages) {

        PostRequest request = new PostRequest();
        request.setDescription(description);
        request.setTitle(title);

        Post post = postsService.updatePost(id, authentication, request, mediaFiles, removeImage, keepImages);
        return ResponseEntity.ok(post);
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id, Authentication authentication) {
        postsService.deletePost(id, authentication);
        return ResponseEntity.ok(Map.of("message", "Post deleted successfully"));
    }


    @PostMapping("/like")
    public ResponseEntity<Post> likePost(@RequestBody PostRequest request, Authentication authentication) {
        Post post = postsService.likePost(request.getPostId(), authentication);
        return ResponseEntity.ok(post);
    }


    @GetMapping("/me")
    public ResponseEntity<Page<Post>> getMyPosts(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        Page<Post> posts = postsService.getMyPosts(authentication, pageable);
        return ResponseEntity.ok(posts);
    }


    @GetMapping("/user/{username}")
    public ResponseEntity<Page<Post>> getUserPosts(
            Authentication authentication,
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        Page<Post> posts = postsService.getPostsUser(authentication, username, pageable);
        return ResponseEntity.ok(posts);
    }
}
