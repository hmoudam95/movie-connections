# 🚀 Movie Connections Deployment Guide

This guide will help you deploy your Movie Connections game to work both locally and on Vercel with your 2036-movie Neo4j database.

## 📋 Prerequisites

- ✅ Local Neo4j database with 2036 movies (already set up)
- ✅ Vercel account connected to your GitHub repo
- ✅ TMDB API key
- ⚠️ **Cloud Neo4j database** (Neo4j AuraDB) - **Required for production**

## 🔧 Step 1: Set Up Cloud Neo4j Database

### Option A: Neo4j AuraDB (Recommended - Free Tier)

1. **Create AuraDB Account**
   - Go to [neo4j.com/aura](https://neo4j.com/aura)
   - Sign up for free account
   - Create a new database instance

2. **Get Connection Details**
   - Copy the connection URI (looks like: `neo4j+s://xxxxx.databases.neo4j.io:7687`)
   - Note your username and password

3. **Migrate Your Data**
   ```bash
   # Add cloud database credentials to .env
   CLOUD_NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io:7687
   CLOUD_NEO4J_USER=neo4j
   CLOUD_NEO4J_PASSWORD=your_password
   
   # Run migration script
   node scripts/migrateToCloud.js
   ```

### Option B: Other Cloud Providers
- **Railway**: [railway.app](https://railway.app)
- **Render**: [render.com](https://render.com)
- **Heroku**: [heroku.com](https://heroku.com)

## 🔧 Step 2: Configure Environment Variables

### Local Development (.env)
```env
# Local Neo4j (for development)
LOCAL_NEO4J_URI=bolt://localhost:7687
LOCAL_NEO4J_USER=neo4j
LOCAL_NEO4J_PASSWORD=your_local_password

# TMDB API
TMDB_API_KEY=your_tmdb_api_key

# Development API base (empty for proxy)
REACT_APP_API_BASE_URL=
```

### Vercel Production (Environment Variables)
In your Vercel dashboard, add these environment variables:

```env
# Cloud Neo4j (for production)
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_cloud_password

# TMDB API
TMDB_API_KEY=your_tmdb_api_key

# React environment
REACT_APP_API_BASE_URL=
```

## 🔧 Step 3: Update Vercel Configuration

The `vercel.json` file is already configured to:
- Build your React app
- Handle API routes in `/api` folder
- Route all API calls to the correct handlers

## 🔧 Step 4: Deploy to Vercel

1. **Commit and Push Changes**
   ```bash
   git add .
   git commit -m "🚀 Add Vercel API routes and cloud database support"
   git push origin main
   ```

2. **Vercel Auto-Deploy**
   - Vercel will automatically detect the push
   - Build and deploy your app
   - API routes will be available at `/api/path`

## 🔧 Step 5: Test Both Environments

### Local Development
```bash
# Terminal 1: Start local Neo4j
# (Your Neo4j database should be running)

# Terminal 2: Start backend
cd server
npm start

# Terminal 3: Start frontend
npm start
```

### Production (Vercel)
- Visit your Vercel URL
- Test the shortest path functionality
- Check Vercel logs for any errors

## 🔍 Troubleshooting

### Issue: API calls failing on Vercel
**Solution**: Check environment variables in Vercel dashboard

### Issue: Database connection errors
**Solution**: Verify cloud Neo4j credentials and network access

### Issue: CORS errors
**Solution**: API routes already include CORS headers

### Issue: Build failures
**Solution**: Check that all dependencies are in package.json

## 📊 Environment Comparison

| Feature | Local Development | Vercel Production |
|---------|------------------|-------------------|
| **Frontend** | localhost:3000 | Vercel URL |
| **Backend** | localhost:4000 | Vercel API Routes |
| **Database** | Local Neo4j | Cloud Neo4j (AuraDB) |
| **Movies** | 2036 (local) | 2036 (cloud) |
| **API Endpoint** | `/api/path` | `/api/path` |

## 🎯 Next Steps

1. **Set up cloud Neo4j database**
2. **Run migration script** to transfer your 2036 movies
3. **Configure Vercel environment variables**
4. **Deploy and test**

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test API endpoints directly
4. Check Neo4j database connectivity

---

**Your app will work seamlessly in both environments once configured!** 🎉 