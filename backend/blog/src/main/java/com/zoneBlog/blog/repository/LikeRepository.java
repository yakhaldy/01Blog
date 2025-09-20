package com.zoneBlog.blog.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.zoneBlog.blog.model.Like;

public interface LikeRepository extends JpaRepository<Like, Long> {
    Boolean existsByUser_IdAndPost_Id(Long userId, Long postId);
    Long countByPost_Id(Long postId);
    void deleteByUser_IdAndPost_Id(Long userId, Long postId);
    Like findByUser_IdAndPost_Id(Long userId, Long postId);


}
