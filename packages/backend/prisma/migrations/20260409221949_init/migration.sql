-- CreateEnum
CREATE TYPE "TipoRefeicao" AS ENUM ('cafe_da_manha', 'almoco', 'lanche', 'janta', 'ceia');

-- CreateEnum
CREATE TYPE "OrigemEntrada" AS ENUM ('texto', 'audio');

-- CreateEnum
CREATE TYPE "StatusRefeicao" AS ENUM ('rascunho', 'processando', 'aguardando_revisao', 'confirmada', 'deletada');

-- CreateTable
CREATE TABLE "fontes_nutricionais" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" TEXT,
    "prioridade" INTEGER NOT NULL DEFAULT 1,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fontes_nutricionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alimentos_padronizados" (
    "id" SERIAL NOT NULL,
    "fonte_id" INTEGER NOT NULL,
    "codigo_externo" VARCHAR(50),
    "nome_canonico" VARCHAR(200) NOT NULL,
    "nome_busca" TEXT NOT NULL,
    "categoria" VARCHAR(100),
    "porcao_referencia_g" DECIMAL(8,2) NOT NULL DEFAULT 100,
    "energia_kcal" DECIMAL(8,2),
    "proteina_g" DECIMAL(8,2),
    "carboidrato_g" DECIMAL(8,2),
    "lipideo_g" DECIMAL(8,2),
    "fibra_g" DECIMAL(8,2),
    "sodio_mg" DECIMAL(8,2),
    "confianca_ia" DECIMAL(4,3),
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "alimentos_padronizados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(50) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "nome_display" VARCHAR(100),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refeicoes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "tipo" "TipoRefeicao" NOT NULL,
    "status" "StatusRefeicao" NOT NULL DEFAULT 'rascunho',
    "origem_entrada" "OrigemEntrada" NOT NULL,
    "data_refeicao" DATE NOT NULL,
    "horario_refeicao" VARCHAR(5),
    "texto_original" TEXT,
    "texto_editado" TEXT,
    "texto_confirmado" TEXT NOT NULL,
    "resposta_ia_raw" JSONB,
    "total_energia_kcal" DECIMAL(8,2),
    "total_proteina_g" DECIMAL(8,2),
    "total_carboidrato_g" DECIMAL(8,2),
    "total_lipideo_g" DECIMAL(8,2),
    "confianca_media_ia" DECIMAL(4,3),
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,
    "deletado_em" TIMESTAMPTZ,

    CONSTRAINT "refeicoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_refeicao" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "refeicao_id" UUID NOT NULL,
    "alimento_id" INTEGER,
    "descricao_padronizada" VARCHAR(300) NOT NULL,
    "quantidade_g" DECIMAL(8,2) NOT NULL,
    "energia_kcal" DECIMAL(8,2) NOT NULL,
    "proteina_g" DECIMAL(8,2) NOT NULL,
    "carboidrato_g" DECIMAL(8,2) NOT NULL,
    "lipideo_g" DECIMAL(8,2) NOT NULL,
    "fibra_g" DECIMAL(8,2),
    "confianca_ia" DECIMAL(4,3) NOT NULL,
    "fonte_nutricional" VARCHAR(20) NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itens_refeicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_processamento_ia" (
    "id" BIGSERIAL NOT NULL,
    "refeicao_id" UUID,
    "usuario_id" UUID NOT NULL,
    "tipo_operacao" VARCHAR(30) NOT NULL,
    "modelo_usado" VARCHAR(50) NOT NULL,
    "tokens_entrada" INTEGER,
    "tokens_saida" INTEGER,
    "duracao_ms" INTEGER,
    "status" VARCHAR(20) NOT NULL,
    "erro_mensagem" TEXT,
    "payload_entrada" JSONB,
    "payload_saida" JSONB,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_processamento_ia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fontes_nutricionais_codigo_key" ON "fontes_nutricionais"("codigo");

-- CreateIndex
CREATE INDEX "alimentos_padronizados_fonte_id_idx" ON "alimentos_padronizados"("fonte_id");

-- CreateIndex
CREATE UNIQUE INDEX "alimentos_padronizados_codigo_externo_fonte_id_key" ON "alimentos_padronizados"("codigo_externo", "fonte_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_username_key" ON "usuarios"("username");

-- CreateIndex
CREATE INDEX "refeicoes_usuario_id_data_refeicao_idx" ON "refeicoes"("usuario_id", "data_refeicao");

-- CreateIndex
CREATE INDEX "itens_refeicao_refeicao_id_idx" ON "itens_refeicao"("refeicao_id");

-- CreateIndex
CREATE INDEX "log_processamento_ia_refeicao_id_idx" ON "log_processamento_ia"("refeicao_id");

-- CreateIndex
CREATE INDEX "log_processamento_ia_usuario_id_idx" ON "log_processamento_ia"("usuario_id");

-- AddForeignKey
ALTER TABLE "alimentos_padronizados" ADD CONSTRAINT "alimentos_padronizados_fonte_id_fkey" FOREIGN KEY ("fonte_id") REFERENCES "fontes_nutricionais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refeicoes" ADD CONSTRAINT "refeicoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_refeicao" ADD CONSTRAINT "itens_refeicao_refeicao_id_fkey" FOREIGN KEY ("refeicao_id") REFERENCES "refeicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_refeicao" ADD CONSTRAINT "itens_refeicao_alimento_id_fkey" FOREIGN KEY ("alimento_id") REFERENCES "alimentos_padronizados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_processamento_ia" ADD CONSTRAINT "log_processamento_ia_refeicao_id_fkey" FOREIGN KEY ("refeicao_id") REFERENCES "refeicoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_processamento_ia" ADD CONSTRAINT "log_processamento_ia_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
