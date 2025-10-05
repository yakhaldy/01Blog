package com.zoneBlog.blog.repository;

import com.zoneBlog.blog.model.Post;
import java.util.List;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findAllByOrderByCreatedAtDesc();
    Optional<Post>  findById(Long id);
    List<Post>  findByUser_IdOrderByCreatedAtDesc(Long id);
    List<Post> findByUser_IdInOrderByCreatedAtDesc(List<Long> userIds);
    Long countByUser_Id(Long userId);

    // Page<Post> findByUser_IdInOrderByCreatedAtDesc(List<Long> userIds, Pageable pageable);



}
