#!/bin/bash

echo "🚀 Starting Reddit Backend API..."
echo "📡 Server will be available at: http://localhost:3001"
echo "🔗 Health check: http://localhost:3001/health"
echo "🔗 Reddit API: http://localhost:3001/api/reddit/SaaS"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
node server.js
