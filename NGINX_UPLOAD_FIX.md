# Fix 413 Request Entity Too Large Error

The **413 error** occurs because nginx has a default upload limit of 1MB. Your server needs to be configured to accept larger file uploads.

## Quick Fix - Run on VPS

SSH into your VPS and run these commands:

```bash
# Create or edit nginx config for your site
sudo nano /etc/nginx/sites-available/default
```

Add this inside the `server` block:

```nginx
server {
    # ... existing config ...
    
    # Increase upload size limit to 15MB
    client_max_body_size 15M;
    
    # ... rest of config ...
}
```

Or if you don't have nginx (using PM2 directly), create/edit nginx config:

```bash
# If nginx is installed, check config location
sudo nginx -t

# Edit the main config or site config
sudo nano /etc/nginx/nginx.conf
```

Add in the `http` block:

```nginx
http {
    # ... existing config ...
    
    # Increase upload size limit
    client_max_body_size 15M;
    
    # ... rest of config ...
}
```

## Apply Changes

After editing, test and reload nginx:

```bash
# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## If Not Using Nginx

If you're running Next.js directly with PM2 (no nginx), the app should work without this limit. But if you're behind any reverse proxy (nginx, Apache, Caddy), you need to configure it.

### For Caddy (if using):
```
example.com {
    reverse_proxy localhost:3000
    request_body {
        max_size 15MB
    }
}
```

### For Apache (if using):
```apache
LimitRequestBody 15728640
```

## Verify Fix

After applying:
1. Reload your web server
2. Try uploading again on the verify/resubmit page
3. Files up to 10MB should now work
