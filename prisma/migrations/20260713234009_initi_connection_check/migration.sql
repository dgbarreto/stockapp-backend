-- CreateTable
CREATE TABLE "ConnectionCheck" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConnectionCheck_pkey" PRIMARY KEY ("id")
);
