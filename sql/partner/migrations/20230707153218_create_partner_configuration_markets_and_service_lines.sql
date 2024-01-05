-- +goose Up
-- +goose StatementBegin
CREATE TABLE markets (
    id BIGSERIAL PRIMARY KEY,
    display_name TEXT NOT NULL,
    station_market_id BIGINT NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE markets IS 'A brief market description used when defining market specific properties';

COMMENT ON COLUMN markets.display_name IS 'Full name of the market such as Denver';

COMMENT ON COLUMN markets.station_market_id IS 'ID of market in station database';

CREATE INDEX markets_display_name_id_idx ON markets (display_name);

CREATE TABLE service_lines (
    id BIGSERIAL PRIMARY KEY,
    display_name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    genesys_email TEXT NOT NULL,
    allow_bypass_risk_stratification BOOLEAN NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE service_lines IS 'Service line defines what kind of care is delivered and partner applications have different settings for each one';

COMMENT ON COLUMN service_lines.display_name IS 'Name of service line for display such as Bridge Care';

COMMENT ON COLUMN service_lines.short_name IS 'Code such as bridge_care than can be used for inter-service communication';

COMMENT ON COLUMN service_lines.allow_bypass_risk_stratification IS 'Enabled if service line qualifies for risk stratification bypass';

CREATE TABLE partner_configuration_markets (
    id BIGSERIAL PRIMARY KEY,
    partner_configuration_id BIGINT NOT NULL,
    market_id BIGINT NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE partner_configuration_markets IS 'Markets that partner configurations and submit create care requests in';

COMMENT ON COLUMN partner_configuration_markets.partner_configuration_id IS 'Refers to a partner configuration';

COMMENT ON COLUMN partner_configuration_markets.market_id IS 'Refers to a market';

CREATE INDEX partner_configuration_markets_partner_configuration_id_idx ON partner_configuration_markets (partner_configuration_id, deleted_at);

CREATE INDEX partner_configuration_markets_market_id_idx ON partner_configuration_markets (market_id);

CREATE TABLE partner_configuration_market_service_lines (
    id BIGSERIAL PRIMARY KEY,
    partner_configuration_market_id BIGINT NOT NULL,
    service_line_id BIGINT NOT NULL,
    redox_partner_id BIGINT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE partner_configuration_market_service_lines IS 'Service lines that are available to partner configurations within a market';

COMMENT ON COLUMN partner_configuration_market_service_lines.partner_configuration_market_id IS 'Refers to partner configuration market';

COMMENT ON COLUMN partner_configuration_market_service_lines.service_line_id IS 'Refers to a service line';

COMMENT ON COLUMN partner_configuration_market_service_lines.redox_partner_id IS 'Refers to a source parter for redox orders that use this service line';

CREATE INDEX partner_configuration_market_service_lines_partner_configuration_market_id_idx ON partner_configuration_market_service_lines (partner_configuration_market_id, deleted_at);

CREATE INDEX partner_configuration_market_service_lines_service_line_id_idx ON partner_configuration_market_service_lines (service_line_id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS markets;

DROP TABLE IF EXISTS service_lines;

DROP TABLE IF EXISTS partner_configuration_markets;

DROP TABLE IF EXISTS partner_configuration_market_service_lines;

-- +goose StatementEnd
