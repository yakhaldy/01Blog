package com.zoneBlog.blog.controller;

import org.springframework.context.event.EventListener;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.zoneBlog.blog.event.NotificationCountEvent;
import com.zoneBlog.blog.exception.UnauthorizedException;
import com.zoneBlog.blog.security.JwtUtil;
import com.zoneBlog.blog.service.NotificationService;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:4200")
public class NotificationController {

    private final JwtUtil jwtUtil;
    private final NotificationService notificationService;
    // Map<userId, Map<connectionId, SseEmitter>> to support multiple devices per user
    private final Map<Long, Map<String, SseEmitter>> emitters = new ConcurrentHashMap<>();

    NotificationController(JwtUtil jwtUtil, NotificationService notificationService) {
        this.jwtUtil = jwtUtil;
        this.notificationService = notificationService;
    }

    @GetMapping(value = "/stream", produces = "text/event-stream")
    public SseEmitter streamNotifications(Authentication authentication, @RequestParam("token") String token, @RequestParam("connectionId") String connectionId) {

        if (!jwtUtil.validateToken(token, jwtUtil.extractUsername(token))) {
            throw new UnauthorizedException("Invalid or expired token");
        }

        Long userId = jwtUtil.extractUserId(token);
        if (userId == null)
            throw new UnauthorizedException("Invalid token: missing userId");

      
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L); // 30 minutes in milliseconds
        
        // Get or create the map of connections for this user
        Map<String, SseEmitter> userConnections = emitters.computeIfAbsent(userId, k -> java.util.Collections.synchronizedMap(new java.util.LinkedHashMap<>()));
        
        // If connectionId exists, close old emitter (same tab refresh)
        SseEmitter oldEmitter = userConnections.get(connectionId);
        if (oldEmitter != null) {
            try {
                oldEmitter.complete();
            } catch (Exception e) {
                // Ignore - already closed
            }
        }
        
        // Limit connections per user to prevent pool exhaustion
        final int MAX_CONNECTIONS_PER_USER = 3;
        if (userConnections.size() >= MAX_CONNECTIONS_PER_USER) {
            // Remove oldest connection by arbitrary key (first in iteration)
            String oldestKey = userConnections.keySet().iterator().next();
            SseEmitter oldest = userConnections.remove(oldestKey);
            if (oldest != null) {
                oldest.complete();
            }
        }
        
        userConnections.put(connectionId, emitter);

        emitter.onCompletion(() -> {
            userConnections.remove(connectionId);
            if (userConnections.isEmpty()) {
                emitters.remove(userId);
            }
        });

        emitter.onTimeout(() -> {
            userConnections.remove(connectionId);
            if (userConnections.isEmpty()) {
                emitters.remove(userId);
            }
        });

        emitter.onError(e -> {
            userConnections.remove(connectionId);
            if (userConnections.isEmpty()) {
                emitters.remove(userId);
            }
        });

        // Send initial count asynchronously using Spring managed executor
        notificationService.getUnreadCountAsync(userId)
            .thenAccept(count -> {
                try {
                    emitter.send(SseEmitter.event()
                            .name("unreadCount")
                            .data(count));
                } catch (IOException e) {
                    // Failed to send initial count - client will not receive it
                }
            })
            .exceptionally(ex -> {
                // Error fetching unread count - client will not receive initial count
                return null;
            });

        return emitter;
    }

    public void sendNotificationCount(Long userId, Long count) {
        Map<String, SseEmitter> userConnections = emitters.get(userId);
        if (userConnections != null && !userConnections.isEmpty()) {
            // Send to all active connections for this user
            userConnections.forEach((connectionId, emitter) -> {
                try {
                    emitter.send(SseEmitter.event()
                            .name("unreadCount")
                            .data(count != null ? count : 0L));
                } catch (IOException e) {
                    userConnections.remove(connectionId);
                    if (userConnections.isEmpty()) {
                        emitters.remove(userId);
                    }
                }
            });
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

        Map<String, SseEmitter> userConnections = emitters.get(userId);
        int disconnectedCount = 0;
        
        if (userConnections != null && !userConnections.isEmpty()) {
            disconnectedCount = userConnections.size();
            
            // Complete all emitters for this user
            userConnections.forEach((connectionId, emitter) -> {
                try {
                    emitter.complete();
                } catch (Exception e) {
                    // Ignore - emitter already closed
                }
            });
            
            // Clear the map and remove from parent map
            userConnections.clear();
            emitters.remove(userId);
        }
        
        return Map.of(
            "message", "SSE connections closed",
            "userId", userId,
            "disconnectedConnections", disconnectedCount
        );
    }

    /**
     * Event listener for notification count updates
     * Handles broadcasting notification counts to all connected SSE clients
     */
    @EventListener
    public void handleNotificationCountEvent(NotificationCountEvent event) {
        sendNotificationCount(event.getUserId(), event.getCount());
    }

}
