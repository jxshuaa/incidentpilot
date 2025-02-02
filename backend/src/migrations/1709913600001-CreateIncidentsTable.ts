import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateIncidentsTable1709913600001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum type for incident severity
        await queryRunner.query(`
            CREATE TYPE incident_severity AS ENUM ('critical', 'high', 'medium', 'low')
        `);

        // Create enum type for incident status
        await queryRunner.query(`
            CREATE TYPE incident_status AS ENUM ('open', 'in_progress', 'resolved', 'closed')
        `);

        // Create incidents table
        await queryRunner.createTable(
            new Table({
                name: "incidents",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()"
                    },
                    {
                        name: "title",
                        type: "varchar",
                        length: "255",
                        isNullable: false
                    },
                    {
                        name: "description",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "severity",
                        type: "incident_severity",
                        isNullable: false
                    },
                    {
                        name: "status",
                        type: "incident_status",
                        default: "'open'",
                        isNullable: false
                    },
                    {
                        name: "created_by",
                        type: "uuid",
                        isNullable: false
                    },
                    {
                        name: "assigned_to",
                        type: "uuid",
                        isNullable: true
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "resolved_at",
                        type: "timestamp",
                        isNullable: true
                    }
                ]
            }),
            true
        );

        // Add foreign key constraints
        await queryRunner.createForeignKey(
            "incidents",
            new TableForeignKey({
                columnNames: ["created_by"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE"
            })
        );

        await queryRunner.createForeignKey(
            "incidents",
            new TableForeignKey({
                columnNames: ["assigned_to"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "SET NULL"
            })
        );

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX idx_incidents_status ON incidents(status);
            CREATE INDEX idx_incidents_severity ON incidents(severity);
            CREATE INDEX idx_incidents_created_by ON incidents(created_by);
            CREATE INDEX idx_incidents_assigned_to ON incidents(assigned_to);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys and indexes (they will be automatically dropped with the table)
        await queryRunner.dropTable("incidents");

        // Drop enum types
        await queryRunner.query(`
            DROP TYPE IF EXISTS incident_severity;
            DROP TYPE IF EXISTS incident_status;
        `);
    }
} 