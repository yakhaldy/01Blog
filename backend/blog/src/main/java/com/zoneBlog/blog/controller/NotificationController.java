package com.zoneBlog.blog.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
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
        System.out.println("\n--------------------------------------------\n" + initialCount
                + "-------------------------------------------------\n");
        System.out.println("✅ SSE connection request for user: " + user.getUsername() + " (ID: " + userId + ")");

        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        SseEmitter existingEmitter = emitters.get(userId);
        if (existingEmitter == null) {
            // try {
            // existingEmitter.complete();
            // } catch (Exception e) {
            // System.err.println("Error closing existing emitter: " + e.getMessage());
            // }
            // emitters.remove(userId);
            emitters.put(userId, emitter);
            // Setup cleanup callbacks
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
        } else {
            emitter = existingEmitter;
        }

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

}

// package com.zoneBlog.blog.controller;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.MediaType;
// import org.springframework.scheduling.annotation.Scheduled;
// import org.springframework.security.core.Authentication;
// import org.springframework.web.bind.annotation.*;
// import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

// import com.zoneBlog.blog.model.User;
// import com.zoneBlog.blog.repository.NotificationRepository;
// import com.zoneBlog.blog.service.Helper;

// import java.io.IOException;
// import java.util.Map;
// import java.util.concurrent.ConcurrentHashMap;

// @RestController
// @RequestMapping("/api/notifications")
// public class NotificationController {

// @Autowired
// private Helper helper;

// @Autowired
// private NotificationRepository notificationRepository;

// private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

// @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
// public SseEmitter streamNotifications(Authentication authentication,
// @RequestParam("token") String token) {

// User user = helper.getCurrentUser(authentication);
// Long userId = user.getId();

// System.out.println("✅ SSE connection request for user: " + user.getUsername()
// + " (ID: " + userId + ")");

// // Close existing emitter for this user
// SseEmitter existingEmitter = emitters.get(userId);
// if (existingEmitter != null) {
// try {
// System.out.println("🔄 Closing existing emitter for user: " + userId);
// existingEmitter.complete();
// } catch (Exception e) {
// System.err.println("⚠️ Error closing existing emitter: " + e.getMessage());
// }
// emitters.remove(userId);
// }

// // Create new emitter with timeout (30 minutes)
// SseEmitter emitter = new SseEmitter(1800000L); // 30 minutes timeout
// emitters.put(userId, emitter);

// // Setup cleanup callbacks
// emitter.onCompletion(() -> {
// System.out.println("✅ SSE completed for user: " + userId);
// emitters.remove(userId);
// });

// emitter.onTimeout(() -> {
// System.out.println("⏱️ SSE timeout for user: " + userId);
// emitters.remove(userId);
// });

// emitter.onError(e -> {
// System.err.println("❌ SSE error for user: " + userId + " - " +
// e.getMessage());
// emitters.remove(userId);
// });

// // Send initial count in a separate thread to avoid blocking
// new Thread(() -> {
// try {
// // Small delay to ensure connection is established
// Thread.sleep(100);

// Long initialCount =
// notificationRepository.countByRecipient_IdAndIsReadFalse(userId);
// System.out.println("📊 Initial unread count for user " + userId + ": " +
// initialCount);

// emitter.send(SseEmitter.event()
// .name("unreadCount")
// .data(initialCount)
// .reconnectTime(3000)); // Suggest 3s reconnect time

// System.out.println("📤 Sent initial count (" + initialCount + ") to user: " +
// userId);
// } catch (InterruptedException e) {
// Thread.currentThread().interrupt();
// System.err.println("Thread interrupted while sending initial count");
// } catch (IOException e) {
// System.err.println("❌ Failed to send initial count to user " + userId + ": "
// + e.getMessage());
// emitters.remove(userId);
// try {
// emitter.completeWithError(e);
// } catch (Exception ex) {
// // Ignore
// }
// }
// }).start();

// return emitter;
// }

// /**
// * Send notification count to a specific user
// * This method is called from NotificationService
// */
// public void sendNotificationCount(Long userId, Long count) {
// SseEmitter emitter = emitters.get(userId);
// if (emitter != null) {
// try {
// emitter.send(SseEmitter.event()
// .name("unreadCount")
// .data(count)
// .reconnectTime(3000));
// System.out.println("📤 Sent notification count (" + count + ") to user: " +
// userId);
// } catch (IOException e) {
// System.err.println("❌ Failed to send notification to user " + userId + ": " +
// e.getMessage());
// emitters.remove(userId);
// try {
// emitter.completeWithError(e);
// } catch (Exception ex) {
// // Ignore
// }
// }
// } else {
// System.out.println("⚠️ No active SSE connection for user: " + userId);
// }
// }

// /**
// * Send heartbeat to all connected clients every 30 seconds
// * This keeps the connection alive and helps detect dead connections
// */
// @Scheduled(fixedRate = 30000)
// public void sendHeartbeat() {
// System.out.println("💓 Sending heartbeat to " + emitters.size() + " connected
// clients");

// emitters.forEach((userId, emitter) -> {
// try {
// emitter.send(SseEmitter.event()
// .name("heartbeat")
// .data("ping"));
// } catch (IOException e) {
// System.err.println("❌ Failed to send heartbeat to user " + userId + ": " +
// e.getMessage());
// emitters.remove(userId);
// try {
// emitter.completeWithError(e);
// } catch (Exception ex) {
// // Ignore
// }
// }
// });
// }

// /**
// * Get active connections count (for debugging)
// */
// @GetMapping("/active-connections")
// public Map<String, Object> getActiveConnections() {
// return Map.of(
// "activeConnections", emitters.size(),
// "userIds", emitters.keySet()
// );
// }

// /**
// * Manually close connection for a user (useful for testing)
// */
// @PostMapping("/disconnect/{userId}")
// public Map<String, String> disconnectUser(@PathVariable Long userId) {
// SseEmitter emitter = emitters.get(userId);
// if (emitter != null) {
// try {
// emitter.complete();
// emitters.remove(userId);
// return Map.of("message", "User " + userId + " disconnected");
// } catch (Exception e) {
// return Map.of("error", "Failed to disconnect user: " + e.getMessage());
// }
// }
// return Map.of("message", "No active connection for user " + userId);
// }
// }