-- +goose Up
-- +goose StatementBegin
CREATE TABLE partner_configurations (
    id BIGSERIAL PRIMARY KEY,
    express_id TEXT,
    display_name TEXT NOT NULL,
    phone_number TEXT,
    is_redox_enabled BOOLEAN NOT NULL,
    is_risk_strat_bypass_enabled BOOLEAN NOT NULL,
    is_sso_enabled BOOLEAN NOT NULL,
    is_view_all_care_requests_enabled BOOLEAN NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX partner_configurations_express_id_idx ON partner_configurations(express_id);

CREATE INDEX partner_configurations_display_name_idx ON partner_configurations USING GIST(display_name gist_trgm_ops);

COMMENT ON TABLE partner_configurations IS 'Configuration settings enabling partners to create care requests';

COMMENT ON COLUMN partner_configurations.express_id IS 'Express ID for the partner';

COMMENT ON COLUMN partner_configurations.display_name IS 'display_name of partner';

COMMENT ON COLUMN partner_configurations.phone_number IS 'phone_number of partner, displayed at the call center';

COMMENT ON COLUMN partner_configurations.is_redox_enabled IS 'Flag, true if partner has a redox integration';

COMMENT ON COLUMN partner_configurations.is_risk_strat_bypass_enabled IS 'Flag, true if partner can bypass risk strat';

COMMENT ON COLUMN partner_configurations.is_sso_enabled IS 'Flag, true if partner has an sso integration';

COMMENT ON COLUMN partner_configurations.is_view_all_care_requests_enabled IS 'Flag, true if partner users can view all care requests for partner';

CREATE TABLE email_domains (
    id BIGSERIAL PRIMARY KEY,
    partner_configuration_id BIGSERIAL NOT NULL,
    domain_description TEXT NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE email_domains IS 'Email domains allowed for partner users';

CREATE INDEX email_domains_partner_configuration_idx ON email_domains(partner_configuration_id);

COMMENT ON COLUMN email_domains.domain_description IS 'valid email domain for partner users';

CREATE TABLE sso_configurations (
    id BIGSERIAL PRIMARY KEY,
    partner_configuration_id BIGSERIAL NOT NULL,
    connection_name TEXT NOT NULL,
    logout_url TEXT,
    enforce_role_presence BOOLEAN NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE sso_configurations IS 'Setttings required by configurations with sso enabled';

CREATE INDEX sso_configurations_partner_configuration_id_idx ON sso_configurations(partner_configuration_id);

COMMENT ON COLUMN sso_configurations.partner_configuration_id IS 'References a partner_configuration';

COMMENT ON COLUMN sso_configurations.connection_name IS 'The name of the connection in Auth0';

COMMENT ON COLUMN sso_configurations.logout_url IS 'URL uses to logout users, typically in partner IdP';

COMMENT ON COLUMN sso_configurations.enforce_role_presence IS 'Flag, if true, users must include role in SAML assertion';

CREATE TABLE redox_configurations (
    id BIGSERIAL PRIMARY KEY,
    partner_configuration_id BIGSERIAL NOT NULL,
    cancellation_id TEXT NOT NULL,
    clinical_summary_destination_id TEXT NOT NULL,
    is_clinical_summary_enabled BOOLEAN NOT NULL,
    destination_id TEXT NOT NULL UNIQUE,
    source_id TEXT NOT NULL UNIQUE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE sso_configurations IS 'Setttings required by configurations with redox enabled';

CREATE INDEX redox_configurations_partner_configuration_id_idx ON redox_configurations(partner_configuration_id);

COMMENT ON COLUMN redox_configurations.partner_configuration_id IS 'References a partner_configuration';

COMMENT ON COLUMN redox_configurations.cancellation_id IS 'Cancellation_id, used by partner EHR';

COMMENT ON COLUMN redox_configurations.clinical_summary_destination_id IS 'Redox clinical_summary_destination_id used for clinical summaries only';

COMMENT ON COLUMN redox_configurations.is_clinical_summary_enabled IS 'Flag, if true clinical summaries will be sent back to partner';

COMMENT ON COLUMN redox_configurations.destination_id IS 'Unique Redox Destination ID, used for results';

COMMENT ON COLUMN redox_configurations.source_id IS 'Unique Redox Source ID, links Redox messages to configurations';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS partner_configurations;

DROP TABLE IF EXISTS email_domains;

DROP TABLE IF EXISTS sso_configurations;

DROP TABLE IF EXISTS redox_configurations;

-- +goose StatementEnd
