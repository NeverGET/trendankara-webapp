# ReUI Migration Deployment Checklist

## Pre-Deployment Verification

### ✅ Code Quality
- [x] All TypeScript errors resolved
- [x] ESLint warnings reviewed and acceptable
- [x] No console errors in development
- [x] Build compiles successfully
- [x] Tests passing (unit, integration)

### ✅ Component Migration
- [x] All 12 critical components migrated
- [x] Adapters created and tested
- [x] Feature flag wrappers in place
- [x] Legacy components preserved
- [x] Dark theme implemented

### ✅ Testing
- [x] Unit tests created
- [x] Integration tests passing
- [x] Visual regression tests captured
- [x] E2E test specs defined
- [x] API compatibility verified
- [x] Performance metrics acceptable

### ✅ Documentation
- [x] Component guide created
- [x] Migration report complete
- [x] API compatibility documented
- [x] Deployment instructions ready

## Staging Deployment Steps

### 1. Environment Preparation

```bash
# Set feature flag to OFF initially
export NEXT_PUBLIC_USE_REUI=false

# Verify environment variables
env | grep NEXT_PUBLIC
```

### 2. Build Verification

```bash
# Clean build
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
npm ci

# Run production build
npm run build

# Check build output
ls -la .next/static
```

### 3. Database Backup

```bash
# Backup current database
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASS radio_db > backup_$(date +%Y%m%d).sql

# Verify backup
ls -la *.sql
```

### 4. Deploy to Staging

```bash
# Deploy with feature flag OFF
git checkout main
git pull origin main
git merge dev --no-ff

# Tag the release
git tag -a v2.0.0-reui -m "ReUI Migration Release"
git push origin main --tags

# Deploy to staging
npm run deploy:staging
```

### 5. Staging Verification

```bash
# Check staging health
curl https://staging.trendankara.com/api/health

# Verify components load
curl -I https://staging.trendankara.com

# Check feature flag
curl https://staging.trendankara.com/api/config
```

## Testing Checklist

### Smoke Tests (Feature Flag OFF)
- [ ] Homepage loads
- [ ] Admin dashboard accessible
- [ ] News section works
- [ ] Polls functional
- [ ] Media gallery loads
- [ ] Radio player works
- [ ] Mobile responsive

### Feature Flag Testing
- [ ] Enable flag for test users
- [ ] Verify ReUI components render
- [ ] Test all interactions
- [ ] Check dark theme
- [ ] Mobile compatibility
- [ ] Performance metrics

### Load Testing
- [ ] Run load tests
- [ ] Monitor memory usage
- [ ] Check response times
- [ ] Verify no memory leaks

## Production Deployment

### Phase 1: Soft Launch (5% rollout)
```bash
# Enable for 5% of users
export NEXT_PUBLIC_USE_REUI=false
export REUI_ROLLOUT_PERCENTAGE=5

# Deploy
npm run deploy:production

# Monitor
npm run monitor:production
```

### Phase 2: Expanded Rollout (25%)
```bash
# After 24 hours with no issues
export REUI_ROLLOUT_PERCENTAGE=25

# Update and monitor
npm run deploy:update
npm run monitor:metrics
```

### Phase 3: Majority Rollout (75%)
```bash
# After 48 hours stable
export REUI_ROLLOUT_PERCENTAGE=75

# Update and monitor
npm run deploy:update
npm run monitor:full
```

### Phase 4: Full Rollout (100%)
```bash
# After 72 hours stable
export NEXT_PUBLIC_USE_REUI=true
unset REUI_ROLLOUT_PERCENTAGE

# Final deployment
npm run deploy:final
```

## Rollback Plan

### Immediate Rollback
```bash
# Disable feature flag
export NEXT_PUBLIC_USE_REUI=false

# Redeploy
npm run deploy:emergency

# Verify rollback
curl https://trendankara.com/api/config
```

### Database Rollback (if needed)
```bash
# Restore from backup
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS radio_db < backup_$(date +%Y%m%d).sql

# Verify restoration
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS -e "SELECT VERSION();"
```

### Git Rollback
```bash
# Revert to previous release
git revert HEAD
git push origin main

# Or reset to specific tag
git reset --hard v1.9.0
git push --force origin main
```

## Monitoring

### Key Metrics to Watch

#### Performance
- [ ] Page load time < 3s
- [ ] Time to Interactive < 5s
- [ ] First Contentful Paint < 1.5s
- [ ] Bundle size < 20MB

#### Errors
- [ ] Error rate < 0.1%
- [ ] No 500 errors
- [ ] No console errors
- [ ] No TypeScript errors

#### User Experience
- [ ] Bounce rate stable
- [ ] Session duration stable
- [ ] Page views consistent
- [ ] Mobile usage normal

### Monitoring Commands
```bash
# Check error logs
tail -f logs/error.log

# Monitor server resources
htop

# Check application logs
pm2 logs

# View real-time metrics
npm run monitor:realtime
```

## Post-Deployment

### Day 1
- [ ] Monitor error rates
- [ ] Check user feedback
- [ ] Review performance metrics
- [ ] Verify mobile app compatibility

### Week 1
- [ ] Analyze usage patterns
- [ ] Review component adoption
- [ ] Check bundle size impact
- [ ] Gather team feedback

### Month 1
- [ ] Remove legacy components
- [ ] Optimize based on usage
- [ ] Update documentation
- [ ] Plan next improvements

## Success Criteria

### Technical Success
- ✅ All components migrated
- ✅ Tests passing
- ✅ Performance maintained
- ✅ No breaking changes

### Business Success
- [ ] User satisfaction maintained
- [ ] No increase in support tickets
- [ ] Mobile app compatibility
- [ ] Team productivity improved

## Sign-off

### Technical Team
- [ ] Frontend Lead: _____________
- [ ] Backend Lead: _____________
- [ ] DevOps Lead: _____________
- [ ] QA Lead: _____________

### Business Team
- [ ] Product Manager: _____________
- [ ] Project Manager: _____________
- [ ] Stakeholder: _____________

## Emergency Contacts

- **On-Call Engineer**: +90 XXX XXX XXXX
- **DevOps Team**: devops@trendankara.com
- **Support Team**: support@trendankara.com
- **Escalation**: management@trendankara.com

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Version**: 2.0.0-reui
**Status**: Ready for Staging