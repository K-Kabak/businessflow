WITH ranked AS (
  SELECT "id", "organizationId",
    (ROW_NUMBER() OVER (
      PARTITION BY "organizationId", "projectId", "status"
      ORDER BY "position", "createdAt", "id"
    ) * 1000)::INTEGER AS "position"
  FROM "Task"
)
UPDATE "Task" AS task
SET "position" = ranked."position"
FROM ranked
WHERE task."id" = ranked."id"
  AND task."organizationId" = ranked."organizationId"
  AND task."position" <> ranked."position";

CREATE INDEX "Task_organizationId_projectId_status_position_idx"
ON "Task"("organizationId", "projectId", "status", "position");
