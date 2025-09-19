package com.zoneBlog.blog.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.zoneBlog.blog.model.User;
import com.zoneBlog.blog.repository.UserRepository;

@Service
public class Users {
     @Autowired
    private UserRepository userRepository;

    public  List<User>  getAllUsers(Authentication authentication){
        return userRepository.findAll();
    }
}
