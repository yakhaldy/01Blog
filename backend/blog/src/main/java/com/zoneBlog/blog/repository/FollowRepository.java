package com.zoneBlog.blog.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.zoneBlog.blog.model.Follow;
import java.util.*;

@Repository
public interface FollowRepository extends JpaRepository<Follow, Long> {

    // count all followers of a user
    Long countByFollowing_Id(Long followingId);

    // count all users a specific user is following
    Long countByFollower_Id(Long followerId);

    Boolean existsByFollower_IdAndFollowing_Id(Long followerId, Long followingId);
    Follow findByFollower_IdAndFollowing_Id(Long followerId, Long followingId);


    void deleteByFollower_IdAndFollowing_Id(Long followerId, Long followingId);
     List<Follow> findByFollower_Id(Long followerId);
}
