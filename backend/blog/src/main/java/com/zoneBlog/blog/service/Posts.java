package com.zoneBlog.blog.service;

import com.zoneBlog.blog.dataTransferObj.CommentRequest;
import com.zoneBlog.blog.dataTransferObj.PostRequest;
import com.zoneBlog.blog.exception.ResourceNotFoundException;
import com.zoneBlog.blog.exception.UnauthorizedException;
import com.zoneBlog.blog.model.*;
import com.zoneBlog.blog.repository.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import static com.zoneBlog.blog.model.Notification.NotificationType.*;

@Service
public class Posts {

    private static final String ADMIN_ROLE = "ROLE_ADMIN";

    private final PostRepository postRepository;
    private final LikeRepository likeRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final FollowRepository followRepository;
    private final NotificationRepository notificationRepository;
    private final Helper helper;
    private final NotificationService notificationService;

    public Posts(PostRepository postRepository, LikeRepository likeRepository,
            UserRepository userRepository, CommentRepository commentRepository,
            FollowRepository followRepository, NotificationRepository notificationRepository,
            Helper helper, NotificationService notificationService) {
        this.postRepository = postRepository;
        this.likeRepository = likeRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
        this.followRepository = followRepository;
        this.notificationRepository = notificationRepository;
        this.helper = helper;
        this.notificationService = notificationService;
    }

    @Transactional
    public Post createPost(Authentication authentication, PostRequest request, MultipartFile mediaFile) {
        User user = getUserOrThrow(authentication);

        Post post = buildPost(user, request.getTitle().trim(), request.getDescription().trim());

        if (mediaFile != null && !mediaFile.isEmpty()) {
            String mediaPath = helper.handleFileUpload(mediaFile);
            post.setMediaUrl(mediaPath);
        }

        postRepository.save(post);
        notifyFollowersAboutNewPost(user, post);

        return post;
    }

    @Transactional(readOnly = true)
    public Page<Post> getPosts(Authentication authentication, Pageable pageable) {
        User user = getUserOrThrow(authentication);

        if (ADMIN_ROLE.equals(user.getRole())) {
            Page<Post> allPosts = postRepository.findAll(pageable);
            return addLikeStatus(allPosts, user.getId());
        }

        List<Long> followingIds = getFollowingIds(user.getId());
        followingIds.add(user.getId());

        Page<Post> postsPage = postRepository.findByUser_IdInOrderByCreatedAtDesc(followingIds, pageable);
        return addLikeStatus(postsPage, user.getId());
    }

    @Transactional
    public void deletePost(Long id, Authentication authentication) {
        User user = getUserOrThrow(authentication);
        Post post = getPostOrThrow(id);

        validatePostOwnership(post, user);

        likeRepository.deleteByPost_Id(post.getId());
        commentRepository.deleteByPost_Id(post.getId());
        postRepository.delete(post);

        helper.deleteOldMediaFile(post.getMediaUrl());
    }

    @Transactional
    public Post updatePost(Long id, Authentication authentication, PostRequest request,
            MultipartFile mediaFile, String removeImage) {
        User user = getUserOrThrow(authentication);
        Post post = getPostOrThrow(id);

        validatePostOwnershipStrict(post, user);

        post.setTitle(request.getTitle().trim());
        post.setDescription(request.getDescription().trim());

        handleMediaUpdate(post, mediaFile, removeImage);

        return postRepository.save(post);
    }

    @Transactional
    public Post likePost(Long id, Authentication authentication) {
        User user = getUserOrThrow(authentication);
        Post post = getPostOrThrow(id);

        boolean alreadyLiked = likeRepository.existsByUser_IdAndPost_Id(user.getId(), post.getId());

        if (alreadyLiked) {
            unlikePost(user, post);
        } else {
            performLike(user, post);
        }

        post.setLikesCount(likeRepository.countByPost_Id(post.getId()));
        return postRepository.save(post);
    }

    @Transactional(readOnly = true)
    public Page<Post> getMyPosts(Authentication authentication, Pageable pageable) {
        User user = getUserOrThrow(authentication);
        Page<Post> postsPage = postRepository.findByUser_IdOrderByCreatedAtDesc(user.getId(), pageable);
        return addLikeStatus(postsPage, user.getId());
    }

    @Transactional(readOnly = true)
    public Page<Post> getPostsUser(Authentication authentication, String username, Pageable pageable) {
        User currentUser = getUserOrThrow(authentication);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Page<Post> postsPage = postRepository.findByUser_IdOrderByCreatedAtDesc(user.getId(), pageable);
        return addLikeStatus(postsPage, currentUser.getId());
    }

    @Transactional(readOnly = true)
    public Post getPost(Authentication authentication, Long id) {
        User currentUser = getUserOrThrow(authentication);
        Post post = getPostOrThrow(id);

        post.setIsLiked(likeRepository.existsByUser_IdAndPost_Id(currentUser.getId(), post.getId()));
        return post;
    }

    @Transactional
    public Comment createComment(Authentication authentication, CommentRequest request) {
        User currentUser = getUserOrThrow(authentication);
        Post post = getPostOrThrow(request.getPostId());

        Comment comment = buildComment(currentUser, post, request.getContent().trim());
        commentRepository.save(comment);

        updatePostCommentCount(post);

        if (!currentUser.getId().equals(post.getUser().getId())) {
            notificationService.addNotification(
                    post.getUser(), currentUser, COMMENT, post, comment,
                    currentUser.getUsername() + " commented on your post.");
        }

        return comment;
    }

