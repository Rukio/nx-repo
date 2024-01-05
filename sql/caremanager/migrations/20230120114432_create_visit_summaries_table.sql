-- +goose Up
-- +goose StatementBegin
CREATE TABLE visit_summaries (
    visit_id BIGINT PRIMARY KEY REFERENCES visits(id),
    body TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id BIGINT,
    updated_by_user_id BIGINT
);

COMMENT ON COLUMN visit_summaries.visit_id IS 'The id of the visit the summary belongs to';

COMMENT ON COLUMN visit_summaries.body IS 'Text body of of the visit summary';

COMMENT ON COLUMN visit_summaries.created_at IS 'Point in time when the visit summary was created';

COMMENT ON COLUMN visit_summaries.updated_at IS 'Point in time when the visit summary was updated';

COMMENT ON COLUMN visit_summaries.created_by_user_id IS 'The id of the user who created the visit summary';

COMMENT ON COLUMN visit_summaries.updated_by_user_id IS 'The id of the user who updated the visit summary';

INSERT INTO
    visit_summaries
SELECT
    id,
    summary,
    summary_updated_at,
    summary_updated_at,
    summary_updated_by_user_id,
    summary_updated_by_user_id
FROM
    visits
WHERE
    summary IS NOT NULL;

ALTER TABLE
    visits DROP COLUMN summary,
    DROP COLUMN summary_updated_at,
    DROP COLUMN summary_updated_by_user_id;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    visits
ADD
    COLUMN summary TEXT,
ADD
    COLUMN summary_updated_at TIMESTAMP WITHOUT TIME ZONE,
ADD
    COLUMN summary_updated_by_user_id BIGINT;

COMMENT ON COLUMN visits.summary IS 'General summary of the visit';

COMMENT ON COLUMN visits.summary_updated_at IS 'Point in time when the summary was updated';

COMMENT ON COLUMN visits.summary_updated_by_user_id IS 'The id of the user who updated the summary';

UPDATE
    visits
SET
    summary = summaries.body,
    summary_updated_at = summaries.updated_at,
    summary_updated_by_user_id = summaries.updated_by_user_id
FROM
    (
        SELECT
            visit_id,
            body,
            updated_at,
            updated_by_user_id
        FROM
            visit_summaries
    ) AS summaries
WHERE
    visits.id = summaries.visit_id;

DROP TABLE visit_summaries;

-- +goose StatementEnd
