-- +goose Up
-- +goose StatementBegin
CREATE TABLE calculate_modalities_logs(
    id bigserial PRIMARY KEY,
    market_id BIGINT NOT NULL,
    insurance_plan_id BIGINT NOT NULL,
    service_line_id BIGINT NOT NULL,
    business_modalities TEXT [ ],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE calculate_modalities_logs IS 'Reference table for logs from modalities calculation';

COMMENT ON COLUMN calculate_modalities_logs.market_id IS 'Id of market used in modalities calculation';

COMMENT ON COLUMN calculate_modalities_logs.insurance_plan_id IS 'Id of insurance plan used in modalities calculation';

COMMENT ON COLUMN calculate_modalities_logs.service_line_id IS 'Id of service-line used in modalities calculation';

COMMENT ON COLUMN calculate_modalities_logs.business_modalities IS 'Result of business modalities calculation';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE calculate_modalities_logs;

-- +goose StatementEnd
