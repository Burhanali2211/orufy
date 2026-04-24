# Netlify Deployment Checklist - HimalayanSpicesExportss E-Commerce Store

## Pre-Deployment Verification (Run Locally)

### Code Quality & Build
- [ ] Run `npm run type-check` - No TypeScript errors
- [ ] Run `npm run lint` - No linting errors
- [ ] Run `npm run build` - Build succeeds without errors
- [ ] Build output directory exists: `dist/`
- [ ] No console.logs with sensitive data
- [ ] No hardcoded API keys or secrets
- [ ] No hardcoded localhost URLs in production code

### Environment & Configuration
- [ ] `.env` file exists and is in `.gitignore`
- [ ] `.env.production.example` created with template
- [ ] `netlify.toml` created and configured
- [ ] All required environment variables documented
- [ ] No sensitive data in source code
- [ ] Database connection string uses environment variable

### Database
- [ ] Database connection tested locally
- [ ] Connection string format correct for serverless
- [ ] SSL/TLS enabled in connection string
- [ ] Connection pooling configured
- [ ] Database schema initialized
- [ ] Sample data seeded (if needed)

### Security
- [ ] JWT_SECRET is strong (128+ characters)
- [ ] No API keys in source code
- [ ] CORS configuration reviewed
- [ ] Security headers configured in `netlify.toml`
- [ ] Rate limiting configured
- [ ] Password hashing implemented (bcrypt)
- [ ] Authentication tokens handled securely

### Assets & Static Files
- [ ] All images in `public/` directory
- [ ] All asset paths are relative
- [ ] Favicon configured
- [ ] Robots.txt present
- [ ] Manifest files present
- [ ] Service worker configured

### API & Backend
- [ ] All API endpoints use relative paths
- [ ] CORS headers configured
- [ ] Error handling implemented
- [ ] Rate limiting configured
- [ ] Request logging configured
- [ ] Health check endpoint working

### Frontend
- [ ] All fetch/axios calls use relative paths
- [ ] No localhost references in production code
- [ ] API URL detection working correctly
- [ ] Fallback to `/api` in production
- [ ] All pages load correctly
- [ ] Responsive design working
- [ ] Mobile view tested

---

## Netlify Setup Steps

### Step 1: Repository Connection
- [ ] GitHub/GitLab account connected to Netlify
- [ ] Repository selected and authorized
- [ ] Netlify has access to repository
- [ ] Webhook configured for auto-deploy

### Step 2: Build Configuration
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`
- [ ] Node.js version: 18.17.0
- [ ] Settings from `netlify.toml` will be used
- [ ] No manual build settings needed

### Step 3: Environment Variables Setup

**CRITICAL - Must be set in Netlify Dashboard:**

#### Required Variables
- [ ] `DATABASE_URL` = Your Neon PostgreSQL connection string
  - Format: `postgresql://user:password@host/database?sslmode=require&channel_binding=require`
  - Verify connection string is correct
  - Test connection before setting

- [ ] `JWT_SECRET` = Your JWT signing secret
  - Minimum 32 characters
  - Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
  - Keep secure and never share

- [ ] `VITE_APP_ENV` = `production`
  - Exactly as shown

- [ ] `FRONTEND_URL` = Your Netlify site URL
  - Format: `https://your-site.netlify.app`
  - Must match your actual Netlify domain

- [ ] `VITE_API_URL` = Your API endpoint
  - Format: `https://your-site.netlify.app/api`
  - Must match FRONTEND_URL + `/api`

#### Optional Variables (if using these features)
- [ ] `RAZORPAY_KEY_ID` = Your Razorpay key ID (if using payments)
- [ ] `RAZORPAY_KEY_SECRET` = Your Razorpay secret (if using payments)
- [ ] `VITE_RAZORPAY_KEY_ID` = Your Razorpay key ID (if using payments)
- [ ] `SENDGRID_API_KEY` = Your SendGrid API key (if using emails)
- [ ] `EMAIL_FROM` = Your sender email (if using emails)
- [ ] `VITE_GA_MEASUREMENT_ID` = Your GA4 ID (if using analytics)
- [ ] `VITE_SENTRY_DSN` = Your Sentry DSN (if using error tracking)

