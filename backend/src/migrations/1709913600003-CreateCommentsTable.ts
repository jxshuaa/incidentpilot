import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateCommentsTable1709913600003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create comments table
        await queryRunner.createTable(
            new Table({
                name: "comments",
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
                        isNullable: true
                    },
                    {
                        name: "task_id",
                        type: "uuid",
                        isNullable: true
                    },
                    {
                        name: "user_id",
                        type: "uuid",
                        isNullable: false
                    },
                    {
                        name: "content",
                        type: "text",
                        isNullable: false
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
                    }
                ]
            }),
            true
        );

        // Add check constraint to ensure either incident_id or task_id is not null
        await queryRunner.query(`
            ALTER TABLE comments
            ADD CONSTRAINT "check_comment_target"
            CHECK (
                (incident_id IS NOT NULL AND task_id IS NULL) OR
                (incident_id IS NULL AND task_id IS NOT NULL)
            )
        `);

        // Add foreign key constraints
        await queryRunner.createForeignKey(
            "comments",
            new TableForeignKey({
                columnNames: ["incident_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "incidents",
                onDelete: "CASCADE"
            })
        );

        await queryRunner.createForeignKey(
            "comments",
            new TableForeignKey({
                columnNames: ["task_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "tasks",
                onDelete: "CASCADE"
            })
        );

        await queryRunner.createForeignKey(
            "comments",
            new TableForeignKey({
                columnNames: ["user_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE"
            })
        );

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX idx_comments_incident_id ON comments(incident_id);
            CREATE INDEX idx_comments_task_id ON comments(task_id);
            CREATE INDEX idx_comments_user_id ON comments(user_id);
            CREATE INDEX idx_comments_created_at ON comments(created_at);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys, indexes, and constraints (they will be automatically dropped with the table)
        await queryRunner.dropTable("comments");
    }
} 