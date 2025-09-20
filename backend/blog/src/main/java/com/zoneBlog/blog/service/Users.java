package com.zoneBlog.blog.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.zoneBlog.blog.model.Follow;
import com.zoneBlog.blog.model.User;
import com.zoneBlog.blog.repository.FollowRepository;
import com.zoneBlog.blog.repository.UserRepository;

@Service
public class Users {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FollowRepository followRepository;
    @Autowired
    private Helper helper;

    public List<User> getAllUsers(Authentication authentication) {
        User currentUser = helper.getCurrentUser(authentication);
        if (currentUser == null) {
            throw new RuntimeException("Authenticated user not found");
        }
        return userRepository.findByUsernameNot(currentUser.getUsername());
    }

    public void follow(Authentication authentication, Long userId) {
        User currentUser = helper.getCurrentUser(authentication);

        if (currentUser == null) {
            throw new RuntimeException("Authenticated user not found");
        }

        if (currentUser.getId().equals(userId)) {
            throw new IllegalArgumentException("You cannot follow yourself");
        }

        User userToFollow = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User to follow not found"));

        boolean isFollowing = followRepository.existsByFollower_IdAndFollowing_Id(currentUser.getId(), userId);

        if (isFollowing) {
            Follow follow = followRepository.findByFollower_IdAndFollowing_Id(currentUser.getId(), userId);
            followRepository.delete(follow);
        } else {
            Follow follow = new Follow();
            follow.setFollower(currentUser);
            follow.setFollowing(userToFollow);
            followRepository.save(follow);
        }

        currentUser.setFollowing(followRepository.countByFollower_Id(currentUser.getId()));

        userToFollow.setFollowers(followRepository.countByFollowing_Id(userToFollow.getId()));

        currentUser.setFollowers(followRepository.countByFollowing_Id(currentUser.getId()));

        userRepository.save(currentUser);
        userRepository.save(userToFollow);
    }
}
