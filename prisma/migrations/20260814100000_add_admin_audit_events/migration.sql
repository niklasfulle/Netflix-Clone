CREATE TABLE "AdminAuditEvent" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "outcome" TEXT NOT NULL,
    "correlationId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminAuditEvent_createdAt_idx"
ON "AdminAuditEvent"("createdAt");

CREATE INDEX "AdminAuditEvent_actorUserId_createdAt_idx"
ON "AdminAuditEvent"("actorUserId", "createdAt");

CREATE INDEX "AdminAuditEvent_action_outcome_createdAt_idx"
ON "AdminAuditEvent"("action", "outcome", "createdAt");

CREATE INDEX "AdminAuditEvent_targetType_targetId_createdAt_idx"
ON "AdminAuditEvent"("targetType", "targetId", "createdAt");

CREATE FUNCTION "prevent_admin_audit_event_update"()
RETURNS TRIGGER AS $function$
BEGIN
    RAISE EXCEPTION 'AdminAuditEvent rows are append-only';
END;
$function$ LANGUAGE plpgsql;

CREATE TRIGGER "AdminAuditEvent_prevent_update"
BEFORE UPDATE ON "AdminAuditEvent"
FOR EACH ROW EXECUTE FUNCTION "prevent_admin_audit_event_update"();
