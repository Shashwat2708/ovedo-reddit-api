# Reddit Backend API

A Node.js backend API that fetches Reddit data without CORS issues for the Ovedo web application.

## Features

- ✅ Fetches Reddit posts from any subreddit
- ✅ Filters by keywords and time
- ✅ Handles multiple subreddits
- ✅ No CORS restrictions
- ✅ Error handling and logging
- ✅ Clean subreddit name processing

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## API Endpoints

### Health Check
```
GET /health
```

### Single Subreddit
```
GET /api/reddit/:subreddit?limit=25&hours=24&keywords=keyword1,keyword2
```

Example:
```
GET /api/reddit/SaaS?limit=10&hours=12&keywords=startup,saas
```

### Multiple Subreddits
```
POST /api/reddit/multiple
Content-Type: application/json

{
  "subreddits": ["SaaS", "startups", "entrepreneur"],
  "keywords": "startup,saas,revenue",
  "limit": 25,
  "hours": 24
}
```

## Response Format

```json
{
  "success": true,
  "posts": [
    {
      "id": "post_id",
      "title": "Post Title",
      "author": "username",
      "subreddit": "SaaS",
      "score": 150,
      "numComments": 25,
      "url": "https://...",
      "permalink": "https://reddit.com/r/SaaS/comments/...",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "isSelf": false,
      "selftext": "Post content...",
      "thumbnail": "https://...",
      "domain": "example.com"
    }
  ],
  "total": 10,
  "subreddit": "SaaS",
  "filters": {
    "limit": 25,
    "hours": 24,
    "keywords": "startup,saas"
  }
}
```

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Your API will be available at:
```
https://your-app.vercel.app/api/reddit/SaaS
```

### Other Platforms

- **Railway**: Connect GitHub repo
- **Render**: Deploy from GitHub
- **Heroku**: Use Procfile

## Environment Variables

- `PORT`: Server port (default: 3001)

## Usage in Flutter

Replace the Reddit API calls in your Flutter app with calls to this backend:

```dart
// Instead of calling Reddit directly
final response = await http.get(
  Uri.parse('https://your-backend.vercel.app/api/reddit/SaaS?limit=25&keywords=startup')
);
```
# ovedo-reddit-api
