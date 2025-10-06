package com.zoneBlog.blog.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.zoneBlog.blog.model.Comment;
import com.zoneBlog.blog.model.Notification;
import com.zoneBlog.blog.model.Post;
import com.zoneBlog.blog.model.User;
import com.zoneBlog.blog.repository.NotificationRepository;
import com.zoneBlog.blog.controller.NotificationController;

@Service
public class NotificationService {
    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private Helper helper;

    @Autowired
    private NotificationController notificationController;

    public List<Notification> getnotifications(Authentication authentication) {
        User user = helper.getCurrentUser(authentication);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        
        List<Notification> notification = notificationRepository.findByRecipientOrderByCreatedAtDesc(user);
        return notification;
    }

    public void addNotification(User recipient, User sender, Notification.NotificationType type, Post post,
            Comment comment, String message) {
        if (recipient == null || sender == null || type == null) {
            throw new IllegalArgumentException("Recipient, sender, and type must not be null");
        }

        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setSender(sender);
        notification.setType(type);
        notification.setPost(post);
        notification.setComment(comment);
        notification.setMessage(message);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setRead(false);

        notificationRepository.save(notification);

        Long count = notificationRepository.countByRecipient_Id(recipient.getId());
        
        System.out.println("📊 Unread notification count: " + count);
        
        notificationController.sendNotificationCount(recipient.getId() ,count);
    }

    // public Long getCountNotification(Authentication authentication){
    //     User user = helper.getCurrentUser(authentication);

    //     return notificationRepository.countByRecipient_Id(user.getId());
    // }
}
