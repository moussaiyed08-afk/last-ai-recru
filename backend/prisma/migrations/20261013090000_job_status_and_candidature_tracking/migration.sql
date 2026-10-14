-- AlterTable : nouveaux champs d'une offre
ALTER TABLE "Job"
  ADD COLUMN "type"        TEXT NOT NULL DEFAULT 'CDI',
  ADD COLUMN "contract"    TEXT NOT NULL DEFAULT 'Temps plein',
  ADD COLUMN "location"    TEXT NOT NULL DEFAULT '',
  ADD COLUMN "status"      TEXT NOT NULL DEFAULT 'live',
  ADD COLUMN "publishedAt" TIMESTAMP(3);

-- Les offres existantes sont considérées comme publiées à leur date de création
UPDATE "Job" SET "publishedAt" = "createdAt";

-- AlterTable : suivi des candidatures
ALTER TABLE "Candidature"
  ADD COLUMN "status"     TEXT NOT NULL DEFAULT 'nouveau',
  ADD COLUMN "candidatId" INTEGER;

-- CreateIndex : un candidat ne peut postuler qu'une fois à la même offre
CREATE UNIQUE INDEX "Candidature_jobId_candidatId_key" ON "Candidature"("jobId", "candidatId");

-- AddForeignKey
ALTER TABLE "Candidature"
  ADD CONSTRAINT "Candidature_candidatId_fkey"
  FOREIGN KEY ("candidatId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
