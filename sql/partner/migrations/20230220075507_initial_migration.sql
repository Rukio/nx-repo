-- +goose Up
-- +goose StatementBegin
CREATE EXTENSION pg_trgm;

CREATE EXTENSION btree_gist;

CREATE TABLE partner_categories (
    id BIGSERIAL PRIMARY KEY,
    display_name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN partner_categories.display_name IS 'descriptive name for a category that can be used in a UI';

COMMENT ON COLUMN partner_categories.short_name IS 'unique string identifying category';

CREATE UNIQUE INDEX partner_categories_short_name_idx ON partner_categories (short_name);

INSERT INTO
    partner_categories(display_name, short_name)
VALUES
    ('Employer', 'employer'),
    ('Health System', 'health_system'),
    ('Home Health', 'home_health'),
    (
        'Hospice and Palliative Care',
        'hospice_and_palliative_care'
    ),
    ('Injury Finance', 'injury_finance'),
    ('Payer', 'payer'),
    ('Provider Group', 'provider_group'),
    ('Senior Care', 'senior_care'),
    ('Skilled Nursing Facility', 'snf'),
    ('Unspecified', 'unspecified');

CREATE TABLE partners (
    id BIGSERIAL PRIMARY KEY,
    station_channel_item_id BIGINT NOT NULL,
    station_channel_id BIGINT,
    display_name TEXT NOT NULL,
    partner_category_id BIGINT NOT NULL,
    phone_country_code INT,
    phone_number TEXT,
    phone_extension TEXT,
    email TEXT,
    address_line_one TEXT,
    address_line_two TEXT,
    city TEXT,
    state_code TEXT,
    zipcode TEXT,
    latitude_e6 INT,
    longitude_e6 INT,
    deactivated_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN partners.display_name IS 'display_name of partner';

COMMENT ON COLUMN partners.partner_category_id IS 'category is used to organize partners and implement category specific business logic';

COMMENT ON COLUMN partners.phone_country_code IS 'partner phone number country code';

COMMENT ON COLUMN partners.phone_number IS 'partner phone number without country code and extension';

COMMENT ON COLUMN partners.phone_extension IS 'partner phone number optional extension';

COMMENT ON COLUMN partners.email IS 'partner contact email';

COMMENT ON COLUMN partners.address_line_one IS 'partner physical address, address_line_one';

COMMENT ON COLUMN partners.address_line_two IS 'partner physical address, address_line_two';

COMMENT ON COLUMN partners.city IS 'partner physical address, city';

COMMENT ON COLUMN partners.state_code IS 'partner physical address, state';

COMMENT ON COLUMN partners.zipcode IS 'partner physical address, zipcode';

COMMENT ON COLUMN partners.latitude_e6 IS 'partner location, latitude_e6';

COMMENT ON COLUMN partners.longitude_e6 IS 'partner location, longitude_e6';

COMMENT ON COLUMN partners.deactivated_at IS 'deactivated partners are not visible in name searches and will not be used for partner attribution';

CREATE UNIQUE INDEX partners_channel_item_idx ON partners(station_channel_item_id);

CREATE INDEX partners_deactivated_at_idx ON partners(deactivated_at);

CREATE INDEX partners_location_idx ON partners(latitude_e6, longitude_e6);

CREATE INDEX partners_display_name_idx ON partners USING GIST(display_name gist_trgm_ops);

CREATE INDEX partners_updated_at_idx ON partners(updated_at);

CREATE INDEX partners_created_at_idx ON partners(created_at);

CREATE TABLE care_request_partner_origins (
    id BIGSERIAL PRIMARY KEY,
    slug TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE care_request_partner_origins IS 'origin of a partner care request association';

COMMENT ON COLUMN care_request_partner_origins.slug IS 'unique string describing origin';

CREATE UNIQUE INDEX care_request_partner_origins_slug_idx ON care_request_partner_origins (slug);

INSERT INTO
    care_request_partner_origins(slug)
VALUES
    ('insurance'),
    ('location'),
    ('pop_health'),
    ('provider_network'),
    ('source');

CREATE TABLE care_request_partners (
    id BIGSERIAL PRIMARY KEY,
    station_care_request_id BIGINT NOT NULL,
    partner_id BIGINT NOT NULL,
    care_request_partner_origin_id BIGINT NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE care_request_partners IS 'partners associated with a care request';

COMMENT ON COLUMN care_request_partners.station_care_request_id IS 'refers to a station care request';

COMMENT ON COLUMN care_request_partners.partner_id IS 'refers to a partner';

COMMENT ON COLUMN care_request_partners.care_request_partner_origin_id IS 'refers to an care_request_partner_origin';

CREATE INDEX care_request_partners_station_care_request_id_idx ON care_request_partners (station_care_request_id);

CREATE INDEX care_request_partners_updated_at_idx ON care_request_partners (updated_at);

CREATE INDEX care_request_partners_created_at_idx ON care_request_partners (created_at);

CREATE TABLE partner_insurance_packages (
    id BIGSERIAL PRIMARY KEY,
    package_id BIGINT NOT NULL,
    partner_id BIGINT NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE partner_insurance_packages IS 'insurance packages associated with a partner';

COMMENT ON COLUMN partner_insurance_packages.package_id IS 'refers to a insurance package identifier';

COMMENT ON COLUMN partner_insurance_packages.partner_id IS 'refers to a partner';

CREATE INDEX partner_insurance_packages_partner_id_idx ON partner_insurance_packages(partner_id);

CREATE INDEX partner_insurance_packages_package_id_idx ON partner_insurance_packages(package_id);

CREATE UNIQUE INDEX partner_insurance_packages_partner_id_package_id_idx ON partner_insurance_packages(partner_id, package_id, deleted_at);

CREATE INDEX partner_insurance_packages_updated_at_idx ON partner_insurance_packages(updated_at);

CREATE INDEX partner_insurance_packages_created_at_idx ON partner_insurance_packages(created_at);

CREATE TABLE care_request_partner_backfill_types (
    id BIGSERIAL PRIMARY KEY,
    slug TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE care_request_partner_backfill_types IS 'type of a partner care request backfill';

COMMENT ON COLUMN care_request_partner_backfill_types.slug IS 'unique string describing backfill type';

CREATE UNIQUE INDEX care_request_partner_backfill_types_slug_idx ON care_request_partner_backfill_types (slug);

INSERT INTO
    care_request_partner_backfill_types(slug)
VALUES
    ('pophealth'),
    ('provider_network');

CREATE TABLE care_request_partner_backfills (
    id BIGSERIAL PRIMARY KEY,
    partner_id BIGINT NOT NULL,
    backfill_type_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    last_processed_care_request_created_at TIMESTAMP WITH TIME ZONE,
    number_of_matches INT NOT NULL DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE care_request_partner_backfills IS 'backfills initiated to create care request partner associations';

COMMENT ON COLUMN care_request_partner_backfills.partner_id IS 'refers to a partner';

COMMENT ON COLUMN care_request_partner_backfills.backfill_type_id IS 'refers to a backfill type';

COMMENT ON COLUMN care_request_partner_backfills.start_date IS 'backfill start date';

COMMENT ON COLUMN care_request_partner_backfills.end_date IS 'backfill end date';

COMMENT ON COLUMN care_request_partner_backfills.last_processed_care_request_created_at IS 'created at timestamp of the last care request processed by backill';

COMMENT ON COLUMN care_request_partner_backfills.number_of_matches IS 'number of care request partner associations created by backfill';

COMMENT ON COLUMN care_request_partner_backfills.completed_at IS 'backfill completion timestamp';

CREATE INDEX care_request_partner_backfills_partner_id_idx ON care_request_partner_backfills (partner_id);

CREATE INDEX care_request_partner_backfills_updated_at_idx ON care_request_partner_backfills (updated_at);

CREATE INDEX care_request_partner_backfills_created_at_idx ON care_request_partner_backfills (created_at);

CREATE TABLE partner_clinical_providers (
    id BIGSERIAL PRIMARY KEY,
    partner_id BIGINT NOT NULL,
    athena_clinical_provider_id BIGINT NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE partner_clinical_providers IS 'clinical providers associated with a partner';

COMMENT ON COLUMN partner_clinical_providers.partner_id IS 'refers to a partner';

COMMENT ON COLUMN partner_clinical_providers.athena_clinical_provider_id IS 'refers to a clinical provider from athena';

CREATE INDEX partner_clinical_providers_partner_id_idx ON partner_clinical_providers(partner_id);

CREATE UNIQUE INDEX partner_clinical_providers_partner_id_provider_id_idx ON partner_clinical_providers(partner_id, athena_clinical_provider_id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS partners;

DROP TABLE IF EXISTS partner_categories;

DROP TABLE IF EXISTS care_request_partners;

DROP TABLE IF EXISTS care_request_partner_origins;

DROP TABLE IF EXISTS partner_insurance_packages;

DROP TABLE IF EXISTS care_request_partner_backfill_types;

DROP TABLE IF EXISTS care_request_partner_backfills;

DROP TABLE IF EXISTS partner_clinical_providers;

DROP EXTENSION IF EXISTS btree_gist;

DROP EXTENSION IF EXISTS pg_trgm;

-- +goose StatementEnd
