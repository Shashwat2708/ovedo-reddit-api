const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// User agent for Reddit API
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

// Clean subreddit name helper
function cleanSubredditName(subreddit) {
    let cleanSubreddit = subreddit.trim();

    // Remove full Reddit URL
    if (cleanSubreddit.startsWith('https://www.reddit.com/r/')) {
        cleanSubreddit = cleanSubreddit.replace('https://www.reddit.com/r/', '');
    }

    // Remove r/ prefix if present
    if (cleanSubreddit.startsWith('r/')) {
        cleanSubreddit = cleanSubreddit.replace('r/', '');
    }

    // Remove trailing slash
    if (cleanSubreddit.endsWith('/')) {
        cleanSubreddit = cleanSubreddit.substring(0, cleanSubreddit.length - 1);
    }

    // Remove query parameters
    if (cleanSubreddit.includes('?')) {
        cleanSubreddit = cleanSubreddit.split('?')[0];
    }

    return cleanSubreddit;
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Reddit Backend API is running' });
});

// Main Reddit API endpoint
app.get('/api/reddit/:subreddit', async (req, res) => {
    try {
        const { subreddit } = req.params;
        const { limit = 25, hours = 24, keywords = '' } = req.query;

        console.log(`🔍 Fetching posts from r/${subreddit}`);
        console.log(`📋 Limit: ${limit}, Hours: ${hours}, Keywords: ${keywords}`);

        // Clean subreddit name
        const cleanSubreddit = cleanSubredditName(subreddit);
        console.log(`🧹 Cleaned subreddit: ${cleanSubreddit}`);

        // Build Reddit API URL
        const redditUrl = `https://www.reddit.com/r/${cleanSubreddit}.json?limit=${limit}`;
        console.log(`🌐 Reddit URL: ${redditUrl}`);

        // Fetch from Reddit API
        const response = await axios.get(redditUrl, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Cache-Control': 'max-age=0'
            },
            timeout: 10000 // 10 second timeout
        });

        console.log(`📡 Reddit response status: ${response.status}`);

        if (response.status === 200) {
            const data = response.data;

            // Process posts
            const posts = [];
            if (data.data && data.data.children) {
                console.log(`📝 Found ${data.data.children.length} posts`);

                for (const child of data.data.children) {
                    if (child.data) {
                        try {
                            const post = {
                                id: child.data.id,
                                title: child.data.title,
                                author: child.data.author,
                                subreddit: child.data.subreddit,
                                score: child.data.score,
                                numComments: child.data.num_comments,
                                url: child.data.url,
                                permalink: `https://reddit.com${child.data.permalink}`,
                                createdAt: new Date(child.data.created_utc * 1000).toISOString(),
                                isSelf: child.data.is_self,
                                selftext: child.data.selftext || '',
                                thumbnail: child.data.thumbnail,
                                domain: child.data.domain
                            };

                            // Filter by keywords if provided
                            if (keywords) {
                                const keywordList = keywords.split(',').map(k => k.trim().toLowerCase());
                                const searchText = `${post.title} ${post.selftext}`.toLowerCase();
                                const matchesKeywords = keywordList.some(keyword =>
                                    searchText.includes(keyword)
                                );

                                if (!matchesKeywords) continue;
                            }

                            // Filter by time if provided
                            if (hours) {
                                const postTime = new Date(post.createdAt);
                                const hoursAgo = new Date(Date.now() - (hours * 60 * 60 * 1000));
                                if (postTime < hoursAgo) continue;
                            }

                            posts.push(post);
                        } catch (error) {
                            console.error('❌ Error parsing post:', error.message);
                            continue;
                        }
                    }
                }
            }

            console.log(`✅ Returning ${posts.length} filtered posts`);

            res.json({
                success: true,
                posts: posts,
                total: posts.length,
                subreddit: cleanSubreddit,
                filters: {
                    limit: parseInt(limit),
                    hours: parseInt(hours),
                    keywords: keywords
                }
            });

        } else {
            console.error(`❌ Reddit API error: ${response.status}`);
            res.status(response.status).json({
                success: false,
                error: 'Reddit API error',
                message: `Reddit API returned status ${response.status}`
            });
        }

    } catch (error) {
        console.error('❌ Server error:', error.message);

        if (error.response) {
            // Check if Reddit is blocking the request
            const responseText = error.response.data?.toString() || '';
            if (responseText.includes('blocked by network security') || 
                responseText.includes('You\'ve been blocked') ||
                responseText.includes('rate limit') ||
                error.response.status === 429) {
                res.status(429).json({
                    success: false,
                    error: 'REDDIT_BLOCKED',
                    message: 'Reddit is blocking requests from this server. This is a temporary issue.',
                    details: 'Reddit has implemented additional security measures that are blocking serverless function requests.'
                });
            } else {
                // Other Reddit API errors
                res.status(error.response.status).json({
                    success: false,
                    error: 'Reddit API error',
                    message: `Reddit API error: ${error.response.status}`,
                    details: error.response.data
                });
            }
        } else if (error.code === 'ECONNABORTED') {
            // Timeout error
            res.status(408).json({
                success: false,
                error: 'Timeout',
                message: 'Request to Reddit API timed out'
            });
        } else {
            // Other errors
            res.status(500).json({
                success: false,
                error: 'Server error',
                message: error.message
            });
        }
    }
});