**Verification:**
- [ ] All variable names match exactly with code usage
- [ ] No typos in variable names
- [ ] All values are correct
- [ ] Sensitive values are secure
- [ ] Variables starting with `VITE_` are frontend-exposed
- [ ] Other variables are server-side only

### Step 4: Deploy
- [ ] Trigger initial deployment
- [ ] Monitor build logs in Netlify dashboard
- [ ] Wait for build to complete
- [ ] Check for any errors or warnings
- [ ] Verify deployment succeeded

---

## Post-Deployment Verification

### Immediate Checks (First 5 minutes)
- [ ] Site loads without errors
- [ ] No 404 errors in console
- [ ] No CORS errors in console
- [ ] No authentication errors
- [ ] Database connection working

### Functional Testing

#### Authentication
- [ ] Login page loads
- [ ] Register page loads
- [ ] Can create new account
- [ ] Can login with credentials
- [ ] Can logout
- [ ] Session persists on page reload
- [ ] Unauthorized access redirects to login

#### Products & Catalog
- [ ] Products page loads
- [ ] Products display correctly
- [ ] Product images load
- [ ] Product details page works
- [ ] Search functionality works
- [ ] Filters work correctly
- [ ] Pagination works

#### Shopping Cart
- [ ] Add to cart works
- [ ] Remove from cart works
- [ ] Update quantity works
- [ ] Cart persists on page reload
- [ ] Cart total calculates correctly
- [ ] Empty cart message displays

#### Checkout & Orders
- [ ] Checkout page loads
- [ ] Address form works
- [ ] Shipping calculation works
- [ ] Order creation succeeds
- [ ] Order confirmation displays
- [ ] Order history shows orders
- [ ] Order details page works

#### User Account
- [ ] Profile page loads
- [ ] Can update profile
- [ ] Can change password
- [ ] Can manage addresses
- [ ] Can view order history
- [ ] Can manage payment methods
- [ ] Can update preferences

#### Admin Features (if applicable)
- [ ] Admin dashboard loads
- [ ] Can view analytics
- [ ] Can manage products
- [ ] Can manage categories
- [ ] Can manage users
- [ ] Can manage orders
- [ ] Can manage settings

#### Seller Features (if applicable)
- [ ] Seller dashboard loads
- [ ] Can view seller analytics
- [ ] Can manage seller products
- [ ] Can view seller orders
- [ ] Can update seller profile

### Performance Testing
- [ ] Page load time < 3 seconds
- [ ] Images load quickly
- [ ] No layout shifts
- [ ] Smooth animations
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Responsive on desktop

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### Device Testing
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Large mobile (414x896)

### API Testing
- [ ] GET `/api/products` returns data
- [ ] GET `/api/categories` returns data
- [ ] POST `/api/auth/login` works
- [ ] POST `/api/auth/register` works
- [ ] GET `/api/cart` returns cart
- [ ] POST `/api/orders` creates order
- [ ] GET `/api/orders` returns orders
- [ ] All endpoints return correct status codes

### Error Handling
- [ ] 404 page displays for invalid routes
- [ ] Error messages display correctly
- [ ] Network errors handled gracefully
- [ ] Timeout errors handled gracefully
- [ ] Database errors handled gracefully
- [ ] Authentication errors handled gracefully

### Security Verification
- [ ] HTTPS enabled
- [ ] Security headers present
- [ ] No sensitive data in console
- [ ] No API keys exposed
- [ ] CORS working correctly
- [ ] Rate limiting working
- [ ] Authentication tokens secure

### Analytics & Monitoring
- [ ] Google Analytics tracking (if configured)
- [ ] Sentry error tracking (if configured)
- [ ] Performance metrics collected
- [ ] No JavaScript errors in console
- [ ] No network errors

---

## Monitoring & Maintenance

### Daily Checks (First Week)
- [ ] Monitor Netlify build logs
- [ ] Check for deployment errors
- [ ] Monitor function logs
- [ ] Check error tracking (Sentry)
- [ ] Monitor analytics
- [ ] Check database performance
- [ ] Monitor uptime

