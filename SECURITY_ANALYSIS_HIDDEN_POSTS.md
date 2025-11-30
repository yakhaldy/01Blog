# Security Analysis: Hide/Unhide Posts Feature

## Executive Summary
The recently added hide/unhide posts feature has **CRITICAL SECURITY VULNERABILITIES** that allow unauthorized access to hidden content. Immediate remediation is required.

---

## 1. Logic Validation ❌ FAILED

### ✅ Model Layer (Correct)
**File**: `Post.java`
```java
@Column(name = "statue", length = 50, nullable = false)
private String statue; // Values: "active" | "hidden"
```
✅ Field exists and is persisted correctly

### ⚠️ Service Layer (Partially Correct)
**File**: `Posts.java:213-226`

**Problems Found**:
1. **Logic Bug**: The `statue` parameter is IGNORED
```java
public Post updatePostStatue(Long id, String statue) {
    // Parameter 'statue' is checked but never used!
    if (statue == null && statue.trim().isEmpty()) { // Bug: && should be ||
        throw new IllegalArgumentException("Statue cannot be null or empty");
    }
    if (!statue.equals("active") && !statue.equals("hidden")) {
        throw new IllegalArgumentException("Invalid statue value");
    }
    // Method always toggles instead of setting to provided value
    if (post.getStatue().equals("active")) {
        post.setStatue("hidden");
    } else if (post.getStatue().equals("hidden")) {
        post.setStatue("active");
    }
    return postRepository.save(post);
}
```

**Recommended Fix**:
```java
public Post updatePostStatue(Long id, String statue) {
    Post post = getPostOrThrow(id);
    
    if (statue == null || statue.trim().isEmpty()) { // Fix: Use ||
        throw new IllegalArgumentException("Statue cannot be null or empty");
    }
    if (!statue.equals("active") && !statue.equals("hidden")) {
        throw new IllegalArgumentException("Invalid statue value");
    }
    
    // Use the provided value instead of toggling
    post.setStatue(statue);
    return postRepository.save(post);
}
```

### ❌ Repository Layer (CRITICAL VULNERABILITY)
**File**: `PostRepository.java`

**Problem**: Only ONE query filters by `statue`:
```java
// ✅ Only this query filters hidden posts
Page<Post> findByUser_IdInAndStatueOrderByCreatedAtDesc(List<Long> userIds, String statue, Pageable pageable);

// ❌ These queries expose hidden posts
Page<Post> findByUser_IdOrderByCreatedAtDesc(Long id, Pageable pageable);
Optional<Post> findById(Long id);
List<Post> findByUser_IdInOrderByCreatedAtDesc(List<Long> userIds);
Page<Post> findAll(Pageable pageable);
```

### ❌ Controller Layer (MAJOR SECURITY FLAW)
**File**: `AuthController.java:274-281`

**Critical Issue**: NO ADMIN CHECK!
```java
@PatchMapping("/admin/updateStatusP/{id}")
public ResponseEntity<Post> updatePostStatue(
        @PathVariable Long id,
        @RequestBody Map<String, String> payload) {
    String statue = payload.get("statue");
    Post post = postsService.updatePostStatue(id, statue);
    return ResponseEntity.ok(post);
}
```

**Problem**: Despite being under `/admin/` path, there's NO explicit admin validation in the method. It relies solely on path-based security in `SecurityConfig.java`:
```java
.requestMatchers("/api/admin/**").hasRole("ADMIN")
```

**Risk**: If path-based security is misconfigured or bypassed, any authenticated user could hide posts.

---

## 2. Security Checklist ❌ CRITICAL FAILURES

### ❌ Broken Access Control - CONFIRMED

#### Vulnerability #1: Hidden Posts Exposed via Direct Access
**File**: `Posts.java:154-159`
```java
@Transactional(readOnly = true)
public Post getPost(Authentication authentication, Long id) {
    User currentUser = getUserOrThrow(authentication);
    Post post = getPostOrThrow(id);
    post.setIsLiked(likeRepository.existsByUser_IdAndPost_Id(currentUser.getId(), post.getId()));
    return post;
}
```
**Endpoint**: `GET /api/post/{id}`

**Attack Scenario**:
1. Admin hides post ID 123
2. Regular user accesses `GET /api/post/123`
3. ❌ Post is returned with `statue: "hidden"`
4. Frontend displays it anyway (no client-side filtering)

**Proof of Vulnerability**:
```bash
# As regular user
curl -H "Authorization: Bearer <user_token>" \
  http://localhost:8080/api/post/123
# Returns hidden post!
```

