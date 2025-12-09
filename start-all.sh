#!/bin/bash

# Start all ResearchOS services

echo "🚀 Starting ResearchOS..."

# Start Agent Server
echo "📦 Starting ADK-TS Agent Server (port 3002)..."
cd apps/agent-server && npm run dev &
AGENT_PID=$!

# Wait for agent server to start
sleep 3

# Start Next.js App
echo "🌐 Starting Next.js App (port 3000)..."
cd ../web && npm run dev &
WEB_PID=$!

echo ""
echo "✅ All services started!"
echo ""
echo "📊 Agent Server: http://localhost:3002"
echo "🌐 Web App: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "kill $AGENT_PID $WEB_PID; exit" INT
wait
