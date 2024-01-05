-- +goose Up
-- +goose StatementBegin
UPDATE
    shift_snapshot_phase_types
SET
    short_name = map.new_short_name,
    description = map.description
FROM
    (
        VALUES
            ('on_route', 'en_route', 'En Route'),
            ('break', 'on_break', 'On Break')
    ) AS map(short_name, new_short_name, description)
WHERE
    shift_snapshot_phase_types.short_name = map.short_name;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
UPDATE
    shift_snapshot_phase_types
SET
    short_name = map.new_short_name,
    description = map.description
FROM
    (
        VALUES
            ('en_route', 'on_route', 'En Route'),
            ('on_break', 'break', 'Break')
    ) AS map(short_name, new_short_name, description)
WHERE
    shift_snapshot_phase_types.short_name = map.short_name;

-- +goose StatementEnd
