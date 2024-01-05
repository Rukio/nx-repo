-- +goose Up
-- +goose StatementBegin
CREATE TABLE schedule_diagnostics(
    id bigserial PRIMARY KEY,
    schedule_id BIGINT NOT NULL,
    debug_explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE schedule_diagnostics IS 'Non-critical diagnostic information for a schedule';

COMMENT ON COLUMN schedule_diagnostics.schedule_id IS 'The schedule whose diagnostics are stored';

COMMENT ON COLUMN schedule_diagnostics.debug_explanation IS 'Text explanation of constraint matches and indictments to explain the schedule';

-- there should really only be a single diagnostics record per schedule!
CREATE UNIQUE INDEX schedule_diagnostics_schedule_id_idx ON schedule_diagnostics(schedule_id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE schedule_diagnostics;

-- +goose StatementEnd
