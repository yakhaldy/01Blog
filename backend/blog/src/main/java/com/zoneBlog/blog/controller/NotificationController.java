package com.zoneBlog.blog.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.zoneBlog.blog.exception.UnauthorizedException;
import com.zoneBlog.blog.repository.NotificationRepository;
import com.zoneBlog.blog.security.JwtUtil;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:4200")
public class NotificationController {

    private final JwtUtil jwtUtil;
    private final NotificationRepository notificationRepository;
    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    NotificationController(NotificationRepository notificationRepository, JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
        this.notificationRepository = notificationRepository;
    }

    @GetMapping(value = "/stream", produces = "text/event-stream")
    public SseEmitter streamNotifications(Authentication authentication, @RequestParam("token") String token) {

        if (!jwtUtil.validateToken(token, jwtUtil.extractUsername(token))) {
            throw new UnauthorizedException("Invalid or expired token");
        }

        Long userId = jwtUtil.extractUserId(token);
        if (userId == null)
            throw new UnauthorizedException("Invalid token: missing userId");

        // Check if user already has an active connection
        SseEmitter existingEmitter = emitters.get(userId);
        if (existingEmitter != null) {
            System.out.println("♻️ Reusing existing SSE connection for user: " + userId);
            
            // Send current count even for existing connections
            new Thread(() -> {
                try {
                    Long currentCount = notificationRepository.countByRecipient_IdAndIsReadFalse(userId);
                    existingEmitter.send(SseEmitter.event()
                            .name("unreadCount")
                            .data(currentCount));
                    System.out.println("📤 Sent updated count (" + currentCount + ") to existing connection: " + userId);
                } catch (IOException e) {
                    System.err.println("Failed to send count to existing connection " + userId + ": " + e.getMessage());
                    emitters.remove(userId);
                }
            }).start();
            
            return existingEmitter;
        }

        // Create new emitter only if one doesn't exist
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.put(userId, emitter);

        emitter.onCompletion(() -> {
            System.out.println("✅ SSE completed for user: " + userId);
            emitters.remove(userId);
        });

        emitter.onTimeout(() -> {
            System.out.println("⏱️ SSE timeout for user: " + userId);
            emitters.remove(userId);
        });

        emitter.onError(e -> {
            System.err.println("❌ SSE error for user: " + userId + " - " + e.getMessage());
            emitters.remove(userId);
        });

        // Send initial count asynchronously to avoid blocking
        final SseEmitter finalEmitter = emitter;
        new Thread(() -> {
            try {
                Long initialCount = notificationRepository.countByRecipient_IdAndIsReadFalse(userId);
                finalEmitter.send(SseEmitter.event()
                        .name("unreadCount")
                        .data(initialCount));
                System.out.println("📤 Sent initial count (" + initialCount + ") to user: " + userId);
            } catch (IOException e) {
                System.err.println("Failed to send initial count to user " + userId + ": " + e.getMessage());
                finalEmitter.completeWithError(e);
                emitters.remove(userId);
            }
        }).start();

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
}