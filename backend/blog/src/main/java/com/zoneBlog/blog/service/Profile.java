package com.zoneBlog.blog.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.zoneBlog.blog.dataTransferObj.ReportRequest;
import com.zoneBlog.blog.exception.BusinessException;
import com.zoneBlog.blog.exception.DuplicateResourceException;
import com.zoneBlog.blog.exception.ResourceNotFoundException;
import com.zoneBlog.blog.model.Report;
import com.zoneBlog.blog.model.User;
import com.zoneBlog.blog.repository.FollowRepository;
import com.zoneBlog.blog.repository.ReportRepository;
import com.zoneBlog.blog.repository.UserRepository;

@Service
@Transactional
public class Profile {

    private static final int MAX_USERNAME_LENGTH = 30;
    private static final int MAX_BIO_LENGTH = 200;
    private static final String PENDING_STATUS = "pending";

    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final ReportRepository reportRepository;
    private final Helper helper;

    public Profile(UserRepository userRepository, FollowRepository followRepository,
            ReportRepository reportRepository, Helper helper) {
        this.userRepository = userRepository;
        this.followRepository = followRepository;
        this.reportRepository = reportRepository;
        this.helper = helper;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCurrentUser(Authentication authentication) {
        User user = getUserOrThrow(authentication);
        return buildUserResponse(user, null);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getInfoUser(Authentication authentication, String username) {
        User currentUser = getUserOrThrow(authentication);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isFollowing = followRepository.existsByFollower_IdAndFollowing_Id(
                currentUser.getId(), user.getId());

        return buildUserResponse(user, isFollowing);
    }

    public User updateProfile(Authentication authentication, String username, String bio,
            String removeImage, MultipartFile avatarFile) {
        User user = getUserOrThrow(authentication);

        validateAndUpdateUsername(user, username);
        validateAndUpdateBio(user, bio);
        handleAvatarUpdate(user, avatarFile, removeImage);

        return userRepository.save(user);
    }

    public void report(Authentication authentication, ReportRequest request) {
        User currentUser = getUserOrThrow(authentication);
        User reportedUser = userRepository.findById(request.getReportedUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Reported user not found"));

        validateReport(currentUser, reportedUser);

        Report report = createReport(currentUser, reportedUser, request.getReportReason());
        reportRepository.save(report);
    }

    // Private helper methods

    private User getUserOrThrow(Authentication authentication) {
        User user = helper.getCurrentUser(authentication);
        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }
        return user;
    }

    private Map<String, Object> buildUserResponse(User user, Boolean isFollowing) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());
        response.put("bio", user.getBio());
        response.put("avatar", user.getAvatar());
        response.put("followingCount", user.getFollowing());
        response.put("followersCount", user.getFollowers());

        if (isFollowing != null) {
            response.put("isfollowing", isFollowing);
        }

        return response;
    }

    private void validateAndUpdateUsername(User user, String username) {
        if (username == null || username.trim().isEmpty()) {
            throw new BusinessException("Username cannot be empty");
        }

        String trimmedUsername = username.trim();

        if (trimmedUsername.length() > MAX_USERNAME_LENGTH) {
            throw new BusinessException("Username cannot exceed " + MAX_USERNAME_LENGTH + " characters");
        }
        if (!trimmedUsername.matches("^[a-zA-Z_]+$")) {
            throw new BusinessException("Username can only contain characters and underscores");
        }

        if (!trimmedUsername.equals(user.getUsername()) &&
                userRepository.existsByUsername(trimmedUsername)) {
            throw new DuplicateResourceException("Username already exists");
        }

        user.setUsername(trimmedUsername);
    }

    private void validateAndUpdateBio(User user, String bio) {
        if (bio == null) {
            user.setBio("");
            return;
        }

        String normalizedBio = bio.replaceAll("\r\n", "\n").trim();

        if (normalizedBio.length() > MAX_BIO_LENGTH) {
            throw new BusinessException("Bio cannot exceed " + MAX_BIO_LENGTH + " characters");
        }

        user.setBio(normalizedBio);
    }

    private void handleAvatarUpdate(User user, MultipartFile avatarFile, String removeImage) {
        if (avatarFile != null && !avatarFile.isEmpty()) {
            helper.deleteOldMediaFile(user.getAvatar());
            String mediaPath = helper.handleFileUpload(avatarFile);
            user.setAvatar(mediaPath);
        } else if ("true".equals(removeImage)) {
            helper.deleteOldMediaFile(user.getAvatar());
            user.setAvatar(null);
        }
    }

    private void validateReport(User reporter, User reportedUser) {
        if (reporter.getId().equals(reportedUser.getId())) {
            throw new BusinessException("You cannot report yourself");
        }

        if (reportRepository.existsByReportedUserAndReportedBy(reportedUser, reporter)) {
            throw new DuplicateResourceException("You have already reported this user");
        }
    }

    private Report createReport(User reporter, User reportedUser, String reason) {
        Report report = new Report();
        report.setReportedUser(reportedUser);
        report.setReportedBy(reporter);
        report.setReportReason(reason);
        report.setStatus(PENDING_STATUS);
        return report;
    }
}