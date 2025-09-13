package com.zoneBlog.blog.controller;


import com.zoneBlog.blog.model.Post;
import com.zoneBlog.blog.model.User;
import com.zoneBlog.blog.repository.PostRepository;
import com.zoneBlog.blog.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public PostController(PostRepository postRepository, UserRepository userRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Post> getAllPosts() {
        return postRepository.findAll();
    }

   
    @PostMapping
    public ResponseEntity<?> createPost(@RequestBody Post post, Authentication auth) {
        

        
        Post savedPost = postRepository.save(post);

        return ResponseEntity.ok(savedPost);
    }
}
