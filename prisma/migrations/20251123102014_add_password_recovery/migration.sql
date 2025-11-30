-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "data_nascimento" DATETIME;

-- CreateTable
CREATE TABLE "tokens_recuperacao_senha" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tokens_recuperacao_senha_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "tokens_recuperacao_senha_token_key" ON "tokens_recuperacao_senha"("token");
-- Migration: Adicionar campo img (avatar) ao usuário
-- Arquivo: prisma/migrations/YYYYMMDDHHMMSS_add_user_img/migration.sql

-- Adicionar coluna img à tabela usuarios
ALTER TABLE "usuarios" ADD COLUMN "img" TEXT;

-- Atualizar usuários existentes com avatar padrão (opcional)
-- UPDATE "usuarios" SET "img" = '' WHERE "img" IS NULL;