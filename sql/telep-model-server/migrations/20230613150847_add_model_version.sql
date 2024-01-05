-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    ml_predictions
ADD
    COLUMN model_version TEXT;

COMMENT ON COLUMN ml_predictions.model_version IS 'Hybrid model version';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    ml_predictions DROP COLUMN model_version;

-- +goose StatementEnd
