-- +goose Up
-- +goose StatementBegin
CREATE TABLE notes (
    id BIGSERIAL PRIMARY KEY,
    body TEXT NOT NULL,
    kind SMALLINT NOT NULL DEFAULT 0,
    episode_id BIGINT NOT NULL REFERENCES episodes(id),
    created_by_user_id BIGINT,
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITHOUT TIME ZONE
);

COMMENT ON TABLE notes IS 'CareManager Notes Table';

COMMENT ON COLUMN notes.body IS 'Main text of the note';

COMMENT ON COLUMN notes.kind IS 'Note kind';

COMMENT ON COLUMN notes.episode_id IS 'Reference to the episode to which the note belongs to';

COMMENT ON COLUMN notes.created_by_user_id IS 'Reference to the user who created the note';

COMMENT ON COLUMN notes.pinned IS 'Pinned state of the note';

COMMENT ON COLUMN notes.created_at IS 'Point in time when the note was created';

COMMENT ON COLUMN notes.updated_at IS 'Point in time when the note was updated';

COMMENT ON COLUMN notes.deleted_at IS 'Point in time when the note was deleted';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE notes;

-- +goose StatementEnd
