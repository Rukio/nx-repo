-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    visits
ADD
    COLUMN car_id BIGINT,
ADD
    COLUMN virtual_app_id BIGINT;

COMMENT ON COLUMN visits.car_id IS 'The id of the car assigned to the visit';

COMMENT ON COLUMN visits.virtual_app_id IS 'The user id of the virtual app assigned to the visit';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    visits DROP COLUMN car_id,
    DROP COLUMN virtual_app_id;

-- +goose StatementEnd
