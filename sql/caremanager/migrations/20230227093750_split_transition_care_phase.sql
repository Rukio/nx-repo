-- +goose Up
-- +goose StatementBegin
INSERT INTO
    care_phases ("id", "name", "is_active")
VALUES
    (7, 'Transition - Low', TRUE);

UPDATE
    care_phases
SET
    name = 'Transition - High'
WHERE
    name = 'Transition';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
UPDATE
    care_phases
SET
    name = 'Transition'
WHERE
    name = 'Transition - High';

DELETE FROM
    care_phases
WHERE
    name = 'Transition - Low';

-- +goose StatementEnd
