package com.zoneBlog.blog.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.zoneBlog.blog.model.User;
import com.zoneBlog.blog.repository.NotificationRepository;
import com.zoneBlog.blog.service.Helper;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private Helper helper;

    @Autowired
    private NotificationRepository notificationRepository;

    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

@GetMapping(value = "/stream", produces = "text/event-stream")
public SseEmitter streamNotifications(Authentication authentication, @RequestParam("token") String token) {

    User user = helper.getCurrentUser(authentication); 
    Long userId = user.getId();
    Long initialCount = notificationRepository.countByRecipient_IdAndIsReadFalse(userId);
 System.out.println("\n--------------------------------------------\n"+initialCount+"-------------------------------------------------\n");
    System.out.println("✅ SSE connection request for user: " + user.getUsername() + " (ID: " + userId + ")");

    SseEmitter existingEmitter = emitters.get(userId);
    if (existingEmitter != null) {
        try {
            existingEmitter.complete();
        } catch (Exception e) {
            System.err.println("Error closing existing emitter: " + e.getMessage());
        }
        emitters.remove(userId);
    }

    SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
    emitters.put(userId, emitter);

    emitter.onCompletion(() -> emitters.remove(userId));
    emitter.onTimeout(() -> emitters.remove(userId));
    emitter.onError(e -> {
        System.err.println("❌ SSE error for user: " + userId + " - " + e.getMessage());
        emitters.remove(userId);
    });

    try {
        emitter.send(SseEmitter.event()
            .name("unreadCount")
            .data(initialCount));
        System.out.println("📤 Sent initial count (" + initialCount + ") to user: " + userId);
    } catch (IOException e) {
        System.err.println("Failed to send initial count to user " + userId + ": " + e.getMessage());
        emitters.remove(userId);
    }

    return emitter;
}


    public void sendNotificationCount(Long userId, Long count) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name("unreadCount")
                        .data(count));
                System.out.println("📤 Sent notification count (" + count + ") to user: " + userId);
            } catch (IOException e) {
                System.err.println("Failed to send notification to user " + userId + ": " + e.getMessage());
                emitters.remove(userId);
            }
        } else {
            System.out.println("⚠️ No active SSE connection for user: " + userId);
        }
    }

    // get active connections count (for debugging)
    @GetMapping("/active-connections")
    public Map<String, Object> getActiveConnections() {
        return Map.of(
            "activeConnections", emitters.size(),
            "userIds", emitters.keySet()
        );
    }
}