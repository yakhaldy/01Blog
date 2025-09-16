package com.zoneBlog.blog.dataTransferObj;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostRequest {
    
    @NotBlank(message = "Post description cannot be empty")
    @Size(min = 1, max = 280, message = "Post description must be between 1 and 280 characters")
    private String description;

}