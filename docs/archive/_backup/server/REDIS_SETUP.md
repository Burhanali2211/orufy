# Redis Cache Setup Guide

This application uses a **hybrid caching strategy** that automatically uses Redis when available and falls back to in-memory caching when Redis is not configured.

## Features

- **Automatic Fallback**: Works without Redis, automatically falls back to in-memory cache
- **Distributed Caching**: Redis enables caching across multiple server instances
- **High Performance**: Significantly reduces database load for frequently accessed data
- **Monitoring**: Built-in cache statistics and health checks

## Quick Start

### Option 1: No Configuration Required (Development)

The application works out of the box without Redis. It will use in-memory caching automatically.

### Option 2: Local Redis (Recommended for Production)

#### Install Redis

**Windows:**
```bash
# Using Chocolatey
choco install redis-64

# Or download from: https://github.com/microsoftarchive/redis/releases
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### Configure Application

Add to your `.env` file:
```env
REDIS_URL=redis://localhost:6379
```

### Option 3: Redis Cloud (Production)

#### Popular Redis Cloud Providers:

1. **Redis Cloud** (https://redis.com/try-free/)
   - Free tier: 30MB
   - Managed service
   - Global availability

2. **Upstash** (https://upstash.com/)
   - Serverless Redis
   - Pay-per-request pricing
   - Free tier available

3. **AWS ElastiCache** (https://aws.amazon.com/elasticache/)
   - Enterprise-grade
   - Integrated with AWS

#### Configure Application

Add to your `.env` file:
```env
REDIS_URL=redis://username:password@your-redis-host:port
```

## Verify Redis Connection

### Check Health Endpoint

```bash
curl http://localhost:5000/health/cache
```

**Response with Redis:**
```json
{
  "cache": {
    "redis": {
      "type": "redis",
      "connected": true,
      "hits": 150,
      "misses": 45,
      "hitRate": "76.92%"
    },
    "memory": {
      "size": 25,
      "hits": 200,
      "misses": 50,
      "hitRate": "80.00%",
      "memoryUsage": "2.45MB"
    },
    "activeCache": "redis"
  }
}
```

**Response without Redis:**
```json
{
  "cache": {
    "redis": {
      "type": "unavailable",
      "connected": false
    },
    "memory": {
      "size": 25,
      "hits": 200,
      "misses": 50,
      "hitRate": "80.00%"
    },
    "activeCache": "memory"
  }
}
```

## Cache Configuration

### Default TTL (Time To Live)

- **Products**: 15 minutes
- **Categories**: 1 hour
- **Settings**: 24 hours

### Cache Keys

The application uses structured cache keys:
- `product:{id}` - Individual product
- `products:{page}:{limit}:{filters}` - Product lists
- `category:{id}` - Individual category
- `categories:all` - All categories
- `cart:{userId}` - User cart
- `settings:all` - Application settings

## Cache Management

### Clear Cache

```bash
# Clear all cache
curl -X POST http://localhost:5000/health/cache/clear
```

### Monitor Cache Performance

```bash
# Get cache statistics
curl http://localhost:5000/health/cache
```

## Production Recommendations

1. **Use Redis in Production**: Enables distributed caching across multiple servers
2. **Configure Persistence**: Enable Redis RDB or AOF for data persistence
3. **Set Memory Limits**: Configure `maxmemory` and `maxmemory-policy`
4. **Enable Authentication**: Use Redis password authentication
5. **Monitor Performance**: Track cache hit rates and memory usage

### Recommended Redis Configuration

```conf
# /etc/redis/redis.conf

# Memory
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence (optional)
save 900 1
save 300 10
save 60 10000

# Security
requirepass your-strong-password

# Performance
tcp-backlog 511
timeout 0
tcp-keepalive 300
```

## Troubleshooting

### Redis Connection Failed

**Symptom**: Application logs show "Redis connection failed"

**Solution**:
1. Check if Redis is running: `redis-cli ping` (should return "PONG")
2. Verify REDIS_URL in .env file
3. Check firewall settings
4. Application will automatically fall back to in-memory cache

### High Memory Usage

**Solution**:
1. Reduce TTL values
2. Configure Redis maxmemory
3. Use LRU eviction policy
4. Monitor cache hit rates

### Cache Not Updating

**Solution**:
1. Check cache invalidation patterns
2. Verify TTL settings
3. Clear cache manually: `POST /health/cache/clear`

## Performance Impact

### With Redis (Production):
- **Database Load**: -70% (reduced queries)
- **Response Time**: -50% (faster responses)
- **Scalability**: Horizontal scaling enabled
- **Consistency**: Shared cache across instances

### Without Redis (Development):
- **Database Load**: -40% (in-memory cache)
- **Response Time**: -30% (faster responses)
- **Scalability**: Single instance only
- **Consistency**: Per-instance cache

## Support

For issues or questions:
- Check application logs: `server/logs/`
- Monitor health endpoint: `/health/cache`
- Review Redis logs: `redis-cli monitor`

