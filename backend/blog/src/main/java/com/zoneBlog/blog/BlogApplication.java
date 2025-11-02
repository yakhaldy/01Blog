package com.zoneBlog.blog;

import com.zoneBlog.blog.model.User;
import com.zoneBlog.blog.repository.UserRepository;

import jakarta.annotation.PostConstruct;

import org.springframework.context.ApplicationContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
@EnableAsync
public class BlogApplication {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public static void main(String[] args) {
        SpringApplication.run(BlogApplication.class, args);
    }

    // @PostConstruct
    @EventListener(ApplicationReadyEvent.class)
    public void initData() {
        if (userRepository.findByEmail("admin@admin.ad").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole("ROLE_ADMIN");
            admin.setEmail("admin@admin.ad");
            userRepository.save(admin);
            System.out.println("Admin user created!");
        }

        /// test print beans
        // printBeans();
    }

    @Autowired
    private ApplicationContext context;

    public void printBeans() {
        System.out.println("================== start print beans =====================\n");
        String[] names =  context.getBeanDefinitionNames();
        for (String name : names) {
            System.out.println("======> "+name);
        }
    }
}