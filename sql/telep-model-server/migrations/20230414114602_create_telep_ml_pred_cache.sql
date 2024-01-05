-- +goose Up
-- +goose StatementBegin
CREATE TABLE ml_predictions (
    id BIGSERIAL PRIMARY KEY,
    care_request_id BIGINT NOT NULL,
    feature_hash BYTEA UNIQUE NOT NULL,
    prediction BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_queried_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ml_predictions IS 'Table to store prediction value from telep_model_server';

COMMENT ON COLUMN ml_predictions.id IS 'Auto-incrementing ID';

COMMENT ON COLUMN ml_predictions.care_request_id IS 'ID of care request';

COMMENT ON COLUMN ml_predictions.feature_hash IS 'SHA256 of the input features (including care_request_id)';

COMMENT ON COLUMN ml_predictions.prediction IS 'Final Tele-p model prediction';

COMMENT ON COLUMN ml_predictions.created_at IS 'Timestamp that prediction for this feature hash was created';

COMMENT ON COLUMN ml_predictions.last_queried_at IS 'Timestamp that this cached record was last queried';

CREATE UNIQUE INDEX ml_predictions_feature_hash_idx ON ml_predictions USING btree (feature_hash);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE ml_predictions;

-- +goose StatementEnd
