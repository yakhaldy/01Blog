#!/bin/bash

echo "🧹 Cleaning 01Blog Project..."
echo ""

# Backend cleanup
echo "📦 Cleaning Backend..."
if [ -d "backend/blog/target" ]; then
    rm -rf backend/blog/target
    echo "  ✓ Removed backend/blog/target"
else
    echo "  ✓ backend/blog/target already clean"
fi

# Frontend cleanup
echo ""
echo "🎨 Cleaning Frontend..."

if [ -d "frontend/.angular" ]; then
    rm -rf frontend/.angular
    echo "  ✓ Removed frontend/.angular cache"
else
    echo "  ✓ frontend/.angular already clean"
fi

if [ -d "frontend/dist" ]; then
    rm -rf frontend/dist
    echo "  ✓ Removed frontend/dist"
else
    echo "  ✓ frontend/dist already clean"
fi

if [ -f "frontend/logfile" ]; then
    rm frontend/logfile
    echo "  ✓ Removed frontend/logfile"
else
    echo "  ✓ frontend/logfile already clean"
fi

# Docker cleanup
echo ""
echo "🐳 Cleaning Docker..."
docker system prune -f > /dev/null 2>&1
echo "  ✓ Removed unused Docker resources"

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "💡 To rebuild and run:"
echo "   docker compose up -d --build"
