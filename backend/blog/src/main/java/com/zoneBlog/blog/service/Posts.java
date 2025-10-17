package com.zoneBlog.blog.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.data.domain.PageImpl;
import org.springframework.security.core.Authentication;

import com.zoneBlog.blog.dataTransferObj.CommentRequest;
import com.zoneBlog.blog.dataTransferObj.PostRequest;
import com.zoneBlog.blog.model.Post;
import com.zoneBlog.blog.model.User;
import com.zoneBlog.blog.model.Follow;
import com.zoneBlog.blog.model.Like;
import com.zoneBlog.blog.repository.PostRepository;
import com.zoneBlog.blog.repository.UserRepository;

import jakarta.transaction.Transactional;
import com.zoneBlog.blog.model.Comment;

import com.zoneBlog.blog.repository.FollowRepository;
import com.zoneBlog.blog.repository.LikeRepository;
import com.zoneBlog.blog.repository.NotificationRepository;
import com.zoneBlog.blog.repository.CommentRepository;
import static com.zoneBlog.blog.model.Notification.NotificationType.POST;
import static com.zoneBlog.blog.model.Notification.NotificationType.LIKE;
import static com.zoneBlog.blog.model.Notification.NotificationType.COMMENT;
import java.util.stream.Collectors;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@Transactional
public class Posts {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CommentRepository CommentRepository;

    @Autowired
    private FollowRepository followRepository;

    @Autowired
    private Helper helper;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationRepository notificationRepository;

    public Post createPost(Authentication authentication, @RequestBody PostRequest request, MultipartFile mediaFile) {
        String description = request.getDescription();
        String title = request.getTitle();

        User user = helper.getCurrentUser(authentication);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        if (title == null || title.trim().isEmpty()) {
            throw new RuntimeException("Post title cannot be empty");
        }
        title = title.replaceAll("\r\n", "\n");
        if (title.length() > 280) {
            throw new RuntimeException("Post description cannot exceed 280 characters");
        }
        if (description == null || description.trim().isEmpty()) {
            throw new RuntimeException("Post description cannot be empty");
        }
        description = description.replaceAll("\r\n", "\n");
        if (description.length() > 5000) {
            throw new RuntimeException("Post description cannot exceed 5000 characters");
        }

        Post post = new Post();
        post.setTitle(title);
        post.setDescription(description.trim());
        post.setUser(user);
        post.setCreatedAt(LocalDateTime.now());

        if (mediaFile != null && !mediaFile.isEmpty()) {
            String mediaPath = helper.handleFileUpload(mediaFile);
            post.setMediaUrl(mediaPath);
        }
        postRepository.save(post);

        List<Follow> follows = followRepository.findByFollowing_Id(user.getId());
        for (Follow follow : follows) {
            Long followerId = follow.getFollower().getId();
            notificationService.addNotification(
                    userRepository.findById(followerId).orElse(null),
                    user,
                    POST,
                    post,
                    null,
                    user.getUsername() + " created a new post.");
        }

        return post;
    }

    // public List<Post> getPosts(Authentication authentication , Pageable pageable)
    // {
    // User user = helper.getCurrentUser(authentication);
    // if (user == null) {
    // throw new RuntimeException("User not found");
    // }
    // if (user.getRole().equals("ROLE_ADMIN")) {
    // return postRepository.findAll();
    // }

    // List<Follow> followings = followRepository.findByFollower_Id(user.getId());

    // List<Long> followingIds = followings.stream()
    // .map(f -> f.getFollowing().getId())
    // .collect(Collectors.toList());

    // followingIds.add(user.getId());

    // List<Post> posts =
    // postRepository.findByUser_IdInOrderByCreatedAtDesc(followingIds);

    // posts = posts.stream().map(p -> {
    // p.setIsLiked(likeRepository.existsByUser_IdAndPost_Id(user.getId(),
    // p.getId()));
    // return p;
    // }).collect(Collectors.toList());

    // return posts;
    // }
    public Page<Post> getPosts(Authentication authentication, Pageable pageable) {
        User user = helper.getCurrentUser(authentication);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        // Admin gets all posts (paginated)
        if (user.getRole().equals("ROLE_ADMIN")) {
            Page<Post> allPosts = postRepository.findAll(pageable);
            return addLikeStatus(allPosts, user.getId());
        }

        // Get IDs of followed users + current user
        List<Follow> followings = followRepository.findByFollower_Id(user.getId());
        List<Long> followingIds = followings.stream()
                .map(f -> f.getFollowing().getId())
                .collect(Collectors.toList());

        followingIds.add(user.getId());

        // Fetch paged posts from those users
        Page<Post> postsPage = postRepository.findByUser_IdInOrderByCreatedAtDesc(followingIds, pageable);

        return addLikeStatus(postsPage, user.getId());
    }

