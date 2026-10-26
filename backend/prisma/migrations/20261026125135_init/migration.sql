-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CITOYEN', 'ENTREPRISE', 'ADMIN');

-- CreateEnum
CREATE TYPE "Langue" AS ENUM ('FR', 'EN');

-- CreateEnum
CREATE TYPE "StatutCompte" AS ENUM ('EN_ATTENTE', 'ACTIF', 'REFUSE', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "StatutOffre" AS ENUM ('EN_ATTENTE', 'VALIDE', 'REFUSE', 'EN_PAUSE', 'EXPIREE');

-- CreateEnum
CREATE TYPE "SourceOffre" AS ENUM ('ENTREPRISE', 'OPENAGENDA', 'DATA_GOUV', 'PARIS_OPEN_DATA');

-- CreateEnum
CREATE TYPE "StatutBorne" AS ENUM ('ACTIVE', 'HORS_LIGNE', 'DESACTIVEE');

-- CreateEnum
CREATE TYPE "StatutSession" AS ENUM ('ACTIVE', 'TERMINEE', 'EXPIREE');

-- CreateEnum
CREATE TYPE "StatutImport" AS ENUM ('EN_COURS', 'TERMINE', 'ECHEC');

-- CreateEnum
CREATE TYPE "DecisionModeration" AS ENUM ('VALIDE', 'REFUSE', 'SUSPENDU', 'REACTIVE');

-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasseHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CITOYEN',
    "langue" "Langue" NOT NULL DEFAULT 'FR',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entreprise" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "typeActivite" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "justificatifUrl" TEXT,
    "statut" "StatutCompte" NOT NULL DEFAULT 'EN_ATTENTE',
    "motifRefus" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entreprise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categorie" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelleFr" TEXT NOT NULL,
    "libelleEn" TEXT NOT NULL,
    "picto" TEXT,
    "dureeDefautMinutes" INTEGER NOT NULL DEFAULT 60,

    CONSTRAINT "Categorie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offre" (
    "id" TEXT NOT NULL,
    "entrepriseId" TEXT,
    "categorieId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "lieu" TEXT NOT NULL,
    "adresse" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "debut" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3),
    "horaires" TEXT,
    "dureeMinutes" INTEGER NOT NULL,
    "prix" DECIMAL(8,2),
    "gratuit" BOOLEAN NOT NULL DEFAULT false,
    "photoUrl" TEXT,
    "source" "SourceOffre" NOT NULL DEFAULT 'ENTREPRISE',
    "sourceUrl" TEXT,
    "idExterne" TEXT,
    "statut" "StatutOffre" NOT NULL DEFAULT 'EN_ATTENTE',
    "vues" INTEGER NOT NULL DEFAULT 0,
    "motifRefus" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Offre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preference" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "budgetMax" DECIMAL(8,2),

    CONSTRAINT "Preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favori" (
    "utilisateurId" TEXT NOT NULL,
    "offreId" TEXT NOT NULL,
    "ajouteLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favori_pkey" PRIMARY KEY ("utilisateurId","offreId")
);

-- CreateTable
CREATE TABLE "Borne" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "emplacement" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "cleApiHash" TEXT NOT NULL,
    "statut" "StatutBorne" NOT NULL DEFAULT 'ACTIVE',
    "dernierPing" TIMESTAMP(3),

    CONSTRAINT "Borne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionBorne" (
    "id" TEXT NOT NULL,
    "borneId" TEXT NOT NULL,
    "langue" "Langue" NOT NULL DEFAULT 'FR',
    "statut" "StatutSession" NOT NULL DEFAULT 'ACTIVE',
    "debutLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expireLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionBorne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recherche" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "utilisateurId" TEXT,
    "tempsLibreMinutes" INTEGER NOT NULL,
    "budgetMax" DECIMAL(8,2),
    "categories" TEXT[],
    "rayonM" INTEGER NOT NULL,
    "elargie" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recherche_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommandation" (
    "id" TEXT NOT NULL,
    "rechercheId" TEXT NOT NULL,
    "offreId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "rang" INTEGER NOT NULL,
    "explication" TEXT NOT NULL,

    CONSTRAINT "Recommandation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalModeration" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "offreId" TEXT,
    "entrepriseId" TEXT,
    "decision" "DecisionModeration" NOT NULL,
    "motif" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalModeration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRapport" (
    "id" TEXT NOT NULL,
    "source" "SourceOffre" NOT NULL,
    "debutLe" TIMESTAMP(3) NOT NULL,
    "finLe" TIMESTAMP(3),
    "statut" "StatutImport" NOT NULL DEFAULT 'EN_COURS',
    "message" TEXT,
    "nbCrees" INTEGER NOT NULL DEFAULT 0,
    "nbMisAJour" INTEGER NOT NULL DEFAULT 0,
    "nbRejetes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ImportRapport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatOffreJour" (
    "offreId" TEXT NOT NULL,
    "jour" DATE NOT NULL,
    "recommandations" INTEGER NOT NULL DEFAULT 0,
    "vues" INTEGER NOT NULL DEFAULT 0,
    "favoris" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StatOffreJour_pkey" PRIMARY KEY ("offreId","jour")
);

-- CreateTable
CREATE TABLE "_CategorieToPreference" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategorieToPreference_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Entreprise_utilisateurId_key" ON "Entreprise"("utilisateurId");

-- CreateIndex
CREATE INDEX "Entreprise_statut_idx" ON "Entreprise"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "Categorie_code_key" ON "Categorie"("code");

-- CreateIndex
CREATE INDEX "Offre_statut_fin_idx" ON "Offre"("statut", "fin");

-- CreateIndex
CREATE INDEX "Offre_latitude_longitude_idx" ON "Offre"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Offre_categorieId_idx" ON "Offre"("categorieId");

-- CreateIndex
CREATE INDEX "Offre_entrepriseId_idx" ON "Offre"("entrepriseId");

-- CreateIndex
CREATE UNIQUE INDEX "Offre_source_idExterne_key" ON "Offre"("source", "idExterne");

-- CreateIndex
CREATE UNIQUE INDEX "Preference_utilisateurId_key" ON "Preference"("utilisateurId");

-- CreateIndex
CREATE INDEX "Favori_offreId_idx" ON "Favori"("offreId");

-- CreateIndex
CREATE UNIQUE INDEX "Borne_cleApiHash_key" ON "Borne"("cleApiHash");

-- CreateIndex
CREATE INDEX "SessionBorne_statut_expireLe_idx" ON "SessionBorne"("statut", "expireLe");

-- CreateIndex
CREATE INDEX "SessionBorne_borneId_idx" ON "SessionBorne"("borneId");

-- CreateIndex
CREATE INDEX "Recherche_sessionId_idx" ON "Recherche"("sessionId");

-- CreateIndex
CREATE INDEX "Recherche_utilisateurId_creeLe_idx" ON "Recherche"("utilisateurId", "creeLe");

-- CreateIndex
CREATE INDEX "Recommandation_rechercheId_rang_idx" ON "Recommandation"("rechercheId", "rang");

-- CreateIndex
CREATE INDEX "Recommandation_offreId_idx" ON "Recommandation"("offreId");

-- CreateIndex
CREATE UNIQUE INDEX "Recommandation_rechercheId_offreId_key" ON "Recommandation"("rechercheId", "offreId");

-- CreateIndex
CREATE INDEX "JournalModeration_creeLe_idx" ON "JournalModeration"("creeLe");

-- CreateIndex
CREATE INDEX "JournalModeration_offreId_idx" ON "JournalModeration"("offreId");

-- CreateIndex
CREATE INDEX "JournalModeration_entrepriseId_idx" ON "JournalModeration"("entrepriseId");

-- CreateIndex
CREATE INDEX "JournalModeration_adminId_idx" ON "JournalModeration"("adminId");

-- CreateIndex
CREATE INDEX "ImportRapport_source_debutLe_idx" ON "ImportRapport"("source", "debutLe");

-- CreateIndex
CREATE INDEX "StatOffreJour_jour_idx" ON "StatOffreJour"("jour");

-- CreateIndex
CREATE INDEX "_CategorieToPreference_B_index" ON "_CategorieToPreference"("B");

-- AddForeignKey
ALTER TABLE "Entreprise" ADD CONSTRAINT "Entreprise_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offre" ADD CONSTRAINT "Offre_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offre" ADD CONSTRAINT "Offre_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "Categorie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preference" ADD CONSTRAINT "Preference_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favori" ADD CONSTRAINT "Favori_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favori" ADD CONSTRAINT "Favori_offreId_fkey" FOREIGN KEY ("offreId") REFERENCES "Offre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionBorne" ADD CONSTRAINT "SessionBorne_borneId_fkey" FOREIGN KEY ("borneId") REFERENCES "Borne"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recherche" ADD CONSTRAINT "Recherche_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SessionBorne"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recherche" ADD CONSTRAINT "Recherche_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommandation" ADD CONSTRAINT "Recommandation_rechercheId_fkey" FOREIGN KEY ("rechercheId") REFERENCES "Recherche"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommandation" ADD CONSTRAINT "Recommandation_offreId_fkey" FOREIGN KEY ("offreId") REFERENCES "Offre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalModeration" ADD CONSTRAINT "JournalModeration_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalModeration" ADD CONSTRAINT "JournalModeration_offreId_fkey" FOREIGN KEY ("offreId") REFERENCES "Offre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalModeration" ADD CONSTRAINT "JournalModeration_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatOffreJour" ADD CONSTRAINT "StatOffreJour_offreId_fkey" FOREIGN KEY ("offreId") REFERENCES "Offre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategorieToPreference" ADD CONSTRAINT "_CategorieToPreference_A_fkey" FOREIGN KEY ("A") REFERENCES "Categorie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategorieToPreference" ADD CONSTRAINT "_CategorieToPreference_B_fkey" FOREIGN KEY ("B") REFERENCES "Preference"("id") ON DELETE CASCADE ON UPDATE CASCADE;
