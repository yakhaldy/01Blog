package com.zoneBlog.blog.service;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;

import com.zoneBlog.blog.dataTransferObj.PostRequest;
import com.zoneBlog.blog.model.Post;
import com.zoneBlog.blog.model.User;
import com.zoneBlog.blog.repository.PostRepository;
import com.zoneBlog.blog.repository.UserRepository;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import java.nio.file.Path;
import java.util.UUID;
import java.io.IOException;
import java.util.List;

@Service
public class Posts {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PostRepository postRepository;

    @Value("${file.upload.dir:uploads}")
    private String uploadDir;

    @Value("${file.upload.max-size:10485760}") // 10MB
    private long maxFileSize;

    private final String[] allowedImageTypes = { "image/jpeg", "image/jpg", "image/png", "image/gif" };
    private final String[] allowedVideoTypes = { "video/mp4", "video/webm", "video/avi" };

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }

        Optional<User> userOpt = userRepository.findByEmail(authentication.getName());
        return userOpt.orElse(null);
    }

    public Post createPost(Authentication authentication, @RequestBody PostRequest request, MultipartFile mediaFile) {
        String description = request.getDescription();

        User user = getCurrentUser(authentication);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        if (description == null || description.trim().isEmpty()) {
            throw new RuntimeException("Post description cannot be empty");
        }

        if (description.length() > 280) {
            throw new RuntimeException("Post description cannot exceed 280 characters");
        }

        Post post = new Post();
        post.setDescription(description.trim());
        post.setUser(user);
        post.setCreatedAt(LocalDateTime.now());

        if (mediaFile != null && !mediaFile.isEmpty()) {
            String mediaPath = handleFileUpload(mediaFile);
            post.setMediaUrl(mediaPath);
        }

        return postRepository.save(post);
    }

    private String handleFileUpload(MultipartFile file) {
        try {

            if (file.getSize() > maxFileSize) {
                throw new RuntimeException("File size exceeds maximum limit of 10MB");
            }

            String contentType = file.getContentType();
            if (!isAllowedFileType(contentType)) {
                throw new RuntimeException("File type not supported. Allowed types: JPEG, PNG, GIF, MP4, WebM");
            }

            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            String fileName = UUID.randomUUID().toString() + fileExtension;

            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath);

            return "http://localhost:8080/uploads/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file: " + e.getMessage());
        }
    }

    private boolean isAllowedFileType(String contentType) {
        if (contentType == null)
            return false;

        for (String type : allowedImageTypes) {
            if (contentType.equals(type))
                return true;
        }
        for (String type : allowedVideoTypes) {
            if (contentType.equals(type))
                return true;
        }
        return false;
    }

    public List<Post> getAllPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc();
    }

    public void deletePost(Long id, Authentication authentication) {
        User user = getCurrentUser(authentication);
        Post post = getPostById(id);

        if (!post.getUser().getId().equals(user.getId()) && !user.getRole().equals("ADMIN")) {
            throw new RuntimeException("You can only delete your own posts");
        }

        deleteOldMediaFile(post.getMediaUrl());

        postRepository.delete(post);
    }

    public Post getPostById(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
    }

    private void deleteOldMediaFile(String mediaUrl) {
        if (mediaUrl != null && mediaUrl.startsWith("/uploads/")) {
            try {
                String fileName = mediaUrl.substring("/uploads/".length());
                Path filePath = Paths.get(uploadDir, fileName);
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                System.err.println("Failed to delete old media file: " + e.getMessage());
            }
        }
    }

}
