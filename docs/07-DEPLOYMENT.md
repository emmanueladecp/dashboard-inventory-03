# Deployment Guide

## Overview

This guide covers deploying the Inventory Management Dashboard to various platforms. The application is optimized for deployment on **Vercel** but can also be deployed to other platforms that support Next.js applications.

## Platform Options

### 1. Vercel (Recommended)
- **Best for**: Quick deployment, automatic CI/CD
- **Pros**: Seamless Next.js integration, automatic deployments, edge functions
- **Cons**: Usage limits on free tier

### 2. Netlify
- **Best for**: JAMstack applications, custom build processes
- **Pros**: Good free tier, extensive plugin ecosystem
- **Cons**: Requires additional configuration for API routes

### 3. Railway
- **Best for**: Full-stack applications with databases
- **Pros**: Integrated database hosting, simple configuration
- **Cons**: Limited free tier

### 4. AWS (Advanced)
- **Best for**: Enterprise deployments, custom infrastructure
- **Pros**: Full control, scalability, extensive services
- **Cons**: Complex setup, requires AWS knowledge

### 5. Docker/Self-Hosted
- **Best for**: On-premises deployment, custom infrastructure
- **Pros**: Full control, cost-effective for high usage
- **Cons**: Requires infrastructure management

## Vercel Deployment (Step-by-Step)

### Prerequisites
- GitHub/GitLab/Bitbucket repository
- Vercel account
- Configured environment variables
- Working local development environment

### 1. Prepare Repository

#### Ensure Build Success
```bash
# Test local build
npm run build
npm start

# Verify no build errors
npm run lint
```

#### Environment Variables Check
Create `.env.example` file:
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Vercel Configuration
Create `vercel.json`:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

### 2. Deploy to Vercel

#### Option A: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# ? Set up and deploy "~/project"? [Y/n] y
# ? Which scope do you want to deploy to? Your Username
# ? Link to existing project? [y/N] n
# ? What's your project's name? inventory-dashboard
# ? In which directory is your code located? ./
```

#### Option B: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (or `./project` if needed)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### 3. Configure Environment Variables

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add all required environment variables
3. Set appropriate environments (Production, Preview, Development)

```bash
# Production environment variables
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiI...
```

### 4. Configure Domain

#### Custom Domain Setup
1. In Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain
3. Configure DNS records:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   
   Type: A
   Name: @
   Value: 76.76.19.61
   ```

#### SSL Certificate
Vercel automatically provisions SSL certificates for custom domains.

### 5. Set Up Continuous Deployment

#### Automatic Deployments
Vercel automatically deploys:
- **Production**: Pushes to main/master branch
- **Preview**: Pull requests and other branches
- **Development**: Local development with `vercel dev`

#### Deployment Configuration
```json
// vercel.json - Advanced configuration
{
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  },
  "github": {
    "enabled": true,
    "autoAlias": true
  },
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  }
}
```

## Alternative Deployments

### Netlify Deployment

#### 1. Netlify Configuration
Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[functions]
  node_bundler = "esbuild"

[dev]
  command = "npm run dev"
  port = 3000
```

#### 2. API Routes Configuration
```typescript
// netlify/functions/api.ts
import { handler } from '../../src/app/api/[...slug]/route';

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
```

### Railway Deployment

#### 1. Railway Configuration
Create `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/test-db",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### 2. Deploy to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Docker Deployment

#### 1. Create Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### 2. Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${CLERK_PUBLISHABLE_KEY}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/test-db"]
      interval: 30s
      timeout: 10s
      retries: 3
```

#### 3. Build and Run
```bash
# Build image
docker build -t inventory-dashboard .

# Run container
docker run -p 3000:3000 --env-file .env inventory-dashboard

