# GitHub Repository Setup Guide

After creating your repository on GitHub, follow these steps:

## 1. Repository Settings

### Description
```
A full-stack social blogging platform for students to share learning experiences | Spring Boot + Angular + PostgreSQL + Docker
```

### Topics (Add these tags)
```
spring-boot
angular
postgresql
docker
fullstack
jwt-authentication
server-sent-events
social-media
zone01
web-development
material-design
rest-api
docker-compose
maven
typescript
```

### Website
```
Add your deployed URL here (if you deploy to cloud)
```

## 2. About Section

Enable these features:
- ✅ Releases
- ✅ Packages
- ✅ Deployments (if applicable)
- ✅ Environments (if applicable)

## 3. Repository Options

### General Settings
- ✅ Allow issues
- ✅ Allow discussions (optional)
- ✅ Preserve this repository (recommended)

### Features
- ✅ Wikis (optional - for expanded docs)
- ✅ Projects (optional - for roadmap)

## 4. Branch Protection (Optional but recommended)

For `main` branch:
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging

## 5. Create Initial Release

```bash
# Tag your first release
git tag -a v1.0.0 -m "Initial release - 01Blog v1.0.0"
git push origin v1.0.0
```

Then create a release on GitHub with:
- **Tag**: v1.0.0
- **Title**: 01Blog v1.0.0 - Initial Release
- **Description**:
```markdown
🎉 First stable release of 01Blog!

## Features
- User authentication and authorization (JWT)
- Social interactions (follow, like, comment)
- Real-time notifications (Server-Sent Events)
- Admin dashboard
- Content moderation and reporting
- Dockerized deployment
- Full CRUD operations for posts

## Tech Stack
- Backend: Spring Boot 3.5.5 (Java 17)
- Frontend: Angular 20.2.2
- Database: PostgreSQL
- Deployment: Docker & Docker Compose

## Getting Started
See [README.md](README.md) for installation instructions.

Docker Quick Start:
\`\`\`bash
docker compose up -d
\`\`\`

Access the app at http://localhost:8000
```

## 6. Pin Repository

Go to your GitHub profile and pin this repository so it appears in your featured projects.

## 7. Social Preview Image (Optional but Recommended)

Create a 1280x640px image showing:
- Project name and logo
- Tech stack logos (Spring Boot, Angular, PostgreSQL, Docker)
- Key features or screenshot

Upload in: Settings → Social preview

## 8. README Badges (Optional)

Add these at the top of README.md:

```markdown
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Angular](https://img.shields.io/badge/Angular-20.2.2-red.svg)](https://angular.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
```

## 9. GitHub Actions (Future Enhancement)

Consider adding CI/CD workflows in `.github/workflows/`:
- Build and test on pull requests
- Automated security scanning
- Docker image building

## 10. Star Your Own Repo!

Yes, seriously! It signals to others that this is a quality project.

---

## Quick Command Sequence

```bash
# After creating repo on GitHub
git remote add origin https://github.com/yourusername/01blog.git

# Stage all files
git add .

# Commit
git commit -m "Initial commit: 01Blog - Full-stack social blogging platform"

# Push
git push -u origin main

# Create and push tag
git tag -a v1.0.0 -m "Initial release v1.0.0"
git push origin v1.0.0

# Pin repo, add topics, and create release on GitHub UI
```

---

**Your repository is now professionally configured!** 🚀
