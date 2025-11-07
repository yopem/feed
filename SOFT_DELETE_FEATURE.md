# Soft Delete Feature

## Overview

This project implements a **soft-delete** pattern for feeds, tags, and articles.
Instead of permanently removing data from the database, items are marked with a
`status='deleted'` flag and excluded from normal queries.

## Benefits

- **Data Recovery**: Deleted items can be restored if needed
- **Audit Trail**: Maintain history of all content
- **Compliance**: Meet data retention requirements
- **User Safety**: Undo accidental deletions

## Implementation

### Database Schema

**Enum Type** (`entity_status`):

```sql
CREATE TYPE entity_status AS ENUM ('published', 'draft', 'deleted');
```

**Status Columns**:

- `feeds.status` - Default: `'published'`
- `tags.status` - Default: `'published'`
- `articles.status` - Default: `'published'`

**Performance Indexes** (7 total):

```sql
-- Composite indexes for user-scoped queries
CREATE INDEX feeds_user_id_status_idx ON feeds(user_id, status);
CREATE INDEX tags_user_id_status_idx ON tags(user_id, status);
CREATE INDEX articles_user_id_status_idx ON articles(user_id, status);

-- Feed-scoped article queries
CREATE INDEX articles_feed_id_status_idx ON articles(feed_id, status);

-- Individual status indexes
CREATE INDEX feeds_status_idx ON feeds(status);
CREATE INDEX tags_status_idx ON tags(status);
CREATE INDEX articles_status_idx ON articles(status);
```

### Deletion Behavior

#### Feed Deletion

When a feed is deleted:

1. Feed status → `'deleted'`
2. All articles in feed → `'deleted'` (cascade)
3. Feed-tag associations remain (tags not deleted)

**Router**: `src/lib/api/routers/feed.ts:213`

#### Tag Deletion

When a tag is deleted:

1. Tag status → `'deleted'`
2. Feed-tag associations remain
3. Deleted tags excluded from feed tag lists

**Router**: `src/lib/api/routers/tag.ts:101`

#### Article Deletion

Articles can be soft-deleted when:

- Parent feed is deleted (cascade)
- Individual article deletion (if implemented)

### Query Filtering

All queries automatically filter by status:

```typescript
// Feed queries
db.query.feed.findMany({
  where: and(
    eq(feed.userId, ctx.user.id),
    eq(feed.status, "published"), // 👈 Status filter
  ),
})

// Article queries
db.query.article.findMany({
  where: and(
    eq(article.userId, ctx.user.id),
    eq(article.status, "published"), // 👈 Status filter
  ),
})

// Tag queries
db.query.tag.findMany({
  where: and(
    eq(tag.userId, ctx.user.id),
    eq(tag.status, "published"), // 👈 Status filter
  ),
})
```

**All Filtered Queries**:

- Feed Router: 10 queries filter by status
- Tag Router: 3 queries filter by status
- Article Router: 7 queries filter by status

### Cache Invalidation

Deletion operations properly invalidate React Query caches:

```typescript
// Feed deletion invalidates both feeds and articles
await queryClient.invalidateQueries(trpc.feed.pathFilter())
await queryClient.invalidateQueries(trpc.article.pathFilter())

// Tag deletion invalidates tags and feeds (for tag lists)
await queryClient.invalidateQueries(trpc.tag.pathFilter())
await queryClient.invalidateQueries(trpc.feed.pathFilter())
```

## Testing

### Test Suite

- ✅ Schema validation (enum, columns, indexes)
- ✅ Default status behavior
- ✅ Feed soft-delete
- ✅ Tag soft-delete
- ✅ Query filtering

- ✅ Feed and article cascade deletion
- ✅ Tag soft-delete
- ✅ Query filtering excludes deleted items
- ✅ Data recovery (restore deleted items)
- ✅ Index performance verification

### Running Tests

```bash
# Run integration tests only
npm run test:soft-delete

# Run E2E tests only
npm run test:e2e

# Run all tests
npm run test:all
```

**Test Results**: 22/22 passing ✅

## Migration

**File**: `src/lib/db/migrations/0002_regular_vapor.sql`

**Applied**: Yes ✅

**What it does**:

1. Creates `entity_status` enum
2. Adds status columns to feeds, tags, articles
3. Sets default to `'published'`
4. Creates 7 performance indexes
5. All existing data defaults to `'published'`

**Apply migration**:

```bash
npm run db:migrate
```

## Data Recovery

To restore deleted items (admin/maintenance operation):

```sql
-- Restore a deleted feed
UPDATE feeds
SET status = 'published', updated_at = NOW()
WHERE id = 'feed-id';

-- Restore articles from a restored feed
UPDATE articles
SET status = 'published', updated_at = NOW()
WHERE feed_id = 'feed-id';

-- Restore a deleted tag
UPDATE tags
SET status = 'published', updated_at = NOW()
WHERE id = 'tag-id';
```

## Future Enhancements

### Automated Cleanup

Consider adding a scheduled job to permanently delete items after X days:

```sql
-- Permanently delete feeds older than 90 days
DELETE FROM feeds
WHERE status = 'deleted'
  AND updated_at < NOW() - INTERVAL '90 days';
```

### Admin UI

Add admin interface to:

- View deleted items
- Restore deleted items
- Permanently delete items
- Bulk operations

### Trash/Recycle Bin

Add user-facing UI for:

- Viewing recently deleted items
- One-click restore
- Empty trash feature

### Draft Status

The `'draft'` status is available but not currently used. Could be used for:

- Unpublished feeds (pending user activation)
- Draft articles (scheduled publishing)
- Pending tags (admin approval)

## Files Modified

**Schema**:

- `src/lib/db/schema/enums.ts` - Entity status enum
- `src/lib/db/schema/feed.ts` - Status column
- `src/lib/db/schema/tag.ts` - Status column
- `src/lib/db/schema/article.ts` - Status column

**Routers**:

- `src/lib/api/routers/feed.ts` - Delete mutation + query filters
- `src/lib/api/routers/tag.ts` - Delete mutation + query filters
- `src/lib/api/routers/article.ts` - Query filters

**Migrations**:

- `src/lib/db/migrations/0002_regular_vapor.sql` - Migration

**Tests**:

**Documentation**:

- `RUNTIME_TESTING_GUIDE.md` - Deployment guide
- `SOFT_DELETE_FEATURE.md` - This file

## Performance Impact

**Query Performance**: Minimal impact

- All indexes include status column
- Composite indexes optimize user-scoped queries
- PostgreSQL efficiently filters by indexed enum columns

**Storage**: Deleted items remain in database

- Consider periodic cleanup for very old deleted items
- Monitor database size over time

**Backup/Restore**: No changes needed

- Soft-deleted items included in backups
- Restore operations work normally

## Security Considerations

- Soft-deleted items are hidden from UI but remain in database
- Ensure deleted items don't appear in:
  - API responses
  - Search results
  - RSS feeds
  - Public pages
- Consider access controls for restoration operations
- Audit log restoration actions

## Compliance

Soft-delete helps meet various compliance requirements:

- **GDPR**: Can permanently delete on user request (separate operation)
- **Data Retention**: Keep records for required periods
- **Audit Trail**: Maintain history of deletions
- **Business Continuity**: Recover from accidental deletions
