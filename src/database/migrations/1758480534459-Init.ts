import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm"

export class Init1758480534459 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // En tu caso, las tablas ya existen. La migración generada intenta
        // recrearlas o alterar sus columnas. Los siguientes comandos
        // son los que causaron el error, ya que la tabla "calculoimc" ya tiene
        // datos que la migración intentó alterar.
        //
        // Lo que haremos es "vaciar" la migración para que no intente hacer
        // cambios que ya hiciste manualmente.

        // NOTA: Si no tienes las tablas "users" y "calculoimc" creadas
        // manualmente en la base de datos, descomenta estos bloques para que se creen.
        // Pero dado tu caso, las tablas ya existen y están llenas de datos,
        // por lo que la migración no necesita hacer nada.
        
        // await queryRunner.createTable(new Table({
        //     name: 'users',
        //     columns: [
        //         { name: 'id', type: 'integer', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
        //         { name: 'email', type: 'varchar', isUnique: true, isNullable: false },
        //         { name: 'password', type: 'varchar', isNullable: false },
        //         { name: 'firstName', type: 'varchar', isNullable: true },
        //         { name: 'lastName', type: 'varchar', isNullable: true }
        //     ]
        // }));

        // await queryRunner.createTable(new Table({
        //     name: 'calculoimc',
        //     columns: [
        //         { name: 'id', type: 'integer', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
        //         { name: 'altura', type: 'decimal', precision: 4, scale: 2, isNullable: false },
        //         { name: 'peso', type: 'decimal', precision: 6, scale: 2, isNullable: false },
        //         { name: 'imc', type: 'decimal', precision: 6, scale: 2, isNullable: false },
        //         { name: 'categoria', type: 'varchar', isNullable: false },
        //         { name: 'fecha_calculo', type: 'timestamp with time zone', isNullable: false, default: 'now()' },
        //         { name: 'userId', type: 'integer', isNullable: true }
        //     ]
        // }));

        // await queryRunner.createForeignKey('calculoimc', new TableForeignKey({
        //     columnNames: ['userId'],
        //     referencedColumnNames: ['id'],
        //     referencedTableName: 'users',
        //     onDelete: 'CASCADE'
        // }));

        // Como ya creaste las tablas y las llenaste, el método "up" no necesita hacer nada.
        // El error se produce porque TypeORM está intentando aplicar cambios a una tabla
        // que ya existe y que tiene datos que la violan.

        // Por lo tanto, el método `up` no tendrá contenido para tu caso específico.
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // En tu caso, tampoco necesitas hacer un rollback, ya que las tablas
        // fueron creadas manualmente.
    }
}
