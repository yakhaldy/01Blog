package com.zoneBlog.blog.repository;

import com.zoneBlog.blog.model.Notification;
import com.zoneBlog.blog.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);
    
    // List<Notification> findByRecipientAndIsReadOrderByCreatedAtDesc(User recipient, boolean isRead);
    
    // long countByRecipientAndIsRead(User recipient, boolean isRead);
    
    // void deleteByRecipient(User recipient);
}