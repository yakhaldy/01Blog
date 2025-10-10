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

    public List<Notification> getNotifications(Authentication authentication) {
        User user = helper.getCurrentUser(authentication);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        List<Notification> notifications = notificationRepository.findByRecipientOrderByCreatedAtDesc(user);

        boolean anyUpdated = false;
        for (Notification notification : notifications) {
            if (!notification.isRead()) {
                notification.setRead(true);
                anyUpdated = true;
            }
        }

        if (anyUpdated) {
            notificationRepository.saveAll(notifications);
        }

        Long unreadCount = notificationRepository.countByRecipient_IdAndIsReadFalse(user.getId());
        notificationController.sendNotificationCount(user.getId(), unreadCount);

        return notifications;
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

        Long unreadCount = notificationRepository.countByRecipient_IdAndIsReadFalse(recipient.getId());
        notificationController.sendNotificationCount(recipient.getId(), unreadCount);
    }

}