#### Vulnerability #2: Hidden Posts in User Profiles
**File**: `Posts.java:145-151`
```java
@Transactional(readOnly = true)
public Page<Post> getPostsUser(Authentication authentication, String username, Pageable pageable) {
    User currentUser = getUserOrThrow(authentication);
    User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    Page<Post> postsPage = postRepository.findByUser_IdOrderByCreatedAtDesc(user.getId(), pageable);
    return addLikeStatus(postsPage, currentUser.getId());
}
```
**Endpoint**: `GET /api/posts/{username}`

**Attack Scenario**:
1. Admin hides offensive post from user "john"
2. Anyone visits `/api/posts/john`
3. ❌ Hidden posts are included in response

#### Vulnerability #3: Own Posts Not Filtered
**File**: `Posts.java:137-141`
```java
@Transactional(readOnly = true)
public Page<Post> getMyPosts(Authentication authentication, Pageable pageable) {
    User user = getUserOrThrow(authentication);
    Page<Post> postsPage = postRepository.findByUser_IdOrderByCreatedAtDesc(user.getId(), pageable);
    return addLikeStatus(postsPage, user.getId());
}
```
**Risk**: While less critical (users seeing their own hidden posts), this creates UX confusion.

### ⚠️ ID-Based Privilege Escalation - POSSIBLE

**Scenario**: If an attacker can guess post IDs, they can:
1. Call `GET /api/post/{id}` to view any hidden post
2. Call `PATCH /api/admin/updateStatusP/{id}` if they bypass admin check

**Mitigation Needed**: Add UUID or non-sequential IDs for posts.

### ❌ Direct Object Manipulation - CONFIRMED

The frontend sends the `statue` value to the backend:
```typescript
// frontend/src/app/service/auth.ts:179-182
updatePostStatue(id: number, statue: string): Observable<Post> {
  return this.http.patch<Post>(`${this.apiUrl}/admin/updateStatusP/${id}`, 
    { statue: statue })
}
```

**Problem**: The service method IGNORES this parameter and toggles instead. This creates unpredictable behavior.

### ❌ API Routes Exposing Hidden Content - CONFIRMED

**Vulnerable Endpoints**:
1. `GET /api/post/{id}` - Returns any post regardless of statue
2. `GET /api/posts/{username}` - Lists all user posts including hidden
3. `GET /api/posts/CurrentUserPost` - Shows own hidden posts
4. `GET /api/posts/getComment/{postId}` - Comments on hidden posts accessible

---

## 3. Error Handling & Edge Cases ❌ INADEQUATE

### Missing Authorization Check
```java
@Transactional(readOnly = true)
public Post getPost(Authentication authentication, Long id) {
    User currentUser = getUserOrThrow(authentication);
    Post post = getPostOrThrow(id);
    // ❌ No check for: if (post.statue == "hidden" && !isAdmin(currentUser))
    return post;
}
```

**Should throw**: `ForbiddenException` when non-admin accesses hidden post.

### State Transition Edge Case
**Scenario**: Post is hidden while user is viewing it.

**Current Behavior**: 
- ❌ User can continue viewing (no real-time checks)
- ❌ Comments/likes still work on hidden posts

**Should implement**: 
- Check post visibility on every operation
- Return 403 Forbidden for hidden posts

### Caching Issues
No caching implementation found, but if added later:
- ⚠️ Cache keys must include `statue` field
- ⚠️ Admin bypass must invalidate user caches

---

## 4. Code Quality + Best Practices

### ❌ Critical Issues

#### 1. Typo in Field Name
```java
private String statue; // Should be "status"
```
**Impact**: Throughout entire codebase (database, models, APIs)
**Fix**: Database migration required

#### 2. Duplicated Filtering Logic
The pattern `if (ADMIN_ROLE.equals(user.getRole()))` appears in multiple places without abstraction.

**Recommended**: Extract to helper method
```java
private boolean isAdmin(User user) {
    return ADMIN_ROLE.equals(user.getRole());
}

private boolean canViewPost(User user, Post post) {
    return "active".equals(post.getStatue()) || isAdmin(user);
}
```

#### 3. Inconsistent Query Patterns
Some queries paginate, others don't. Some filter by statue, most don't.

**Recommendation**: Create base repository methods
```java
// Add to PostRepository.java
@Query("SELECT p FROM Post p WHERE p.id = :id AND (p.statue = 'active' OR :isAdmin = true)")
Optional<Post> findByIdAndVisibility(@Param("id") Long id, @Param("isAdmin") boolean isAdmin);

@Query("SELECT p FROM Post p WHERE p.user.id = :userId AND (p.statue = 'active' OR :isAdmin = true)")
Page<Post> findByUserIdAndVisibility(@Param("userId") Long userId, 
                                      @Param("isAdmin") boolean isAdmin, 
                                      Pageable pageable);
```

