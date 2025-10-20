package com.zoneBlog.blog.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;


import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.zoneBlog.blog.model.Comment;
import com.zoneBlog.blog.model.Notification;
import com.zoneBlog.blog.model.Post;
import com.zoneBlog.blog.model.User;
import com.zoneBlog.blog.repository.NotificationRepository;
import com.zoneBlog.blog.controller.NotificationController;

@Service
public class NotificationService {


    private final NotificationRepository notificationRepository;
    private final Helper helper;
    private final NotificationController notificationController;

    public NotificationService(NotificationRepository notificationRepository, 
                              Helper helper, 
                              NotificationController notificationController) {
        this.notificationRepository = notificationRepository;
        this.helper = helper;
        this.notificationController = notificationController;
    }


    @Transactional
    public List<Notification> getNotifications(Authentication authentication) {
        User user = getUserOrThrow(authentication);

        List<Notification> notifications = notificationRepository
            .findByRecipientOrderByCreatedAtDesc(user);

        boolean anyUpdated = markNotificationsAsRead(notifications);

        if (anyUpdated) {
            notificationRepository.saveAll(notifications);
            notificationRepository.flush();
        }

        Long unreadCount = notificationRepository.countByRecipient_IdAndIsReadFalse(user.getId());
        sendNotificationCountAsync(user.getId(), unreadCount);

        return notifications;
    }

    @Transactional
    public void addNotification(User recipient, User sender, Notification.NotificationType type, 
                               Post post, Comment comment, String message) {
        validateNotificationParameters(recipient, sender, type);

        
        if (recipient.getId().equals(sender.getId())) {
            return;
        }

        Notification notification = createNotification(recipient, sender, type, post, comment, message);
        notificationRepository.save(notification);
        notificationRepository.flush();

        
        Long unreadCount = notificationRepository.countByRecipient_IdAndIsReadFalse(recipient.getId());
        sendNotificationCountAsync(recipient.getId(), unreadCount);
    }


    private User getUserOrThrow(Authentication authentication) {
        User user = helper.getCurrentUser(authentication);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        return user;
    }

    private void validateNotificationParameters(User recipient, User sender, 
                                               Notification.NotificationType type) {
        if (recipient == null || sender == null || type == null) {
            throw new IllegalArgumentException("Recipient, sender, and type must not be null");
        }
    }

    private boolean markNotificationsAsRead(List<Notification> notifications) {
        boolean anyUpdated = false;
        
        for (Notification notification : notifications) {
            if (!notification.isRead()) {
                notification.setRead(true);
                anyUpdated = true;
            }
        }
        
        return anyUpdated;
    }

    private Notification createNotification(User recipient, User sender, 
                                          Notification.NotificationType type,
                                          Post post, Comment comment, String message) {
        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setSender(sender);
        notification.setType(type);
        notification.setPost(post);
        notification.setComment(comment);
        notification.setMessage(message);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setRead(false);
        
        return notification;
    }


    @Async
    private void sendNotificationCountAsync(Long userId, Long count) {
        try {
            notificationController.sendNotificationCount(userId, count);
        } catch (Exception e) {
        }
    }
}