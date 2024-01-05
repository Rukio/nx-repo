-- name: GetLatestVisitValue :many
SELECT
    visit_values.*
FROM
    visit_values
    INNER JOIN payers ON visit_values.payer_id = payers.id
    INNER JOIN service_lines ON visit_values.service_line_id = service_lines.id
WHERE
    payers.name = sqlc.arg(payer_name)
    AND service_lines.short_name = sqlc.arg(service_line_short_name)
    AND visit_values.created_at <= sqlc.arg(created_before)
ORDER BY
    visit_values.created_at DESC
LIMIT
    1;

-- name: AddVisitValue :one
INSERT INTO
    visit_values (service_line_id, payer_id, value_cents)
VALUES
    (
        (
            SELECT
                id
            FROM
                service_lines
            WHERE
                short_name = $1
        ),
        (
            SELECT
                id
            FROM
                payers
            WHERE
                payers.name = $2
        ),
        $3
    ) RETURNING *;

-- name: TestAddVisitValue :one
-- This query is required because we're not updating the corresponding id sequences for payers and service_lines table.
WITH new_service_line AS (
    INSERT INTO
        service_lines (id, name, short_name)
    VALUES
        (
            (
                SELECT
                    max(id) + 1
                FROM
                    service_lines
            ),
            sqlc.arg(service_line_name),
            sqlc.arg(service_line_short_name)
        ) RETURNING id
),
new_payer AS (
    INSERT INTO
        payers (id, name)
    VALUES
        (
            (
                SELECT
                    max(id) + 1
                FROM
                    payers
            ),
            sqlc.arg(payer_name)
        ) RETURNING id
)
INSERT INTO
    visit_values (service_line_id, payer_id, value_cents)
VALUES
    (
        (
            SELECT
                id
            FROM
                new_service_line
        ),
        (
            SELECT
                id
            FROM
                new_payer
        ),
        sqlc.arg(value_cents)
    ) RETURNING *;
