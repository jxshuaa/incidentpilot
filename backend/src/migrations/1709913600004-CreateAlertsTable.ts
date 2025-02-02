import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateAlertsTable1709913600004 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum types for alert type and severity
        await queryRunner.query(`
            CREATE TYPE alert_type AS ENUM ('system', 'manual');
            CREATE TYPE alert_severity AS ENUM ('critical', 'high', 'medium', 'low');
        `);

        // Create alerts table
        await queryRunner.createTable(
            new Table({
                name: "alerts",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()"
                    },
                    {
                        name: "incident_id",
                        type: "uuid",
                        isNullable: false
                    },
                    {
                        name: "type",
                        type: "alert_type",
                        isNullable: false
                    },
                    {
                        name: "severity",
                        type: "alert_severity",
                        isNullable: false
                    },
                    {
                        name: "message",
                        type: "text",
                        isNullable: false
                    },
                    {
                        name: "metadata",
                        type: "jsonb",
                        isNullable: true,
                        comment: "Additional alert data in JSON format"
                    },
                    {
                        name: "acknowledged_at",
                        type: "timestamp",
                        isNullable: true
                    },
                    {
                        name: "acknowledged_by",
                        type: "uuid",
                        isNullable: true
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    }
                ]
            }),
            true
        );

        // Add foreign key constraints
        await queryRunner.createForeignKey(
            "alerts",
            new TableForeignKey({
                columnNames: ["incident_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "incidents",
                onDelete: "CASCADE"
            })
        );

        await queryRunner.createForeignKey(
            "alerts",
            new TableForeignKey({
                columnNames: ["acknowledged_by"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "SET NULL"
            })
        );

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX idx_alerts_incident_id ON alerts(incident_id);
            CREATE INDEX idx_alerts_type ON alerts(type);
            CREATE INDEX idx_alerts_severity ON alerts(severity);
            CREATE INDEX idx_alerts_created_at ON alerts(created_at);
            CREATE INDEX idx_alerts_acknowledged_at ON alerts(acknowledged_at);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys and indexes (they will be automatically dropped with the table)
        await queryRunner.dropTable("alerts");

        // Drop enum types
        await queryRunner.query(`
            DROP TYPE IF EXISTS alert_type;
            DROP TYPE IF EXISTS alert_severity;
        `);
    }
} 