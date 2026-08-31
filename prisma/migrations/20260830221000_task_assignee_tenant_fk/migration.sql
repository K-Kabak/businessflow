-- Strengthen task assignments with organization-aware referential integrity.
ALTER TABLE "Task" DROP CONSTRAINT "Task_assigneeId_fkey";

ALTER TABLE "Task"
ADD CONSTRAINT "Task_assigneeId_organizationId_fkey"
FOREIGN KEY ("assigneeId", "organizationId")
REFERENCES "User"("id", "organizationId")
ON DELETE SET NULL ("assigneeId")
ON UPDATE CASCADE;
