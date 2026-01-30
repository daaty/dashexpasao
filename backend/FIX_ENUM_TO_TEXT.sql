-- =====================================================
-- FIX: Database migration for production
-- Run this SQL directly on the PostgreSQL database
-- =====================================================

-- Step 1: Alter status column from ENUM to TEXT
ALTER TABLE "City" ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;

-- Step 2: Alter mesorregion column from ENUM to TEXT  
ALTER TABLE "City" ALTER COLUMN "mesorregion" TYPE TEXT USING "mesorregion"::TEXT;

-- Step 3: Drop the unused ENUM types (optional cleanup)
DROP TYPE IF EXISTS "CityStatus";
DROP TYPE IF EXISTS "Mesorregion";

-- Step 4: Add missing column to PlanningResults
ALTER TABLE "PlanningResults" ADD COLUMN IF NOT EXISTS "realMonthlyCosts" JSONB;

-- =====================================================
-- After running this, redeploy the backend
-- =====================================================
