-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    shift_team_snapshots
ADD
    COLUMN num_app_providers INTEGER NOT NULL DEFAULT 0,
ADD
    COLUMN num_dhmt_providers INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN shift_team_snapshots.num_app_providers IS 'number of providers that are APP on the shift team.';

COMMENT ON COLUMN shift_team_snapshots.num_dhmt_providers IS 'number of providers that are DHMT on the shift team.';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    shift_team_snapshots DROP COLUMN num_app_providers,
    DROP COLUMN num_dhmt_providers;

-- +goose StatementEnd
