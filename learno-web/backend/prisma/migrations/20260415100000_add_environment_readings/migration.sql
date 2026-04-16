-- Create environment_readings table for IoT sensor data
CREATE TABLE "environment_readings" (
    "id" VARCHAR(26) NOT NULL,
    "class_id" VARCHAR(26),
    "session_id" VARCHAR(26),
    "device_id" VARCHAR(255),
    "co2_ppm" INTEGER,
    "temperature_c" DOUBLE PRECISION,
    "humidity_pct" DOUBLE PRECISION,
    "light_lux" DOUBLE PRECISION,
    "received_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT "environment_readings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "environment_readings_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "environment_readings_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create indexes for environment_readings
CREATE INDEX "environment_readings_class_id_received_at_idx" ON "environment_readings"("class_id", "received_at");
CREATE INDEX "environment_readings_session_id_received_at_idx" ON "environment_readings"("session_id", "received_at");
CREATE INDEX "environment_readings_device_id_received_at_idx" ON "environment_readings"("device_id", "received_at");