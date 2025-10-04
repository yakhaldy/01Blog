package com.zoneBlog.blog.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column( unique = true)
    private String username;

    @Column(nullable = false)
    @JsonIgnore
    private String password;

    @Column(nullable = false)
    private String role; //  "ROLE_USER" or "ROLE_ADMIN"
    
    @Column(nullable = false)
    private String email; 

    private String bio;
    private String avatar;

    private Long Followers;
    private Long Following;

    @Column(nullable = false)
    private Boolean isBanned = false;

}