    private Page<Post> addLikeStatus(Page<Post> postsPage, Long userId) {
        List<Post> updatedPosts = postsPage.getContent().stream().map(post -> {
            post.setIsLiked(likeRepository.existsByUser_IdAndPost_Id(userId, post.getId()));
            return post;
        }).collect(Collectors.toList());

        return new PageImpl<>(updatedPosts, postsPage.getPageable(), postsPage.getTotalElements());
    }

    /************* */

    public void deletePost(Long id, Authentication authentication) {
        User user = helper.getCurrentUser(authentication);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        Post post = postRepository.findById(id).orElse(null);
        if (post == null) {
            throw new RuntimeException("Post not found");
        }

        if (!post.getUser().getId().equals(user.getId()) && !user.getRole().equals("ROLE_ADMIN")) {
            throw new RuntimeException("You can only delete your own posts");
        }

        likeRepository.deleteByPost_Id(post.getId());
        CommentRepository.deleteByPost_Id(post.getId());

        // notificationRepository.deleteByPost(post);
        postRepository.delete(post);
        helper.deleteOldMediaFile(post.getMediaUrl());

    }

    public Post updatePost(Long id, Authentication authentication, @RequestBody PostRequest request,
            MultipartFile mediaFile, String removeImage) {
        User user = helper.getCurrentUser(authentication);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        Post post = postRepository.findById(id).orElse(null);
        if (post == null) {
            throw new RuntimeException("Post not found");
        }

        if (!post.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only update your own posts");
        }
        String description = request.getDescription();
        if (description == null || description.trim().isEmpty()) {
            throw new RuntimeException("Post description cannot be empty");
        }

        description = description.replaceAll("\r\n", "\n");
        if (description.length() > 5000) {
            throw new RuntimeException("Post description cannot exceed 1000 characters");
        }
        post.setDescription(description);

        String title = request.getTitle();
        if (title == null || title.trim().isEmpty()) {
            throw new RuntimeException("Post title cannot be empty");
        }

        title = title.replaceAll("\r\n", "\n");
        if (title.length() > 280) {
            throw new RuntimeException("Post title cannot exceed 280 characters");
        }

        post.setTitle(title);
        ;

        if (mediaFile != null && !mediaFile.isEmpty()) {
            helper.deleteOldMediaFile(post.getMediaUrl());
            String mediaPath = helper.handleFileUpload(mediaFile);
            post.setMediaUrl(mediaPath);
        }
        if (removeImage != null && removeImage.equals("true")) {
            helper.deleteOldMediaFile(post.getMediaUrl());
            post.setMediaUrl(null);

        }
        postRepository.save(post);
        return post;
    }

    public Post likePost(Long id, Authentication authentication) {
        User user = helper.getCurrentUser(authentication);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        Post post = postRepository.findById(id).orElse(null);
        if (post == null) {
            throw new RuntimeException("Post not found");
        }

        if (likeRepository.existsByUser_IdAndPost_Id(user.getId(), post.getId())) {
            Like like = likeRepository.findByUser_IdAndPost_Id(user.getId(), post.getId());
            likeRepository.delete(like);
            if (!user.getId().equals(post.getUser().getId())) {
                notificationRepository.deleteByRecipientAndSenderAndPostAndType(post.getUser(), user, post, LIKE);
            }
        } else {
            Like like = new Like();
            like.setPost(post);
            like.setUser(user);
            likeRepository.save(like);
            if (!user.getId().equals(post.getUser().getId())) {
                notificationService.addNotification(post.getUser(), user, LIKE, post, null,
                        user.getUsername() + " liked your post.");
            }
        }
        post.setLikesCount(likeRepository.countByPost_Id(post.getId()));

        postRepository.save(post);

        return post;
    }

