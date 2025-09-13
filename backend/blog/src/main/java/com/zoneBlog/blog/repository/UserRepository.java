package com.zoneBlog.blog.repository;


import com.zoneBlog.blog.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String Email);
    Optional<User> findByUsername(String Username);
}