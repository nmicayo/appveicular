-- Create "vehicle" table
CREATE TABLE "vehicle" (
  "id" text NOT NULL,
  "organization_id" text NOT NULL,
  "name" text NOT NULL,
  "nickname" text,
  "brand" text,
  "model" text,
  "year" integer,
  "plate" text,
  "current_km" integer NOT NULL DEFAULT 0,
  "fuel_type" text,
  "engine" text,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "vehicle_organization_id_fkey" FOREIGN KEY ("organization_id")
    REFERENCES "organization" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Create "maintenance_plan" table
CREATE TABLE "maintenance_plan" (
  "id" text NOT NULL,
  "vehicle_id" text NOT NULL,
  "organization_id" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "trigger_type" text NOT NULL,
  "trigger_km" integer,
  "trigger_days" integer,
  "lead_time_km" integer,
  "lead_time_days" integer,
  "last_done_km" integer,
  "last_done_date" timestamp,
  "next_due_km" integer,
  "next_due_date" timestamp,
  "status" text NOT NULL DEFAULT 'ok',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "maintenance_plan_vehicle_id_fkey" FOREIGN KEY ("vehicle_id")
    REFERENCES "vehicle" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "maintenance_plan_organization_id_fkey" FOREIGN KEY ("organization_id")
    REFERENCES "organization" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Create "maintenance_record" table
CREATE TABLE "maintenance_record" (
  "id" text NOT NULL,
  "vehicle_id" text NOT NULL,
  "organization_id" text NOT NULL,
  "type" text NOT NULL,
  "date" timestamp NOT NULL,
  "odometer_km" integer,
  "workshop" text,
  "category" text,
  "reported_problem" text,
  "cost" numeric(12, 2),
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "maintenance_record_vehicle_id_fkey" FOREIGN KEY ("vehicle_id")
    REFERENCES "vehicle" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "maintenance_record_organization_id_fkey" FOREIGN KEY ("organization_id")
    REFERENCES "organization" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Create "alert" table
CREATE TABLE "alert" (
  "id" text NOT NULL,
  "vehicle_id" text NOT NULL,
  "plan_id" text,
  "organization_id" text NOT NULL,
  "type" text NOT NULL,
  "triggered_at" timestamp NOT NULL DEFAULT now(),
  "sent_at" timestamp,
  "acknowledged_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "alert_vehicle_id_fkey" FOREIGN KEY ("vehicle_id")
    REFERENCES "vehicle" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "alert_plan_id_fkey" FOREIGN KEY ("plan_id")
    REFERENCES "maintenance_plan" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "alert_organization_id_fkey" FOREIGN KEY ("organization_id")
    REFERENCES "organization" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
