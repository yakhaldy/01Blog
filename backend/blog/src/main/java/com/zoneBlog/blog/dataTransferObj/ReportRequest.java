package com.zoneBlog.blog.dataTransferObj;

import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportRequest {
    @NotNull(message = "Reported user ID is required")
    private Long reportedId;

    @NotBlank(message = "Report reason is required")
    private String reportReason;

    // Getters and setters
    public Long getReportedId() { return reportedId; }
    public void setReportedId(Long reportedUserId) { this.reportedId = reportedUserId; }
    public String getReportReason() { return reportReason; }
    public void setReportReason(String reportReason) { this.reportReason = reportReason; }
}



