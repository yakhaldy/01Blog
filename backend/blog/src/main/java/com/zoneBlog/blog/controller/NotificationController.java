package com.zoneBlog.blog.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.zoneBlog.blog.exception.UnauthorizedException;
import com.zoneBlog.blog.repository.NotificationRepository;
import com.zoneBlog.blog.security.JwtUtil;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:4200")
public class NotificationController {

    private final JwtUtil jwtUtil;
    private final NotificationRepository notificationRepository;
    // Map<userId, Set<SseEmitter>> to support multiple devices per user
    private final Map<Long, Set<SseEmitter>> emitters = new ConcurrentHashMap<>();

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

      
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L); // 30 minutes in milliseconds
        
        // Get or create the set of emitters for this user
        Set<SseEmitter> userEmitters = emitters.computeIfAbsent(userId, k -> new CopyOnWriteArraySet<>());
        userEmitters.add(emitter);
        
        System.out.println("🔌 New SSE connection for user: " + userId + " (Total connections: " + userEmitters.size() + ")");

        emitter.onCompletion(() -> {
            System.out.println("✅ SSE completed for user: " + userId);
            userEmitters.remove(emitter);
            if (userEmitters.isEmpty()) {
                emitters.remove(userId);
                System.out.println("🧹 No more connections for user: " + userId);
            }
        });

        emitter.onTimeout(() -> {
            System.out.println("⏱️ SSE timeout (30min) for user: " + userId + " - Client will reconnect with fresh token");
            userEmitters.remove(emitter);
            if (userEmitters.isEmpty()) {
                emitters.remove(userId);
            }
        });

        emitter.onError(e -> {
            System.err.println("❌ SSE error for user: " + userId + " - " + e.getMessage());
            userEmitters.remove(emitter);
            if (userEmitters.isEmpty()) {
                emitters.remove(userId);
            }
        });

        // Send initial count asynchronously to avoid blocking
        // new Thread(() -> {
            try {
                Long initialCount = notificationRepository.countByRecipient_IdAndIsReadFalse(userId);
                emitter.send(SseEmitter.event()
                        .name("unreadCount")
                        .data(initialCount != null ? initialCount : 0L));
                System.out.println("📤 Sent initial count (" + initialCount + ") to user: " + userId);
            } catch (IOException e) {
                System.err.println("Failed to send initial count to user " + userId + ": " + e.getMessage());
                emitter.completeWithError(e);
                userEmitters.remove(emitter);
                if (userEmitters.isEmpty()) {
                    emitters.remove(userId);
                }
            }
        // }).start();

        return emitter;
    }

    public void sendNotificationCount(Long userId, Long count) {
        Set<SseEmitter> userEmitters = emitters.get(userId);
        if (userEmitters != null && !userEmitters.isEmpty()) {
            System.out.println("📤 Broadcasting notification count (" + count + ") to " + userEmitters.size() + " device(s) for user: " + userId);
            
            // Send to all active connections for this user
            userEmitters.forEach(emitter -> {
                try {
                    emitter.send(SseEmitter.event()
                            .name("unreadCount")
                            .data(count != null ? count : 0L));
                } catch (IOException e) {
                    System.err.println("Failed to send notification to one device of user " + userId + ": " + e.getMessage());
                    userEmitters.remove(emitter);
                    if (userEmitters.isEmpty()) {
                        emitters.remove(userId);
                    }
                }
            });
        } else {
            System.out.println("⚠️ No active SSE connections for user: " + userId);
        }
    }

    /**
     * Close all SSE connections for a specific user (useful for logout from all devices)
     * This endpoint allows a user to manually disconnect all their SSE connections
     */
    @PostMapping("/disconnect")
    public Map<String, Object> disconnectUser(Authentication authentication, @RequestParam("token") String token) {
        if (!jwtUtil.validateToken(token, jwtUtil.extractUsername(token))) {
            throw new UnauthorizedException("Invalid or expired token");
        }

        Long userId = jwtUtil.extractUserId(token);
        if (userId == null) {
            throw new UnauthorizedException("Invalid token: missing userId");
        }

        Set<SseEmitter> userEmitters = emitters.get(userId);
        int disconnectedCount = 0;
        
        if (userEmitters != null && !userEmitters.isEmpty()) {
            disconnectedCount = userEmitters.size();
            System.out.println("🔌 Disconnecting " + disconnectedCount + " SSE connection(s) for user: " + userId);
            
            // Complete all emitters for this user
            userEmitters.forEach(emitter -> {
                try {
                    emitter.complete();
                } catch (Exception e) {
                    System.err.println("Error completing emitter: " + e.getMessage());
                }
            });
            
            // Clear the set and remove from map
            userEmitters.clear();
            emitters.remove(userId);
            
            System.out.println("✅ All SSE connections closed for user: " + userId);
        } else {
            System.out.println("⚠️ No active SSE connections found for user: " + userId);
        }
        
        return Map.of(
            "message", "SSE connections closed",
            "userId", userId,
            "disconnectedConnections", disconnectedCount
        );
    }

}
