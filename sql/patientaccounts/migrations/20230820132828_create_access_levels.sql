-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS access_levels(
    id bigserial PRIMARY KEY,
    short_name TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE access_levels IS 'Types of access levels';

COMMENT ON COLUMN access_levels.short_name IS 'Short name of the access level';

COMMENT ON COLUMN access_levels.description IS 'Description of the access level';

CREATE UNIQUE INDEX IF NOT EXISTS access_levels_short_name_idx ON access_levels(short_name);

COMMENT ON INDEX access_levels_short_name_idx IS 'Lookup index for access levels';

INSERT INTO
    access_levels(id, short_name, description)
VALUES
    (1, 'primary', 'Primary'),
    (2, 'phi', 'PHI'),
    (3, 'unverified', 'Unverified') ON CONFLICT DO NOTHING;

ALTER TABLE
    account_patient_links
ADD
    COLUMN access_level_id BIGINT NOT NULL,
ADD
    CONSTRAINT fk_account_patient_links_access_levels FOREIGN KEY (access_level_id) REFERENCES access_levels (id);

COMMENT ON COLUMN account_patient_links.access_level_id IS 'Access level';

ALTER TABLE
    account_patient_links DROP COLUMN access_level;

DROP TYPE access_level;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
-- Intentionally irreversible, rolling back the above actions would break application code due to reliance on SQLC generated code for enums, must be migrated forward
-- +goose StatementEnd
