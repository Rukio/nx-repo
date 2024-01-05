-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    provider_shift_snapshots
ALTER COLUMN
    start_time TYPE TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE
    provider_shift_snapshots
ALTER COLUMN
    end_time TYPE TIMESTAMP WITHOUT TIME ZONE;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    provider_shift_snapshots
ALTER COLUMN
    start_time TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE
    provider_shift_snapshots
ALTER COLUMN
    end_time TYPE TIMESTAMP WITH TIME ZONE;

-- +goose StatementEnd
