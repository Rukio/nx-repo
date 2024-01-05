-- +goose Up
-- +goose StatementBegin
-- remove_default_and_not_null_from_deleted_at_column.sql
-- Drop the default constraint from 'deleted_at' column
ALTER TABLE
    addresses
ALTER COLUMN
    deleted_at DROP DEFAULT;

-- Alter the 'deleted_at' column to allow NULL values
ALTER TABLE
    addresses
ALTER COLUMN
    deleted_at DROP NOT NULL;

-- +goose StatementEnd
