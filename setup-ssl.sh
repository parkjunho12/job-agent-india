#!/bin/bash

# jobagent-career.com - SSL Setup Script
# For job-agent-india project with docker-compose.prod.yml

set -e

echo "🌐 Setting up SSL for jobagent-career.com"
echo "=========================================="

# Check if in correct directory
if [ ! -f docker-compose.prod.yml ]; then
    echo "❌ Error: docker-compose.prod.yml not found"
    echo "Please run this from ~/workspace/job-agent-india directory"
    exit 1
fi

# Check .env file
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env file with all required variables"
    exit 1
fi

# Install Certbot
echo ""
echo "📦 Installing Certbot..."
sudo dnf install -y certbot

# Stop all services
echo ""
echo "🛑 Stopping all services..."
docker-compose -f docker-compose.prod.yml down

# Get email for Let's Encrypt
echo ""
echo "🔐 Getting SSL certificate..."
read -p "Enter your email for Let's Encrypt: " EMAIL

if [ -z "$EMAIL" ]; then
    echo "❌ Email is required"
    exit 1
fi

# Request SSL certificate
sudo certbot certonly --standalone \
  -d jobagent-career.com \
  -d www.jobagent-career.com \
  -d api.jobagent-career.com \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email

# Verify certificates
echo ""
echo "✅ Verifying certificates..."
sudo certbot certificates

# Check if nginx directory exists
if [ ! -d nginx ]; then
    echo "Creating nginx directory..."
    mkdir -p nginx
fi

# Backup existing nginx.conf if it exists
if [ -f nginx/nginx.conf ]; then
    cp nginx/nginx.conf nginx/nginx.conf.backup.$(date +%Y%m%d)
fi

# Create new nginx.conf with SSL
# Create new nginx.conf with SSL
echo ""
echo "📝 Creating nginx configuration..."
cat > nginx/nginx.conf << 'NGINX_EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;

    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:3000;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name jobagent-career.com www.jobagent-career.com api.jobagent-career.com;
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # Frontend HTTPS
    server {
        listen 443 ssl;
        http2 on;
        server_name jobagent-career.com www.jobagent-career.com;
        
        ssl_certificate /etc/letsencrypt/live/jobagent-career.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/jobagent-career.com/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        add_header Strict-Transport-Security "max-age=31536000" always;

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # API HTTPS
    server {
        listen 443 ssl;
        http2 on;
        server_name api.jobagent-career.com;
        
        ssl_certificate /etc/letsencrypt/live/jobagent-career.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/jobagent-career.com/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # CORS headers for all responses
        add_header Access-Control-Allow-Origin "https://jobagent-career.com" always;
        add_header Access-Control-Allow-Credentials "true" always;

        # Proxy to backend
        location / {
            # Handle OPTIONS preflight
            if ($request_method = OPTIONS) {
                add_header Access-Control-Allow-Origin "https://jobagent-career.com" always;
                add_header Access-Control-Allow-Credentials "true" always;
                add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
                add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept" always;
                add_header Access-Control-Max-Age 3600 always;
                add_header Content-Length 0;
                add_header Content-Type text/plain;
                return 204;
            }

            # Proxy to backend
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Ensure CORS headers on backend responses
            proxy_hide_header Access-Control-Allow-Origin;
            proxy_hide_header Access-Control-Allow-Credentials;
            add_header Access-Control-Allow-Origin "https://jobagent-career.com" always;
            add_header Access-Control-Allow-Credentials "true" always;
        }
    }
}
NGINX_EOF

echo "✅ nginx.conf created"

# Update .env with HTTPS URLs
echo ""
echo "📝 Updating .env with HTTPS URLs..."
if [ -f .env ]; then
    cp .env .env.backup.$(date +%Y%m%d)
    
    # Update URLs
    sed -i 's|BACKEND_URL=.*|BACKEND_URL=https://api.jobagent-career.com|g' .env
    sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=https://jobagent-career.com|g' .env
    sed -i 's|VITE_API_URL=.*|VITE_API_URL=https://api.jobagent-career.com/api/v1|g' .env
    
    # Add CORS if not present
    if ! grep -q "CORS_ORIGINS" .env; then
        echo "CORS_ORIGINS=https://jobagent-career.com,https://www.jobagent-career.com" >> .env
    else
        sed -i 's|CORS_ORIGINS=.*|CORS_ORIGINS=https://jobagent-career.com,https://www.jobagent-career.com|g' .env
    fi
    
    echo "✅ .env updated"
fi

# Create frontend .env files
echo ""
echo "📝 Creating frontend environment files..."
cat > frontend/.env << 'ENV_EOF'
VITE_API_URL=https://api.jobagent-career.com/api/v1
ENV_EOF

