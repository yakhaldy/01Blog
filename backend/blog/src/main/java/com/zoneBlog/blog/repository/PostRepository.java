package com.zoneBlog.blog.repository;

import com.zoneBlog.blog.model.Post;
import java.util.List;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findAllByOrderByCreatedAtDesc();

    Optional<Post> findById(Long id);

    Page<Post> findByUser_IdOrderByCreatedAtDesc(Long id,Pageable pageable);

    Page<Post> findByUser_IdAndStatueOrderByCreatedAtDesc(Long id, String statue, Pageable pageable);

    List<Post> findByUser_IdInOrderByCreatedAtDesc(List<Long> userIds);

    Long countByUser_Id(Long userId);

    // Page<Post> findByUser_IdInOrderByCreatedAtDesc(List<Long> userIds, Pageable pageable);
    Page<Post> findByUser_IdInAndStatueOrderByCreatedAtDesc(List<Long> userIds, String statue, Pageable pageable);

    Page<Post> findAll(Pageable pageable);


}
