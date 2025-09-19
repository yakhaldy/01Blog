package com.zoneBlog.blog.dataTransferObj;


import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostRequest {
    
    @Size(min = 1, max = 280, message = "Post description must be between 1 and 280 characters")
    private String description;

    private Long postId;

}