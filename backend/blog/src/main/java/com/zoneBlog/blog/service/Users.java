package com.zoneBlog.blog.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.zoneBlog.blog.model.Follow;
import com.zoneBlog.blog.model.User;
import com.zoneBlog.blog.repository.FollowRepository;
import com.zoneBlog.blog.repository.NotificationRepository;
import com.zoneBlog.blog.repository.PostRepository;
import com.zoneBlog.blog.repository.ReportRepository;
import com.zoneBlog.blog.repository.UserRepository;

import static com.zoneBlog.blog.model.Notification.NotificationType.FOLLOW;

@Service
@Transactional
public class Users {

    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final PostRepository postRepository;
    private final ReportRepository reportRepository;
    private final NotificationRepository notificationRepository;
    private final Helper helper;
    private final NotificationService notificationService;

    public Users(UserRepository userRepository, FollowRepository followRepository,
                PostRepository postRepository, ReportRepository reportRepository,
                NotificationRepository notificationRepository, Helper helper,
                NotificationService notificationService) {
        this.userRepository = userRepository;
        this.followRepository = followRepository;
        this.postRepository = postRepository;
        this.reportRepository = reportRepository;
        this.notificationRepository = notificationRepository;
        this.helper = helper;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllUsers(Authentication authentication) {
        User currentUser = getUserOrThrow(authentication);
        
        List<User> users = userRepository.findByUsernameNot(currentUser.getUsername());
        List<Map<String, Object>> response = new ArrayList<>();

        for (User user : users) {
            response.add(buildUserResponse(user, currentUser.getId()));
        }
        
        return response;
    }

    public void follow(Authentication authentication, Long userId) {
        User currentUser = getUserOrThrow(authentication);

        if (currentUser.getId().equals(userId)) {
            throw new IllegalArgumentException("You cannot follow yourself");
        }

        User userToFollow = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User to follow not found"));

        boolean isFollowing = followRepository.existsByFollower_IdAndFollowing_Id(
            currentUser.getId(), userId
        );

        if (isFollowing) {
            unfollowUser(currentUser, userToFollow);
        } else {
            followUser(currentUser, userToFollow);
        }

        updateFollowCounts(currentUser, userToFollow);
    }

    // Private helper methods

    private User getUserOrThrow(Authentication authentication) {
        User user = helper.getCurrentUser(authentication);
        if (user == null) {
            throw new RuntimeException("Authenticated user not found");
        }
        return user;
    }

    private Map<String, Object> buildUserResponse(User user, Long currentUserId) {
        Map<String, Object> userResponse = new HashMap<>();
        userResponse.put("id", user.getId());
        userResponse.put("username", user.getUsername());
        userResponse.put("email", user.getEmail());
        userResponse.put("avatar", user.getAvatar());
        userResponse.put("isBanned", user.getIsBanned());
        userResponse.put("followersCount", user.getFollowers());
        userResponse.put("followingCount", user.getFollowing());
        userResponse.put("postsCount", postRepository.countByUser_Id(user.getId()));
        userResponse.put("reportsCount", reportRepository.countByReportedUser_Id(user.getId()));

        boolean isFollowing = followRepository.existsByFollower_IdAndFollowing_Id(
            currentUserId, user.getId()
        );
        userResponse.put("isfollowing", isFollowing);

        return userResponse;
    }

    private void followUser(User follower, User following) {
        Follow follow = new Follow();
        follow.setFollower(follower);
        follow.setFollowing(following);
        followRepository.save(follow);

        notificationService.addNotification(
            following, 
            follower, 
            FOLLOW, 
            null, 
            null,
            follower.getUsername() + " started following you."
        );
    }

    private void unfollowUser(User follower, User following) {
        Follow follow = followRepository.findByFollower_IdAndFollowing_Id(
            follower.getId(), following.getId()
        );
        
        if (follow != null) {
            followRepository.delete(follow);
            notificationRepository.deleteByRecipientAndSenderAndType(following, follower, FOLLOW);
        }
    }

    private void updateFollowCounts(User follower, User following) {
      
        follower.setFollowing(followRepository.countByFollower_Id(follower.getId()));
        follower.setFollowers(followRepository.countByFollowing_Id(follower.getId()));

        
        following.setFollowers(followRepository.countByFollowing_Id(following.getId()));
        following.setFollowing(followRepository.countByFollower_Id(following.getId()));

        userRepository.save(follower);
        userRepository.save(following);
    }
}