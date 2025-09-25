package com.zoneBlog.blog.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.zoneBlog.blog.model.User;
import com.zoneBlog.blog.repository.UserRepository;

@Component
public class Helper {

    @Autowired
    private UserRepository userRepository;

    @Value("${file.upload.dir:uploads}")
    public String uploadDir;

    @Value("${file.upload.max-size:10485760}") // 10MB
    private long maxFileSize;

    private final String[] allowedImageTypes = { "image/jpeg", "image/jpg", "image/png", "image/gif" };
    private final String[] allowedVideoTypes = { "video/mp4", "video/webm", "video/avi" };

    public User getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        Optional<User> userOpt = userRepository.findByEmail(authentication.getName());
        return userOpt.orElse(null);
    }

    public String handleFileUpload(MultipartFile file) {
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

            return /*"http://localhost:8080/uploads/"+*/ fileName;
            // String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
            // .path("/uploads/")
            // .path(fileName)
            // .toUriString();
            // return fileDownloadUri;
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

       public void deleteOldMediaFile(String mediaUrl) {
        if (mediaUrl != null /*&& mediaUrl.startsWith("http://localhost:8080/uploads/")*/) {
            try {
                // String fileName = mediaUrl.substring("http://localhost:8080/uploads/".length());
                Path filePath = Paths.get(uploadDir, mediaUrl);
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                System.err.println("Failed to delete old media file: " + e.getMessage());
            }
        }
    }
}
