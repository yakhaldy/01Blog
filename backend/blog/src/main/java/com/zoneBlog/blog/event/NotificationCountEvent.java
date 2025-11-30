package com.zoneBlog.blog.event;

public class NotificationCountEvent {
    private final Long userId;
    private final Long count;

    public NotificationCountEvent(Long userId, Long count) {
        this.userId = userId;
        this.count = count;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getCount() {
        return count;
    }
}
