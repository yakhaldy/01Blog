package com.zoneBlog.blog.service;

import java.time.LocalDateTime;
import java.util.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.zoneBlog.blog.model.Report;
import com.zoneBlog.blog.model.User;
import com.zoneBlog.blog.repository.CommentRepository;
import com.zoneBlog.blog.repository.PostRepository;
import com.zoneBlog.blog.repository.ReportRepository;
import com.zoneBlog.blog.repository.UserRepository;

@Service
public class Admin {

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CommentRepository commentRepository;

 

    public List<Report> getReports(Authentication authentication) {
        return reportRepository.findAll();
    }

    public Map<String, Long> getDashboardStats(Authentication authentication) {
        Map<String, Long> dashboardStats = new HashMap<String, Long>();

        Long totalUsers = userRepository.count();
        dashboardStats.put("totalUsers", totalUsers);
        Long totalPosts = postRepository.count();
        dashboardStats.put("totalPosts", totalPosts);
        Long totalReports = reportRepository.count();
        dashboardStats.put("totalReports", totalReports);
        Long bannedUsers = userRepository.countByIsBanned(true);
        dashboardStats.put("bannedUsers", bannedUsers);
        Long activeReports = reportRepository.countByStatus("pending");
        dashboardStats.put("activeReports", activeReports);

        return dashboardStats;
    }


    public void deleteUser(Authentication authentication, Long id){
        User user = userRepository.findById(id).orElse(null);
         if (user == null) {
            throw new RuntimeException("User not found");
        }
        // commentRepository.deleteByUser_Id(user.getId());
        userRepository.delete(user);
    }

    public User banUser(Authentication authentication, Long id){
         User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        if (user.getIsBanned()){
            user.setIsBanned(false);
        }else {
            user.setIsBanned(true);
            user.setBannedAt(LocalDateTime.now());
        }

        userRepository.save(user);
        return user;
    }

    public void deleteReport(Authentication authentication, Long id){
        Report report = reportRepository.findById(id).orElse(null);
        if (report == null){
            throw new RuntimeException("report not found");

        }
        reportRepository.delete(report);
    }
}
