-- +goose Up
-- +goose StatementBegin
SELECT
    setval(
        'care_phases_id_seq',
        COALESCE(
            (
                SELECT
                    MAX(id)
                FROM
                    care_phases
            ),
            1
        )
    ),
    setval(
        'service_lines_id_seq',
        COALESCE(
            (
                SELECT
                    MAX(id)
                FROM
                    service_lines
            ),
            1
        )
    ),
    setval(
        'task_types_id_seq',
        COALESCE(
            (
                SELECT
                    MAX(id)
                FROM
                    task_types
            ),
            1
        )
    );

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
-- No action on goose Down
-- +goose StatementEnd