### Weekly Checks
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Monitor database connections
- [ ] Review user feedback
- [ ] Check for security issues
- [ ] Monitor API response times
- [ ] Check cache hit rates

### Monthly Checks
- [ ] Review analytics data
- [ ] Analyze user behavior
- [ ] Check for performance degradation
- [ ] Review security logs
- [ ] Update dependencies (if needed)
- [ ] Backup database
- [ ] Review cost/usage

---

## Troubleshooting Guide

### Build Fails
**Symptoms**: Build fails in Netlify dashboard
**Solutions**:
- [ ] Check build logs for error messages
- [ ] Verify Node.js version in `netlify.toml`
- [ ] Verify all dependencies are installed
- [ ] Check for TypeScript errors
- [ ] Verify environment variables are set
- [ ] Check for missing files or imports

### Site Won't Load
**Symptoms**: Site shows error or blank page
**Solutions**:
- [ ] Check browser console for errors
- [ ] Verify DNS is pointing to Netlify
- [ ] Check Netlify deployment status
- [ ] Clear browser cache
- [ ] Try incognito/private mode
- [ ] Check network tab for failed requests

### Database Connection Fails
**Symptoms**: Database errors in logs
**Solutions**:
- [ ] Verify `DATABASE_URL` is correct
- [ ] Check Neon dashboard for connection status
- [ ] Verify IP whitelist (if applicable)
- [ ] Test connection string locally
- [ ] Check connection pool settings
- [ ] Monitor database logs

### CORS Errors
**Symptoms**: CORS errors in browser console
**Solutions**:
- [ ] Verify `FRONTEND_URL` is set correctly
- [ ] Check server CORS configuration
- [ ] Verify origin is in allowed list
- [ ] Check for typos in URLs
- [ ] Verify HTTPS is being used
- [ ] Check browser console for exact error

### API Endpoints Not Working
**Symptoms**: API calls fail or return errors
**Solutions**:
- [ ] Verify `VITE_API_URL` is correct
- [ ] Check API endpoint exists
- [ ] Verify authentication token is valid
- [ ] Check request headers
- [ ] Monitor server logs
- [ ] Test endpoint with curl/Postman

### Authentication Issues
**Symptoms**: Can't login or register
**Solutions**:
- [ ] Verify `JWT_SECRET` is set
- [ ] Check database connection
- [ ] Verify user exists in database
- [ ] Check password hashing
- [ ] Monitor authentication logs
- [ ] Clear browser storage and try again

### Performance Issues
**Symptoms**: Site is slow or unresponsive
**Solutions**:
- [ ] Check Netlify function logs
- [ ] Monitor database query times
- [ ] Check bundle size
- [ ] Enable caching headers
- [ ] Optimize images
- [ ] Monitor network requests
- [ ] Check for memory leaks

---

## Rollback Procedure

If deployment has critical issues:

1. **Immediate Actions**
   - [ ] Identify the issue
   - [ ] Check error logs
   - [ ] Notify team members

2. **Rollback Steps**
   - [ ] Go to Netlify Dashboard → Deploys
   - [ ] Find the previous successful deployment
   - [ ] Click "Publish deploy"
   - [ ] Confirm rollback
   - [ ] Verify site is working

3. **Post-Rollback**
   - [ ] Verify all functionality works
   - [ ] Check error logs
   - [ ] Identify root cause
   - [ ] Fix issue locally
   - [ ] Test thoroughly
   - [ ] Deploy again

---

## Success Criteria

✅ **Deployment is successful when:**
- [ ] Build completes without errors
- [ ] Site loads without errors
- [ ] All pages load correctly
- [ ] Database connection works
- [ ] Authentication works
- [ ] Shopping cart works
- [ ] Checkout works
- [ ] Orders can be created
- [ ] Admin features work (if applicable)
- [ ] No console errors
- [ ] No CORS errors
- [ ] Performance is acceptable
- [ ] Security headers present
- [ ] HTTPS enabled
- [ ] All tests pass

---

## Contact & Support

- **Netlify Support**: https://support.netlify.com
- **Neon Support**: https://neon.tech/docs
- **GitHub Issues**: Check repository issues
- **Team Slack**: #deployment channel

---

**Last Updated**: 2024
**Status**: Ready for Deployment
