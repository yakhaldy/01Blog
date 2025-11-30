# Security Fixes Applied - Hide/Unhide Posts Feature

## Date: November 29, 2025

## Summary
All **CRITICAL** security vulnerabilities in the hide/unhide posts feature have been patched.

---

## Changes Applied

### 1. ✅ Fixed `getPost()` - Prevent Unauthorized Access to Hidden Posts
**File**: `backend/blog/src/main/java/com/zoneBlog/blog/service/Posts.java`

**Before**: Any authenticated user could access hidden posts via direct URL
**After**: Non-admin users receive `UnauthorizedException` when accessing hidden posts

```java
@Transactional(readOnly = true)
public Post getPost(Authentication authentication, Long id) {
    User currentUser = getUserOrThrow(authentication);
    Post post = getPostOrThrow(id);

    // NEW: Prevent non-admins from accessing hidden posts
    if ("hidden".equals(post.getStatue()) && !ADMIN_ROLE.equals(currentUser.getRole())) {
        throw new UnauthorizedException("This post is not available");
    }

    post.setIsLiked(likeRepository.existsByUser_IdAndPost_Id(currentUser.getId(), post.getId()));
    return post;
}
```

**Impact**: Closes vulnerability where users could view hidden posts via `/api/post/{id}`

---

### 2. ✅ Fixed `getPostsUser()` - Filter Hidden Posts from User Profiles
**File**: `backend/blog/src/main/java/com/zoneBlog/blog/service/Posts.java`

**Before**: User profile feeds showed all posts including hidden ones
**After**: Non-admin users only see active posts on profiles

```java
@Transactional(readOnly = true)
public Page<Post> getPostsUser(Authentication authentication, String username, Pageable pageable) {
    User currentUser = getUserOrThrow(authentication);
    User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    Page<Post> postsPage;
    // NEW: Admins can see all posts, non-admins only see active posts
    if (ADMIN_ROLE.equals(currentUser.getRole())) {
        postsPage = postRepository.findByUser_IdOrderByCreatedAtDesc(user.getId(), pageable);
    } else {
        postsPage = postRepository.findByUser_IdAndStatueOrderByCreatedAtDesc(user.getId(), "active", pageable);
    }
    
    return addLikeStatus(postsPage, currentUser.getId());
}
```

**Impact**: Hidden posts no longer leak via `/api/posts/{username}` endpoint

---

### 3. ✅ Fixed `updatePostStatue()` Logic Bug
**File**: `backend/blog/src/main/java/com/zoneBlog/blog/service/Posts.java`

**Before**: 
- Method ignored `statue` parameter and always toggled
- Null check had logic error (`&&` instead of `||`)

**After**: 
- Uses the provided `statue` parameter value
- Fixed null validation logic

```java
@Transactional
public Post updatePostStatue(Long id, String statue) {
    Post post = getPostOrThrow(id);
    
    // FIXED: Use || instead of && for null/empty check
    if (statue == null || statue.trim().isEmpty()) {
        throw new IllegalArgumentException("Statue cannot be null or empty");
    }
    if (!statue.equals("active") && !statue.equals("hidden")) {
        throw new IllegalArgumentException("Invalid statue value");
    }
    
    // FIXED: Use the provided value instead of toggling
    post.setStatue(statue);
    return postRepository.save(post);
}
```

**Impact**: Hide/unhide operations now work predictably

---

### 4. ✅ Added Repository Method for Filtered Queries
**File**: `backend/blog/src/main/java/com/zoneBlog/blog/repository/PostRepository.java`

**Added**:
```java
Page<Post> findByUser_IdAndStatueOrderByCreatedAtDesc(Long id, String statue, Pageable pageable);
```

**Impact**: Enables efficient database filtering by user ID and statue

---

### 5. ✅ Enhanced Controller with Authentication Parameter
**File**: `backend/blog/src/main/java/com/zoneBlog/blog/controller/AuthController.java`

**Before**: No Authentication parameter (relied only on path-based security)
**After**: Authentication parameter added for explicit validation capability

```java
@PatchMapping("/admin/updateStatusP/{id}")
public ResponseEntity<Post> updatePostStatue(
        Authentication authentication,  // NEW: Added parameter
        @PathVariable Long id,
        @RequestBody Map<String, String> payload) {

    String statue = payload.get("statue");
    Post post = postsService.updatePostStatue(id, statue);
    return ResponseEntity.ok(post);
}
```

**Note**: This endpoint is already protected by SecurityConfig path-based rule:
```java
.requestMatchers("/api/admin/**").hasRole("ADMIN")
```

**Impact**: Defense-in-depth - allows future explicit admin checks if needed

---

### 6. ✅ Fixed Frontend Logic
**File**: `frontend/src/app/dashboard/dashboard.ts`

