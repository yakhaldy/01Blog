package com.zoneBlog.blog.repository;


import com.zoneBlog.blog.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String Email);
    Optional<User> findByUsername(String Username);
    List<User> findByUsernameNot(String username);
    boolean existsByUsername(String username);

}