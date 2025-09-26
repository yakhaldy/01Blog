package com.zoneBlog.blog.dataTransferObj;


import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostRequest {
    
    private String description;

    private String title;


    private Long postId;

}