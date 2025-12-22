# Contributing to 01Blog

Thank you for considering contributing to 01Blog! This document outlines the process for contributing to this project.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue on GitHub with:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Your environment (OS, browser, etc.)

### Suggesting Enhancements

Enhancement suggestions are welcome! Please create an issue with:
- A clear, descriptive title
- Detailed description of the proposed enhancement
- Why this enhancement would be useful
- Examples of how it would work

### Pull Requests

1. **Fork the repository**

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Write clear, commented code
   - Add tests if applicable

4. **Test your changes**
   ```bash
   # Backend tests
   cd backend/blog
   mvn test

   # Frontend tests
   cd frontend
   npm test
   ```

5. **Commit your changes**
   ```bash
   git commit -m "Add: brief description of your changes"
   ```
   
   Commit message format:
   - `Add: new feature`
   - `Fix: bug description`
   - `Update: improvement description`
   - `Docs: documentation changes`
   - `Refactor: code refactoring`

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Provide a clear description of the changes
   - Reference any related issues
   - Ensure all tests pass

## Development Setup

See [README.md](README.md) for detailed setup instructions.

### Quick Start with Docker
```bash
docker compose up -d
```

### Manual Development Setup
See the README for backend and frontend setup.

## Code Style Guidelines

### Backend (Java)
- Follow standard Java naming conventions
- Use meaningful variable and method names
- Add JavaDoc comments for public methods
- Keep methods small and focused

### Frontend (TypeScript/Angular)
- Follow Angular style guide
- Use TypeScript strict mode
- Write meaningful component and service names
- Add JSDoc comments for complex functions

## Testing

- Write unit tests for new features
- Ensure all existing tests pass
- Test on both development and production builds

## Questions?

Feel free to open an issue for any questions or concerns.

Thank you for contributing! 🎉
