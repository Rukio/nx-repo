-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    shift_team_snapshots RENAME COLUMN num_app_providers TO num_app_members;

ALTER TABLE
    shift_team_snapshots RENAME COLUMN num_dhmt_providers TO num_dhmt_members;

COMMENT ON COLUMN shift_team_snapshots.num_app_members IS 'number of members that are APP on the shift team.';

COMMENT ON COLUMN shift_team_snapshots.num_dhmt_members IS 'number of members that are DHMT on the shift team.';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    shift_team_snapshots RENAME COLUMN num_app_members TO num_app_providers;

ALTER TABLE
    shift_team_snapshots RENAME COLUMN num_dhmt_members TO num_dhmt_providers;

COMMENT ON COLUMN shift_team_snapshots.num_app_providers IS 'number of providers that are APP on the shift team.';

COMMENT ON COLUMN shift_team_snapshots.num_dhmt_providers IS 'number of providers that are DHMT on the shift team.';

-- +goose StatementEnd
