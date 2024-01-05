-- +goose Up
-- +goose StatementBegin
CREATE TABLE payers(
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE payers IS 'Names for types of payers';

COMMENT ON COLUMN payers.name IS 'Name for payer type';

CREATE INDEX payer_name_idx ON payers(name);

CREATE TABLE visit_values(
    id BIGSERIAL PRIMARY KEY,
    service_line_id BIGINT NOT NULL,
    payer_id BIGINT NOT NULL,
    value_cents BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_line_id) REFERENCES service_lines (id),
    FOREIGN KEY (payer_id) REFERENCES payers (id)
);

COMMENT ON TABLE visit_values IS 'Visit value associated with varying types of service lines and payers';

COMMENT ON COLUMN visit_values.service_line_id IS 'Service line associated with visit value';

COMMENT ON COLUMN visit_values.payer_id IS 'Payer associated with visit value';

COMMENT ON COLUMN visit_values.value_cents IS 'Value in cents associated with service line and payer';

CREATE INDEX visit_value_service_line_payer_idx ON visit_values(service_line_id, payer_id, created_at);

INSERT INTO
    service_lines(id, name, short_name)
VALUES
    (7, 'Wellness', 'Wellness'),
    (8, 'ED Education', 'ED Education');

CREATE INDEX service_line_short_name_idx ON service_lines(short_name);

INSERT INTO
    payers(id, name)
VALUES
    (1, 'Patient Self Pay'),
    (2, 'Corporate Billing'),
    (3, 'Commercial'),
    (4, 'Medicare Advantage'),
    (5, 'Worker''s Comp'),
    (6, 'Managed Medicaid'),
    (7, 'Medicare'),
    (8, 'Medicaid'),
    (9, 'Tri-Care');

WITH visit_value_mappings AS (
    SELECT
        service_line_name,
        payer_name,
        value_cents
    FROM
        (
            VALUES
                ('Acute', 'Patient Self Pay', 10000),
                ('Acute', 'Corporate Billing', 25200),
                ('Acute', 'Commercial', 25000),
                ('Acute', 'Medicare Advantage', 24400),
                ('Acute', 'Worker''s Comp', 24000),
                ('Acute', 'Managed Medicaid', 20000),
                ('Acute', 'Medicare', 10000),
                ('Acute', 'Medicaid', 10000),
                ('Acute', 'Tri-Care', 10000),
                ('Bridge', 'Patient Self Pay', 10000),
                ('Bridge', 'Corporate Billing', 25200),
                ('Bridge', 'Commercial', 25000),
                ('Bridge', 'Medicare Advantage', 24400),
                ('Bridge', 'Worker''s Comp', 24000),
                ('Bridge', 'Managed Medicaid', 20000),
                ('Bridge', 'Medicare', 10000),
                ('Bridge', 'Medicaid', 10000),
                ('Bridge', 'Tri-Care', 10000),
                ('Wellness', 'Patient Self Pay', 35000),
                ('Wellness', 'Corporate Billing', 35000),
                ('Wellness', 'Commercial', 35000),
                ('Wellness', 'Medicare Advantage', 35000),
                ('Wellness', 'Worker''s Comp', 35000),
                ('Wellness', 'Managed Medicaid', 35000),
                ('Wellness', 'Medicare', 35000),
                ('Wellness', 'Medicaid', 35000),
                ('Wellness', 'Tri-Care', 35000),
                ('ED Education', 'Patient Self Pay', 20000),
                ('ED Education', 'Corporate Billing', 20000),
                ('ED Education', 'Commercial', 20000),
                ('ED Education', 'Medicare Advantage', 20000),
                ('ED Education', 'Worker''s Comp', 20000),
                ('ED Education', 'Managed Medicaid', 20000),
                ('ED Education', 'Medicare', 20000),
                ('ED Education', 'Medicaid', 20000),
                ('ED Education', 'Tri-Care', 20000),
                ('Advanced Care', 'Patient Self Pay', 867400),
                ('Advanced Care', 'Corporate Billing', 867400),
                ('Advanced Care', 'Commercial', 867400),
                ('Advanced Care', 'Medicare Advantage', 867400),
                ('Advanced Care', 'Worker''s Comp', 867400),
                ('Advanced Care', 'Managed Medicaid', 867400),
                ('Advanced Care', 'Medicare', 867400),
                ('Advanced Care', 'Medicaid', 867400),
                ('Advanced Care', 'Tri-Care', 867400)
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
DROP TABLE visit_values;

DROP TABLE payers;

DELETE FROM
    service_lines
WHERE
    id IN (7, 8);

-- +goose StatementEnd
