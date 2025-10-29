package com.zoneBlog.blog.dataTransferObj;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CommentRequest {
    @NotBlank(message = "Comment content cannot be empty")
    @Size(max = 500, message = "Comment content cannot exceed 500 characters")
    private String content;

    @NotNull(message = "Post ID is required")
    private Long postId;

    // Getters and setters
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Long getPostId() { return postId; }
    public void setPostId(Long postId) { this.postId = postId; }
}