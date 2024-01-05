-- +goose Up
-- +goose StatementBegin
CREATE TABLE optimizer_run_types (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL);

COMMENT ON TABLE optimizer_run_types IS 'Enum of the possible optimizer run types';

COMMENT ON COLUMN optimizer_run_types.name IS 'Name of the type';

INSERT INTO
    optimizer_run_types (name)
VALUES
    ('service_region_schedule'),
    ('feasibility_check'),
    ('service_region_availability');

ALTER TABLE
    optimizer_runs
ADD
    COLUMN optimizer_run_type_id BIGINT;

COMMENT ON COLUMN optimizer_runs.optimizer_run_type_id IS 'The id of the associated run type';

UPDATE
    optimizer_runs
SET
    optimizer_run_type_id = (
        CASE
            WHEN optimizer_runs.is_feasibility_check THEN (
                SELECT
                    id
                FROM
                    optimizer_run_types
                WHERE
                    name = 'feasibility_check'
            )
            ELSE (
                SELECT
                    id
                FROM
                    optimizer_run_types
                WHERE
                    name = 'service_region_schedule'
            )
        END
    );

ALTER TABLE
    optimizer_runs
ALTER COLUMN
    optimizer_run_type_id
SET
    NOT NULL;

ALTER TABLE
    optimizer_runs DROP COLUMN is_feasibility_check;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    optimizer_runs
ADD
    COLUMN is_feasibility_check bool;

UPDATE
    optimizer_runs
SET
    is_feasibility_check = (
        CASE
            WHEN optimizer_run_type_id = (
                SELECT
                    id
                FROM
                    optimizer_run_types
                WHERE
                    name = 'feasibility_check'
            ) THEN TRUE
            ELSE FALSE
        END
    );

ALTER TABLE
    optimizer_runs DROP COLUMN optimizer_run_type_id;

DROP TABLE optimizer_run_types;

-- +goose StatementEnd
