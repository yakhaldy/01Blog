package com.zoneBlog.blog.config;

import com.zoneBlog.blog.repository.UserRepository;
import com.zoneBlog.blog.security.JwtFilter;
import com.zoneBlog.blog.security.JwtUtil;
import com.zoneBlog.blog.security.RateLimitFilter;
import com.zoneBlog.blog.security.RateLimiter;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
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

    public SecurityConfig(UserRepository userRepository, JwtFilter jwtFilter, RateLimitFilter rateLimitFilter) {
        this.jwtFilter = jwtFilter;
        this.rateLimitFilter = rateLimitFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, CorsConfigurationSource corsConfigurationSource,
            UserDetailsService userDetailsService, JwtUtil jwtUtil, RateLimiter rateLimiter) throws Exception {
        System.out.println("🔧 Configuring Security Filter Chain...");
        // JwtFilter jwtFilter = new JwtFilter(jwtUtil, userDetailsService);
        // RateLimitFilter rateLimitFilter = new RateLimitFilter(rateLimiter);

        http
                .cors(cors -> {
                    cors.configurationSource(corsConfigurationSource);
                    System.out.println("✅ CORS configured");
                })
                .csrf(csrf -> {
                    csrf.disable();
                    System.out.println("✅ CSRF disabled");
                })
                .authorizeHttpRequests(auth -> {
                    auth
                            .requestMatchers("/api/login", "/api/register", "/uploads/**").permitAll()
                            .requestMatchers("/api/notifications/stream").permitAll()
                            .requestMatchers("/api/admin/**").hasRole("ADMIN")
                            .anyRequest().authenticated();
                });

        http.addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        System.out.println("✅ JWT Filter added before UsernamePasswordAuthenticationFilter");

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authManager(HttpSecurity http, PasswordEncoder passwordEncoder,
            UserDetailsService userDetailsService) throws Exception {
        return http.getSharedObject(AuthenticationManagerBuilder.class)
                .userDetailsService(userDetailsService)
                .passwordEncoder(passwordEncoder)
                .and()
                .build();
    }
}