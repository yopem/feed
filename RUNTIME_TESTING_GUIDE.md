# Soft-Delete Implementation - Runtime Testing Guide

This guide provides step-by-step instructions for deploying and testing the
entity status soft-delete feature.

## Prerequisites

- Docker and Docker Compose installed
- Database credentials configured in `.env`
- Bun or Node.js runtime installed

## Step 1: Check Current Database State

Before applying the migration, check if your database is already migrated:

```bash
# Connect to your database and check if entity_status enum exists
npx drizzle-kit introspect

# Or check directly with psql if you have access
psql $DATABASE_URL -c "SELECT EXISTS (SELECT FROM pg_type WHERE typname = 'entity_status');"
```

Expected output if NOT migrated: `f` (false)  
Expected output if migrated: `t` (true)

## Step 2: Apply the Migration

### Option A: Using Drizzle Kit (Recommended)

```bash
# Apply all pending migrations
npm run db:push

# Or use migrate command
npm run db:migrate
```

### Option B: Manual Migration (If needed)

```bash
# Connect to database and run migration file
psql $DATABASE_URL -f src/lib/db/migrations/0002_regular_vapor.sql
```

### Verify Migration Success

Check that the migration was applied:

```bash
# Check enum exists
psql $DATABASE_URL -c "SELECT typname, typnamespace FROM pg_type WHERE typname = 'entity_status';"

# Check columns were added
psql $DATABASE_URL -c "SELECT table_name, column_name, data_type, column_default FROM information_schema.columns WHERE column_name = 'status' AND table_schema = 'public';"

# Check indexes were created
psql $DATABASE_URL -c "SELECT tablename, indexname FROM pg_indexes WHERE indexname LIKE '%status%' ORDER BY tablename, indexname;"
```

Expected results:

- Enum `entity_status` exists with values: published, draft, deleted
- Status column added to: `feeds`, `tags`, `articles` tables
- Default value: `'published'::entity_status`
- 7 indexes created:
  - `article_status_idx`, `article_feed_status_idx`, `article_user_status_idx`
  - `feed_status_idx`, `feed_user_status_idx`
  - `tag_status_idx`, `tag_user_status_idx`

## Step 3: Start the Application

### Development Mode

```bash
# Start the dev server
npm run dev

# Or with bun
bun dev
```

The app will be available at `http://localhost:3000`

### Production Mode (Docker)

```bash
# Build and start with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f app
```

The app will be available at `http://localhost:3069`

## Step 4: Run Integration Tests

### Set Test User ID

First, create a test user or use an existing user ID:

```bash
# Export test user ID
export TEST_USER_ID="your-user-id-here"
```

### Run Test Suite

```bash
# Make the test executable
chmod +x test-soft-delete.ts

# Run the integration tests
```

Expected output:

```
============================================================
SOFT-DELETE INTEGRATION TEST SUITE
============================================================
Test User ID: your-user-id-here

🧹 Cleaning up test data...
✓ Cleanup complete

📋 Testing Schema Setup...
✓ Enum entity_status exists
✓ Feed status column exists
✓ Feed status defaults to published
✓ Feed status indexes exist

⚙️  Testing Default Status...
✓ New feed defaults to 'published'
✓ New tag defaults to 'published'
✓ New article defaults to 'published'

📰 Testing Feed Soft-Delete...
✓ Test feed created
✓ Test article created
✓ Feed visible before deletion
✓ Feed hidden after soft-delete
✓ Article hidden after cascade delete
✓ Feed status is 'deleted' in database
✓ Article status is 'deleted' in database

🏷️  Testing Tag Soft-Delete...
✓ Test tag created
✓ Tag visible before deletion
✓ Tag hidden after soft-delete
✓ Tag status is 'deleted' in database

🔍 Testing Query Filtering...
✓ Query returns published feeds
✓ Query excludes deleted feeds

============================================================
TEST SUMMARY
============================================================
✓ All 21 tests passed!
============================================================
```

## Step 5: Manual Testing via tRPC

### Test Feed Soft-Delete

1. **Create a test feed**

   ```bash
   # Using curl or your API client
   curl -X POST http://localhost:3000/api/trpc/feed.create \
     -H "Content-Type: application/json" \
     -d '{"url": "https://example.com/feed.xml"}'
   ```

