-- +goose Up
-- +goose StatementBegin
CREATE TABLE visit_value_snapshots(
    id BIGSERIAL PRIMARY KEY,
    visit_snapshot_id BIGINT NOT NULL,
    completion_value_cents BIGINT,
    partner_priority_score BIGINT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE visit_value_snapshots IS 'Computed values for a given visit snapshot based on potential revenue and partner priority';

COMMENT ON COLUMN public.visit_value_snapshots.visit_snapshot_id IS 'The visit snapshot the value data belongs to';

COMMENT ON COLUMN visit_value_snapshots.completion_value_cents IS 'Number of 1/100 points for completing the care request';

COMMENT ON COLUMN visit_value_snapshots.partner_priority_score IS 'Score given to prioritize a partner visit';

CREATE UNIQUE INDEX visit_value_snapshots_visit_snapshot_id_idx ON visit_value_snapshots(visit_snapshot_id);

CREATE INDEX visit_value_snapshots_created_at_idx ON visit_value_snapshots(created_at DESC);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE visit_value_snapshots;

-- +goose StatementEnd
