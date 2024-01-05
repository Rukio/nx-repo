-- +goose Up
-- +goose StatementBegin
-- Data Migration needed due to a bug: https://*company-data-covered*.atlassian.net/browse/CO-1492
UPDATE
    episodes
SET
    discharged_at = NULL
WHERE
    care_phase_id IN (
        SELECT
            id
        FROM
            care_phases
        WHERE
            name IN (
                'Pending',
                'High Acuity',
                'Transition - High',
                'Active',
                'Transition - Low'
            )
    );

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
-- +goose StatementEnd
