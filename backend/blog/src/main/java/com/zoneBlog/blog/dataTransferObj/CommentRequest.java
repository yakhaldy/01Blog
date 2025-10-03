package com.zoneBlog.blog.dataTransferObj;

import lombok.Data;

@Data
public class CommentRequest {
    private String content;
    private Long postId;
}