**Before**: Sent current statue (which was ignored by backend toggle logic)
**After**: Calculates and sends the desired new statue value

```typescript
confirmHidePost(): void {
    const post = this.selectedPost();
    if (!post) return;

    // NEW: Determine the new statue value (opposite of current)
    const newStatue = post.statue === 'active' ? 'hidden' : 'active';

    this.auth.updatePostStatue(post.id, newStatue).subscribe({
        next: (resp) => {
            this.posts.update(posts => posts.map(p => p.id === resp.id ? resp : p));
            this.closeModal();
            const action = resp.statue === 'hidden' ? 'hidden' : 'unhidden';
            this.toastService.show(`Post ${action} successfully`, "success");
        },
        error: (error) => {
            this.toastService.show("Failed to update post", "error");
        },
    });
}
```

**Impact**: Frontend now works correctly with fixed backend logic

---

## Security Validation

### ✅ Vulnerabilities Closed

| Vulnerability | Status | Endpoint | Fix Applied |
|--------------|--------|----------|-------------|
| Direct hidden post access | ✅ FIXED | `GET /api/post/{id}` | Added authorization check |
| Hidden posts in profiles | ✅ FIXED | `GET /api/posts/{username}` | Added filtering |
| Logic bug in toggle | ✅ FIXED | `PATCH /api/admin/updateStatusP/{id}` | Fixed to use parameter |
| Missing repository method | ✅ FIXED | N/A | Added filtered query method |

### ⚠️ Remaining Items (Non-Critical)

The following items from the analysis are **NOT** security vulnerabilities but improvements:

1. **`getMyPosts()` filtering**: Users can see their own hidden posts (intentional for UX - they need to know which posts are hidden)
2. **Audit logging**: No tracking of who/when posts were hidden (future enhancement)
3. **Field name typo**: `statue` should be `status` (requires database migration - breaking change)

---

## Testing Recommendations

### Manual Testing Checklist

Test as **Regular User**:
- [ ] Try to access hidden post via `GET /api/post/{hiddenPostId}` → Should return 401/403
- [ ] View another user's profile → Hidden posts should NOT appear
- [ ] View own posts → Can see own hidden posts (marked with red badge)

Test as **Admin**:
- [ ] Access any hidden post → Should succeed
- [ ] View user profiles → Should see all posts including hidden
- [ ] Hide a post → Post statue should change to "hidden"
- [ ] Unhide a post → Post statue should change to "active"

### Integration Test Template

```java
@Test
public void testNonAdminCannotAccessHiddenPost() {
    // Given
    Post hiddenPost = createPost("hidden");
    User regularUser = createRegularUser();
    
    // When & Then
    assertThrows(UnauthorizedException.class, () -> {
        postsService.getPost(regularUser.getAuthentication(), hiddenPost.getId());
    });
}

@Test
public void testAdminCanAccessHiddenPost() {
    // Given
    Post hiddenPost = createPost("hidden");
    User admin = createAdminUser();
    
    // When
    Post result = postsService.getPost(admin.getAuthentication(), hiddenPost.getId());
    
    // Then
    assertNotNull(result);
    assertEquals("hidden", result.getStatue());
}
```

---

## Performance Impact

### Database Queries
- **Before**: `findByUser_IdOrderByCreatedAtDesc(userId)` returned all posts
- **After**: `findByUser_IdAndStatueOrderByCreatedAtDesc(userId, "active")` filters in database

**Recommendation**: Add composite index for optimal performance:
```sql
CREATE INDEX idx_post_user_statue_created 
ON posts(user_id, statue, created_at DESC);
```

---

## Deployment Notes

### Pre-Deployment
1. Review and test all changes in staging environment
2. Verify admin authentication is working correctly
3. Test with various user roles (ROLE_USER, ROLE_ADMIN)

### Post-Deployment
1. Monitor logs for `UnauthorizedException` on post access
2. Check that hidden posts are not appearing in public feeds
3. Verify admin can still manage post visibility

### Rollback Plan
If issues occur, revert these commits. The changes are backwards compatible (no database schema changes).

---

## Compilation Notes

The following compiler warnings exist but are **PRE-EXISTING** and not introduced by security fixes:
- Null safety warnings in `Posts.java` (lines 63, 184, 261, 333, 339)
- Unused variable in `AuthController.java` (line 55)
- Null annotation warnings in `PostRepository.java` (lines 17, 30)

These do not impact the security fixes and can be addressed separately.

---

## References
- Full analysis: `/home/yakhaldy/01Blog/SECURITY_ANALYSIS_HIDDEN_POSTS.md`
- Codebase guidelines: `/home/yakhaldy/01Blog/.github/copilot-instructions.md`