# Or use docker-compose
docker-compose up -d
```

## Environment-Specific Configuration

### Production Environment

#### Performance Optimizations
```javascript
// next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  
  // Image optimization
  images: {
    domains: ['images.clerk.dev'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Bundle analyzer (optional)
  bundleAnalyzer: {
    enabled: process.env.ANALYZE === 'true',
  },
  
  // Experimental features
  experimental: {
    appDir: true,
    serverActions: true,
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

#### Environment Variables
```env
# Production environment variables
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Clerk Production Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Supabase Production
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiI...

# Production optimizations
NEXT_SHARP=1
```

### Staging Environment
```env
# Staging environment variables
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Clerk Staging Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Supabase Staging
NEXT_PUBLIC_SUPABASE_URL=https://staging-xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiI...
```

## Post-Deployment Configuration

### 1. Database Setup

#### Production Database Migration
```sql
-- Run in production Supabase instance
-- 1. Execute initial schema
\i database_schema.sql

-- 2. Apply migrations
\i database_migration.sql

-- 3. Verify setup
SELECT table_name, row_security 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

#### Create Initial Superadmin
```sql
-- After first user signs up
UPDATE user_profiles 
SET role = 'superadmin' 
WHERE clerk_user_id = 'user_xxxxxxxxxxxx';
```

### 2. Clerk Configuration

#### Production Settings
1. **Dashboard** → **Settings** → **General**
   - Update application name
   - Set production domain
   - Configure branding

2. **Authentication** → **Social connections**
   - Configure OAuth providers
   - Set production OAuth app credentials

3. **Paths**
   - Sign-in URL: `https://yourdomain.com/sign-in`
   - Sign-up URL: `https://yourdomain.com/sign-up`
   - User profile URL: `https://yourdomain.com/settings`
   - After sign-in: `https://yourdomain.com/dashboard`
   - After sign-up: `https://yourdomain.com/dashboard`

#### Webhook Configuration
```typescript
// Set webhook endpoint
// URL: https://yourdomain.com/api/webhooks/clerk
// Events: user.created, user.updated, session.created

// Webhook handler
export async function POST(request: Request) {
  const payload = await request.text();
  const headers = Object.fromEntries(request.headers.entries());
  
  try {
    const evt = verifyWebhook(payload, headers, process.env.CLERK_WEBHOOK_SECRET!);
    
    // Handle webhook events
    if (evt.type === 'user.created') {
      // Sync user to database
    }
    
    return new Response('OK', { status: 200 });
  } catch (error) {
    return new Response('Webhook verification failed', { status: 400 });
  }
}
```

### 3. Monitoring Setup

#### Vercel Analytics
```typescript
// Add to app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

#### Error Monitoring with Sentry
```bash
# Install Sentry
npm install @sentry/nextjs

# Configure Sentry
npx @sentry/wizard@latest -i nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

## Security Considerations

### 1. Environment Variables Security
- Never commit `.env` files to version control
- Use different keys for different environments
- Rotate keys regularly
- Use secure key generation

### 2. Content Security Policy
```typescript
// next.config.ts
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.yourdomain.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://images.clerk.dev;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ''),
          },
        ],
      },
    ];
  },
};
```

### 3. Rate Limiting
```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function middleware(request: NextRequest) {
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);
    
    if (!success) {
      return new Response('Too Many Requests', { status: 429 });
    }
  }
  
  return clerkMiddleware()(request);
}
```

## Performance Optimization

### 1. Build Optimization
```typescript
// next.config.ts
module.exports = {
  // Minimize bundle size
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000,
  },
  
  // Compression
  compress: true,
  
  // Remove unused code
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{ kebabCase member }}',
    },
  },
};
```

### 2. Runtime Performance
```typescript
// Optimize API responses
export async function GET() {
  const data = await fetchData();
  
  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
```

### 3. Database Performance
```sql
-- Optimize database queries
-- Add indexes for frequently queried columns
CREATE INDEX CONCURRENTLY idx_user_profiles_role_active 
ON user_profiles(role, is_active) 
WHERE is_active = true;

-- Optimize RLS policies
CREATE INDEX CONCURRENTLY idx_user_profiles_clerk_id_active 
ON user_profiles(clerk_user_id, is_active) 
WHERE is_active = true;
```

## Maintenance and Updates

### 1. Automated Updates
```yaml
# .github/workflows/update-dependencies.yml
name: Update Dependencies
on:
  schedule:
    - cron: '0 0 * * 1'  # Weekly on Monday

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Update dependencies
        run: |
          npm update
          npm audit fix
      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v5
        with:
          title: 'chore: update dependencies'
```

### 2. Health Checks
```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database connection
    const { data, error } = await supabaseAdmin
      .from('master_areas')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    
    // Check Clerk connection
    const users = await clerkClient.users.getUserList({ limit: 1 });
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        authentication: 'up',
      },
    });
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error.message,
    }, { status: 503 });
  }
}
```

### 3. Backup Strategy
```bash
# Automated database backups
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > "backup_${DATE}.sql"
aws s3 cp "backup_${DATE}.sql" s3://your-backup-bucket/
rm "backup_${DATE}.sql"
```

## Troubleshooting Deployment Issues

### Common Issues

#### Build Failures
```bash
# Check build logs
vercel logs

# Local build test
npm run build
npm run start

# Check for TypeScript errors
npx tsc --noEmit
```

#### Environment Variable Issues
```bash
# Verify environment variables
vercel env ls

# Test with local environment
vercel dev

# Pull production environment
vercel env pull .env.local
```

#### Database Connection Issues
```bash
# Test database connection
curl https://yourdomain.com/api/test-db

# Check Supabase project status
# Verify connection strings and keys
```

#### Authentication Issues
```bash
# Check Clerk configuration
# Verify redirect URLs
# Test authentication flow
```

### Debug Commands
```bash
# Vercel debugging
vercel dev --debug
vercel logs --follow

# Check deployment status
vercel ls
vercel inspect [deployment-url]

# Environment debugging
vercel env ls
vercel env pull
```

This deployment guide provides comprehensive instructions for deploying your Inventory Management Dashboard to various platforms with security, performance, and maintenance considerations.