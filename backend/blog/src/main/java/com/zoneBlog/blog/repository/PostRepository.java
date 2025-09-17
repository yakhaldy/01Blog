package com.zoneBlog.blog.repository;

import com.zoneBlog.blog.model.Post;
import java.util.List;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findAllByOrderByCreatedAtDesc();
    Optional<Post>  findById(Long id);
}
