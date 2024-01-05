-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    partners
ADD
    COLUMN location_id BIGINT;

COMMENT ON COLUMN partners.location_id IS 'physical location of partner, refers to location table';

CREATE INDEX partners_location_id_idx ON partners (location_id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    partners DROP COLUMN location_id;

-- +goose StatementEnd