2. **Verify feed appears in list**

   ```bash
   curl http://localhost:3000/api/trpc/feed.all?input=%7B%22page%22%3A1%2C%22perPage%22%3A10%7D
   ```

3. **Soft-delete the feed**

   ```bash
   curl -X POST http://localhost:3000/api/trpc/feed.delete \
     -H "Content-Type: application/json" \
     -d '{"feedId": "feed-id-here"}'
   ```

4. **Verify feed is hidden from list**

   ```bash
   # Should not appear in results
   curl http://localhost:3000/api/trpc/feed.all?input=%7B%22page%22%3A1%2C%22perPage%22%3A10%7D
   ```

5. **Verify database state**

   ```sql
   -- Feed should have status = 'deleted'
   SELECT id, title, status FROM feeds WHERE id = 'feed-id-here';

   -- Articles should have status = 'deleted'
   SELECT id, title, status FROM articles WHERE feed_id = 'feed-id-here';
   ```

### Test Tag Soft-Delete

1. **Create a test tag**

   ```bash
   curl -X POST http://localhost:3000/api/trpc/tag.create \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Tag"}'
   ```

2. **Soft-delete the tag**

   ```bash
   curl -X POST http://localhost:3000/api/trpc/tag.delete \
     -H "Content-Type: application/json" \
     -d '{"tagId": "tag-id-here"}'
   ```

3. **Verify tag is hidden**
   ```bash
   curl http://localhost:3000/api/trpc/tag.all
   ```

### Test Article Cascade Deletion

1. **Query articles for a feed**

   ```bash
   curl "http://localhost:3000/api/trpc/article.byFilter?input=%7B%22filter%22%3A%22all%22%2C%22feedId%22%3A%22feed-id%22%7D"
   ```

2. **Soft-delete the parent feed**

   ```bash
   curl -X POST http://localhost:3000/api/trpc/feed.delete \
     -H "Content-Type: application/json" \
     -d '{"feedId": "feed-id-here"}'
   ```

3. **Verify articles are hidden**
   ```bash
   # Should return empty or 404
   curl "http://localhost:3000/api/trpc/article.byFilter?input=%7B%22filter%22%3A%22all%22%2C%22feedId%22%3A%22feed-id%22%7D"
   ```

## Step 6: Frontend Testing

### Verify UI Behavior

1. **Login to the application**
   - Navigate to `http://localhost:3000/auth/login`
   - Login with your credentials

2. **Test Feed Deletion**
   - Go to Dashboard
   - Create a new feed
   - Delete the feed using the delete button
   - Verify it disappears from the list immediately
   - Verify associated articles also disappear

3. **Test Tag Deletion**
   - Go to Tag Management
   - Create a new tag
   - Assign it to a feed
   - Delete the tag
   - Verify it disappears from all feeds

4. **Test Cache Invalidation**
   - Create a feed
   - Refresh the page (should still show)
   - Delete the feed
   - Refresh the page (should not show)
   - This confirms Redis cache is properly invalidated

## Step 7: Performance Testing

### Check Index Usage

```sql
-- Explain analyze a typical query
EXPLAIN ANALYZE
SELECT * FROM feeds
WHERE user_id = 'user-id' AND status = 'published';

-- Should show: "Index Scan using feed_user_status_idx"
```

### Check Query Performance

```sql
-- Time a query before soft-delete
\timing on
SELECT COUNT(*) FROM articles WHERE user_id = 'user-id' AND status = 'published';

-- Time a query after soft-deleting many items
-- Should remain fast due to indexes
```

## Step 8: Data Integrity Checks

### Verify Existing Data Defaults

```sql
-- All existing records should have status = 'published'
SELECT
  'feeds' as table_name,
  status,
  COUNT(*) as count
FROM feeds
GROUP BY status

UNION ALL

SELECT
  'tags' as table_name,
  status,
  COUNT(*) as count
FROM tags
GROUP BY status

UNION ALL

SELECT
  'articles' as table_name,
  status,
  COUNT(*) as count
FROM articles
GROUP BY status;
```

