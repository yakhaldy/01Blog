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

        System.out.println("✅ SSE connection received for: " + user.getUsername());

        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.put(userId, emitter);

        emitter.onCompletion(() -> emitters.remove(userId));
        emitter.onTimeout(() -> emitters.remove(userId));
        emitter.onError((e) -> emitters.remove(userId));

        // Optional: send initial unread count
        sendNotificationCount(userId, notificationRepository.countByRecipient_Id(userId));

        return emitter;
    }

    public void sendNotificationCount(Long userId, Long count) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name("unreadCount")
                        .data(count));
            } catch (IOException e) {
                emitters.remove(userId);
            }
        }
    }
}
