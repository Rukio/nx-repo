-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    notes
ALTER COLUMN
    episode_id DROP NOT NULL;

CREATE TABLE service_request_notes (
    service_request_id BIGINT NOT NULL REFERENCES service_requests(id),
    note_id BIGINT NOT NULL REFERENCES notes(id)
);

CREATE INDEX service_request_notes_service_request_id_idx ON service_request_notes(service_request_id);

CREATE UNIQUE INDEX service_request_notes_note_id_idx ON service_request_notes(note_id);

COMMENT ON TABLE service_request_notes IS 'this is the list of notes that are assigned to service_requests';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
TRUNCATE TABLE service_request_notes;

DELETE FROM
    notes
WHERE
    episode_id IS NULL;

ALTER TABLE
    notes
ALTER COLUMN
    episode_id
SET
    NOT NULL;

DROP TABLE service_request_notes;

-- +goose StatementEnd
