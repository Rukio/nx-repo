-- +goose Up
-- +goose StatementBegin
CREATE TABLE provider_shifts(
    id bigserial PRIMARY KEY,
    shift_team_id BIGINT NOT NULL,
    provider_id BIGINT NOT NULL,
    service_date DATE NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    patients_seen INTEGER,
    out_the_door_duration_seconds INTEGER,
    en_route_duration_seconds INTEGER,
    on_scene_duration_seconds INTEGER,
    on_break_duration_seconds INTEGER,
    idle_duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shift_team_id, provider_id)
);

COMMENT ON TABLE provider_shifts IS 'Provider`s shifts across all markets for the latest 80 days.';

COMMENT ON COLUMN provider_shifts.id IS 'The unique ID of the provider shifts record.';

COMMENT ON COLUMN provider_shifts.shift_team_id IS 'The unique ID of the shift team in Station DB.';

COMMENT ON COLUMN provider_shifts.provider_id IS 'The ID of the provider in Station DB.';

COMMENT ON COLUMN provider_shifts.service_date IS 'The date of the shift.';

COMMENT ON COLUMN provider_shifts.start_time IS 'Start time of the shift.';

COMMENT ON COLUMN provider_shifts.end_time IS 'End time of the shift.';

COMMENT ON COLUMN provider_shifts.patients_seen IS 'Amount of patients that were seen on shift.';

COMMENT ON COLUMN provider_shifts.out_the_door_duration_seconds IS 'Time duration when provider was out the door.';

COMMENT ON COLUMN provider_shifts.en_route_duration_seconds IS 'Time duration when provider was on route.';

COMMENT ON COLUMN provider_shifts.on_scene_duration_seconds IS 'Time duration when provider was on scene.';

COMMENT ON COLUMN provider_shifts.on_break_duration_seconds IS 'Time duration when provider was on break.';

COMMENT ON COLUMN provider_shifts.idle_duration_seconds IS 'Time duration of idle time.';

CREATE INDEX provider_shifts_provider_id_service_date_idx ON provider_shifts(provider_id, service_date);

COMMENT ON INDEX provider_shifts_provider_id_service_date_idx IS 'Index of leader hub provider IDs and shifts dates.';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS provider_shifts;

-- +goose StatementEnd
