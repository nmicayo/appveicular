-- Create canonical category lookup table
CREATE TABLE "maintenance_category" (
  "id" text NOT NULL,
  "organization_id" text NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "maintenance_category_organization_id_fkey" FOREIGN KEY ("organization_id")
    REFERENCES "organization" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "maintenance_category_org_name_unique" UNIQUE ("organization_id", "name")
);

-- Add category_id FK to maintenance_record (drop old free-text column)
ALTER TABLE "maintenance_record"
  DROP COLUMN IF EXISTS "category",
  ADD COLUMN "category_id" text REFERENCES "maintenance_category" ("id") ON DELETE SET NULL;

-- Add category_id FK to maintenance_plan
ALTER TABLE "maintenance_plan"
  ADD COLUMN "category_id" text REFERENCES "maintenance_category" ("id") ON DELETE SET NULL;
