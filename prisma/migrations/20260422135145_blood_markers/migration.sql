-- Blood markers model — trackeo de glucosa, presión arterial, lípidos,
-- A1C, ketones, insulina. Un log por fecha (puede haber varios si el
-- user mide glucosa multiple veces al día — usamos measuredAt timestamp
-- además de date).

CREATE TABLE "BloodMarker" (
  "id"            TEXT NOT NULL,
  "userId"        TEXT NOT NULL,
  "date"          TEXT NOT NULL,              -- YYYY-MM-DD
  "measuredAt"    TIMESTAMPTZ,                -- opcional: timestamp exacto
  "context"       TEXT,                       -- fasting | postprandial | random | pre_meal | post_meal
  -- Glucosa y metabolismo
  "glucoseMgDl"   DOUBLE PRECISION,
  "a1cPercent"    DOUBLE PRECISION,
  "ketonesMmolL"  DOUBLE PRECISION,
  "insulinMuIml"  DOUBLE PRECISION,
  -- Presión arterial
  "systolic"      INTEGER,
  "diastolic"     INTEGER,
  "heartRate"     INTEGER,
  -- Lípidos
  "totalCholesterol" DOUBLE PRECISION,
  "hdl"           DOUBLE PRECISION,
  "ldl"           DOUBLE PRECISION,
  "triglycerides" DOUBLE PRECISION,
  -- Otros
  "source"        TEXT,                       -- cgm | home_meter | lab | smartwatch
  "notes"         TEXT,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "BloodMarker_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BloodMarker_userId_date_idx" ON "BloodMarker" ("userId", "date");
CREATE INDEX "BloodMarker_userId_measuredAt_idx" ON "BloodMarker" ("userId", "measuredAt");

ALTER TABLE "BloodMarker" ADD CONSTRAINT "BloodMarker_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
