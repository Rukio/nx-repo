-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    visit_phase_snapshots
ADD
    shift_team_id BIGINT;

COMMENT ON COLUMN visit_phase_snapshots.shift_team_id IS 'the shift team id associated with the care requests status';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    visit_phase_snapshots DROP COLUMN shift_team_id;

-- +goose StatementEnd
