# 01Blog - Social Blogging Platform

A fullstack social blogging platform where students can share their learning experiences, discoveries, and progress throughout their journey. Users can interact with content, follow one another, and engage in meaningful discussions.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Security & Authentication](#security--authentication)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

01Blog is a fullstack application built to help students document their learning journey. The platform provides:

- **User Profiles**: Each user has a public "block" showcasing all their posts
- **Social Features**: Follow users, like posts, comment, and receive notifications
- **Content Management**: Create, edit, and delete posts with media support
- **Moderation System**: Report inappropriate content and admin tools for platform management
- **Secure Authentication**: Role-based access control (User vs Admin)

## ✨ Features

### Core Features

#### Authentication & Authorization
- ✅ User registration with email validation
- ✅ Secure login with JWT tokens
- ✅ Password encryption using BCrypt
- ✅ Role-based access control (USER, ADMIN)
- ✅ Banned user handling

#### User Profiles (Block Pages)
- ✅ Public profile with user information
- ✅ Display all posts created by user
- ✅ Follow/Unfollow functionality
- ✅ Follower and following counts
- ✅ Profile editing (avatar, bio)

#### Posts Management
- ✅ Create posts with text and media (images/videos)
- ✅ Edit and delete own posts
- ✅ Post visibility status (visible/hidden)
- ✅ Media upload with file validation
- ✅ Post timestamps and statistics
- ✅ Infinite scroll pagination

#### Social Interactions
- ✅ Like/Unlike posts
- ✅ Comment on posts
- ✅ Real-time comment updates
- ✅ Like and comment counts

#### Notifications
- ✅ Real-time notifications using Server-Sent Events (SSE)
- ✅ Notification icon with unread count
- ✅ Mark notifications as read
- ✅ Notification types: likes, comments, follows

#### Reporting System
- ✅ Report users with detailed reasons
- ✅ Report posts for inappropriate content
- ✅ Timestamp and reporter tracking
- ✅ Admin-only access to reports

#### Admin Dashboard
- ✅ View all users and posts
- ✅ Manage user reports
- ✅ Ban/Unban users
- ✅ Hide/Show posts
- ✅ Delete posts
- ✅ Platform statistics

### Bonus Features Implemented

- ✅ **Real-time updates** using Server-Sent Events (SSE)
- ✅ **Infinite scroll** on feeds
- ✅ **Dashboard analytics** for admins
- ✅ **Rate limiting** to prevent abuse
- ✅ **Status chips** for hidden posts

## 🛠 Technologies Used

### Backend
- **Java 17**
- **Spring Boot 3.5.5**
  - Spring Security
  - Spring Data JPA
  - Spring Validation
  - Spring Web
- **PostgreSQL** - Relational database
- **JWT (JSON Web Tokens)** - Authentication
- **Lombok** - Reduce boilerplate code
- **BCrypt** - Password encryption
- **Dotenv** - Environment variable management

### Frontend
- **Angular 20.2.2**
- **TypeScript**
- **Angular Material** - UI components
- **RxJS** - Reactive programming
- **Server-Sent Events (SSE)** - Real-time notifications
- **Zoneless Change Detection** - Performance optimization

### Development Tools
- **Maven** - Build automation
- **Git** - Version control
- **VS Code / IntelliJ IDEA** - IDEs

## 📁 Project Structure

```
01blog/
├── backend/
│   └── blog/
│       ├── src/
│       │   ├── main/
│       │   │   ├── java/com/zoneBlog/blog/
│       │   │   │   ├── config/          # Security, CORS, Async configs
│       │   │   │   ├── controller/      # REST API endpoints
│       │   │   │   ├── dataTransferObj/ # DTOs for requests
│       │   │   │   ├── event/           # Application events
│       │   │   │   ├── exception/       # Custom exceptions & handlers
│       │   │   │   ├── model/           # JPA entities
│       │   │   │   ├── repository/      # Data access layer
│       │   │   │   ├── security/        # JWT, filters, rate limiting
│       │   │   │   └── service/         # Business logic
│       │   │   └── resources/
│       │   │       └── application.properties
│       │   └── test/
│       ├── uploads/                     # Media storage
│       ├── .env                         # Environment variables (not in git)
│       ├── .env.example                 # Environment template
│       └── pom.xml                      # Maven dependencies
│
└── frontend/
    ├── src/
    │   └── app/
    │       ├── components/              # Reusable components
    │       │   ├── edit-profile/
    │       │   ├── error-403/
    │       │   ├── error-404/
    │       │   ├── error-500/
    │       │   ├── navbar/
    │       │   ├── report-dialog/
    │       │   └── toast/
    │       ├── dashboard/               # Admin dashboard
    │       ├── home/                    # Feed page
    │       ├── login/                   # Authentication
    │       ├── register/
    │       ├── profile/                 # User block page
    │       ├── singal-post/             # Post detail page
    │       ├── notifications/           # Notification center
    │       ├── interceptors/            # HTTP interceptors
    │       ├── service/                 # API services & guards
    │       ├── model/                   # TypeScript interfaces
    │       └── helper/                  # Utility functions
    ├── public/                          # Static assets
    └── package.json
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Java Development Kit (JDK) 17 or higher**
  ```bash
  java -version
  ```

- **Node.js (v18 or higher) and npm**
  ```bash
  node -v
  npm -v
  ```

- **PostgreSQL (v12 or higher)**
  ```bash
  psql --version
  ```

- **Maven (v3.6 or higher)**
  ```bash
  mvn -v
  ```

- **Git**
  ```bash
  git --version
  ```

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd 01blog
```

### 2. Database Setup

#### Create PostgreSQL Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE blogdb;
CREATE USER bloguser WITH PASSWORD 'Password';
GRANT ALL PRIVILEGES ON DATABASE blogdb TO bloguser;

# Exit psql
\q
```

Alternatively, run the provided script:

```bash
chmod +x installDB.sh
./installDB.sh
```

### 3. Backend Setup

#### Configure Environment Variables

```bash
cd backend/blog

# Copy the example .env file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**.env configuration:**

```properties
# Database Configuration
DB_URL=jdbc:postgresql://localhost:5432/blogdb
DB_USERNAME=bloguser
DB_PASSWORD=StrongPassword123!

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_at_least_256_bits_long_12345

# File Upload Configuration
MAX_FILE_SIZE=20MB
MAX_REQUEST_SIZE=20MB

# Server Configuration
SERVER_PORT=8080
```

#### Install Dependencies & Build

```bash
# Install dependencies
mvn clean install

# Or skip tests
mvn clean install -DskipTests
```

### 4. Frontend Setup

```bash
cd ../../frontend

# Install dependencies
npm install
```

## ▶️ Running the Application

### Start Backend Server

```bash
cd backend/blog

# Run with Maven
mvn spring-boot:run

# Or run the JAR directly
java -jar target/blog-0.0.1-SNAPSHOT.jar
```

The backend will start on **http://localhost:8080**

### Start Frontend Development Server

```bash
cd frontend

# Start Angular development server
npm start

# Or
ng serve
```

The frontend will start on **http://localhost:4200**

### Access the Application

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8080/api
- **Uploads**: http://localhost:8080/uploads

## 📡 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/me` | Get current user | ✅ |
| GET | `/api/users/{username}` | Get user profile | ✅ |
| PUT | `/api/users/update-profile` | Update profile | ✅ |
| POST | `/api/users/follow/{userId}` | Follow/Unfollow user | ✅ |

### Post Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/posts` | Get all posts (paginated) | ✅ |
| GET | `/api/posts/{id}` | Get single post | ✅ |
| POST | `/api/posts` | Create post | ✅ |
| PUT | `/api/posts/{id}` | Update post | ✅ |
| DELETE | `/api/posts/{id}` | Delete post | ✅ |
| POST | `/api/posts/{id}/like` | Like/Unlike post | ✅ |

### Comment Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/comments/post/{postId}` | Get post comments | ✅ |
| POST | `/api/comments` | Add comment | ✅ |
| DELETE | `/api/comments/{id}` | Delete comment | ✅ |

### Notification Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/notifications/stream` | SSE stream | ✅ |
| GET | `/api/notifications` | Get all notifications | ✅ |
| PUT | `/api/notifications/{id}/read` | Mark as read | ✅ |
| GET | `/api/notifications/unread-count` | Get unread count | ✅ |

### Report Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/reports/user/{userId}` | Report user | ✅ |
| POST | `/api/reports/post/{postId}` | Report post | ✅ |

### Admin Endpoints (ADMIN only)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/dashboard` | Get dashboard stats | ✅ (ADMIN) |
| GET | `/api/admin/users` | Get all users | ✅ (ADMIN) |
| GET | `/api/admin/reports` | Get all reports | ✅ (ADMIN) |
| PUT | `/api/admin/users/{id}/ban` | Ban/Unban user | ✅ (ADMIN) |
| PUT | `/api/admin/posts/{id}/hide` | Hide/Show post | ✅ (ADMIN) |
| DELETE | `/api/admin/posts/{id}` | Delete post | ✅ (ADMIN) |

## 🗄 Database Schema

### Main Entities

#### User
- `id` (BIGINT, PK)
- `username` (VARCHAR, UNIQUE)
- `email` (VARCHAR, UNIQUE)
- `password` (VARCHAR, encrypted)
- `role` (VARCHAR) - ROLE_USER, ROLE_ADMIN
- `bio` (TEXT)
- `avatar` (VARCHAR)
- `isBanned` (BOOLEAN)
- `createdAt` (TIMESTAMP)

#### Post
- `id` (BIGINT, PK)
- `title` (TEXT)
- `mediaUrls` (TEXT[])
- `statue` (VARCHAR) - visible, hidden
- `createdAt` (TIMESTAMP)
- `user_id` (BIGINT, FK)

#### Comment
- `id` (BIGINT, PK)
- `content` (TEXT)
- `createdAt` (TIMESTAMP)
- `user_id` (BIGINT, FK)
- `post_id` (BIGINT, FK)

#### Like
- `id` (BIGINT, PK)
- `user_id` (BIGINT, FK)
- `post_id` (BIGINT, FK)
- UNIQUE(user_id, post_id)

#### Follow
- `id` (BIGINT, PK)
- `follower_id` (BIGINT, FK)
- `following_id` (BIGINT, FK)
- UNIQUE(follower_id, following_id)

#### Notification
- `id` (BIGINT, PK)
- `type` (VARCHAR) - LIKE, COMMENT, FOLLOW
- `message` (TEXT)
- `isRead` (BOOLEAN)
- `createdAt` (TIMESTAMP)
- `user_id` (BIGINT, FK)

#### Report
- `id` (BIGINT, PK)
- `reason` (TEXT)
- `targetType` (VARCHAR) - USER, POST
- `createdAt` (TIMESTAMP)
- `reporter_id` (BIGINT, FK)
- `targetUserId` (BIGINT, FK, nullable)
- `targetPostId` (BIGINT, FK, nullable)

## 🔐 Security & Authentication

### JWT Authentication Flow

1. User registers/logs in
2. Server validates credentials
3. Server generates JWT token with user info
4. Client stores token in localStorage
5. Client sends token in Authorization header: `Bearer <token>`
6. Server validates token on each request

### Security Features

- ✅ Password encryption using BCrypt
- ✅ JWT token-based authentication
- ✅ Role-based access control (USER, ADMIN)
- ✅ Banned user detection and blocking
- ✅ Rate limiting to prevent abuse
- ✅ CORS configuration
- ✅ SQL injection prevention (JPA/Hibernate)
- ✅ XSS protection
- ✅ File upload validation

### Protected Routes

#### Frontend Guards
- `AuthGuard` - Requires authentication
- `GuestGuard` - Only for non-authenticated users
- `AdminGuard` - Requires ADMIN role

#### Backend Security
- Public endpoints: `/api/auth/**`, `/uploads/**`
- User endpoints: Require valid JWT
- Admin endpoints: Require ADMIN role
- Ban check: All authenticated requests

## 🎨 UI/UX Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Angular Material** - Consistent UI components
- **Infinite Scroll** - Smooth content loading
- **Real-time Updates** - SSE for instant notifications
- **Toast Notifications** - User feedback for actions
- **Loading States** - Skeleton loaders and spinners
- **Error Handling** - Custom error pages (403, 404, 500)
- **Image/Video Preview** - Media carousel support
- **Form Validation** - Client-side validation with error messages




## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Git Workflow

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent fixes

## 📝 Default Users

After running the application for the first time, you can create users or use these credentials if seeded:

**Admin Account:**
- Email: `admin@01blog.com`
- Password: `Admin123!`

**Test User:**
- Email: `user@01blog.com`
- Password: `User123!`

## 🐛 Common Issues & Solutions

### Backend Issues

**Issue**: `Cannot connect to database`
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
psql -U postgres -c "\l"
```

**Issue**: `Port 8080 already in use`
```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>
```

### Frontend Issues

**Issue**: `Port 4200 already in use`
```bash
# Use a different port
ng serve --port 4300
```

**Issue**: `Module not found`
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.



## 🙏 Acknowledgments

- Spring Boot Documentation
- Angular Official Documentation
- Angular Material Team
- PostgreSQL Community
- JWT.io
- Professeur Mohamed YOUSSFI

---

**Built with ❤️ for zone01 oujda Students**

For questions or support, please open an issue on GitHub.
