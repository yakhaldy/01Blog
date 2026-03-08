package com.zoneBlog.blog.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @org.springframework.beans.factory.annotation.Value("${cors.allowed-origins:http://localhost:4200,http://localhost:8000}")
    private String[] allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Allow origins dynamically from environment or default to local development ones
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins));
        
        // Allow all methods
        configuration.addAllowedMethod("*");
        
        // Allow all headers
        configuration.addAllowedHeader("*");
        
        // ⭐ CRITICAL: Expose headers needed for SSE
        configuration.setExposedHeaders(Arrays.asList(
            "Content-Type",
            "Cache-Control",
            "X-Accel-Buffering"  // Important for preventing buffering
        ));
        
        // Allow credentials
        configuration.setAllowCredentials(true);
        
        // Cache preflight response
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);  // Changed from /api/** to /**
        
        return source;
    }
}