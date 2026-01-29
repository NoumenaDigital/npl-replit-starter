# 14 - Troubleshooting Guide

This guide documents common issues encountered during NPL application development and their solutions.

## Table of Contents

1. [NPL Compilation Issues](#1-npl-compilation-issues)
2. [Deployment Issues](#2-deployment-issues)
3. [API Path Configuration](#3-api-path-configuration)
4. [Keycloak Issues](#4-keycloak-issues)
5. [Frontend Integration Issues](#5-frontend-integration-issues)

---

## 1. NPL Compilation Issues

### 1.1 Reserved Keywords as Variable Names

**Error:**
```
E0001: Syntax error: mismatched input 'resume' expecting IDENTIFIER
```

**Cause:** NPL has reserved keywords that cannot be used as variable names, parameter names, or identifiers.

**Common Reserved Keywords to Avoid:**
- `resume` - Use `resumeDate` → `medicationResumeDate`
- `state` - Use `stateValue` or `protocolState`
- `symbol` - Use `symbolValue` or specific name
- `return`, `final`, `initial`, `match`, `permission`, `protocol`

**Solution:** Rename the variable to avoid the reserved keyword. For example:
```npl
// ❌ WRONG - 'resume' is a reserved keyword
private var resumeDate: Optional<DateTime> = optionalOf<DateTime>();

// ✅ CORRECT - Use a different name
private var medicationResumeDate: Optional<DateTime> = optionalOf<DateTime>();
```

**Full List of Reserved Keywords:**
`after`, `and`, `become`, `before`, `between`, `const`, `enum`, `else`, `final`, `for`, `function`, `guard`, `in`, `init`, `initial`, `if`, `is`, `match`, `native`, `notification`, `notify`, `identifier`, `obligation`, `optional`, `otherwise`, `package`, `permission`, `private`, `protocol`, `require`, `resume`, `return`, `returns`, `state`, `struct`, `symbol`, `this`, `union`, `use`, `var`, `vararg`, `with`, `copy`

---

## 2. Deployment Issues

### 2.1 NPL Type Redefinition Errors

**Error:**
```
E0020: Attempt to redefine 'TypeName', already defined in previous deployment
```

**Cause:** Noumena Cloud retains migration state from previous deployments. This happens when:
- You rename NPL packages
- You rename or reorganize type definitions
- You change the structure of existing protocols

**Solution:** Clear the cloud cache before deploying:

```bash
# Clear Noumena Cloud cache
npl cloud clear --tenant $NPL_TENANT --app $NPL_APP

# Then deploy fresh
make deploy-npl
```

**Or use the combined command:**
```bash
make deploy-npl-clean
```

**Prevention:** When making significant NPL structure changes, always clear first.

### 2.2 Deployment Fails with Validation Errors

**Symptoms:** `make deploy-npl` fails with NPL validation errors.

**Diagnosis:** Run validation locally first:
```bash
make check
```

**Common Causes:**
1. **NPL syntax errors** - Fix syntax issues shown in `make check` output
2. **Missing required fields** - Ensure all protocol parameters are properly defined
3. **Type mismatches** - Verify all type definitions are correct

**Solution:** Fix the NPL errors shown in `make check` output, then retry deployment.

---

## 3. API Path Configuration

### 3.1 Incorrect API Endpoint Paths

**Error:** API calls return 404 Not Found

**Cause:** The NPL Engine uses a specific path format that differs from what you might expect:

```
WRONG:  /protocol/package.ProtocolName
WRONG:  /api/v1/package/ProtocolName
CORRECT: /npl/package/ProtocolName/
```

**Key Points:**
- Path prefix is `/npl/` not `/protocol/` or `/api/`
- Package and protocol are separated by `/` not `.`
- Trailing slash `/` is often required
- Case-sensitive: use exact protocol names

**Example Mappings:**

| NPL Protocol | Correct API Path |
|-------------|------------------|
| `package cooper; protocol DogProfile` | `/npl/cooper/DogProfile/` |
| `package cooper; protocol Command` | `/npl/cooper/Command/` |
| `package myapp.users; protocol User` | `/npl/myapp.users/User/` |

### 3.2 Finding the Correct API Paths

The OpenAPI specification is the source of truth for API paths:

```bash
# Find where OpenAPI spec is generated
find npl/target -name "*openapi*.yml" 2>/dev/null

# View the paths section
grep "^  /npl" npl/target/generated-sources/openapi/*-openapi.yml | head -30
```

### 3.3 Frontend API Client Configuration

When writing the frontend API client, ensure paths match exactly:

```typescript
// ❌ WRONG
const response = await axios.get('/protocol/cooper.DogProfile');

// ✅ CORRECT  
const response = await axios.get('/npl/cooper/DogProfile/');
```

---

## 4. Keycloak Issues

### 4.1 Terraform Provisioning Fails

**Error:** Keycloak Terraform provisioning fails with connection errors

**Cause:** SSL is enabled by default on the master realm, which blocks Terraform.

**Solution:** The `local.sh` script must disable SSL before running Terraform:

```bash
# Wait for Keycloak to be ready
until curl -s http://keycloak:8080/health/ready 2>/dev/null | grep -q "UP"; do
  sleep 5
done

# CRITICAL: Disable SSL for master realm
curl -s -X PUT "http://keycloak:8080/admin/realms/master" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"sslRequired": "none"}'

# Now Terraform can run
terraform apply -auto-approve
```

### 4.2 Authentication Redirect Issues

**Symptoms:** Login works but redirect back to app fails

**Checklist:**
1. Verify `VITE_KEYCLOAK_URL` points to correct Keycloak host
2. Check realm name matches in Keycloak config
3. Verify client ID matches between frontend and Keycloak
4. Check redirect URIs are configured in Keycloak client settings

### 4.3 Engine Rejects JWT Tokens (401 Unauthorized)

**Error:** API calls return 401 Unauthorized even with valid tokens

**Cause:** The NPL Engine's `ENGINE_ALLOWED_ISSUERS` only includes the internal Docker network URL (`http://keycloak:11000/realms/...`), but the frontend (running in browser) uses `localhost` to access Keycloak, so tokens are issued with `http://localhost:11000/realms/...` as the issuer.

**Solution:** Include **both** URLs in `ENGINE_ALLOWED_ISSUERS`:

```yaml
# docker-compose.yml
engine:
  environment:
    ENGINE_ALLOWED_ISSUERS: http://keycloak:11000/realms/${VITE_NC_KC_REALM},http://localhost:11000/realms/${VITE_NC_KC_REALM}
```

**Why Both URLs Are Needed:**
- `http://keycloak:11000/...` - Internal Docker network (for service-to-service communication)
- `http://localhost:11000/...` - Browser access (for frontend authentication)

**Verification:**
```bash
# Check engine logs for issuer validation errors
docker compose logs engine | grep -i issuer

# Test API call with token
TOKEN=$(curl -s -X POST "http://localhost:11000/realms/cooper/protocol/openid-connect/token" \
  -d "client_id=cooper-app" \
  -d "username=owner@cooper.app" \
  -d "password=welcome" \
  -d "grant_type=password" | jq -r '.access_token')

curl -s http://localhost:12000/npl/cooper/DogProfile/ \
  -H "Authorization: Bearer $TOKEN"
```

### 4.4 Engine Cannot Fetch JWKS (Failed to retrieve JWKS)

**Error:**
```
Failed to retrieve JWKS for http://localhost:11000/realms/cooper-life-manager
java.io.FileNotFoundException: http://localhost:11000/realms/cooper-life-manager/.well-known/openid-configuration
```

**Cause:** The engine container is trying to fetch JWKS from `localhost:11000`, but from inside the Docker container, `localhost` refers to the container itself, not the host machine. The engine cannot reach Keycloak using `localhost`.

**Solution:** Configure hostname settings using both command-line flags and `KC_HOSTNAME` environment variable:

```yaml
# docker-compose.yml
keycloak:
  command: |
    start-dev
    --spi-events-listener-jboss-logging-success-level=info
    --spi-events-listener-jboss-logging-error-level=error
    --hostname-strict=false
    --health-enabled=true
    --http-enabled=true
    --metrics-enabled=true
    --db=postgres
    --hostname-admin=http://keycloak:11000
    --hostname=http://keycloak:11000
  environment:
    KC_HOSTNAME: keycloak
    # ... other environment variables ...
```

**Why This Works:**
- `KC_HOSTNAME: keycloak` sets the base hostname for internal Docker network resolution
- `--hostname=http://keycloak:11000` sets the public hostname for frontend access
- `--hostname-admin=http://keycloak:11000` sets the admin hostname for backend access
- `--hostname-strict=false` allows redirect URIs from different hosts (like `localhost`)
- The engine can reach `keycloak:11000` from inside the Docker network
- JWKS endpoints are now accessible at `http://keycloak:11000/realms/.../.well-known/openid-configuration`

**Note:** Both `KC_HOSTNAME` and `--hostname` flags work together - they complement each other rather than conflict.

**Important:** After configuring hostname, you must also configure redirect URIs properly (see section 4.5).

### 4.4.1 Keycloak Container Unhealthy (Healthcheck Fails)

**Error:** `container coppersappnd-keycloak-1 is unhealthy`

**Common Causes:**

1. **Curl not installed:** The Keycloak container doesn't have `curl` installed, which is required for the healthcheck. The Keycloak base image is minimal/distroless and doesn't include package managers.

2. **Missing library dependencies:** Curl is installed but missing required shared libraries (SSL, Kerberos, etc.)

3. **Incorrect health check configuration:** Wrong port, hostname, or endpoint

**Solution:** Use a multi-stage build to install curl with ALL dependencies in `keycloak/Dockerfile`:

```dockerfile
# Multi-stage build to install curl
FROM registry.access.redhat.com/ubi9/ubi-minimal:latest AS curl-builder
RUN microdnf install -y curl-minimal && microdnf clean all
# Copy curl and all its library dependencies
# All curl libraries are in /lib64/ in UBI9
RUN mkdir -p /output/usr/bin /output/lib64 && \
    cp /usr/bin/curl /output/usr/bin/ && \
    # Copy all curl dependencies from /lib64/
    # Use -L to follow symlinks and copy the actual files
    cp -L /lib64/libcurl.so.4* /output/lib64/ 2>/dev/null || true; \
    cp -L /lib64/libssl.so.3* /output/lib64/ 2>/dev/null || true; \
    cp -L /lib64/libcrypto.so.3* /output/lib64/ 2>/dev/null || true; \
    cp -L /lib64/libnghttp2.so.14* /output/lib64/ 2>/dev/null || true; \
    cp -L /lib64/libgssapi_krb5.so.2* /output/lib64/ 2>/dev/null || true; \
    cp -L /lib64/libkrb5.so.3* /output/lib64/ 2>/dev/null || true; \
    cp -L /lib64/libk5crypto.so.3* /output/lib64/ 2>/dev/null || true; \
    cp -L /lib64/libcom_err.so.2* /output/lib64/ 2>/dev/null || true; \
    cp -L /lib64/libkrb5support.so.0* /output/lib64/ 2>/dev/null || true; \
    cp -L /lib64/libkeyutils.so.1* /output/lib64/ 2>/dev/null || true; \
    cp -L /lib64/libpcre2-8.so.0* /output/lib64/ 2>/dev/null || true; \
    cp -L /lib64/libselinux.so.1* /output/lib64/ 2>/dev/null || true; \
    cp -L /lib64/libz.so.1* /output/lib64/ 2>/dev/null || true

FROM quay.io/keycloak/keycloak:24.0

# Copy curl and its dependencies from builder
USER root
COPY --from=curl-builder /output/usr/bin/curl /usr/bin/curl
COPY --from=curl-builder /output/lib64/ /lib64/
USER 1000

# Copy custom theme
COPY theme/winecellar /opt/keycloak/themes/winecellar
```

**CRITICAL Health Check Configuration:**

The health check in `docker-compose.yml` must use the correct configuration:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:11000/health/ready"]
  interval: 10s
  timeout: 5s
  retries: 30
  start_period: 60s
```

**Important Notes:**
- **Port:** Health endpoint is on port **11000** (HTTP port), NOT port 9000
- **Hostname:** Use `localhost` (not `keycloak` service name) since health check runs inside the container
- **Endpoint:** Use `/health/ready` for readiness check (Keycloak 24.0+ standard)
- **Format:** Use array format `["CMD", "curl", "-f", "..."]` for better Docker compatibility
- **Flags:** `-f` flag makes curl fail on HTTP errors (returns non-zero exit code)
- **Timing:** `start_period: 60s` gives Keycloak time to start (database migrations, realm init)
- **Libraries:** Must copy ALL curl dependencies explicitly. In UBI9, all libraries are in `/lib64/` (not `/usr/lib64/`)
- **Library list:** The following 13 libraries must be copied: `libcurl.so.4`, `libssl.so.3`, `libcrypto.so.3`, `libnghttp2.so.14`, `libgssapi_krb5.so.2`, `libkrb5.so.3`, `libk5crypto.so.3`, `libcom_err.so.2`, `libkrb5support.so.0`, `libkeyutils.so.1`, `libpcre2-8.so.0`, `libselinux.so.1`, `libz.so.1`
- **Copy flag:** Use `-L` flag with `cp` to follow symlinks and copy the actual library files

**Troubleshooting Missing Libraries:**

If you see errors like:
```
curl: error while loading shared libraries: libcurl.so.4: cannot open shared object file
```

1. **Verify library location in builder:** Check where libraries are located in the UBI9 image:
```bash
docker run --rm registry.access.redhat.com/ubi9/ubi-minimal:latest sh -c "microdnf install -y curl-minimal > /dev/null 2>&1 && ldd /usr/bin/curl | awk '/=>/ {print \$3}'"
```

2. **Check which libraries are missing in Keycloak container:**
```bash
docker exec coppersappnd-keycloak-1 ldd /usr/bin/curl 2>&1 | grep "not found"
```

3. **Add missing libraries to Dockerfile:** All curl libraries in UBI9 are in `/lib64/`, so copy them explicitly:
```dockerfile
cp -L /lib64/libcurl.so.4* /output/lib64/ 2>/dev/null || true;
# ... add other missing libraries
```

4. **Rebuild the image:**
```bash
docker compose build keycloak
docker compose up -d keycloak
```

**Note:** The working solution explicitly copies all 13 required libraries from `/lib64/` rather than trying to use `ldd` with complex shell commands, which is more reliable in Docker build contexts.

**Verification:**
```bash
# Rebuild Keycloak image
docker compose build keycloak

# Restart Keycloak
docker compose restart keycloak

# Check health status
docker compose ps keycloak

# Test curl manually (from inside container)
docker compose exec keycloak curl -f http://localhost:11000/health/ready

# Check for missing libraries
docker compose exec keycloak ldd /usr/bin/curl | grep "not found"
```

### 4.4.2 Double-Protocol URL Error (http://http//keycloak)

**Error:** After login, Keycloak redirects to malformed URL: `http://http//keycloak:11000/...`

**Cause:** This can occur if Keycloak configuration is incorrect, but the working example shows that `KC_HOSTNAME` and `--hostname` flags can work together. If you encounter this error, verify:

1. **Both are set correctly:**
   ```yaml
   environment:
     KC_HOSTNAME: keycloak  # Just the hostname, no protocol
   command: |
     --hostname=http://keycloak:11000  # Full URL with protocol
   ```

2. **Check Keycloak logs** for hostname resolution issues:
   ```bash
   docker compose logs keycloak | grep -i hostname
   ```

3. **Verify redirect URIs** in Terraform provisioning match your frontend URL

**Note:** The working example uses both `KC_HOSTNAME: keycloak` and `--hostname=http://keycloak:11000` together successfully. If you still encounter issues, check Keycloak version compatibility or consult Keycloak documentation for your specific version.

### 4.5 Invalid Redirect URI Error

**Error:** Keycloak shows "Invalid parameter: redirect_uri" error page

**Cause:** When hostname is configured (via `--hostname` flags or `KC_HOSTNAME`), Keycloak becomes stricter about redirect URIs. The frontend (running on `localhost:5000`) sends redirect URIs that don't match Keycloak's expected patterns.

**Solution 1: Configure Keycloak to Allow Flexible Redirect URIs**

Add `--hostname-strict=false` to the Keycloak command and set hostname flags:

```yaml
# docker-compose.yml
keycloak:
  command: |
    start-dev
    --spi-events-listener-jboss-logging-success-level=info
    --spi-events-listener-jboss-logging-error-level=error
    --hostname-strict=false
    --health-enabled=true
    --http-enabled=true
    --metrics-enabled=true
    --db=postgres
    --hostname-admin=http://keycloak:11000
    --hostname=http://keycloak:11000
  environment:
    KC_HOSTNAME: keycloak
    # ... other environment variables ...
```

**Key Flags:**
- `--hostname-strict=false` - Allow redirect URIs from different hosts (like `localhost`)
- `--hostname=http://keycloak:11000` - Public hostname for frontend access
- `--hostname-admin=http://keycloak:11000` - Admin hostname for backend access
- `KC_HOSTNAME: keycloak` - Base hostname for internal Docker network resolution

**Note:** Both `KC_HOSTNAME` and `--hostname` flags work together in the working example.

**Solution 2: Update Terraform to Include Frontend Redirect URIs**

Update `keycloak-provisioning/terraform.tf` to include specific redirect URIs:

```hcl
resource "keycloak_openid_client" "client" {
  # ... other settings ...
  
  # Allow redirect URIs from localhost (for local development)
  valid_redirect_uris = [
    "http://localhost:${var.frontend_port}/*",
    "http://localhost:${var.frontend_port}",
    "*"  # Fallback for development - remove in production
  ]
  
  web_origins = [
    "http://localhost:${var.frontend_port}",
    "*"  # Fallback for development - remove in production
  ]
}
```

**Why Both Solutions Are Needed:**
- `--hostname-strict=false` flag allows Keycloak to accept redirect URIs from different hosts
- Terraform configuration explicitly lists allowed redirect URI patterns
- Together, they ensure the frontend can authenticate successfully

**Verification:**
1. Restart Keycloak: `docker compose restart keycloak`
2. Re-run provisioning: `docker compose up -d keycloak-provisioning`
3. Try logging in from the frontend
4. Check Keycloak logs: `docker compose logs keycloak | grep -i redirect`

---

### 4.6 Failed to Retrieve JWKS Error

**Error:** 
```
Failed to retrieve JWKS for http://localhost:11000/realms/winecellar
java.io.FileNotFoundException: http://localhost:11000/realms/winecellar/.well-known/openid-configuration
```

**Cause:** This is a Docker networking issue. The backend engine receives tokens with issuer `http://localhost:11000/realms/winecellar` (because the browser accessed Keycloak at localhost). When the engine tries to verify the token by fetching JWKS from the issuer URL, it fails because `localhost` inside the Docker container refers to the container itself, not the host machine.

**Solution: Disable Engine Dev Mode**

The Noumena engine has an embedded OIDC server that runs in dev mode on port 11000, which can conflict with Keycloak. Ensure dev mode is disabled:

```yaml
# docker-compose.yml
services:
  engine:
    environment:
      ENGINE_DEV_MODE: false  # IMPORTANT: Disable to avoid port conflicts
      # ...
```

**Why Dev Mode Causes Issues:**
- When `ENGINE_DEV_MODE=true`, the engine runs an embedded OIDC server on port 11000
- This conflicts with external Keycloak which also uses port 11000
- The engine may try to verify tokens against the wrong OIDC server

**After Disabling:**
```bash
docker compose restart engine
```

**Note:** The `extra_hosts: ["localhost:host-gateway"]` approach may not work reliably on Docker Desktop for Mac. If you still have issues after disabling dev mode, see section 5.2 for the nginx proxy solution which handles both JWKS and CORS issues.

---

## 5. Frontend Integration Issues

### 5.1 API Calls Return 401 Unauthorized

**Cause:** Authentication token not being passed with requests

**Checklist:**
1. Verify Keycloak is returning a valid token after login
2. Check that the token is stored correctly (localStorage or memory)
3. Ensure axios interceptor adds Authorization header (see ServiceProvider in 10-CODE-TEMPLATES.md)

**Solution: Use Axios Interceptor in ServiceProvider**

The ServiceProvider must use an axios request interceptor to automatically add the Authorization header to all API requests:

```typescript
// In ServiceProvider.tsx
import axios from 'axios';

axios.interceptors.request.use(
  async (config) => {
    const kc = keycloakRef.current;
    
    if (kc?.authenticated) {
      await kc.updateToken(70); // Refresh if expiring
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${kc.token}`;
    }
    
    return config;
  }
);
```

See [10-CODE-TEMPLATES.md](./10-CODE-TEMPLATES.md) for the complete ServiceProvider implementation.

### 5.2 CORS Errors

**Symptoms:** Browser console shows "CORS error" or "Invalid CORS request" when frontend calls the engine API.

**Cause:** The Noumena engine has strict CORS filtering. Even with `FRONTEND_URL` configured, it may reject cross-origin requests.

**Solution: Use Nginx Proxy with CORS Headers**

Instead of calling the engine directly (port 12000), route all API calls through the nginx proxy (port 12001) which adds proper CORS headers.

**Step 1: Update nginx configuration (`nginx/nginx.conf`):**

```nginx
events {
    worker_connections 1024;
}

http {
    upstream engine {
        server engine:12000;
    }

    upstream read-model {
        server read-model:15000;
    }

    # Gateway: Engine + GraphQL with SSE support and CORS
    server {
        listen 12001;
        
        location / {
            # Handle CORS preflight requests
            if ($request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' '*' always;
                add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
                add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept, X-Requested-With' always;
                add_header 'Access-Control-Max-Age' 86400;
                add_header 'Content-Length' 0;
                return 204;
            }
            
            proxy_pass http://engine;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # CORS headers for all responses
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept, X-Requested-With' always;
            
            # SSE support
            proxy_buffering off;
            proxy_cache off;
            proxy_read_timeout 24h;
        }
        
        location /graphql {
            # Same CORS handling for GraphQL
            if ($request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' '*' always;
                add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
                add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept' always;
                add_header 'Access-Control-Max-Age' 86400;
                return 204;
            }
            
            proxy_pass http://read-model/graphql;
            proxy_set_header Host $host;
            
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept' always;
        }
    }
}
```

**Step 2: Configure frontend to use nginx proxy (docker-compose.yml):**

```yaml
# docker-compose.yml
services:
  frontend:
    build:
      context: frontend
      dockerfile: Dockerfile.dev
    ports:
      - "${FRONTEND_PORT:-5000}:5000"
    volumes:
      - ./frontend:/app:delegated
      - /app/node_modules
    environment:
      # CRITICAL: Use nginx proxy (12001) instead of direct engine (12000)
      VITE_ENGINE_URL: http://localhost:12001
      VITE_KEYCLOAK_URL: ${VITE_KEYCLOAK_URL:-http://localhost:11000}
      VITE_NC_KC_REALM: ${VITE_NC_KC_REALM:-winecellar}
      VITE_NC_KC_CLIENT_ID: ${VITE_NC_KC_CLIENT_ID:-winecellar}
```

**Step 3: Restart services:**

```bash
docker compose restart nginx-proxy frontend
```

**Verification:**

Test CORS preflight:
```bash
curl -v -X OPTIONS http://localhost:12001/api/npl/winecellar/Wine \
  -H "Origin: http://localhost:5000" \
  -H "Access-Control-Request-Method: GET"
```

Should return `204 No Content` with CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, Accept, X-Requested-With
```

**Why This Solution Works:**
1. Nginx handles CORS preflight (OPTIONS) requests with proper headers
2. Nginx adds CORS headers to all responses from the engine
3. Frontend calls nginx (12001) which proxies to engine (12000)
4. Engine never sees direct cross-origin requests

### 5.3 React Hook Form Not Updating State

**Symptoms:** Form fields appear filled but validation errors persist

**Cause:** Browser automation or programmatic value setting bypasses React's event handlers.

**Solution for manual testing:** Use the actual browser UI, not automation.

**Solution for programmatic forms:** Use React Hook Form's `setValue` method:

```typescript
const { setValue, handleSubmit } = useForm();

// ✅ CORRECT - Use setValue
setValue('fieldName', 'value', { shouldValidate: true });

// ❌ WRONG - Direct DOM manipulation
document.getElementById('fieldName').value = 'value';
```

---

## Quick Reference: Common Commands

### Setup and Configuration
```bash
# Full setup (interactive)
make setup

# Check environment is configured correctly
make preflight

# Login to Noumena Cloud
make login
```

### NPL Development
```bash
# Validate NPL code
make check

# Deploy to Noumena Cloud
make deploy-npl

# Clear cache and deploy
make deploy-npl-clean
```

### Frontend Development
```bash
# Generate TypeScript API client
make client

# Start dev server
make run

# Deploy frontend to Noumena Cloud
make deploy-frontend
```

### User Management
```bash
# Configure Keycloak for Replit
make keycloak

# Create test users (alice, bob, etc.)
make users
```

---

## Debugging Workflow

When something goes wrong, follow this order:

1. **Check environment configuration**
   ```bash
   make preflight
   ```

2. **For NPL deployment issues:**
   - Check validation: `make check`
   - Look for reserved keyword errors
   - Look for type redefinition errors
   - Try clearing cache: `make deploy-npl-clean`

3. **For API client generation issues:**
   - Ensure NPL is deployed: `make deploy-npl`
   - Check `.env` file exists and has correct URLs
   - Regenerate client: `make client`
   - Verify generated files in `frontend/src/generated/`

4. **For Frontend issues:**
   - Check browser console for errors
   - Check network tab for failed requests
   - Verify API paths in generated client
   - Check authentication token is being sent

5. **For Auth issues:**
   - Run `make keycloak` to configure Keycloak client
   - Check Keycloak secrets are set in Replit Secrets tab
   - Verify you can login via the frontend
   - Check browser network tab for auth-related errors

6. **For "Permission Denied" or 403 errors:**
   - Verify party automation rules in `npl/src/main/rules.yml`
   - Check user has required claims/roles
   - Verify JWT token contains expected claims

