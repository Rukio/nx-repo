-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    episodes
ADD
    "original_care_request_id" BIGINT UNIQUE;

COMMENT ON COLUMN episodes.original_care_request_id IS 'The original Care Request id the episode was created from';

CREATE UNIQUE INDEX "episodes_original_care_request_id_idx" ON episodes(original_care_request_id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX episodes_original_care_request_id_idx;

ALTER TABLE
    episodes DROP COLUMN "original_care_request_id";

-- +goose StatementEnd
