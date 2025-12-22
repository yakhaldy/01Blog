# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in 01Blog, please report it by:

1. **DO NOT** create a public GitHub issue
2. Email the maintainer directly with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Security Best Practices

### For Development
- Never commit `.env` files
- Use strong passwords for database and JWT secrets
- Keep dependencies updated
- Run security audits regularly:
  ```bash
  # Backend
  mvn dependency:check
  
  # Frontend
  npm audit
  ```

### For Production
- Change all default passwords
- Use HTTPS only
- Enable CORS only for trusted domains
- Use environment variables for sensitive data
- Regular security updates
- Monitor logs for suspicious activity
- Implement rate limiting (already included)
- Regular database backups

## Known Security Features

✅ JWT-based authentication
✅ BCrypt password encryption
✅ SQL injection prevention (JPA/Hibernate)
✅ CORS protection
✅ Rate limiting
✅ Input validation
✅ File upload validation
✅ Banned user handling
✅ XSS protection (Angular sanitization)

## Dependencies

We regularly update dependencies to patch security vulnerabilities. Please report any outdated dependencies.

## Contact

For security concerns, please contact the repository maintainer.
