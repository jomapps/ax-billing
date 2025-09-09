# CORS Configuration Guide

This document explains the Cross-Origin Resource Sharing (CORS) configuration for the AX Billing application.

## Overview

The application has comprehensive CORS support configured in multiple layers:

1. **Next.js Configuration** (`next.config.mjs`) - Headers for API routes and CSP for admin
2. **Middleware** (`src/middleware.ts`) - Runtime CORS handling for API requests
3. **Environment Variables** (`.env`) - Centralized whitelist management

## Environment Variables

The CORS configuration is driven by environment variables for easy management:

```env
# CORS Configuration
CORS_LOCALHOST_PORTS=3000,3001,3002,3003
CORS_CUSTOM_DOMAINS=local.ft.tc,ax.ft.tc
```

### CORS_LOCALHOST_PORTS
Comma-separated list of localhost ports to allow. These will be automatically prefixed with `http://localhost:` and `https://localhost:`.

**Default**: `3000,3001,3002,3003`

### CORS_CUSTOM_DOMAINS  
Comma-separated list of custom domains to allow. These will be automatically prefixed with `https://` and `http://`.

**Default**: `local.ft.tc,ax.ft.tc`

## Allowed Origins

Based on the current configuration, the following origins are automatically whitelisted:

### Localhost Ports
- `http://localhost:3000`
- `http://localhost:3001` 
- `http://localhost:3002`
- `http://localhost:3003`
- `https://localhost:3000`
- `https://localhost:3001`
- `https://localhost:3002` 
- `https://localhost:3003`

### Custom Domains
- `https://local.ft.tc`
- `http://local.ft.tc`
- `https://ax.ft.tc`
- `http://ax.ft.tc`

### Main App URL
- The value of `NEXT_PUBLIC_APP_URL` (currently `https://local.ft.tc`)

## CORS Headers

The following CORS headers are automatically set for all `/api/*` routes:

- `Access-Control-Allow-Origin`: Dynamic based on request origin
- `Access-Control-Allow-Methods`: `GET,POST,PUT,DELETE,OPTIONS`
- `Access-Control-Allow-Headers`: `Content-Type,Authorization,x-gupshup-signature`
- `Access-Control-Allow-Credentials`: `true`
- `Access-Control-Max-Age`: `86400` (24 hours)

## Content Security Policy (CSP)

For admin routes (`/admin/*`), a Content Security Policy is applied that allows:

- Scripts from self and whitelisted domains
- Connections to self and whitelisted domains  
- Frames from self and whitelisted domains

## Testing CORS Configuration

Use the provided test script to verify CORS is working correctly:

```bash
# Load environment variables and test CORS
node scripts/test-cors-config.js
```

This script will:
- Test preflight OPTIONS requests from each whitelisted origin
- Verify CORS headers are set correctly
- Show which origins are allowed/blocked
- Display current environment variable values

## Adding New Origins

To add new origins to the whitelist:

1. **For localhost ports**: Add the port number to `CORS_LOCALHOST_PORTS`
   ```env
   CORS_LOCALHOST_PORTS=3000,3001,3002,3003,3004
   ```

2. **For custom domains**: Add the domain to `CORS_CUSTOM_DOMAINS`
   ```env
   CORS_CUSTOM_DOMAINS=local.ft.tc,ax.ft.tc,new-domain.com
   ```

3. **Restart the application** for changes to take effect

## Security Considerations

- Origins are validated against an exact whitelist - no wildcards
- Credentials are allowed only for whitelisted origins
- CSP headers provide additional protection for admin routes
- All origins support both HTTP and HTTPS protocols for development flexibility

## Troubleshooting

### CORS Errors in Browser
1. Check browser console for specific CORS error messages
2. Verify the requesting origin is in the whitelist
3. Run the test script to validate configuration
4. Check that environment variables are loaded correctly

### Adding Development Domains
For local development with custom domains:
1. Add entries to `/etc/hosts` file
2. Add the domain to `CORS_CUSTOM_DOMAINS`
3. Restart the development server

### Production Deployment
- Ensure `NEXT_PUBLIC_APP_URL` matches your production domain
- Update `CORS_CUSTOM_DOMAINS` with production domains only
- Remove unnecessary localhost ports from `CORS_LOCALHOST_PORTS`
