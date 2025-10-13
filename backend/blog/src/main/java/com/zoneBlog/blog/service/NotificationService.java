// package com.zoneBlog.blog.service;

// import java.time.LocalDateTime;
// import java.util.List;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.security.core.Authentication;
// import org.springframework.stereotype.Service;

// import com.zoneBlog.blog.model.Comment;
// import com.zoneBlog.blog.model.Notification;
// import com.zoneBlog.blog.model.Post;
// import com.zoneBlog.blog.model.User;
// import com.zoneBlog.blog.repository.NotificationRepository;
// import com.zoneBlog.blog.controller.NotificationController;

// @Service
// public class NotificationService {
//     @Autowired
//     private NotificationRepository notificationRepository;

//     @Autowired
//     private Helper helper;

//     @Autowired
//     private NotificationController notificationController;

//     public List<Notification> getNotifications(Authentication authentication) {
//         User user = helper.getCurrentUser(authentication);
//         if (user == null) {
//             throw new RuntimeException("User not found");
//         }

//         List<Notification> notifications = notificationRepository.findByRecipientOrderByCreatedAtDesc(user);

//         boolean anyUpdated = false;
//         for (Notification notification : notifications) {
//             if (!notification.isRead()) {
//                 notification.setRead(true);
//                 anyUpdated = true;
//             }
//         }

//         if (anyUpdated) {
//             notificationRepository.saveAll(notifications);
//         }

//         Long unreadCount = notificationRepository.countByRecipient_IdAndIsReadFalse(user.getId());
//         notificationController.sendNotificationCount(user.getId(), unreadCount);

//         return notifications;
//     }

//     public void addNotification(User recipient, User sender, Notification.NotificationType type, Post post,
//             Comment comment, String message) {
//         if (recipient == null || sender == null || type == null) {
//             throw new IllegalArgumentException("Recipient, sender, and type must not be null");
//         }

//         Notification notification = new Notification();
//         notification.setRecipient(recipient);
//         notification.setSender(sender);
//         notification.setType(type);
//         notification.setPost(post);
//         notification.setComment(comment);
//         notification.setMessage(message);
//         notification.setCreatedAt(LocalDateTime.now());
//         notification.setRead(false);

//         notificationRepository.save(notification);

//         Long unreadCount = notificationRepository.countByRecipient_IdAndIsReadFalse(recipient.getId());
//         notificationController.sendNotificationCount(recipient.getId(), unreadCount);
//     }

// }

package com.zoneBlog.blog.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
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
    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private Helper helper;

    @Autowired
    private NotificationController notificationController;

    @Transactional
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
            // Flush to ensure the database is updated before counting
            notificationRepository.flush();
        }

        // Get updated count after marking as read
        Long unreadCount = notificationRepository.countByRecipient_IdAndIsReadFalse(user.getId());
        System.out.println("📊 Sending updated count after marking as read: " + unreadCount);
        
        // Send the updated count via SSE in a separate thread to avoid blocking
        new Thread(() -> {
            notificationController.sendNotificationCount(user.getId(), unreadCount);
        }).start();

        return notifications;
    }

    @Transactional
    public void addNotification(User recipient, User sender, Notification.NotificationType type, Post post,
            Comment comment, String message) {
        if (recipient == null || sender == null || type == null) {
            throw new IllegalArgumentException("Recipient, sender, and type must not be null");
        }

        // Don't send notifications to yourself
        if (recipient.getId().equals(sender.getId())) {
            System.out.println("⚠️ Skipping self-notification for user: " + sender.getId());
            return;
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
        // Flush to ensure the database is updated before counting
        notificationRepository.flush();

        Long unreadCount = notificationRepository.countByRecipient_IdAndIsReadFalse(recipient.getId());
        System.out.println("📊 New notification created. Unread count for user " + recipient.getId() + ": " + unreadCount);
        
        // Send notification count via SSE in a separate thread to avoid blocking
        new Thread(() -> {
            notificationController.sendNotificationCount(recipient.getId(), unreadCount);
        }).start();
    }

    /**
     * Mark a specific notification as read
     */
    @Transactional
    public void markAsRead(Long notificationId, Authentication authentication) {
        User user = helper.getCurrentUser(authentication);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("Notification not found"));

        // Verify the notification belongs to the current user
        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to notification");
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            notificationRepository.save(notification);
            notificationRepository.flush();

            Long unreadCount = notificationRepository.countByRecipient_IdAndIsReadFalse(user.getId());
            System.out.println("📊 Marked notification as read. Updated count: " + unreadCount);
            
            new Thread(() -> {
                notificationController.sendNotificationCount(user.getId(), unreadCount);
            }).start();
        }
    }

    /**
     * Mark all notifications as read for the current user
     */
    @Transactional
    public void markAllAsRead(Authentication authentication) {
        User user = helper.getCurrentUser(authentication);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        List<Notification> unreadNotifications = notificationRepository
            .findByRecipient_IdAndIsReadFalse(user.getId());

        if (!unreadNotifications.isEmpty()) {
            unreadNotifications.forEach(n -> n.setRead(true));
            notificationRepository.saveAll(unreadNotifications);
            notificationRepository.flush();

            System.out.println("📊 Marked all notifications as read for user: " + user.getId());
            
            new Thread(() -> {
                notificationController.sendNotificationCount(user.getId(), 0L);
            }).start();
        }
    }

    /**
     * Get unread notification count for current user
     */
    @Transactional(readOnly = true)
    public Long getUnreadCount(Authentication authentication) {
        User user = helper.getCurrentUser(authentication);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        return notificationRepository.countByRecipient_IdAndIsReadFalse(user.getId());
    }
}