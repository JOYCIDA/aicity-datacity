-- CreateEnum
CREATE TYPE "MotifSignalement" AS ENUM ('INFORMATION_ERRONEE', 'OFFRE_EXPIREE', 'LIEU_INCORRECT', 'CONTENU_INAPPROPRIE', 'AUTRE');

-- CreateTable
CREATE TABLE "Signalement" (
    "id" TEXT NOT NULL,
    "offreId" TEXT NOT NULL,
    "motif" "MotifSignalement" NOT NULL,
    "commentaire" TEXT,
    "traite" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Signalement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Signalement_traite_creeLe_idx" ON "Signalement"("traite", "creeLe");

-- CreateIndex
CREATE INDEX "Signalement_offreId_idx" ON "Signalement"("offreId");

-- AddForeignKey
ALTER TABLE "Signalement" ADD CONSTRAINT "Signalement_offreId_fkey" FOREIGN KEY ("offreId") REFERENCES "Offre"("id") ON DELETE CASCADE ON UPDATE CASCADE;
