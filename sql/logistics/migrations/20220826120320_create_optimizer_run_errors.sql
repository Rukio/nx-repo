-- +goose Up
-- +goose StatementBegin
CREATE TABLE optimizer_run_errors (
    id bigserial PRIMARY KEY,
    optimizer_run_id BIGINT NOT NULL,
    error_value TEXT NOT NULL,
    optimizer_run_error_source_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE optimizer_run_errors IS 'Sources of errors for optimizer runs';

COMMENT ON COLUMN optimizer_run_errors.optimizer_run_id IS 'The optimizer run for the error';

COMMENT ON COLUMN optimizer_run_errors.error_value IS 'The string error value';

COMMENT ON COLUMN optimizer_run_errors.optimizer_run_error_source_id IS 'Identifier for the source of the error';

CREATE INDEX optimizer_run_error_optimizer_run_idx ON optimizer_run_errors(optimizer_run_id, created_at DESC);

CREATE TABLE optimizer_run_error_sources (
    id bigserial PRIMARY KEY,
    short_name TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE optimizer_run_error_sources IS 'Sources of errors for optimizer runs';

COMMENT ON COLUMN optimizer_run_error_sources.short_name IS 'Short name of the optimizer run error source';

COMMENT ON COLUMN optimizer_run_error_sources.description IS 'Description of the optimizer run source type';

CREATE UNIQUE INDEX optimizer_run_error_sources_short_name_idx ON optimizer_run_error_sources(short_name);

INSERT INTO
    optimizer_run_error_sources(id, short_name, description)
VALUES
    (1, 'logistics', 'Logistics'),
    (2, 'optimizer', 'Optimizer');

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE optimizer_run_error_sources;

DROP TABLE optimizer_run_errors;

-- +goose StatementEnd
