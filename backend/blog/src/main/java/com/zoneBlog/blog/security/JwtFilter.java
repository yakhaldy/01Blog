package com.zoneBlog.blog.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
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

    // Define public endpoints that should skip JWT validation
    private final List<String> publicEndpoints = Arrays.asList(
        "/api/login",
        "/api/register"
    );
    

    public JwtFilter(JwtUtil jwtUtil, UserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String requestPath = request.getRequestURI();
        System.out.println("🔍 JWT Filter processing request: " + requestPath);

        // Skip JWT validation for public endpoints
        if (isPublicEndpoint(requestPath)) {
            System.out.println("⏭️ Skipping JWT validation for public endpoint: " + requestPath);
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        System.out.println("🔑 Authorization header: " + (authHeader != null ? "Present" : "Missing"));

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            System.out.println("📝 Processing JWT token...");

            try {
                String username = jwtUtil.extractUsername(token);
                System.out.println("👤 Extracted username: " + username);

                if (username == null) {
                    System.out.println("❌ Username could not be extracted from token");
                    sendUnauthorizedResponse(response, "Invalid token: unable to extract username");
                    return;
                }

                if (SecurityContextHolder.getContext().getAuthentication() == null) {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    System.out.println("✅ Loaded user details for: " + userDetails.getUsername());

                    if (jwtUtil.validateToken(token, userDetails.getUsername())) {
                        System.out.println("✅ Token is valid for user: " + username);

                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                        authToken.setDetails(
                                new org.springframework.security.web.authentication.WebAuthenticationDetailsSource()
                                        .buildDetails(request));

                        SecurityContextHolder.getContext().setAuthentication(authToken);
                        System.out.println("✅ Authentication set for user: " + username);
                    } else {
                        System.out.println("❌ Token validation failed for user: " + username);
                        sendUnauthorizedResponse(response, "Token is invalid or expired");
                        return;
                    }
                }
            } catch (Exception e) {
                System.err.println("❌ Error processing JWT token: " + e.getMessage());
                e.printStackTrace();
                sendUnauthorizedResponse(response, "Token processing error: " + e.getMessage());
                return;
            }
        } else {
            System.out.println("❌ Missing or invalid Authorization header");
        //    sendUnauthorizedResponse(response, "❌ Missing or invalid Authorization header" );
        //         return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isPublicEndpoint(String requestPath) {
        return publicEndpoints.stream().anyMatch(requestPath::equals);
    }

    private void sendUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> errorResponse = Map.of(
                "error", "Unauthorized",
                "message", message,
                "status", 401);

        String jsonResponse = objectMapper.writeValueAsString(errorResponse);
        response.getWriter().write(jsonResponse);
        response.getWriter().flush();

        System.out.println("❌ Sent 401 Unauthorized response: " + message);
    }
}