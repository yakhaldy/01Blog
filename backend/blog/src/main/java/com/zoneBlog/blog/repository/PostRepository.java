package com.zoneBlog.blog.repository;

import com.zoneBlog.blog.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {
}