#### 4. No Audit Trail
When posts are hidden/unhidden:
- ❌ No logging of who performed action
- ❌ No timestamp of status change
- ❌ No reason field

**Recommended**: Add audit fields
```java
@Column(name = "hidden_at")
private LocalDateTime hiddenAt;

@Column(name = "hidden_by_user_id")
private Long hiddenByUserId;

@Column(name = "hidden_reason")
private String hiddenReason;
```

### ⚠️ Database Query Efficiency

Current query in feed:
```java
Page<Post> postsPage = postRepository.findByUser_IdInAndStatueOrderByCreatedAtDesc(
    followingIds, "active", pageable);
```

**Issue**: `IN` clause with large follower lists can be slow.

**Optimization**: Add composite index
```sql
CREATE INDEX idx_post_user_statue_created 
ON posts(user_id, statue, created_at DESC);
```

### ⚠️ Frontend Security Gaps

**File**: `dashboard.html:221`
```html
<span *ngIf="post.statue === 'hidden'" class="status-chip hidden">Hidden</span>
```

**Problem**: Client-side display only. A modified client could hide this indicator.

**Solution**: All security must be server-side (already violated as shown above).

---

## 5. Immediate Action Items (Priority Order)

### 🔴 CRITICAL (Fix Today)

1. **Add visibility check to `getPost()`**
```java
public Post getPost(Authentication authentication, Long id) {
    User currentUser = getUserOrThrow(authentication);
    Post post = getPostOrThrow(id);
    
    if ("hidden".equals(post.getStatue()) && !ADMIN_ROLE.equals(currentUser.getRole())) {
        throw new ForbiddenException("This post is not available");
    }
    
    post.setIsLiked(likeRepository.existsByUser_IdAndPost_Id(currentUser.getId(), post.getId()));
    return post;
}
```

2. **Fix `getPostsUser()` to filter hidden posts**
```java
public Page<Post> getPostsUser(Authentication authentication, String username, Pageable pageable) {
    User currentUser = getUserOrThrow(authentication);
    User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    
    if (ADMIN_ROLE.equals(currentUser.getRole())) {
        return addLikeStatus(
            postRepository.findByUser_IdOrderByCreatedAtDesc(user.getId(), pageable), 
            currentUser.getId()
        );
    }
    
    // Non-admins only see active posts
    return addLikeStatus(
        postRepository.findByUser_IdAndStatueOrderByCreatedAtDesc(user.getId(), "active", pageable),
        currentUser.getId()
    );
}
```

3. **Add explicit admin check in controller**
```java
@PatchMapping("/admin/updateStatusP/{id}")
public ResponseEntity<Post> updatePostStatue(
        Authentication authentication,
        @PathVariable Long id,
        @RequestBody Map<String, String> payload) {
    
    User user = helper.getCurrentUser(authentication);
    if (!"ROLE_ADMIN".equals(user.getRole())) {
        throw new UnauthorizedException("Only admins can change post visibility");
    }
    
    String statue = payload.get("statue");
    Post post = postsService.updatePostStatue(id, statue);
    return ResponseEntity.ok(post);
}
```

### 🟠 HIGH (Fix This Week)

4. Fix the logic bug in `updatePostStatue()` (use provided value instead of toggle)
5. Add repository method `findByUser_IdAndStatueOrderByCreatedAtDesc` and use it
6. Add visibility checks to comment endpoints
7. Add audit logging for hide/unhide actions

### 🟡 MEDIUM (Fix This Sprint)

8. Rename `statue` to `status` (requires DB migration)
9. Add database index for performance
10. Extract admin/visibility checks to helper methods
11. Add integration tests for hidden post access control

---

## 6. Testing Checklist

After fixes, verify:
- [ ] Regular user CANNOT access hidden post via direct URL
- [ ] Hidden posts DO NOT appear in user profile feeds
- [ ] Hidden posts DO NOT appear in search results
- [ ] Admin CAN see hidden posts in dashboard
- [ ] Admin CAN hide/unhide posts
- [ ] Regular user CANNOT call hide/unhide endpoint (403)
- [ ] Comments on hidden posts return 403 for non-admins
- [ ] Likes on hidden posts return 403 for non-admins
- [ ] Performance test with 1000+ followed users

---

## Conclusion

The hide/unhide feature has **critical security flaws** that allow unauthorized access to supposedly hidden content. The implementation fails basic access control principles:

1. ❌ No authorization checks on read operations
2. ❌ Inconsistent filtering across endpoints  
3. ❌ Logic bugs in update method
4. ❌ Missing audit trail

**Risk Level**: HIGH - Sensitive content can be viewed by unauthorized users.

**Estimated Fix Time**: 4-6 hours for critical issues, 2 days for full remediation.
