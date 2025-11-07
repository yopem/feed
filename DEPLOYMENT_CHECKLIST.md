# Soft-Delete Feature - Deployment Checklist

## ✅ Pre-Deployment Verification

### Local Testing

- [x] All integration tests passing (10/10)
- [x] All E2E tests passing (12/12)
- [x] TypeScript compilation successful
- [x] Linting passes
- [x] Migration applied locally

### Code Review

- [x] Schema changes reviewed
- [x] Router query filters verified
- [x] Cache invalidation patterns confirmed
- [x] JSDoc documentation complete
- [x] No breaking API changes

### Database

- [x] Migration file created (`0002_regular_vapor.sql`)
- [x] Indexes properly defined (7 total)
- [x] Default values set (`published`)
- [x] Enum type created (`entity_status`)

## 📋 Deployment Steps

### 1. Backup Database

```bash
# Create full database backup
pg_dump $DATABASE_URL > backup_pre_soft_delete_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backup_pre_soft_delete_*.sql
```

### 2. Deploy to Staging

```bash
# Deploy code to staging
git push staging main

# Run migration on staging
npm run db:migrate

# Verify migration
npm run db:check
```

### 3. Staging Validation

**Manual Testing**:

- [ ] Login to staging application
- [ ] Create a test feed
- [ ] Create test articles in feed
- [ ] Delete feed → verify articles disappear
- [ ] Create a test tag
- [ ] Delete tag → verify tag disappears
- [ ] Verify feed list only shows non-deleted feeds
- [ ] Check database to confirm deleted items still exist

**Database Verification**:

```sql
-- Check enum created
SELECT * FROM pg_type WHERE typname = 'entity_status';

-- Check columns added
SELECT table_name, column_name, column_default
FROM information_schema.columns
WHERE column_name = 'status'
  AND table_schema = 'public';

-- Check indexes created
SELECT indexname FROM pg_indexes
WHERE indexname LIKE '%status%'
  AND schemaname = 'public';

-- Check existing data defaults to 'published'
SELECT status, COUNT(*)
FROM feeds
GROUP BY status;
```

### 4. Monitor Staging (24 hours)

**What to Monitor**:

- [ ] Application errors in logs
- [ ] Database query performance
- [ ] User feedback (if staging has users)
- [ ] Memory/CPU usage
- [ ] Query execution times

**Performance Queries**:

```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE indexname LIKE '%status%'
ORDER BY idx_scan DESC;

-- Check query performance
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query LIKE '%status%'
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### 5. Production Deployment

```bash
# Create production backup
pg_dump $PROD_DATABASE_URL > backup_prod_pre_soft_delete_$(date +%Y%m%d_%H%M%S).sql

# Deploy to production
git push production main

# Run migration
npm run db:migrate

# Verify
npm run db:check
```

### 6. Production Validation

**Smoke Tests**:

- [ ] Application loads successfully
- [ ] Feed list displays correctly
- [ ] Article list displays correctly
- [ ] Tag list displays correctly
- [ ] Delete operations work
- [ ] No errors in production logs

**Database Check**:

```sql
-- Verify migration applied
SELECT * FROM drizzle.migrations
ORDER BY created_at DESC
LIMIT 5;

-- Check data integrity
SELECT
  (SELECT COUNT(*) FROM feeds WHERE status = 'published') as published_feeds,
  (SELECT COUNT(*) FROM feeds WHERE status = 'deleted') as deleted_feeds,
  (SELECT COUNT(*) FROM articles WHERE status = 'published') as published_articles,
  (SELECT COUNT(*) FROM tags WHERE status = 'published') as published_tags;
```

### 7. Post-Deployment Monitoring (7 days)

**Daily Checks**:

- [ ] Error logs review
- [ ] Performance metrics
- [ ] User feedback
- [ ] Database size growth
- [ ] Query performance

**Week 1 Metrics**:

- [ ] Number of feeds deleted
- [ ] Number of articles cascaded
- [ ] Average query response times
- [ ] Cache hit rates
- [ ] User-reported issues

## 🚨 Rollback Plan

If issues are detected:

### 1. Code Rollback (Fastest)

```bash
# Revert to previous deployment
git revert HEAD
git push production main
```

**Note**: This will keep the migration applied but stop using soft-delete in
queries.

### 2. Full Database Rollback (If Necessary)

⚠️ **WARNING**: This loses any data created after migration

```bash
# Restore from backup
psql $DATABASE_URL < backup_prod_pre_soft_delete_TIMESTAMP.sql

# Verify restoration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM feeds"
```

### 3. Partial Rollback

If only specific issues:

```sql
-- Remove status filter from specific queries
-- (Requires code changes)

-- Or restore specific records
UPDATE feeds SET status = 'published' WHERE status = 'deleted';
UPDATE tags SET status = 'published' WHERE status = 'deleted';
UPDATE articles SET status = 'published' WHERE status = 'deleted';
```

## 📊 Success Criteria

### Functional

- [x] Deleted feeds don't appear in feed lists
- [x] Deleting feed cascades to articles
- [x] Deleted tags don't appear in tag lists
- [x] All queries filter by status correctly
- [x] Cache invalidation works properly

### Performance

- [ ] Query response times < 100ms (avg)
- [ ] No significant CPU increase
- [ ] No memory leaks
- [ ] Index usage confirmed

### Quality

- [x] All tests passing
- [x] Zero TypeScript errors
- [x] Zero linting errors
- [x] Documentation complete

## 📝 Communication Plan

### Before Deployment

- [ ] Notify team of deployment window
- [ ] Share rollback plan
- [ ] Ensure on-call engineer available

### During Deployment

- [ ] Post status updates
- [ ] Monitor error channels
- [ ] Be ready for quick rollback

### After Deployment

- [ ] Announce successful deployment
- [ ] Share metrics/results
- [ ] Document any issues encountered
- [ ] Update team on monitoring plan

## 🔐 Security Considerations

### Data Access

- [ ] Verify deleted items not exposed via API
- [ ] Check deleted items not in search results
- [ ] Ensure deleted items not in public feeds
- [ ] Confirm deleted items not in exports

### Audit Trail

- [ ] Log all deletion operations
- [ ] Track who deleted what
- [ ] Monitor restoration requests
- [ ] Review access patterns

## 📚 Documentation Updates

- [x] SOFT_DELETE_FEATURE.md created
- [x] RUNTIME_TESTING_GUIDE.md created
- [x] Package.json test scripts added
- [ ] Update API documentation (if exists)
- [ ] Update user documentation (if needed)
- [ ] Update ops runbook

## ✅ Final Sign-Off

- [ ] Engineering Lead approval
- [ ] Database admin approval
- [ ] Product owner notification
- [ ] Deployment scheduled
- [ ] On-call engineer assigned
- [ ] Rollback plan reviewed
- [ ] Communication sent

---

**Deployment Date**: **\*\*\*\***\_**\*\*\*\*** **Deployed By**:
**\*\*\*\***\_**\*\*\*\*** **Sign-Off**: **\*\*\*\***\_**\*\*\*\***
