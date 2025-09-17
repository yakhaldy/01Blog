package com.zoneBlog.blog.config;

import com.zoneBlog.blog.repository.UserRepository;
import com.zoneBlog.blog.security.JwtFilter;

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

    private final UserRepository userRepository;
    private final JwtFilter jwtFilter;

    public SecurityConfig(UserRepository userRepository, JwtFilter jwtFilter) {
        this.userRepository = userRepository;
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, CorsConfigurationSource corsConfigurationSource) throws Exception {
        System.out.println("🔧 Configuring Security Filter Chain...");
        
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
                    .anyRequest().authenticated();
            });

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