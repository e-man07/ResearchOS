# Railway Deployment Guide for Agent Server

This guide will help you deploy the ResearchOS Agent Server to Railway.

## Prerequisites

1. A Railway account ([railway.app](https://railway.app))
2. Your code pushed to GitHub
3. API keys ready (OpenAI, optional: Google for Gemini fallback)

## Step-by-Step Deployment

### 1. Prepare Your Repository

Ensure all changes are committed and pushed:

```bash
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
```

### 2. Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway will detect the project

### 3. Configure the Service

Since this is a monorepo, you need to configure Railway:

1. Go to your service settings
2. Set **Root Directory**: `apps/agent-server`
3. Railway will automatically use `nixpacks.toml` or `railway.json` if present

**Alternative Configuration (if auto-detection doesn't work):**

- **Build Command**: `cd ../.. && npm install && cd apps/agent-server && npm run build`
- **Start Command**: `npm start`

### 4. Set Environment Variables

In Railway dashboard, go to **Variables** tab and add:

```env
# Server Configuration
PORT=3002
NODE_ENV=production

# OpenAI (Required)
OPENAI_API_KEY=sk-your-openai-key

# Gemini Fallback (Optional but recommended)
GOOGLE_API_KEY=your-google-api-key
FALLBACK_LLM_MODEL=gemini-2.0-flash-exp
ENABLE_LLM_FALLBACK=true

# CORS (Update with your web app URL)
NEXT_PUBLIC_URL=https://your-web-app.vercel.app
```

**Important Notes:**
- Railway automatically sets `PORT` - the server will use it
- Update `NEXT_PUBLIC_URL` with your actual web app URL after deployment
- All environment variables are encrypted in Railway

### 5. Deploy

1. Railway will automatically deploy when you push to your connected branch
2. Or click **"Deploy"** button to deploy manually
3. Wait for build to complete (usually 2-5 minutes)

### 6. Get Your Deployment URL

After deployment:

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"** to get a public URL
3. Your agent server will be available at: `https://your-app-name.up.railway.app`

### 7. Test the Deployment

```bash
# Health check
curl https://your-app-name.up.railway.app/health

# Expected response:
# {"status":"ok","service":"agent-server","version":"0.1.0"}
```

### 8. Update Your Web App

Update your Next.js app's environment variables:

**In Vercel/your hosting platform:**
```env
AGENT_SERVER_URL=https://your-app-name.up.railway.app
```

## Configuration Files

### nixpacks.toml
This file tells Railway how to build your app. It:
- Uses Node.js 20
- Installs workspace dependencies from root
- Builds the agent-server
- Starts with `npm start`

### railway.json
Alternative configuration file with:
- Build commands
- Start commands
- Health check path (`/health`)
- Restart policies

## Monitoring

### Health Check
Railway automatically monitors `/health` endpoint:
- **Path**: `/health`
- **Expected Response**: `{"status":"ok","service":"agent-server","version":"0.1.0"}`

### Logs
View logs in Railway dashboard:
- **Deployments** → Click on deployment → **View Logs**
- Real-time logs available during deployment

### Metrics
Railway provides:
- CPU usage
- Memory usage
- Network traffic
- Request metrics

## Troubleshooting

### Build Fails

**Issue**: "Module not found" errors
**Solution**: Ensure build command installs workspace dependencies:
```bash
cd ../.. && npm install && cd apps/agent-server && npm run build
```

### Port Issues

**Issue**: Server not starting
**Solution**: The server now uses `process.env.PORT` (Railway sets this automatically). Check logs for port binding errors.

### Environment Variables Not Working

**Issue**: API keys not found
**Solution**: 
1. Verify variables are set in Railway dashboard
2. Check variable names match exactly (case-sensitive)
3. Redeploy after adding new variables

### CORS Errors

**Issue**: Web app can't connect to agent server
**Solution**: 
1. Update `NEXT_PUBLIC_URL` in Railway with your web app URL
2. Ensure CORS middleware is configured correctly
3. Check that both services are using HTTPS in production

### Timeout Issues

**Issue**: Build or deployment times out
**Solution**:
- Railway has a 5-minute build timeout
- Optimize build by caching node_modules
- Consider using Railway's build cache

## Cost Optimization

### Free Tier Limits
- **$5 credit/month** (free tier)
- **500 hours** of usage
- **100GB** bandwidth

### Tips to Reduce Costs
1. Use sleep on inactivity (Railway Pro feature)
2. Monitor resource usage
3. Optimize build times
4. Use health checks to prevent unnecessary restarts

## Updating Deployment

### Automatic Updates
Railway automatically deploys when you push to your connected branch.

### Manual Updates
1. Go to **Deployments** tab
2. Click **"Redeploy"** on latest deployment
3. Or trigger new deployment from GitHub

### Rollback
1. Go to **Deployments** tab
2. Find previous successful deployment
3. Click **"Redeploy"** on that deployment

## Production Checklist

- [ ] Environment variables set in Railway
- [ ] Health check endpoint working (`/health`)
- [ ] CORS configured with production web app URL
- [ ] API keys secured (not in code)
- [ ] Monitoring set up
- [ ] Web app updated with agent server URL
- [ ] Tested end-to-end workflow
- [ ] Logs accessible and monitored

## Support

- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Project Issues: GitHub Issues

---

**Your agent server is now live on Railway! 🚀**

