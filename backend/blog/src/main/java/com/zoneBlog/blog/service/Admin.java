package com.zoneBlog.blog.service;

import java.time.LocalDateTime;
import java.util.*;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.zoneBlog.blog.exception.BusinessException;
import com.zoneBlog.blog.exception.ResourceNotFoundException;
import com.zoneBlog.blog.exception.UnauthorizedException;
import com.zoneBlog.blog.model.Report;
import com.zoneBlog.blog.model.User;
import com.zoneBlog.blog.repository.CommentRepository;
import com.zoneBlog.blog.repository.PostRepository;
import com.zoneBlog.blog.repository.ReportRepository;
import com.zoneBlog.blog.repository.UserRepository;

@Service
@Transactional
public class Admin {

    private static final String ADMIN_ROLE = "ROLE_ADMIN";
    private static final String PENDING_STATUS = "pending";

    private final ReportRepository reportRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final Helper helper;

    public Admin(ReportRepository reportRepository, PostRepository postRepository,
            UserRepository userRepository, CommentRepository commentRepository, Helper helper) {
        this.reportRepository = reportRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
        this.helper = helper;
    }

    @Transactional(readOnly = true)
    public List<Report> getReports(Authentication authentication) {
        validateAdminAccess(authentication);
        return reportRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getDashboardStats(Authentication authentication) {
        validateAdminAccess(authentication);
        
        Map<String, Long> dashboardStats = new HashMap<>();
        dashboardStats.put("totalUsers", userRepository.count());
        dashboardStats.put("totalPosts", postRepository.count());
        dashboardStats.put("totalReports", reportRepository.count());
        dashboardStats.put("bannedUsers", userRepository.countByIsBanned(true));
        dashboardStats.put("activeReports", reportRepository.countByStatus(PENDING_STATUS));

        return dashboardStats;
    }

    public void deleteUser(Authentication authentication, Long id) {
        validateAdminAccess(authentication);

        User user = getUserOrThrow(id);

        if (ADMIN_ROLE.equals(user.getRole())) {
            throw new BusinessException("Admin users cannot be deleted");
        }

        userRepository.delete(user);
    }

    public User banUser(Authentication authentication, Long id) {
        validateAdminAccess(authentication);

        User user = getUserOrThrow(id);

        if (ADMIN_ROLE.equals(user.getRole())) {
            throw new BusinessException("Admin users cannot be banned");
        }

        boolean currentBanStatus = Boolean.TRUE.equals(user.getIsBanned());
        user.setIsBanned(!currentBanStatus);

        if (!currentBanStatus) {
            user.setBannedAt(LocalDateTime.now());
        } else {
            user.setBannedAt(null);
        }

        return userRepository.save(user);
    }

    public void deleteReport(Authentication authentication, Long id) {
        validateAdminAccess(authentication);

        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));

        reportRepository.delete(report);
    }

    private void validateAdminAccess(Authentication authentication) {
        User user = helper.getCurrentUser(authentication);
        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }
        if (!ADMIN_ROLE.equals(user.getRole())) {
            throw new UnauthorizedException("Admin access required");
        }
    }

    private User getUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}