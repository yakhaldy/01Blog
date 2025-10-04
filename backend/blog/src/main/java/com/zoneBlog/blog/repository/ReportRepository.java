package com.zoneBlog.blog.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.zoneBlog.blog.model.Report;
import com.zoneBlog.blog.model.User;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    boolean existsByReportedUserAndReportedBy(User reportedUser, User reportedBy);
    List<Report> findAll();
    Long countByStatus(String status);
}
