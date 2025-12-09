# Render Deployment Guide for Agent Server

This guide will help you deploy the ResearchOS Agent Server to Render.

## Prerequisites

1. A Render account ([render.com](https://render.com))
2. Your code pushed to GitHub
3. API keys ready (OpenAI, optional: Google for Gemini fallback)

## Step-by-Step Deployment

### 1. Prepare Your Repository

Ensure all changes are committed and pushed:

```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### 2. Create Render Web Service

1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select your repository

### 3. Configure the Service

Fill in the service configuration:

**Basic Settings:**
- **Name**: `research-os-agent-server` (or your preferred name)
- **Region**: Choose closest to you (Oregon, Frankfurt, Singapore, etc.)
- **Branch**: `main` (or your default branch)
- **Root Directory**: `apps/agent-server`
- **Runtime**: `Node`
- **Build Command**: 
  ```bash
  cd ../.. && npm install && cd apps/agent-server && npm run build
  ```
- **Start Command**: 
  ```bash
  node dist/index.js
  ```

**Advanced Settings:**
- **Plan**: Free (or paid if you need more resources)
- **Auto-Deploy**: Yes (deploys on every push)
- **Health Check Path**: `/health`

### 4. Set Environment Variables

In Render dashboard, go to **Environment** tab and add:

```env
# Server Configuration
NODE_ENV=production
PORT=3002

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
- Render automatically sets `PORT` - the server will use it
- Update `NEXT_PUBLIC_URL` with your actual web app URL after deployment
- All environment variables are encrypted in Render

### 5. Deploy

1. Click **"Create Web Service"**
2. Render will start building immediately
3. Wait for build to complete (usually 3-5 minutes)
4. Monitor the build logs in real-time

### 6. Get Your Deployment URL

After deployment:

1. Your service will have a URL like: `https://research-os-agent-server.onrender.com`
2. Or set a custom domain in **Settings** → **Custom Domain**

### 7. Test the Deployment

```bash
# Health check
curl https://research-os-agent-server.onrender.com/health

# Expected response:
# {"status":"ok","service":"agent-server","version":"0.1.0"}
```

### 8. Update Your Web App

Update your Next.js app's environment variables:

**In Vercel/your hosting platform:**
```env
AGENT_SERVER_URL=https://research-os-agent-server.onrender.com
```

## Configuration Options

### Option 1: Manual Configuration (Recommended)

Configure directly in Render dashboard as described above.

### Option 2: Using render.yaml

If you want to use Infrastructure as Code:

1. Create `render.yaml` in your repo root (already created)
2. In Render dashboard, go to **Blueprints**
3. Click **"New Blueprint"**
4. Connect your repo
5. Render will detect and use `render.yaml`

**Note**: The `render.yaml` in root is for the entire project. For just agent-server, use the manual configuration.

## Monitoring

### Health Check
Render automatically monitors `/health` endpoint:
- **Path**: `/health`
- **Expected Response**: `{"status":"ok","service":"agent-server","version":"0.1.0"}`

### Logs
View logs in Render dashboard:
- **Logs** tab shows real-time logs
- **Events** tab shows deployment history
- Logs are searchable and filterable

### Metrics
Render provides (on paid plans):
- CPU usage
- Memory usage
- Request metrics
- Response times

## Troubleshooting

### Build Fails

**Issue**: "Module not found" errors
**Solution**: 
1. Verify Root Directory is `apps/agent-server`
2. Ensure Build Command installs from root: `cd ../.. && npm install`
3. Check that all workspace packages are committed to git

**Issue**: "Cannot find module '@research-os/agents'"
**Solution**:
1. Build command must install workspace dependencies first
2. Ensure Root Directory is set correctly
3. Check that workspace packages exist in repo

### Port Issues

**Issue**: Server not starting
**Solution**: The server uses `process.env.PORT` (Render sets this automatically). No action needed.

### Environment Variables Not Working

**Issue**: API keys not found
**Solution**: 
1. Verify variables are set in Render dashboard
2. Check variable names match exactly (case-sensitive)
3. Redeploy after adding new variables (Render auto-redeploys)

### CORS Errors

**Issue**: Web app can't connect to agent server
**Solution**: 
1. Update `NEXT_PUBLIC_URL` in Render with your web app URL
2. Ensure CORS middleware is configured correctly
3. Check that both services are using HTTPS in production

### Build Timeout

**Issue**: Build times out (>20 minutes on free tier)
**Solution**:
- Free tier has 20-minute build timeout
- Optimize build by ensuring dependencies are cached
- Consider upgrading to paid plan for longer builds

### Service Sleeping (Free Tier)

**Issue**: Service takes time to respond after inactivity
**Solution**:
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds (cold start)
- Upgrade to paid plan to prevent sleeping
- Or use a cron job to ping `/health` every 10 minutes

## Cost Optimization

### Free Tier Limits
- **750 hours/month** of runtime
- **100GB** bandwidth
- **Services sleep** after 15 min inactivity
- **20-minute** build timeout

### Tips to Reduce Costs
1. Use health check pings to prevent sleep (free tier)
2. Monitor resource usage
3. Optimize build times
4. Use Render's build cache

## Updating Deployment

### Automatic Updates
Render automatically deploys when you push to your connected branch (if Auto-Deploy is enabled).

### Manual Updates
1. Go to **Manual Deploy** tab
2. Click **"Deploy latest commit"**
3. Or trigger from GitHub webhook

### Rollback
1. Go to **Events** tab
2. Find previous successful deployment
3. Click **"Redeploy"** on that deployment

## Production Checklist

- [ ] Environment variables set in Render
- [ ] Root Directory: `apps/agent-server`
- [ ] Build Command: `cd ../.. && npm install && cd apps/agent-server && npm run build`
- [ ] Start Command: `node dist/index.js`
- [ ] Health check endpoint working (`/health`)
- [ ] CORS configured with production web app URL
- [ ] API keys secured (not in code)
- [ ] Monitoring set up
- [ ] Web app updated with agent server URL
- [ ] Tested end-to-end workflow
- [ ] Logs accessible and monitored

## Render vs Railway

### Advantages of Render
- ✅ More generous free tier (750 hours vs 500 hours)
- ✅ Better documentation
- ✅ Easier monorepo setup
- ✅ More reliable builds
- ✅ Better logging interface

### Disadvantages
- ⚠️ Services sleep on free tier (15 min inactivity)
- ⚠️ Slightly slower cold starts

## Support

- Render Docs: [render.com/docs](https://render.com/docs)
- Render Status: [status.render.com](https://status.render.com)
- Render Support: [render.com/support](https://render.com/support)

---

**Your agent server is now live on Render! 🚀**

