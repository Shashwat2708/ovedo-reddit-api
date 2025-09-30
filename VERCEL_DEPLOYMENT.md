# Vercel Deployment Guide

## 🚀 Deploy Your Reddit Backend to Vercel

### Prerequisites
- GitHub account
- Vercel account (free at vercel.com)

### Method 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from your backend directory:**
   ```bash
   cd reddit-backend
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? **Y**
   - Which scope? **Your account**
   - Link to existing project? **N**
   - Project name: **reddit-backend** (or your preferred name)
   - Directory: **./** (current directory)
   - Override settings? **N**

5. **Your API will be deployed!** You'll get a URL like:
   ```
   https://reddit-backend-xxx.vercel.app
   ```

### Method 2: Deploy via GitHub

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Add Reddit backend API"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `reddit-backend` folder
   - Deploy!

### 🔧 Configuration Files

Your backend now includes:
- ✅ `vercel.json` - Vercel configuration
- ✅ `package.json` - Dependencies and scripts
- ✅ `server.js` - Main server code

### 📡 API Endpoints After Deployment

Once deployed, your API will be available at:
- **Health Check:** `https://your-app.vercel.app/health`
- **Single Subreddit:** `https://your-app.vercel.app/api/reddit/SaaS?limit=25&keywords=startup`
- **Multiple Subreddits:** `https://your-app.vercel.app/api/reddit/multiple`

### 🔄 Update Flutter App

After deployment, update your Flutter app:

1. **Open:** `lib/backend/reddit/reddit_api_service.dart`
2. **Replace:** `http://localhost:3001` with your Vercel URL
3. **Example:**
   ```dart
   static const String _backendUrl = 'https://reddit-backend-xxx.vercel.app';
   ```

### 🧪 Test Your Deployment

Test your deployed API:
```bash
curl https://your-app.vercel.app/health
curl "https://your-app.vercel.app/api/reddit/SaaS?limit=5"
```

### 🎯 Benefits of Vercel

- ✅ **Free tier** - Perfect for your use case
- ✅ **Automatic HTTPS** - Secure by default
- ✅ **Global CDN** - Fast worldwide
- ✅ **Auto-scaling** - Handles traffic spikes
- ✅ **Easy updates** - Just push to GitHub

### 🚨 Important Notes

- **Cold starts:** First request might be slower (1-2 seconds)
- **Timeout:** 30 seconds max per request
- **Rate limits:** Vercel has generous limits for free tier
- **Environment variables:** Use Vercel dashboard for secrets

### 🔍 Troubleshooting

**Deployment fails?**
- Check `package.json` has correct dependencies
- Ensure `vercel.json` is valid JSON
- Check Vercel logs in dashboard

**API not working?**
- Verify your Vercel URL is correct
- Check CORS settings (should work automatically)
- Test with curl or Postman

**Need help?**
- Check Vercel documentation
- Look at deployment logs in Vercel dashboard
- Test locally first with `node server.js`

## 🎉 You're Ready!

Once deployed, your Reddit monitoring app will work perfectly without any CORS issues!