// Multiple subreddits endpoint
app.post('/api/reddit/multiple', async (req, res) => {
    try {
        const { subreddits, keywords = '', limit = 25, hours = 24 } = req.body;

        if (!subreddits || !Array.isArray(subreddits)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request',
                message: 'subreddits array is required'
            });
        }

        console.log(`🔍 Fetching posts from ${subreddits.length} subreddits`);
        console.log(`📋 Subreddits: ${subreddits.join(', ')}`);
        console.log(`🔑 Keywords: ${keywords}`);

        const allPosts = [];
        const errors = [];

        // Fetch from each subreddit
        for (const subreddit of subreddits) {
            try {
                const cleanSubreddit = cleanSubredditName(subreddit);
                const redditUrl = `https://www.reddit.com/r/${cleanSubreddit}.json?limit=${limit}`;

                console.log(`🌐 Fetching from r/${cleanSubreddit}`);

                const response = await axios.get(redditUrl, {
                    headers: {
                        'User-Agent': USER_AGENT,
                        'Accept': 'application/json',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'DNT': '1',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1',
                        'Sec-Fetch-Dest': 'document',
                        'Sec-Fetch-Mode': 'navigate',
                        'Sec-Fetch-Site': 'none',
                        'Cache-Control': 'max-age=0'
                    },
                    timeout: 10000
                });

                if (response.status === 200 && response.data.data && response.data.data.children) {
                    const posts = response.data.data.children
                        .filter(child => child.data)
                        .map(child => ({
                            id: child.data.id,
                            title: child.data.title,
                            author: child.data.author,
                            subreddit: child.data.subreddit,
                            score: child.data.score,
                            numComments: child.data.num_comments,
                            url: child.data.url,
                            permalink: `https://reddit.com${child.data.permalink}`,
                            createdAt: new Date(child.data.created_utc * 1000).toISOString(),
                            isSelf: child.data.is_self,
                            selftext: child.data.selftext || '',
                            thumbnail: child.data.thumbnail,
                            domain: child.data.domain
                        }))
                        .filter(post => {
                            // Filter by keywords
                            if (keywords) {
                                const keywordList = keywords.split(',').map(k => k.trim().toLowerCase());
                                const searchText = `${post.title} ${post.selftext}`.toLowerCase();
                                const matchesKeywords = keywordList.some(keyword =>
                                    searchText.includes(keyword)
                                );
                                if (!matchesKeywords) return false;
                            }

                            // Filter by time
                            if (hours) {
                                const postTime = new Date(post.createdAt);
                                const hoursAgo = new Date(Date.now() - (hours * 60 * 60 * 1000));
                                if (postTime < hoursAgo) return false;
                            }

                            return true;
                        });

                    allPosts.push(...posts);
                    console.log(`✅ r/${cleanSubreddit}: ${posts.length} posts`);
                }
            } catch (error) {
                console.error(`❌ Error fetching r/${subreddit}:`, error.message);
                errors.push({
                    subreddit: subreddit,
                    error: error.message
                });
            }
        }

        // Remove duplicates and sort
        const uniquePosts = allPosts.filter((post, index, self) =>
            index === self.findIndex(p => p.id === post.id)
        );

        uniquePosts.sort((a, b) => {
            if (a.score !== b.score) return b.score - a.score;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        console.log(`✅ Total unique posts: ${uniquePosts.length}`);

        res.json({
            success: true,
            posts: uniquePosts,
            total: uniquePosts.length,
            subreddits: subreddits,
            errors: errors,
            filters: {
                limit: parseInt(limit),
                hours: parseInt(hours),
                keywords: keywords
            }
        });

    } catch (error) {
        console.error('❌ Server error:', error.message);
        
        if (error.response) {
            // Check if Reddit is blocking the request
            const responseText = error.response.data?.toString() || '';
            if (responseText.includes('blocked by network security') || 
                responseText.includes('You\'ve been blocked') ||
                responseText.includes('rate limit') ||
                error.response.status === 429) {
                res.status(429).json({
                    success: false,
                    error: 'REDDIT_BLOCKED',
                    message: 'Reddit is blocking requests from this server. This is a temporary issue.',
                    details: 'Reddit has implemented additional security measures that are blocking serverless function requests.'
                });
            } else {
                res.status(error.response.status).json({
                    success: false,
                    error: 'Reddit API error',
                    message: `Reddit API error: ${error.response.status}`,
                    details: error.response.data
                });
            }
        } else {
            res.status(500).json({
                success: false,
                error: 'Server error',
                message: error.message
            });
        }
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Reddit Backend API running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 Reddit API: http://localhost:${PORT}/api/reddit/SaaS`);
});