cat > frontend/.env.production << 'ENV_EOF'
VITE_API_URL=https://api.jobagent-career.com/api/v1
ENV_EOF

echo "✅ Frontend .env files created"

# Update vite.config.js
echo ""
echo "📝 Updating vite.config.js..."
if [ -f frontend/vite.config.js ]; then
    cp frontend/vite.config.js frontend/vite.config.js.backup.$(date +%Y%m%d)
fi

cat > frontend/vite.config.js << 'VITE_EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || 'https://api.jobagent-career.com/api/v1'
    )
  },
  
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://api.jobagent-career.com/api/v1',
        changeOrigin: true,
      },
    },
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react'],
        },
      },
    },
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
VITE_EOF

echo "✅ vite.config.js updated"

# Check docker-compose for SSL mount
echo ""
echo "📝 Checking docker-compose.prod.yml..."
if ! grep -q "/etc/letsencrypt:/etc/letsencrypt:ro" docker-compose.prod.yml; then
    echo "⚠️  Adding SSL certificate mount to docker-compose.prod.yml"
    
    # Backup
    cp docker-compose.prod.yml docker-compose.prod.yml.backup.$(date +%Y%m%d)
    
    # Add SSL mount to nginx service (simple sed)
    sed -i '/nginx:/,/volumes:/{/volumes:/a\      - /etc/letsencrypt:/etc/letsencrypt:ro' docker-compose.prod.yml
    
    echo "✅ SSL mount added"
else
    echo "✅ SSL mount already present"
fi

# Delete old frontend images
echo ""
echo "🗑️  Removing old frontend images..."
docker rmi $(docker images | grep -E 'frontend|job-agent-india' | awk '{print $3}') 2>/dev/null || echo "No old images to remove"

# Export environment variables
echo ""
echo "📤 Exporting environment variables..."
export VITE_API_URL=https://api.jobagent-career.com/api/v1
echo "✅ VITE_API_URL=$VITE_API_URL"

# Rebuild frontend with no cache
echo ""
echo "🔨 Rebuilding frontend (this may take a few minutes)..."
docker-compose -f docker-compose.prod.yml build --no-cache --build-arg VITE_API_URL=https://api.jobagent-career.com/api/v1 frontend

# Start services
echo ""
echo "🚀 Starting all services with SSL..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services
echo ""
echo "⏳ Waiting for services to start (30 seconds)..."
sleep 30

# Test services
echo ""
echo "🧪 Testing services..."

if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✅ Services are running"
    docker-compose -f docker-compose.prod.yml ps
else
    echo "⚠️  Some services may not be running"
    docker-compose -f docker-compose.prod.yml ps
fi

# Verify frontend build
echo ""
echo "🔍 Verifying frontend build contains HTTPS URLs..."
if docker exec job-agent-frontend sh -c "grep -q 'https://api.jobagent-career.com' /usr/share/nginx/html/assets/*.js" 2>/dev/null; then
    echo "✅ Frontend build contains HTTPS URLs"
else
    echo "⚠️  Warning: Could not verify HTTPS URLs in frontend build"
    echo "   This might be normal if files are minimized differently"
fi

# Setup auto-renewal
echo ""
echo "🔄 Setting up SSL auto-renewal..."
CRON_CMD="0 0 * * 0 certbot renew --quiet && docker-compose -f $PWD/docker-compose.prod.yml restart nginx"
(sudo crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_CMD") | sudo crontab -

echo ""
echo "✅ SSL Setup Complete!"
echo ""
echo "🎉 Your site should now be live with HTTPS:"
echo "   Frontend: https://jobagent-career.com"
echo "   API:      https://api.jobagent-career.com"
echo ""
echo "📋 Next steps:"
echo "   1. Clear browser cache completely (Ctrl+Shift+Delete)"
echo "   2. Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)"
echo "   3. Test: https://jobagent-career.com"
echo "   4. Check for green lock 🔒 in browser"
echo "   5. Verify no Mixed Content errors in Console (F12)"
echo ""
echo "🔍 Troubleshooting:"
echo "   View logs:        docker-compose -f docker-compose.prod.yml logs -f"
echo "   Check nginx:      docker-compose -f docker-compose.prod.yml logs nginx"
echo "   Check frontend:   docker-compose -f docker-compose.prod.yml logs frontend"
echo "   Check backend:    docker-compose -f docker-compose.prod.yml logs backend"
echo "   Check certs:      sudo certbot certificates"
echo "   Verify build:     docker exec job-agent-frontend grep -r 'api.jobagent-career.com' /usr/share/nginx/html/assets/"
echo ""