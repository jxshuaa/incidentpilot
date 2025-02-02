import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateTasksTable1709913600002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum type for task status
        await queryRunner.query(`
            CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed')
        `);

        // Create tasks table
        await queryRunner.createTable(
            new Table({
                name: "tasks",
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
                        name: "status",
                        type: "task_status",
                        default: "'pending'",
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
                        name: "completed_at",
                        type: "timestamp",
                        isNullable: true
                    }
                ]
            }),
            true
        );

        // Add foreign key constraints
        await queryRunner.createForeignKey(
            "tasks",
            new TableForeignKey({
                columnNames: ["incident_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "incidents",
                onDelete: "CASCADE"
            })
        );

        await queryRunner.createForeignKey(
            "tasks",
            new TableForeignKey({
                columnNames: ["assigned_to"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "SET NULL"
            })
        );

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX idx_tasks_incident_id ON tasks(incident_id);
            CREATE INDEX idx_tasks_status ON tasks(status);
            CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys and indexes (they will be automatically dropped with the table)
        await queryRunner.dropTable("tasks");

        // Drop enum type
        await queryRunner.query(`
            DROP TYPE IF EXISTS task_status
        `);
    }
} 