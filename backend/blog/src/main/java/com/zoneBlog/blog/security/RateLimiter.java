package com.zoneBlog.blog.security;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimiter {

    private static class ClientInfo {
        int requestCount;
        long lastRequestTime;

        ClientInfo(int requestCount, long lastRequestTime) {
            this.requestCount = requestCount;
            this.lastRequestTime = lastRequestTime;
        }
    }

    private final Map<String, ClientInfo> clients = new ConcurrentHashMap<>();
    private final Map<String, ClientInfo> sseClients = new ConcurrentHashMap<>();

    // Regular API endpoints
    private final int MAX_REQUESTS = 20;        
    private final long TIME_WINDOW = 1000; // 1 second
    
    // SSE endpoints - more restrictive
    private final int MAX_SSE_REQUESTS = 3;
    private final long SSE_TIME_WINDOW = 10000; // 10 seconds

    /**
     * Check if regular API request is allowed
     */
    public boolean allowRequest(String clientIp) {
        return checkRateLimit(clientIp, clients, MAX_REQUESTS, TIME_WINDOW, "API");
    }

    /**
     * Check if SSE connection request is allowed
     */
    public boolean allowSseRequest(String clientIp) {
        return checkRateLimit(clientIp, sseClients, MAX_SSE_REQUESTS, SSE_TIME_WINDOW, "SSE");
    }

    /**
     * Generic rate limiting logic
     */
    private boolean checkRateLimit(String clientIp, Map<String, ClientInfo> clientMap, 
                                   int maxRequests, long timeWindow, String type) {
        long now = Instant.now().toEpochMilli();
        ClientInfo info = clientMap.getOrDefault(clientIp, new ClientInfo(0, now));

        // Reset counter if time window has passed
        if (now - info.lastRequestTime > timeWindow) {
            info.requestCount = 1;
            info.lastRequestTime = now;
            clientMap.put(clientIp, info);
            System.out.println("✅ [" + type + "] New window for " + clientIp + " - Count: 1/" + maxRequests);
            return true;
        }

        // Check if limit exceeded
        if (info.requestCount >= maxRequests) {
            System.out.println("🚫 [" + type + "] Rate limit exceeded for " + clientIp + " - " + 
                             info.requestCount + "/" + maxRequests);
            return false;
        }

        // Increment counter
        info.requestCount++;
        clientMap.put(clientIp, info);
        System.out.println("✅ [" + type + "] Request allowed for " + clientIp + " - Count: " + 
                         info.requestCount + "/" + maxRequests);
        return true;
    }

    /**
     * Clean up old entries (call this periodically if needed)
     */
    public void cleanup() {
        long now = Instant.now().toEpochMilli();
        clients.entrySet().removeIf(entry -> 
            now - entry.getValue().lastRequestTime > TIME_WINDOW * 10);
        sseClients.entrySet().removeIf(entry -> 
            now - entry.getValue().lastRequestTime > SSE_TIME_WINDOW * 10);
    }
}