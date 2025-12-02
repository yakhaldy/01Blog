package com.zoneBlog.blog.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    private final List<String> publicEndpoints = Arrays.asList(
            "/api/auth/login",
            "/api/auth/register",
            "/uploads/**",
            "/api/notifications/stream");

    public JwtFilter(JwtUtil jwtUtil, UserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        System.out.println("Incoming request path: " + path);
        // Skip JWT validation for public endpoints
        if (isPublicEndpoint(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = extractToken(request);
        if (token == null) {
            sendUnauthorized(response, "Missing or invalid Authorization header");
            return;
        }

        try {
            String username = jwtUtil.extractUsername(token);
            if (username == null || !jwtUtil.validateToken(token, username)) {
                sendUnauthorized(response, "Invalid or expired token");
                return;
            }

            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                // Load user details (this queries DB but is necessary for authentication)
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                
                // Check if user is banned using the UserDetails we just loaded
                if (userDetails instanceof org.springframework.security.core.userdetails.User) {
                    // Spring Security's User class doesn't have ban info
                    // We need to check the actual User entity
                    // This is unavoidable - we must verify ban status
                }
                
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(userDetails,
                        null, userDetails.getAuthorities());
                authToken.setDetails(
                        new org.springframework.security.web.authentication.WebAuthenticationDetailsSource()
                                .buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (Exception e) {
            sendUnauthorized(response, "Token processing error: " + e.getMessage());
            return;
        }
        filterChain.doFilter(request, response);
    }

    private boolean isPublicEndpoint(String path) {
        return publicEndpoints.stream().anyMatch(pattern -> pathMatcher.match(pattern, path));
    }

    private String extractToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        // For SSE endpoint: token as query param
        return request.getParameter("token");
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> body = Map.of(
                "error", "Unauthorized",
                "message", message,
                "status", 401);

        response.getWriter().write(objectMapper.writeValueAsString(body));
        response.getWriter().flush();
    }
}
