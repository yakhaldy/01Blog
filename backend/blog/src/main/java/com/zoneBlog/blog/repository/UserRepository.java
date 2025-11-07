package com.zoneBlog.blog.repository;

import com.zoneBlog.blog.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String Email);

    Optional<User> findByUsername(String Username);

    Page<User> findByUsernameNot(String username, Pageable pageable);

    boolean existsByUsername(String username);

    Long countByIsBanned(Boolean isBanned);


      // @Query("""
      //   SELECT u FROM User u
      //   WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :term, '%'))
      //   """)
    List<User> findTop6ByUsernameContainingIgnoreCase(@Param("term") String term);

}