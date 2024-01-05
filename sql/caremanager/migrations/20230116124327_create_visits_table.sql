-- +goose Up
-- +goose StatementBegin
CREATE TABLE visit_types (id BIGSERIAL PRIMARY KEY, slug TEXT NOT NULL);

COMMENT ON TABLE visit_types IS 'CareManager Visit Types Table';

COMMENT ON COLUMN visit_types.slug IS 'The slug of the visit type';

CREATE TABLE visits (
    id BIGSERIAL PRIMARY KEY,
    care_request_id BIGINT,
    episode_id BIGINT NOT NULL REFERENCES episodes(id),
    summary TEXT,
    summary_updated_at TIMESTAMP WITHOUT TIME ZONE,
    summary_updated_by_user_id BIGINT,
    visit_type_id BIGINT REFERENCES visit_types(id),
    updated_by_user_id BIGINT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE visits IS 'CareManager Visits Table, analogous to Station care_requests table';

COMMENT ON COLUMN visits.care_request_id IS 'Reference to the id of the care_requests record in Station that the visit originates from';

COMMENT ON COLUMN visits.episode_id IS 'The id of the episode that the visit belongs to';

COMMENT ON COLUMN visits.summary IS 'General summary of the visit';

COMMENT ON COLUMN visits.summary_updated_at IS 'Point in time when the summary was updated';

COMMENT ON COLUMN visits.summary_updated_by_user_id IS 'The id of the user who updated the summary';

COMMENT ON COLUMN visits.visit_type_id IS 'The id of the visit type this visit belongs to';

COMMENT ON COLUMN visits.updated_by_user_id IS 'The id of the user who last updated the visit';

COMMENT ON COLUMN visits.created_at IS 'Point in time where the visit was created';

COMMENT ON COLUMN visits.updated_at IS 'Point in time where the visit was last updated';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE visits;

DROP TABLE visit_types;

-- +goose StatementEnd
