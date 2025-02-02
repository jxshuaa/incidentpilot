import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateUsersTable1709913600000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum type for user roles
        await queryRunner.query(`
            CREATE TYPE user_role AS ENUM ('admin', 'responder', 'viewer', 'manager')
        `);

        // Create users table
        await queryRunner.createTable(
            new Table({
                name: "users",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()"
                    },
                    {
                        name: "email",
                        type: "varchar",
                        length: "255",
                        isUnique: true,
                        isNullable: false
                    },
                    {
                        name: "password_hash",
                        type: "varchar",
                        length: "255",
                        isNullable: false
                    },
                    {
                        name: "full_name",
                        type: "varchar",
                        length: "100",
                        isNullable: false
                    },
                    {
                        name: "role",
                        type: "user_role",
                        default: "'viewer'",
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

        // Create uuid-ossp extension if it doesn't exist
        await queryRunner.query(`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
        `);

        // Create index on email
        await queryRunner.query(`
            CREATE INDEX idx_users_email ON users(email)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop index
        await queryRunner.query(`
            DROP INDEX IF EXISTS idx_users_email
        `);

        // Drop table
        await queryRunner.dropTable("users");

        // Drop enum type
        await queryRunner.query(`
            DROP TYPE IF EXISTS user_role
        `);

        // Drop extension
        await queryRunner.query(`
            DROP EXTENSION IF EXISTS "uuid-ossp"
        `);
    }
} 