-- CreateIndex: Partial index on open incidents ordered newest first
CREATE INDEX "Incident_open_createdAt_idx" ON "Incident" ("createdAt" DESC)
WHERE status = 'OPEN';