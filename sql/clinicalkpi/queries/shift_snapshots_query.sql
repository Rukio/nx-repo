-- name: GetLastShiftSnapshots :many
SELECT
    shift_snapshots.*,
    provider_shifts.service_date,
    provider_shifts.provider_id,
    shift_snapshot_phase_types.short_name AS phase
FROM
    shift_snapshots
    LEFT JOIN shift_snapshot_phase_types ON shift_snapshot_phase_types.id = shift_snapshots.shift_snapshot_phase_type_id
    INNER JOIN provider_shifts ON shift_snapshots.shift_team_id = provider_shifts.shift_team_id
WHERE
    provider_shifts.provider_id = sqlc.arg(provider_id)
    AND provider_shifts.service_date = (
        SELECT
            MAX(provider_shifts.service_date)
        FROM
            shift_snapshots
            INNER JOIN provider_shifts ON shift_snapshots.shift_team_id = provider_shifts.shift_team_id
        WHERE
            provider_shifts.provider_id = sqlc.arg(provider_id)
    )
ORDER BY
    shift_snapshots.start_timestamp ASC;
