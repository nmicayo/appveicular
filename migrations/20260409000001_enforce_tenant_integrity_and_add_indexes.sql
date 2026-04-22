-- Enforce tenant-safe vehicle references.
CREATE UNIQUE INDEX IF NOT EXISTS "idx_vehicle_id_organization_id_unique"
  ON "vehicle" ("id", "organization_id");

ALTER TABLE "maintenance_plan"
  DROP CONSTRAINT IF EXISTS "maintenance_plan_vehicle_id_fkey";

ALTER TABLE "maintenance_plan"
  ADD CONSTRAINT "maintenance_plan_vehicle_org_fkey"
  FOREIGN KEY ("vehicle_id", "organization_id")
  REFERENCES "vehicle" ("id", "organization_id")
  ON UPDATE NO ACTION
  ON DELETE CASCADE
  NOT VALID;

ALTER TABLE "maintenance_record"
  DROP CONSTRAINT IF EXISTS "maintenance_record_vehicle_id_fkey";

ALTER TABLE "maintenance_record"
  ADD CONSTRAINT "maintenance_record_vehicle_org_fkey"
  FOREIGN KEY ("vehicle_id", "organization_id")
  REFERENCES "vehicle" ("id", "organization_id")
  ON UPDATE NO ACTION
  ON DELETE CASCADE
  NOT VALID;

ALTER TABLE "alert"
  DROP CONSTRAINT IF EXISTS "alert_vehicle_id_fkey";

ALTER TABLE "alert"
  ADD CONSTRAINT "alert_vehicle_org_fkey"
  FOREIGN KEY ("vehicle_id", "organization_id")
  REFERENCES "vehicle" ("id", "organization_id")
  ON UPDATE NO ACTION
  ON DELETE CASCADE
  NOT VALID;

-- Add indexes for the most frequent read patterns.
CREATE INDEX IF NOT EXISTS "idx_vehicle_org_name"
  ON "vehicle" ("organization_id", "name");

CREATE INDEX IF NOT EXISTS "idx_maintenance_plan_org_name"
  ON "maintenance_plan" ("organization_id", "name");

CREATE INDEX IF NOT EXISTS "idx_maintenance_plan_org_vehicle"
  ON "maintenance_plan" ("organization_id", "vehicle_id");

CREATE INDEX IF NOT EXISTS "idx_maintenance_plan_org_status_due_date"
  ON "maintenance_plan" ("organization_id", "status", "next_due_date");

CREATE INDEX IF NOT EXISTS "idx_maintenance_record_org_date"
  ON "maintenance_record" ("organization_id", "date");

CREATE INDEX IF NOT EXISTS "idx_maintenance_record_org_vehicle_date"
  ON "maintenance_record" ("organization_id", "vehicle_id", "date");

CREATE INDEX IF NOT EXISTS "idx_maintenance_record_org_category_date"
  ON "maintenance_record" ("organization_id", "category_id", "date");

CREATE INDEX IF NOT EXISTS "idx_alert_org_type_unacked"
  ON "alert" ("organization_id", "type")
  WHERE "acknowledged_at" IS NULL;
