#!/bin/bash
# Replace hardcoded localhost API URLs with dynamically provided BACKEND_URL from Render.
# Note: On Render, BACKEND_URL will be passed as https://blog-backend.onrender.com (or similar).

if [ -n "$BACKEND_URL" ]; then
  echo "Replacing localhost:8080 with backend url: $BACKEND_URL"
  # Use double quotes for the sed pattern, but escape special chars and ensure exact match
  sed -i "s|http://localhost:8080|$BACKEND_URL|g" src/app/service/auth.ts || true
  sed -i "s|http://localhost:8080/uploads|$BACKEND_URL/uploads|g" src/app/service/auth.ts || true
  sed -i "s|http://localhost:8080/api/notifications|$BACKEND_URL/api/notifications|g" src/app/service/notifications.ts || true
fi

npm ci
npm run build
