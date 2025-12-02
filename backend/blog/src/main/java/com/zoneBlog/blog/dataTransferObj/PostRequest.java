package com.zoneBlog.blog.dataTransferObj;


import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostRequest {
    @NotBlank(message = "Post title cannot be empty")
    @Size(max = 280, message = "Post title cannot exceed 280 characters")
    private String title;

    @NotBlank(message = "Post description cannot be empty")
    @Size(max = 5000, message = "Post description cannot exceed 5000 characters")
    private String description;

    private Long postId; 

    // Trim and normalize the title before validation
    public void setTitle(String title) {
        this.title = title != null ? title.trim() : null;
    }

    // Trim and normalize the description before validation
    public void setDescription(String description) {
        this.description = description != null ? description.trim() : null;
    }

    // Getters
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public Long getPostId() { return postId; }
    public void setPostId(Long postId) { this.postId = postId; }
}