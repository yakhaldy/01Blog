package com.zoneBlog.blog.config;

import com.zoneBlog.blog.repository.UserRepository;
import com.zoneBlog.blog.security.JwtFilter;
import com.zoneBlog.blog.security.JwtUtil;
import com.zoneBlog.blog.security.RateLimitFilter;
import com.zoneBlog.blog.security.RateLimiter;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final RateLimitFilter rateLimitFilter;
    private final UserRepository userRepository;

    public SecurityConfig(JwtFilter jwtFilter, RateLimitFilter rateLimitFilter, UserRepository userRepository) {
        this.jwtFilter = jwtFilter;
        this.rateLimitFilter = rateLimitFilter;
        this.userRepository = userRepository;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, CorsConfigurationSource corsConfigurationSource,
            UserDetailsService userDetailsService, JwtUtil jwtUtil, RateLimiter rateLimiter) throws Exception {

        http
                .cors(cors -> {
                    cors.configurationSource(corsConfigurationSource);
                })
                .csrf(csrf -> {
                    csrf.disable();
                })
                .authorizeHttpRequests(auth -> {
                    auth
                            .requestMatchers("/api/auth/login", "/api/auth/register", "/uploads/**").permitAll()
                            .requestMatchers("/api/notifications/stream").permitAll()
                            .requestMatchers("/api/admin/**").hasRole("ADMIN")
                            .anyRequest().access((authentication, context) -> {
                                String userEmail = authentication.get().getName();
                                Boolean isBanned = userRepository.findByEmail(userEmail)
                                        .map(user -> user.getIsBanned())
                                        .orElse(false);
                                return new AuthorizationDecision(!isBanned);
                            });
                });

        http.addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authManager(HttpSecurity http, PasswordEncoder passwordEncoder,
            UserDetailsService userDetailsService) throws Exception {
        AuthenticationManagerBuilder authenticationManagerBuilder = http
                .getSharedObject(AuthenticationManagerBuilder.class);
        authenticationManagerBuilder.userDetailsService(userDetailsService)
                .passwordEncoder(passwordEncoder);
        return authenticationManagerBuilder.build();
    }
}