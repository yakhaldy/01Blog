package com.zoneBlog.blog.model;


import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "posts")
@Data
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user; 

    @Column(nullable = false)
    private String description;

    private String mediaUrl; 

    private LocalDateTime createdAt = LocalDateTime.now();
}

