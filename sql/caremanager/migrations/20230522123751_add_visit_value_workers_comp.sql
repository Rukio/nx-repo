-- +goose Up
-- +goose StatementBegin
WITH visit_value_mappings AS (
    SELECT
        service_line_name,
        payer_name,
        value_cents
    FROM
        (
            VALUES
                ('Acute', 'Worker''s Comp', 10000)
        ) AS t (service_line_name, payer_name, value_cents)
)
INSERT INTO
    visit_values(service_line_id, payer_id, value_cents)
SELECT
    service_lines.id,
    payers.id,
    visit_value_mappings.value_cents
FROM
    visit_value_mappings
    INNER JOIN payers ON visit_value_mappings.payer_name = payers.name
    INNER JOIN service_lines ON visit_value_mappings.service_line_name = service_lines.short_name;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
WITH visit_value_max AS (
    SELECT
        max(visit_values.id) id
    FROM
        visit_values
        INNER JOIN payers ON payers.id = visit_values.payer_id
        INNER JOIN service_lines ON service_lines.id = visit_values.service_line_id
    WHERE
        payers.name = 'Worker''s Comp'
        AND service_lines.short_name = 'Acute'
)
DELETE FROM
    visit_values
WHERE
    id = (
        SELECT
            id
        FROM
            visit_value_max
    );

-- +goose StatementEnd
