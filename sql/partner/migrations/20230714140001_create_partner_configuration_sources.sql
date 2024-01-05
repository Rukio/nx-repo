-- +goose Up
-- +goose StatementBegin
CREATE TABLE callback_options (
    id BIGSERIAL PRIMARY KEY,
    slug TEXT NOT NULL,
    display_name TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE callback_options IS 'callback options define who to call during onboarding';

COMMENT ON COLUMN callback_options.slug IS 'unique string describing callback option';

COMMENT ON COLUMN callback_options.display_name IS 'string describing callback option display name';

CREATE UNIQUE INDEX callback_options_slug_idx ON callback_options (slug);

INSERT INTO
    callback_options(slug, display_name)
VALUES
    ('source', 'Source Callback Number'),
    ('requester', 'Requester'),
    ('patient', 'Patient');

CREATE TABLE partner_configuration_sources (
    id BIGSERIAL PRIMARY KEY,
    partner_id BIGINT NOT NULL,
    partner_configuration_id BIGINT NOT NULL,
    callback_number_country_code INT,
    callback_number TEXT NOT NULL,
    callback_number_extension TEXT,
    address_line_one TEXT,
    address_line_two TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    default_callback_option_id BIGINT NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE partner_configuration_sources IS 'a source describes the entity responsible for creating the care request';

COMMENT ON COLUMN partner_configuration_sources.partner_id IS 'refers to a partner that is the source';

COMMENT ON COLUMN partner_configuration_sources.partner_configuration_id IS 'partner configuration that permits partner as a source';

COMMENT ON COLUMN partner_configuration_sources.callback_number_country_code IS 'callback number country code for this source';

COMMENT ON COLUMN partner_configuration_sources.callback_number IS 'callback number for this source';

COMMENT ON COLUMN partner_configuration_sources.callback_number_extension IS 'callback number extension for this source';

COMMENT ON COLUMN partner_configuration_sources.address_line_one IS 'default address line one for care requests from this source';

COMMENT ON COLUMN partner_configuration_sources.address_line_two IS 'default address line two for care requests from this source';

COMMENT ON COLUMN partner_configuration_sources.city IS 'default city for care requests from this source';

COMMENT ON COLUMN partner_configuration_sources.state IS 'default state for care requests from this source';

COMMENT ON COLUMN partner_configuration_sources.zip_code IS 'default zip code for care requests from this source';

COMMENT ON COLUMN partner_configuration_sources.default_callback_option_id IS 'the default callback option for this source';

CREATE UNIQUE INDEX partner_configuration_sources_partner_id_configuration_id_idx ON partner_configuration_sources (partner_id, partner_configuration_id);

CREATE INDEX partner_configuration_sources_partner_configuration_id_idx ON partner_configuration_sources (partner_configuration_id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS partner_configuration_sources;

DROP TABLE IF EXISTS callback_options;

-- +goose StatementEnd
