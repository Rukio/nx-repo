-- +goose Up
-- +goose StatementBegin
CREATE TABLE providers(
    id bigserial PRIMARY KEY,
    provider_id BIGINT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    avatar_url TEXT,
    job_title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider_id)
);

COMMENT ON TABLE providers IS 'Provider`s personal information.';

COMMENT ON COLUMN providers.id IS 'The Station user ID of the provider record.';

COMMENT ON COLUMN providers.provider_id IS 'The unique ID of the provider. The value is the same with Station DB.';

COMMENT ON COLUMN providers.first_name IS 'Provider`s first name.';

COMMENT ON COLUMN providers.last_name IS 'Provider`s last name.';

COMMENT ON COLUMN providers.avatar_url IS 'Url to provider`s photo.';

COMMENT ON COLUMN providers.job_title IS 'Provider`s position.';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE providers;

-- +goose StatementEnd
