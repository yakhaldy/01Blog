package com.zoneBlog.blog.repository;

import com.zoneBlog.blog.model.Notification;
import com.zoneBlog.blog.model.Notification.NotificationType;

import jakarta.transaction.Transactional;

import com.zoneBlog.blog.model.Post;
import com.zoneBlog.blog.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);

    void deleteByRecipientAndSenderAndPostAndType(User recipient, User sender, Post post, NotificationType type);

    @Modifying
    @Transactional
    void deleteByRecipientAndSenderAndType(User recipient, User sender, NotificationType type);

    Long countByRecipient_Id(Long recipientId);

    // List<Notification> findByRecipientAndIsReadOrderByCreatedAtDesc(User
    // recipient, boolean isRead);

    // long countByRecipientAndIsRead(User recipient, boolean isRead);

    // void deleteByRecipient(User recipient);
}