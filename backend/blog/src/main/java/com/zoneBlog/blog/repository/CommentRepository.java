package com.zoneBlog.blog.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.zoneBlog.blog.model.Comment;
import java.util.*;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findBypost_Id(Long postId);
    Long countByPost_Id(Long postId);
    void deleteByPost_Id( Long postId);

}
