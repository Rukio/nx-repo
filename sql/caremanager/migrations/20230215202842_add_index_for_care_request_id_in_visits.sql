-- +goose NO TRANSACTION
-- +goose Up
-- +goose StatementBegin
CREATE UNIQUE INDEX CONCURRENTLY visits_care_request_id_idx ON visits(care_request_id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX CONCURRENTLY visits_care_request_id_idx;

-- +goose StatementEnd