    @Transactional(readOnly = true)
    public List<Comment> getPostComments(Authentication authentication, Long postId) {
        getUserOrThrow(authentication);
        getPostOrThrow(postId);
        return commentRepository.findBypost_Id(postId);
    }

    @Transactional
    public Comment updateComment(Authentication authentication, Long commentId, CommentRequest request) {
        User currentUser = getUserOrThrow(authentication);
        Comment comment = getCommentOrThrow(commentId);

        validateCommentOwnership(comment, currentUser);

        comment.setContent(request.getContent().trim());
        return commentRepository.save(comment);
    }

    @Transactional
    public void deleteComment(Authentication authentication, Long commentId) {
        User currentUser = getUserOrThrow(authentication);
        Comment comment = getCommentOrThrow(commentId);

        validateCommentDeletion(comment, currentUser);

        Post post = getPostOrThrow(comment.getPost().getId());
        commentRepository.delete(comment);

        updatePostCommentCount(post);
    }

    // ==================== Private Helper Methods ====================

    private User getUserOrThrow(Authentication authentication) {
        User user = helper.getCurrentUser(authentication);
        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }
        return user;
    }

    private Post getPostOrThrow(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
    }

    private Comment getCommentOrThrow(Long id) {
        return commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
    }

    private void validatePostOwnership(Post post, User user) {
        if (!post.getUser().getId().equals(user.getId()) && !ADMIN_ROLE.equals(user.getRole())) {
            throw new UnauthorizedException("You can only delete your own posts");
        }
    }

    private void validatePostOwnershipStrict(Post post, User user) {
        if (!post.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("You can only update your own posts");
        }
    }

    private void validateCommentOwnership(Comment comment, User user) {
        if (!comment.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("You can only update your own comments");
        }
    }

    private void validateCommentDeletion(Comment comment, User user) {
        if (!comment.getUser().getId().equals(user.getId()) && !ADMIN_ROLE.equals(user.getRole())) {
            throw new UnauthorizedException("You can only delete your own comments");
        }
    }

    private Post buildPost(User user, String title, String description) {
        Post post = new Post();
        post.setTitle(title);
        post.setDescription(description);
        post.setUser(user);
        post.setCreatedAt(LocalDateTime.now());
        return post;
    }

    private Comment buildComment(User user, Post post, String content) {
        Comment comment = new Comment();
        comment.setContent(content);
        comment.setPost(post);
        comment.setUser(user);
        return comment;
    }

    private void handleMediaUpdate(Post post, MultipartFile mediaFile, String removeImage) {
        if (mediaFile != null && !mediaFile.isEmpty()) {
            helper.deleteOldMediaFile(post.getMediaUrl());
            String mediaPath = helper.handleFileUpload(mediaFile);
            post.setMediaUrl(mediaPath);
        } else if ("true".equals(removeImage)) {
            helper.deleteOldMediaFile(post.getMediaUrl());
            post.setMediaUrl(null);
        }
    }

    private List<Long> getFollowingIds(Long userId) {
        List<Follow> followings = followRepository.findByFollower_Id(userId);
        return followings.stream()
                .map(f -> f.getFollowing().getId())
                .collect(Collectors.toList());
    }

    private Page<Post> addLikeStatus(Page<Post> postsPage, Long userId) {
        List<Post> updatedPosts = postsPage.getContent().stream()
                .map(post -> {
                    post.setIsLiked(likeRepository.existsByUser_IdAndPost_Id(userId, post.getId()));
                    return post;
                })
                .collect(Collectors.toList());

        return new PageImpl<>(updatedPosts, postsPage.getPageable(), postsPage.getTotalElements());
    }

    private void notifyFollowersAboutNewPost(User user, Post post) {
        List<Follow> follows = followRepository.findByFollowing_Id(user.getId());
        for (Follow follow : follows) {
            User follower = userRepository.findById(follow.getFollower().getId()).orElse(null);
            if (follower != null) {
                notificationService.addNotification(
                        follower, user, POST, post, null,
                        user.getUsername() + " created a new post.");
            }
        }
    }

    private void unlikePost(User user, Post post) {
        Like like = likeRepository.findByUser_IdAndPost_Id(user.getId(), post.getId());
        if (like != null) {
            likeRepository.delete(like);

            if (!user.getId().equals(post.getUser().getId())) {
                notificationRepository.deleteByRecipientAndSenderAndPostAndType(
                        post.getUser(), user, post, LIKE);
            }
        }
    }

    private void performLike(User user, Post post) {
        Like like = new Like();
        like.setPost(post);
        like.setUser(user);
        likeRepository.save(like);

        if (!user.getId().equals(post.getUser().getId())) {
            notificationService.addNotification(
                    post.getUser(), user, LIKE, post, null,
                    user.getUsername() + " liked your post.");
        }
    }

    private void updatePostCommentCount(Post post) {
        post.setCommentsCount(commentRepository.countByPost_Id(post.getId()));
        postRepository.save(post);
    }
}