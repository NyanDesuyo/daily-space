#!/bin/sh
set -e

echo "🚀 Starting Daily Space application..."

# Check if we're in production mode
if [ "$NODE_ENV" = "production" ]; then
  echo "📦 Production mode detected"
  
  # Run Prisma migrations
  echo "🔄 Running database migrations..."
  npx prisma migrate deploy
  
  echo "✅ Migrations completed successfully"
else
  echo "🔧 Development mode detected"
fi

# Start the Next.js server
echo "🌐 Starting Next.js server on port ${PORT:-3000}..."
exec node server.js
