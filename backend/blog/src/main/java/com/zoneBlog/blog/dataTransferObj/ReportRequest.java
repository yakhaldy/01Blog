package com.zoneBlog.blog.dataTransferObj;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportRequest {
    private Long reportedUserId;
    private String reportReason;
}