    public List<Post> getMyPosts(Authentication authentication) {
        User user = helper.getCurrentUser(authentication);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        List<Post> posts = postRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());
        posts = posts.stream().map(p -> {
            if (likeRepository.existsByUser_IdAndPost_Id(user.getId(), p.getId())) {
                p.setIsLiked(true);
            } else {
                p.setIsLiked(false);
            }
            return p;
        }).collect(Collectors.toList());
        return posts;
    }

    public List<Post> getPostsUser(Authentication authentication, String username) {
        User CurrentUser = helper.getCurrentUser(authentication);
        if (CurrentUser == null) {
            throw new RuntimeException("User not found");
        }
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        List<Post> posts = postRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());
        posts = posts.stream().map(p -> {
            if (likeRepository.existsByUser_IdAndPost_Id(CurrentUser.getId(), p.getId())) {
                p.setIsLiked(true);
            } else {
                p.setIsLiked(false);
            }
            return p;
        }).collect(Collectors.toList());
        return posts;
    }

    public Post getPost(Authentication authentication, Long id) {
        User CurrentUser = helper.getCurrentUser(authentication);
        if (CurrentUser == null) {
            throw new RuntimeException("User not found");
        }
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (likeRepository.existsByUser_IdAndPost_Id(CurrentUser.getId(), post.getId())) {
            post.setIsLiked(true);
        } else {
            post.setIsLiked(false);
        }

        return post;
    }

    public Comment createComment(Authentication authentication, String content, Long postId) {
        User CurrentUser = helper.getCurrentUser(authentication);
        if (CurrentUser == null) {
            throw new RuntimeException("User not found");
        }
        Post post = postRepository.findById(postId).orElse(null);
        if (post == null) {
            throw new RuntimeException("post not found");
        }

        content = content.replaceAll("\r\n", "\n");
        if (content.length() > 500) {
            throw new RuntimeException("Comment content cannot exceed 500 characters");
        }

        Comment comment = new Comment();

        comment.setContent(content);
        comment.setPost(post);
        comment.setUser(CurrentUser);

        CommentRepository.save(comment);

        post.setCommentsCount(CommentRepository.countByPost_Id(post.getId()));
        postRepository.save(post);

        if (!CurrentUser.getId().equals(post.getUser().getId())) {
            notificationService.addNotification(post.getUser(), CurrentUser, COMMENT, post, comment,
                    CurrentUser.getUsername() + " comment in your post.");
        }

        return comment;
    }

    public List<Comment> getPostComments(Authentication authentication, Long postId) {
        User CurrentUser = helper.getCurrentUser(authentication);
        if (CurrentUser == null) {
            throw new RuntimeException("User not found");
        }
        Post post = postRepository.findById(postId).orElse(null);
        if (post == null) {
            throw new RuntimeException("post not found");
        }

        List<Comment> comments = CommentRepository.findBypost_Id(postId);
        return comments;
    }

    public Comment updateComment(Authentication authentication, Long commentId, CommentRequest request) {
        User CurrentUser = helper.getCurrentUser(authentication);
        if (CurrentUser == null) {
            throw new RuntimeException("User not found");
        }

        Comment comment = CommentRepository.findById(commentId).orElse(null);
        if (comment == null) {
            throw new RuntimeException("comment not found");
        }

        if (!comment.getUser().getId().equals(CurrentUser.getId())) {
            throw new RuntimeException("You can only update your own comments");
        }
        String content = request.getContent();
        if (content == null || content.trim().isEmpty()) {
            throw new RuntimeException("Post description cannot be empty");
        }

        content = content.replaceAll("\r\n", "\n");
        if (content.length() > 500) {
            throw new RuntimeException("Comment content cannot exceed 500 characters");
        }
        comment.setContent(content);
        CommentRepository.save(comment);
        return comment;
    }

    public void deleteComment(Authentication authentication, Long commentId) {
        User CurrentUser = helper.getCurrentUser(authentication);
        if (CurrentUser == null) {
            throw new RuntimeException("User not found");
        }
        Comment comment = CommentRepository.findById(commentId).orElse(null);
        if (comment == null) {
            throw new RuntimeException("comment not found");
        }
        if (!comment.getUser().getId().equals(CurrentUser.getId()) && !CurrentUser.getRole().equals("ROLE_ADMIN")) {
            throw new RuntimeException("You can only delete your own comment");
        }

        Post post = postRepository.findById(comment.getPost().getId()).orElse(null);
        if (post == null) {
            throw new RuntimeException("post not found");
        }

        CommentRepository.delete(comment);

        post.setCommentsCount(CommentRepository.countByPost_Id(post.getId()));
        postRepository.save(post);

    }

}
