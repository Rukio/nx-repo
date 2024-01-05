-- +goose Up
-- +goose StatementBegin
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE symptoms (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (name)
);

CREATE INDEX symptoms_uuid_idx ON symptoms(id);

COMMENT ON TABLE symptoms IS 'Canonical set of symptom names';

COMMENT ON COLUMN symptoms.name IS 'The name of the symptom';

CREATE TABLE symptom_aliases (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    symptom_id UUID NOT NULL REFERENCES symptoms(id),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (name)
);

CREATE INDEX symptom_aliases_uuid_idx ON symptom_aliases(id);

COMMENT ON TABLE symptom_aliases IS 'Alternative aliased names of canonical symptoms';

COMMENT ON COLUMN symptom_aliases.name IS 'The name of the symptom alias';

CREATE INDEX symptoms_name_idx ON symptoms USING gin (name gin_trgm_ops);

CREATE INDEX symptom_aliases_name_idx ON symptom_aliases USING gin (name gin_trgm_ops);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE symptom_aliases;

DROP TABLE symptoms;

-- +goose StatementEnd