Expected: All counts should be under `status = 'published'`

### Verify Cascading Works

```sql
-- Create test data
INSERT INTO feeds (id, title, url, slug, user_id, status)
VALUES ('test-feed', 'Test', 'http://test.com', 'test', 'user-id', 'published');

INSERT INTO articles (id, title, slug, description, link, source, pub_date, user_id, feed_id, status)
VALUES ('test-article', 'Test', 'test', 'Test', 'http://test.com', 'Test', NOW(), 'user-id', 'test-feed', 'published');

-- Soft-delete feed
UPDATE feeds SET status = 'deleted' WHERE id = 'test-feed';
UPDATE articles SET status = 'deleted' WHERE feed_id = 'test-feed';

-- Verify cascade
SELECT status FROM articles WHERE id = 'test-article';
-- Expected: 'deleted'

-- Cleanup
DELETE FROM articles WHERE id = 'test-article';
DELETE FROM feeds WHERE id = 'test-feed';
```

## Troubleshooting

### Issue: Migration Already Applied

If you get "relation already exists" errors:

```bash
# Check which migrations are applied
npm run db:check

# The migration may already be applied, verify manually:
psql $DATABASE_URL -c "\d feeds"
# Should show 'status' column
```

### Issue: Tests Failing

1. **Check test user ID is valid**

   ```bash
   psql $DATABASE_URL -c "SELECT id FROM users LIMIT 1;"
   export TEST_USER_ID="actual-user-id"
   ```

2. **Check database connection**

   ```bash
   psql $DATABASE_URL -c "SELECT NOW();"
   ```

3. **Run individual test sections**
   - Comment out test functions in `test-soft-delete.ts`
   - Run one section at a time

### Issue: Soft-Deleted Items Still Visible

1. **Check Redis cache**

   ```bash
   # Clear Redis cache
   redis-cli FLUSHALL
   # Or restart Redis
   docker restart redis
   ```

2. **Verify query filters**
   ```bash
   # Check the actual query being run
   # Enable query logging in PostgreSQL
   # Check that status filter is present
   ```

## Rollback Plan

If you need to rollback the migration:

```sql
-- Remove indexes
DROP INDEX IF EXISTS article_status_idx;
DROP INDEX IF EXISTS article_feed_status_idx;
DROP INDEX IF EXISTS article_user_status_idx;
DROP INDEX IF EXISTS feed_status_idx;
DROP INDEX IF EXISTS feed_user_status_idx;
DROP INDEX IF EXISTS tag_status_idx;
DROP INDEX IF EXISTS tag_user_status_idx;

-- Remove columns
ALTER TABLE articles DROP COLUMN IF EXISTS status;
ALTER TABLE feeds DROP COLUMN IF EXISTS status;
ALTER TABLE tags DROP COLUMN IF EXISTS status;

-- Remove enum (only if not used elsewhere)
DROP TYPE IF EXISTS entity_status;
```

## Production Deployment Checklist

- [ ] Backup database before migration
- [ ] Test migration on staging environment
- [ ] Verify all indexes created successfully
- [ ] Run integration test suite
- [ ] Test frontend delete operations
- [ ] Verify cache invalidation works
- [ ] Check query performance with EXPLAIN ANALYZE
- [ ] Monitor error logs for 24 hours
- [ ] Verify no breaking changes to API
- [ ] Document rollback procedure
- [ ] Train team on new soft-delete behavior

## Success Criteria

✅ Migration applied without errors  
✅ All 21 integration tests pass  
✅ Feed deletion hides feed and articles  
✅ Tag deletion hides tag from associations  
✅ No deleted items appear in queries  
✅ Cache invalidation works correctly  
✅ Query performance unchanged or improved  
✅ Existing data defaults to 'published'  
✅ Frontend reflects changes immediately  
✅ No errors in application logs

## Support

For issues or questions:

- Check implementation summary:
  `openspec/changes/add-entity-status-soft-delete/IMPLEMENTATION_SUMMARY.md`
- Review completion report:
  `openspec/changes/add-entity-status-soft-delete/COMPLETION_REPORT.md`
- Check migration file: `src/lib/db/migrations/0002_regular_vapor.sql`
