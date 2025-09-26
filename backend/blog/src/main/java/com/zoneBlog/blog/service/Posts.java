package com.zoneBlog.blog.service;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;

import com.zoneBlog.blog.dataTransferObj.PostRequest;
import com.zoneBlog.blog.model.Post;
import com.zoneBlog.blog.model.User;
import com.zoneBlog.blog.model.Like;
import com.zoneBlog.blog.repository.PostRepository;
import com.zoneBlog.blog.repository.UserRepository;

import jakarta.transaction.Transactional;

import com.zoneBlog.blog.repository.LikeRepository;

import java.nio.file.Path;
import java.util.stream.Collectors;
import java.io.IOException;
import java.util.List;

@Service
@Transactional
public class Posts {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private Helper helper;

    public Post createPost(Authentication authentication, @RequestBody PostRequest request, MultipartFile mediaFile) {
        String description = request.getDescription();
        String title = request.getTitle();

        User user = helper.getCurrentUser(authentication);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        if (title == null || title.trim().isEmpty()) {
            throw new RuntimeException("Post title cannot be empty");
        }
         title = title.replaceAll("\r\n", "\n");
        if (title.length() > 280) {
            throw new RuntimeException("Post description cannot exceed 1000 characters");
        }
        if (description == null || description.trim().isEmpty()) {
            throw new RuntimeException("Post description cannot be empty");
        }
        description = description.replaceAll("\r\n", "\n");
        if (description.length() > 5000) {
            throw new RuntimeException("Post description cannot exceed 1000 characters");
        }

        Post post = new Post();
        post.setTitle(title);
        post.setDescription(description.trim());
        post.setUser(user);
        post.setCreatedAt(LocalDateTime.now());

        if (mediaFile != null && !mediaFile.isEmpty()) {
            String mediaPath = helper.handleFileUpload(mediaFile);
            post.setMediaUrl(mediaPath);
        }

        return postRepository.save(post);
    }

    public List<Post> getAllPosts(Authentication authentication) {
        User user = helper.getCurrentUser(authentication);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        List<Post> posts = postRepository.findAllByOrderByCreatedAtDesc();
        posts = posts.stream().map(p -> {
            p.setIsLiked(likeRepository.existsByUser_IdAndPost_Id(user.getId(), p.getId()));
            return p;
        }).collect(Collectors.toList());
        return posts;
    }

    public void deletePost(Long id, Authentication authentication) {
        User user = helper.getCurrentUser(authentication);
        Post post = getPostById(id);

        if (!post.getUser().getId().equals(user.getId()) && !user.getRole().equals("ADMIN")) {
            throw new RuntimeException("You can only delete your own posts");
        }

        helper.deleteOldMediaFile(post.getMediaUrl());

        postRepository.delete(post);
    }

    public Post getPostById(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
    }

    // private void deleteOldMediaFile(String mediaUrl) {
    // // System.err.println("=========="+mediaUrl);
    // if (mediaUrl != null &&
    // mediaUrl.startsWith("http://localhost:8080/uploads/")) {
    // try {
    // String fileName =
    // mediaUrl.substring("http://localhost:8080/uploads/".length());
    // Path filePath = Paths.get(helper.uploadDir, fileName);
    // Files.deleteIfExists(filePath);
    // } catch (IOException e) {
    // System.err.println("Failed to delete old media file: " + e.getMessage());
    // }
    // }
    // }

    public Post updatePost(Long id, Authentication authentication, @RequestBody PostRequest request,
            MultipartFile mediaFile, String removeImage) {
        User user = helper.getCurrentUser(authentication);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        Post post = getPostById(id);

        if (!post.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only update your own posts");
        }
        String description = request.getDescription();
        if (description == null || description.trim().isEmpty()) {
            throw new RuntimeException("Post description cannot be empty");
        }

        description = description.replaceAll("\r\n", "\n");
        if (description.length() > 1000) {
            throw new RuntimeException("Post description cannot exceed 1000 characters");
        }

        post.setDescription(description);

        if (mediaFile != null && !mediaFile.isEmpty()) {
            helper.deleteOldMediaFile(post.getMediaUrl());
            String mediaPath = helper.handleFileUpload(mediaFile);
            post.setMediaUrl(mediaPath);
        }
        if (removeImage != null && removeImage.equals("true")) {
            helper.deleteOldMediaFile(post.getMediaUrl());
            post.setMediaUrl(null);

        }
        postRepository.save(post);
        return post;
    }

    public Post likePost(Long id, Authentication authentication) {
        User user = helper.getCurrentUser(authentication);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        Post post = getPostById(id);
        if (post == null) {
            throw new RuntimeException("Post not found");
        }
        if (likeRepository.existsByUser_IdAndPost_Id(user.getId(), post.getId())) {
            Like like = likeRepository.findByUser_IdAndPost_Id(user.getId(), post.getId());
            // likeRepository.deleteByUser_IdAndPost_Id(user.getId(), post.getId());
            likeRepository.delete(like);
        } else {
            Like like = new Like();
            like.setPost(post);
            like.setUser(user);
            likeRepository.save(like);
        }
        post.setLikesCount(likeRepository.countByPost_Id(post.getId()));

        postRepository.save(post);
        return post;
    }

    public List<Post> getMyPosts(Authentication authentication) {
        User user = helper.getCurrentUser(authentication);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        List<Post> posts = postRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());
        posts = posts.stream().map(p -> {
            if (likeRepository.existsByUser_IdAndPost_Id(user.getId(), p.getId())) {
                p.setIsLiked(true);
            } else {
                p.setIsLiked(false);
            }
            return p;
        }).collect(Collectors.toList());
        return posts;
    }

    public List<Post> getPostsUser(Authentication authentication, String username) {
        User CurrentUser = helper.getCurrentUser(authentication);
        if (CurrentUser == null) {
            throw new RuntimeException("User not found");
        }
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        List<Post> posts = postRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());
        posts = posts.stream().map(p -> {
            if (likeRepository.existsByUser_IdAndPost_Id(CurrentUser.getId(), p.getId())) {
                p.setIsLiked(true);
            } else {
                p.setIsLiked(false);
            }
            return p;
        }).collect(Collectors.toList());
        return posts;
    }

    public Post getPost(Authentication authentication, Long id) {
        User CurrentUser = helper.getCurrentUser(authentication);
        if (CurrentUser == null) {
            throw new RuntimeException("User not found");
        }
        return postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
    }

}
