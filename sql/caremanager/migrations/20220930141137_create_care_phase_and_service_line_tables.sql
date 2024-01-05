-- +goose Up
-- +goose StatementBegin
CREATE TABLE care_phases (
    "id" BIGSERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT FALSE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE care_phases IS 'The catalog of care phases available';

COMMENT ON COLUMN care_phases.name IS 'The name of the Care Phase';

COMMENT ON COLUMN care_phases.is_active IS 'The state of the Care Phase, whether if it is active or not';

CREATE TABLE service_lines (
    "id" BIGSERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "short_name" TEXT,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE service_lines IS 'The catalog of service lines available';

COMMENT ON COLUMN service_lines.name IS 'The name of the Service Line';

COMMENT ON COLUMN service_lines.short_name IS 'The short version of the name of the Service Line';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE care_phases;

DROP TABLE service_lines;

-- +goose StatementEnd
