CREATE TABLE "ActorSource" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActorSource_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ActorSource_actorId_url_key" ON "ActorSource"("actorId", "url");
CREATE INDEX "ActorSource_actorId_createdAt_idx" ON "ActorSource"("actorId", "createdAt");

ALTER TABLE "ActorSource" ADD CONSTRAINT "ActorSource_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
