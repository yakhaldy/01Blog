package com.zoneBlog.blog.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.zoneBlog.blog.model.User;
import com.zoneBlog.blog.repository.UserRepository;

@Component
public class Helper {


    private final UserRepository userRepository;

    @Value("${file.upload.dir:uploads}")
    private String uploadDir;

    @Value("${file.upload.max-size:10485760}")
    private long maxFileSize;

    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
        "image/jpeg", "image/jpg", "image/png", "image/gif"
    );

    private static final List<String> ALLOWED_VIDEO_TYPES = Arrays.asList(
        "video/mp4", "video/webm", "video/avi"
    );

    public Helper(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        
        Optional<User> userOpt = userRepository.findByEmail(authentication.getName());
        return userOpt.orElse(null);
    }


    public String handleFileUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be null or empty");
        }

        validateFileSize(file);
        validateFileType(file);

        try {
            ensureUploadDirectoryExists();
            String fileName = generateUniqueFileName(file);
            Path filePath = Paths.get(uploadDir).resolve(fileName);
            
            Files.copy(file.getInputStream(), filePath);
            
            return fileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file: " + e.getMessage());
        }
    }


    public void deleteOldMediaFile(String mediaUrl) {
        if (mediaUrl == null || mediaUrl.trim().isEmpty()) {
            return;
        }

        try {
            Path filePath = Paths.get(uploadDir, mediaUrl);
             Files.deleteIfExists(filePath);
    
        } catch (IOException e) {
            System.out.println("Failed to delete file: "+mediaUrl+" "+e);
        }
    }

    // Private helper methods

    private void validateFileSize(MultipartFile file) {
        if (file.getSize() > maxFileSize) {
            throw new RuntimeException(
                String.format("File size exceeds maximum limit of %d MB", maxFileSize / (1024 * 1024))
            );
        }
    }

    private void validateFileType(MultipartFile file) {
        String contentType = file.getContentType();
        
        if (contentType == null || !isAllowedFileType(contentType)) {
            throw new RuntimeException(
                "File type not supported. Allowed types: JPEG, PNG, GIF, MP4, WebM, AVI"
            );
        }
    }

    private boolean isAllowedFileType(String contentType) {
        return ALLOWED_IMAGE_TYPES.contains(contentType) || 
               ALLOWED_VIDEO_TYPES.contains(contentType);
    }

    private void ensureUploadDirectoryExists() throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
    }

    private String generateUniqueFileName(MultipartFile file) {
        String originalFileName = file.getOriginalFilename();
        String fileExtension = "";
        
        if (originalFileName != null && originalFileName.contains(".")) {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        
        return UUID.randomUUID().toString() + fileExtension;
    }
}