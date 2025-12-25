DO $$ BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM pg_enum e 
   JOIN pg_type t ON e.enumtypid = t.oid 
   WHERE t.typname = 'feed_type' AND e.enumlabel = 'google_news'
 ) THEN
   ALTER TYPE "public"."feed_type" ADD VALUE 'google_news';
 END IF;
END $$;