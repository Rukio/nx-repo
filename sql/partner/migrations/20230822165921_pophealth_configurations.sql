-- +goose Up
-- +goose StatementBegin
CREATE TABLE pophealth_configurations (
    id BIGSERIAL PRIMARY KEY,
    partner_configuration_id BIGINT NOT NULL,
    partner_id BIGINT NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pophealth_configurations IS 'Pophealth partners with patients searchable by partner configuration';

COMMENT ON COLUMN pophealth_configurations.partner_configuration_id IS 'Refers to a partner configuration';

COMMENT ON COLUMN pophealth_configurations.partner_id IS 'Refers to a partner';

CREATE INDEX pophealth_configurations_partner_configuration_idx ON pophealth_configurations(partner_configuration_id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE pophealth_configurations;

-- +goose StatementEnd
