package com.zoneBlog.blog.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "reports")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Reported user
    @ManyToOne
    @JoinColumn(name = "reported_user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User reportedUser;

    @ManyToOne
    @JoinColumn(name = "reported_post_id", nullable = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Post reportedPost;

    private String reportReason;

    // Reporter
    @ManyToOne
    @JoinColumn(name = "reported_by_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User reportedBy;

    private LocalDateTime reportedAt = LocalDateTime.now();

    private String status;

}
