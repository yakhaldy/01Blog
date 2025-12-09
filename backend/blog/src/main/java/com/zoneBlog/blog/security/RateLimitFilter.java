package com.zoneBlog.blog.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimiter rateLimiter;

    public RateLimitFilter(RateLimiter rateLimiter) {
        this.rateLimiter = rateLimiter;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String clientIp = getClientIp(request);
        String path = request.getRequestURI();

        // Use stricter rate limiting for SSE endpoints
        boolean allowed;
        if (path.contains("/notifications/stream")) {
            allowed = rateLimiter.allowSseRequest(clientIp);
        } else {
            allowed = rateLimiter.allowRequest(clientIp);
        }

        if (!allowed) {
            response.setStatus(429); // Too Many Requests
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            
            String message = path.contains("/notifications/stream") 
                ? "Too many SSE connection attempts. Please wait 10 seconds."
                : "Too many requests. Please wait a moment.";
            
            response.getWriter().write(message);
            
            response.getWriter().flush();
            return;
        }

        filterChain.doFilter(request, response);
    }


    private String getClientIp(HttpServletRequest request) {
        // String ip = request.getHeader("X-Forwarded-For");
        // if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
        //     ip = request.getHeader("X-Real-IP");
        // }
        // if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
        //     ip = request.getRemoteAddr();
        // }
        // // If multiple IPs in X-Forwarded-For, take the first one
        // if (ip != null && ip.contains(",")) {
        //     ip = ip.split(",")[0].trim();
        // }
        // return ip;
        return request.getRemoteAddr();
    }
}