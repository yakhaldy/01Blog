# Blog Application - AI Coding Assistant Instructions

## Architecture Overview

This is a full-stack blog application with:
- **Backend**: Spring Boot (Java) REST API with JWT authentication
- **Frontend**: Angular 18+ standalone components with Material Design
- **Database**: PostgreSQL (inferred from JPA usage)
- **File Storage**: Local filesystem (`uploads/` directory)

### Key Architectural Patterns
- **Backend**: Service-layer architecture (Controller → Service → Repository)
- **Frontend**: Signals-based reactive state management (Angular 18+)
- **Security**: JWT tokens with role-based access control (USER, ADMIN)
- **Real-time**: SSE (Server-Sent Events) for notifications

## Critical Security Context

### Admin-Only Operations
The following endpoints require `ROLE_ADMIN`:
- `/api/admin/**` - All admin operations (configured in `SecurityConfig.java`)
- Post visibility control (`updatePostStatue`)
- User management (ban, delete users)
- Report management

### Post Visibility ("statue" field)
**CRITICAL SECURITY ISSUE FOUND**: The `statue` field (should be "status") controls post visibility with values:
- `"active"` - Visible to all users
- `"hidden"` - Should be admin-only, but **NOT properly filtered in queries**

**Current Implementation Problems**:
1. ❌ `getPost(id)` - Returns hidden posts to ANY authenticated user
2. ❌ `getPostsUser(username)` - Shows hidden posts on user profiles
3. ❌ `getMyPosts()` - No filtering by statue
4. ⚠️ `getPosts()` - Only filters for non-admin users in feed
5. ❌ No validation that requester is admin in `updatePostStatue` controller endpoint

## Common Development Workflows

### Running the Application

**Backend** (from `backend/blog/`):
```bash
./mvnw spring-boot:run
# Or on Windows: mvnw.cmd spring-boot:run
```

**Frontend** (from `frontend/`):
```bash
npm start
# Or: ng serve
```

### Database Setup
Run `installDB.sh` in project root to initialize PostgreSQL database.

### File Uploads
- Stored in `backend/blog/uploads/`
- Retrieved via `/uploads/**` endpoint (publicly accessible)
- Handled by `Helper.handleFileUpload()` service method

## Project-Specific Conventions

### Naming Inconsistencies (Be Aware!)
- `statue` → Should be `status` (typo in database schema and throughout codebase)
- `isfollowing` → Should be `isFollowing` (camelCase)
- `isBanned` → Correct (inconsistent with above)

### Data Transfer Objects
- Located in `backend/blog/src/main/java/com/zoneBlog/blog/dataTransferObj/`
- Use `@Valid` annotation for validation
- Request objects: `LoginRequest`, `RegisterRequest`, `PostRequest`, etc.

### Frontend State Management
- **Signals** (Angular 18+): Prefer `signal()` for reactive state
- **Computed values**: Use `computed()` for derived state
- **Two-way binding helpers**: Implement `updateXxx(value)` methods for `ngModel`

Example pattern from `dashboard.ts`:
```typescript
searchTerm = signal('');
updateSearchTerm(value: string): void {
  this.searchTerm.set(value);
}
// In template: [ngModel]="searchTerm()" (ngModelChange)="updateSearchTerm($event)"
```

### Error Handling
- Backend: `GlobalExceptionHandler` with custom exceptions (`ResourceNotFoundException`, `UnauthorizedException`, etc.)
- Frontend: `ErrorHandlerService` with centralized error handling
- Use `ToastService` for user notifications

### Modal Patterns
Frontend uses custom "door" animations for modals:
- `showModal = signal(false)` - Controls backdrop visibility
- `isOpen = signal(false)` - Controls animation state
- Always call `openModal()` then `setTimeout(() => isOpen.set(true))` for animation

## Security Best Practices for This Codebase

### When Adding Admin Features
1. **Controller**: Add `@PreAuthorize("hasRole('ADMIN')")` OR rely on path-based security
2. **Service**: Call `validateAdminAccess(authentication)` at method start
3. **Repository**: Create specific queries that filter by role/permissions

### When Querying Posts
Always filter by `statue = 'active'` unless the user is an admin:
```java
// Example fix needed:
if (!ADMIN_ROLE.equals(user.getRole())) {
    return postRepository.findByIdAndStatue(id, "active");
}
```

## Integration Points

### Notification System
- **Backend**: `NotificationService` creates notifications, `NotificationController` provides SSE stream
- **Frontend**: `NotificationService` connects to `/api/notifications/stream`
- Types: `LIKE`, `COMMENT`, `POST`, `FOLLOW`

### Follow System
- `FollowRepository` tracks follower/following relationships
- Feed (`getPosts`) shows posts from followed users + own posts
- Uses `findByUser_IdInAndStatueOrderByCreatedAtDesc` query

### Report System
- Users can report other users via `Profile.reportUser()`
- Admins manage reports in dashboard
- Statuses: `"pending"`, `"resolved"`, `"dismissed"`

## Key Files Reference

### Backend Core
- `SecurityConfig.java` - Auth rules, JWT filter chain, CORS
- `Posts.java` - All post CRUD operations (CREATE, UPDATE, DELETE, LIKE)
- `Admin.java` - Admin dashboard stats, user management
- `Profile.java` - User profiles, follow/unfollow, reporting

### Frontend Core
- `auth.ts` - HTTP service with all API calls
- `dashboard.ts` - Admin dashboard (users, posts, reports tabs)
- `home.ts` - Main feed with infinite scroll
- `profile.ts` - User profile view with posts

### Models
- Backend: `backend/blog/src/main/java/com/zoneBlog/blog/model/`
- Frontend: `frontend/src/app/model/model.ts`

## Testing Notes
- Backend tests: `BlogApplicationTests.java` (minimal coverage)
- Frontend tests: `*.spec.ts` files exist but may not be comprehensive
- Manual testing recommended for authentication flows

## Known Technical Debt
1. **Typo**: `statue` field should be renamed to `status` (breaking change)
2. **Hidden posts leak**: Not filtered in several endpoints (security issue)
3. **No input sanitization**: XSS risks in user-generated content
4. **Rate limiting**: Exists (`RateLimitFilter`) but configuration unclear
5. **Pagination**: Inconsistent - some endpoints paginated, others return full lists

## When Implementing New Features
1. Check if admin-only: Add proper security checks
2. Handle file uploads: Use `Helper.handleFileUpload()` and cleanup old files
3. Add notifications: Use `NotificationService.addNotification()`
4. Update counts: Remember to update denormalized counts (likes, comments, followers)
5. Consider visibility: Should hidden posts be shown? Filter appropriately.
