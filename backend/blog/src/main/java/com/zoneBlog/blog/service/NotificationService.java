package com.zoneBlog.blog.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.zoneBlog.blog.model.Notification;
import com.zoneBlog.blog.model.User;
import com.zoneBlog.blog.repository.NotificationRepository;

@Service
public class NotificationService {
    @Autowired
    private NotificationRepository  notificationRepository;
    
    @Autowired
    private Helper helper;

    public List<Notification> getnotifications(Authentication authentication){
         User user = helper.getCurrentUser(authentication);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user);
    }
}
