-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `departamentoId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_departamentoId_fkey` FOREIGN KEY (`departamentoId`) REFERENCES `Departamento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
