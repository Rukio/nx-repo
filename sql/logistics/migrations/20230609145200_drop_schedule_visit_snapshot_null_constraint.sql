-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    schedule_visits
ADD
    COLUMN service_region_availability_visit_id BIGINT;

ALTER TABLE
    schedule_visits
ALTER COLUMN
    visit_snapshot_id DROP NOT NULL;

ALTER TABLE
    schedule_visits
ADD
    CONSTRAINT unique_visit_type_check CHECK (
        (
            (visit_snapshot_id IS NOT NULL) :: INTEGER + (service_region_availability_visit_id IS NOT NULL) :: INTEGER
        ) = 1
    );

COMMENT ON COLUMN schedule_visits.service_region_availability_visit_id IS 'The assigned visit to an availability schedule';

ALTER TABLE
    unassigned_schedule_visits
ADD
    COLUMN service_region_availability_visit_id BIGINT;

ALTER TABLE
    unassigned_schedule_visits
ALTER COLUMN
    visit_snapshot_id DROP NOT NULL;

ALTER TABLE
    unassigned_schedule_visits
ADD
    CONSTRAINT unassigned_schedule_visits_unique_visit_type_check CHECK (
        (
            (visit_snapshot_id IS NOT NULL) :: INTEGER + (service_region_availability_visit_id IS NOT NULL) :: INTEGER
        ) = 1
    );

COMMENT ON COLUMN unassigned_schedule_visits.service_region_availability_visit_id IS 'The unassigned visit to an availability schedule';

ALTER TABLE
    service_region_availability_visits
ADD
    COLUMN location_id BIGINT NOT NULL;

COMMENT ON COLUMN service_region_availability_visits.location_id IS 'The location associated to the visit';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    service_region_availability_visits DROP COLUMN location_id;

DELETE FROM
    schedule_visits
WHERE
    visit_snapshot_id IS NULL;

ALTER TABLE
    schedule_visits DROP COLUMN service_region_availability_visit_id;

ALTER TABLE
    schedule_visits
ALTER COLUMN
    visit_snapshot_id
SET
    NOT NULL;

DELETE FROM
    unassigned_schedule_visits
WHERE
    visit_snapshot_id IS NULL;

ALTER TABLE
    unassigned_schedule_visits DROP COLUMN service_region_availability_visit_id;

ALTER TABLE
    unassigned_schedule_visits
ALTER COLUMN
    visit_snapshot_id
SET
    NOT NULL;

-- +goose StatementEnd
