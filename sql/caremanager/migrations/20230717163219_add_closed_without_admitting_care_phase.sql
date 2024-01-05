-- +goose Up
-- +goose StatementBegin
INSERT INTO
    care_phases(id, name)
VALUES
    (8, 'Closed Without Admitting');

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
UPDATE
    episodes
SET
    care_phase_id = (
        SELECT
            id
        FROM
            care_phases
        WHERE
            care_phases.name = 'Closed'
    )
WHERE
    care_phase_id = (
        SELECT
            id
        FROM
            care_phases
        WHERE
            care_phases.name = 'Closed Without Admitting'
    );

DELETE FROM
    care_phases
WHERE
    name = 'Closed Without Admitting';

-- +goose StatementEnd
