-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sectores" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "sectores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "telefono_alt" TEXT,
    "sector_id" INTEGER,
    "direccion" TEXT,
    "descripcion" TEXT,
    "link_google_maps" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marcas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modelos" (
    "id" SERIAL NOT NULL,
    "marca_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT,

    CONSTRAINT "modelos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades" (
    "id" SERIAL NOT NULL,
    "placa" TEXT NOT NULL,
    "modelo_id" INTEGER NOT NULL,
    "chofer_nombre" TEXT NOT NULL,
    "chofer_telefono" TEXT,
    "color" TEXT,
    "anio" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carreras" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "unidad_id" INTEGER,
    "creado_por" INTEGER,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMP(3),

    CONSTRAINT "carreras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_estados_carrera" (
    "id" SERIAL NOT NULL,
    "carrera_id" INTEGER NOT NULL,
    "estado_anterior" TEXT,
    "estado_nuevo" TEXT NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_estados_carrera_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_username_key" ON "usuarios"("username");

-- CreateIndex
CREATE UNIQUE INDEX "sectores_nombre_key" ON "sectores"("nombre");

-- CreateIndex
CREATE INDEX "clientes_sector_id_idx" ON "clientes"("sector_id");

-- CreateIndex
CREATE INDEX "clientes_telefono_idx" ON "clientes"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "marcas_nombre_key" ON "marcas"("nombre");

-- CreateIndex
CREATE INDEX "modelos_marca_id_idx" ON "modelos"("marca_id");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_placa_key" ON "unidades"("placa");

-- CreateIndex
CREATE INDEX "unidades_modelo_id_idx" ON "unidades"("modelo_id");

-- CreateIndex
CREATE INDEX "carreras_cliente_id_idx" ON "carreras"("cliente_id");

-- CreateIndex
CREATE INDEX "carreras_unidad_id_idx" ON "carreras"("unidad_id");

-- CreateIndex
CREATE INDEX "carreras_estado_idx" ON "carreras"("estado");

-- CreateIndex
CREATE INDEX "carreras_created_at_idx" ON "carreras"("created_at");

-- CreateIndex
CREATE INDEX "carreras_unidad_id_created_at_idx" ON "carreras"("unidad_id", "created_at");

-- CreateIndex
CREATE INDEX "historial_estados_carrera_carrera_id_idx" ON "historial_estados_carrera"("carrera_id");

-- CreateIndex
CREATE INDEX "historial_estados_carrera_fecha_hora_idx" ON "historial_estados_carrera"("fecha_hora");

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modelos" ADD CONSTRAINT "modelos_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "marcas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unidades" ADD CONSTRAINT "unidades_modelo_id_fkey" FOREIGN KEY ("modelo_id") REFERENCES "modelos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carreras" ADD CONSTRAINT "carreras_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carreras" ADD CONSTRAINT "carreras_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "unidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_estados_carrera" ADD CONSTRAINT "historial_estados_carrera_carrera_id_fkey" FOREIGN KEY ("carrera_id") REFERENCES "carreras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
