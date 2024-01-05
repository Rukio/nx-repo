--
-- PostgreSQL database dump
--


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


SET default_table_access_method = heap;

--
-- Name: callback_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.callback_options (
    id bigint NOT NULL,
    slug text NOT NULL,
    display_name text NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE callback_options; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.callback_options IS 'callback options define who to call during onboarding';


--
-- Name: COLUMN callback_options.slug; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.callback_options.slug IS 'unique string describing callback option';


--
-- Name: COLUMN callback_options.display_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.callback_options.display_name IS 'string describing callback option display name';


--
-- Name: callback_options_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.callback_options_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: callback_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.callback_options_id_seq OWNED BY public.callback_options.id;


--
-- Name: care_request_partner_backfill_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.care_request_partner_backfill_types (
    id bigint NOT NULL,
    slug text NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE care_request_partner_backfill_types; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.care_request_partner_backfill_types IS 'type of a partner care request backfill';


--
-- Name: COLUMN care_request_partner_backfill_types.slug; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.care_request_partner_backfill_types.slug IS 'unique string describing backfill type';


--
-- Name: care_request_partner_backfill_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.care_request_partner_backfill_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: care_request_partner_backfill_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.care_request_partner_backfill_types_id_seq OWNED BY public.care_request_partner_backfill_types.id;


--
-- Name: care_request_partner_backfills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.care_request_partner_backfills (
    id bigint NOT NULL,
    partner_id bigint NOT NULL,
    backfill_type_id bigint NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    last_processed_care_request_created_at timestamp with time zone,
    number_of_matches integer DEFAULT 0 NOT NULL,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    error_description text
);


--
-- Name: TABLE care_request_partner_backfills; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.care_request_partner_backfills IS 'backfills initiated to create care request partner associations';


--
-- Name: COLUMN care_request_partner_backfills.partner_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.care_request_partner_backfills.partner_id IS 'refers to a partner';


--
-- Name: COLUMN care_request_partner_backfills.backfill_type_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.care_request_partner_backfills.backfill_type_id IS 'refers to a backfill type';


--
-- Name: COLUMN care_request_partner_backfills.start_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.care_request_partner_backfills.start_date IS 'backfill start date';


--
-- Name: COLUMN care_request_partner_backfills.end_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.care_request_partner_backfills.end_date IS 'backfill end date';


--
-- Name: COLUMN care_request_partner_backfills.last_processed_care_request_created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.care_request_partner_backfills.last_processed_care_request_created_at IS 'created at timestamp of the last care request processed by backill';


--
-- Name: COLUMN care_request_partner_backfills.number_of_matches; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.care_request_partner_backfills.number_of_matches IS 'number of care request partner associations created by backfill';


--
-- Name: COLUMN care_request_partner_backfills.completed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.care_request_partner_backfills.completed_at IS 'backfill completion timestamp';


--
-- Name: COLUMN care_request_partner_backfills.error_description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.care_request_partner_backfills.error_description IS 'Error description if the backfill failed';


--
-- Name: care_request_partner_backfills_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.care_request_partner_backfills_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: care_request_partner_backfills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.care_request_partner_backfills_id_seq OWNED BY public.care_request_partner_backfills.id;


--
-- Name: care_request_partner_origins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.care_request_partner_origins (
    id bigint NOT NULL,
    slug text NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE care_request_partner_origins; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.care_request_partner_origins IS 'origin of a partner care request association';


--
-- Name: COLUMN care_request_partner_origins.slug; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.care_request_partner_origins.slug IS 'unique string describing origin';


--
-- Name: care_request_partner_origins_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.care_request_partner_origins_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: care_request_partner_origins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.care_request_partner_origins_id_seq OWNED BY public.care_request_partner_origins.id;


--
-- Name: care_request_partners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.care_request_partners (
    id bigint NOT NULL,
    station_care_request_id bigint NOT NULL,
    partner_id bigint NOT NULL,
    care_request_partner_origin_id bigint NOT NULL,
    deleted_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE care_request_partners; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.care_request_partners IS 'partners associated with a care request';


--
-- Name: COLUMN care_request_partners.station_care_request_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.care_request_partners.station_care_request_id IS 'refers to a station care request';


--
-- Name: COLUMN care_request_partners.partner_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.care_request_partners.partner_id IS 'refers to a partner';


--
-- Name: COLUMN care_request_partners.care_request_partner_origin_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.care_request_partners.care_request_partner_origin_id IS 'refers to an care_request_partner_origin';


--
-- Name: care_request_partners_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.care_request_partners_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: care_request_partners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.care_request_partners_id_seq OWNED BY public.care_request_partners.id;


--
-- Name: email_domains; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_domains (
    id bigint NOT NULL,
    partner_configuration_id bigint NOT NULL,
    domain_description text NOT NULL,
    deleted_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE email_domains; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.email_domains IS 'Email domains allowed for partner users';


--
-- Name: COLUMN email_domains.domain_description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.email_domains.domain_description IS 'valid email domain for partner users';


--
-- Name: email_domains_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_domains_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_domains_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_domains_id_seq OWNED BY public.email_domains.id;


--
-- Name: email_domains_partner_configuration_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_domains_partner_configuration_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_domains_partner_configuration_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_domains_partner_configuration_id_seq OWNED BY public.email_domains.partner_configuration_id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locations (
    id bigint NOT NULL,
    address_line_one text,
    address_line_two text,
    city text,
    state_code text,
    zip_code text,
    latitude_e6 integer,
    longitude_e6 integer,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE locations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.locations IS 'address and geo location for entities that require a location';


--
-- Name: COLUMN locations.address_line_one; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.address_line_one IS 'address line one for this location';


--
-- Name: COLUMN locations.address_line_two; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.address_line_two IS 'address line two for this location';


--
-- Name: COLUMN locations.city; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.city IS 'city for this location';


--
-- Name: COLUMN locations.state_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.state_code IS 'state code for this location';


--
-- Name: COLUMN locations.zip_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.zip_code IS 'ZIP code for this location';


--
-- Name: COLUMN locations.latitude_e6; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.latitude_e6 IS 'latitude for this location multiplied by 1e6';


--
-- Name: COLUMN locations.longitude_e6; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.longitude_e6 IS 'longitude for this location multiplied by 1e6';


--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.locations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- Name: markets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.markets (
    id bigint NOT NULL,
    display_name text NOT NULL,
    station_market_id bigint NOT NULL,
    deleted_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE markets; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.markets IS 'A brief market description used when defining market specific properties';


--
-- Name: COLUMN markets.display_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.markets.display_name IS 'Full name of the market such as Denver';


--
-- Name: COLUMN markets.station_market_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.markets.station_market_id IS 'ID of market in station database';


--
-- Name: markets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.markets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: markets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.markets_id_seq OWNED BY public.markets.id;


--
-- Name: partner_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_categories (
    id bigint NOT NULL,
    display_name text NOT NULL,
    short_name text NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN partner_categories.display_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_categories.display_name IS 'descriptive name for a category that can be used in a UI';


--
-- Name: COLUMN partner_categories.short_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_categories.short_name IS 'unique string identifying category';


--
-- Name: partner_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.partner_categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: partner_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.partner_categories_id_seq OWNED BY public.partner_categories.id;


--
-- Name: partner_clinical_providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_clinical_providers (
    id bigint NOT NULL,
    partner_id bigint NOT NULL,
    athena_clinical_provider_id bigint NOT NULL,
    deleted_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE partner_clinical_providers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.partner_clinical_providers IS 'clinical providers associated with a partner';


--
-- Name: COLUMN partner_clinical_providers.partner_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_clinical_providers.partner_id IS 'refers to a partner';


--
-- Name: COLUMN partner_clinical_providers.athena_clinical_provider_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_clinical_providers.athena_clinical_provider_id IS 'refers to a clinical provider from athena';


--
-- Name: partner_clinical_providers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.partner_clinical_providers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: partner_clinical_providers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.partner_clinical_providers_id_seq OWNED BY public.partner_clinical_providers.id;


--
-- Name: partner_configuration_market_service_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_configuration_market_service_lines (
    id bigint NOT NULL,
    partner_configuration_market_id bigint NOT NULL,
    service_line_id bigint NOT NULL,
    redox_partner_id bigint,
    deleted_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE partner_configuration_market_service_lines; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.partner_configuration_market_service_lines IS 'Service lines that are available to partner configurations within a market';


--
-- Name: COLUMN partner_configuration_market_service_lines.partner_configuration_market_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_configuration_market_service_lines.partner_configuration_market_id IS 'Refers to partner configuration market';


--
-- Name: COLUMN partner_configuration_market_service_lines.service_line_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_configuration_market_service_lines.service_line_id IS 'Refers to a service line';


--
-- Name: COLUMN partner_configuration_market_service_lines.redox_partner_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_configuration_market_service_lines.redox_partner_id IS 'Refers to a source parter for redox orders that use this service line';


--
-- Name: partner_configuration_market_service_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.partner_configuration_market_service_lines_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: partner_configuration_market_service_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.partner_configuration_market_service_lines_id_seq OWNED BY public.partner_configuration_market_service_lines.id;


--
-- Name: partner_configuration_markets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_configuration_markets (
    id bigint NOT NULL,
    partner_configuration_id bigint NOT NULL,
    market_id bigint NOT NULL,
    deleted_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE partner_configuration_markets; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.partner_configuration_markets IS 'Markets that partner configurations and submit create care requests in';


--
-- Name: COLUMN partner_configuration_markets.partner_configuration_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_configuration_markets.partner_configuration_id IS 'Refers to a partner configuration';


--
-- Name: COLUMN partner_configuration_markets.market_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_configuration_markets.market_id IS 'Refers to a market';


--
-- Name: partner_configuration_markets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.partner_configuration_markets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: partner_configuration_markets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.partner_configuration_markets_id_seq OWNED BY public.partner_configuration_markets.id;


--
-- Name: partner_configuration_sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_configuration_sources (
    id bigint NOT NULL,
    partner_id bigint NOT NULL,
    partner_configuration_id bigint NOT NULL,
    callback_number_country_code integer,
    callback_number text NOT NULL,
    callback_number_extension text,
    default_callback_option_id bigint NOT NULL,
    deleted_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    location_id bigint
);


--
-- Name: TABLE partner_configuration_sources; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.partner_configuration_sources IS 'a source describes the entity responsible for creating the care request';


--
-- Name: COLUMN partner_configuration_sources.partner_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_configuration_sources.partner_id IS 'refers to a partner that is the source';


--
-- Name: COLUMN partner_configuration_sources.partner_configuration_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_configuration_sources.partner_configuration_id IS 'partner configuration that permits partner as a source';


--
-- Name: COLUMN partner_configuration_sources.callback_number_country_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_configuration_sources.callback_number_country_code IS 'callback number country code for this source';


--
-- Name: COLUMN partner_configuration_sources.callback_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_configuration_sources.callback_number IS 'callback number for this source';


--
-- Name: COLUMN partner_configuration_sources.callback_number_extension; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_configuration_sources.callback_number_extension IS 'callback number extension for this source';


--
-- Name: COLUMN partner_configuration_sources.default_callback_option_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_configuration_sources.default_callback_option_id IS 'the default callback option for this source';


--
-- Name: COLUMN partner_configuration_sources.location_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_configuration_sources.location_id IS 'refers to locations table identifier';


--
-- Name: partner_configuration_sources_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.partner_configuration_sources_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: partner_configuration_sources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.partner_configuration_sources_id_seq OWNED BY public.partner_configuration_sources.id;


--
-- Name: partner_configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_configurations (
    id bigint NOT NULL,
    express_id text,
    display_name text NOT NULL,
    phone_number text,
    is_redox_enabled boolean NOT NULL,
    is_risk_strat_bypass_enabled boolean NOT NULL,
    is_sso_enabled boolean NOT NULL,
    is_view_all_care_requests_enabled boolean NOT NULL,
    deleted_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE partner_configurations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.partner_configurations IS 'Configuration settings enabling partners to create care requests';


--
-- Name: COLUMN partner_configurations.express_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_configurations.express_id IS 'Express ID for the partner';


--
-- Name: COLUMN partner_configurations.display_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_configurations.display_name IS 'display_name of partner';


--
-- Name: COLUMN partner_configurations.phone_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_configurations.phone_number IS 'phone_number of partner, displayed at the call center';


--
-- Name: COLUMN partner_configurations.is_redox_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_configurations.is_redox_enabled IS 'Flag, true if partner has a redox integration';


--
-- Name: COLUMN partner_configurations.is_risk_strat_bypass_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_configurations.is_risk_strat_bypass_enabled IS 'Flag, true if partner can bypass risk strat';


--
-- Name: COLUMN partner_configurations.is_sso_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_configurations.is_sso_enabled IS 'Flag, true if partner has an sso integration';


--
-- Name: COLUMN partner_configurations.is_view_all_care_requests_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_configurations.is_view_all_care_requests_enabled IS 'Flag, true if partner users can view all care requests for partner';


--
-- Name: partner_configurations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.partner_configurations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: partner_configurations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.partner_configurations_id_seq OWNED BY public.partner_configurations.id;


--
-- Name: partner_insurance_packages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_insurance_packages (
    id bigint NOT NULL,
    package_id bigint NOT NULL,
    partner_id bigint NOT NULL,
    deleted_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE partner_insurance_packages; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.partner_insurance_packages IS 'insurance packages associated with a partner';


--
-- Name: COLUMN partner_insurance_packages.package_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_insurance_packages.package_id IS 'refers to a insurance package identifier';


--
-- Name: COLUMN partner_insurance_packages.partner_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partner_insurance_packages.partner_id IS 'refers to a partner';


--
-- Name: partner_insurance_packages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.partner_insurance_packages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: partner_insurance_packages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.partner_insurance_packages_id_seq OWNED BY public.partner_insurance_packages.id;


--
-- Name: partners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partners (
    id bigint NOT NULL,
    station_channel_item_id bigint NOT NULL,
    station_channel_id bigint,
    display_name text NOT NULL,
    partner_category_id bigint NOT NULL,
    phone_country_code integer,
    phone_number text,
    phone_extension text,
    email text,
    deactivated_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    location_id bigint,
    insurance_package_id bigint
);


--
-- Name: COLUMN partners.display_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partners.display_name IS 'display_name of partner';


--
-- Name: COLUMN partners.partner_category_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partners.partner_category_id IS 'category is used to organize partners and implement category specific business logic';


--
-- Name: COLUMN partners.phone_country_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partners.phone_country_code IS 'partner phone number country code';


--
-- Name: COLUMN partners.phone_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partners.phone_number IS 'partner phone number without country code and extension';


--
-- Name: COLUMN partners.phone_extension; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partners.phone_extension IS 'partner phone number optional extension';


--
-- Name: COLUMN partners.email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partners.email IS 'partner contact email';


--
-- Name: COLUMN partners.deactivated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partners.deactivated_at IS 'deactivated partners are not visible in name searches and will not be used for partner attribution';


--
-- Name: COLUMN partners.location_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partners.location_id IS 'physical location of partner, refers to location table';


--
-- Name: COLUMN partners.insurance_package_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.partners.insurance_package_id IS 'Corporate insurance package id configured for the partner';


--
-- Name: partners_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.partners_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: partners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.partners_id_seq OWNED BY public.partners.id;


--
-- Name: pophealth_configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pophealth_configurations (
    id bigint NOT NULL,
    partner_configuration_id bigint NOT NULL,
    partner_id bigint NOT NULL,
    deleted_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE pophealth_configurations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.pophealth_configurations IS 'Pophealth partners with patients searchable by partner configuration';


--
-- Name: COLUMN pophealth_configurations.partner_configuration_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pophealth_configurations.partner_configuration_id IS 'Refers to a partner configuration';


--
-- Name: COLUMN pophealth_configurations.partner_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pophealth_configurations.partner_id IS 'Refers to a partner';


--
-- Name: pophealth_configurations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pophealth_configurations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pophealth_configurations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pophealth_configurations_id_seq OWNED BY public.pophealth_configurations.id;


--
-- Name: redox_configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.redox_configurations (
    id bigint NOT NULL,
    partner_configuration_id bigint NOT NULL,
    cancellation_id text NOT NULL,
    clinical_summary_destination_id text NOT NULL,
    is_clinical_summary_enabled boolean NOT NULL,
    destination_id text NOT NULL,
    source_id text NOT NULL,
    deleted_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN redox_configurations.partner_configuration_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.redox_configurations.partner_configuration_id IS 'References a partner_configuration';


--
-- Name: COLUMN redox_configurations.cancellation_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.redox_configurations.cancellation_id IS 'Cancellation_id, used by partner EHR';


--
-- Name: COLUMN redox_configurations.clinical_summary_destination_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.redox_configurations.clinical_summary_destination_id IS 'Redox clinical_summary_destination_id used for clinical summaries only';


--
-- Name: COLUMN redox_configurations.is_clinical_summary_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.redox_configurations.is_clinical_summary_enabled IS 'Flag, if true clinical summaries will be sent back to partner';


--
-- Name: COLUMN redox_configurations.destination_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.redox_configurations.destination_id IS 'Unique Redox Destination ID, used for results';


--
-- Name: COLUMN redox_configurations.source_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.redox_configurations.source_id IS 'Unique Redox Source ID, links Redox messages to configurations';


--
-- Name: redox_configurations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.redox_configurations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: redox_configurations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.redox_configurations_id_seq OWNED BY public.redox_configurations.id;


--
-- Name: redox_configurations_partner_configuration_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.redox_configurations_partner_configuration_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: redox_configurations_partner_configuration_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.redox_configurations_partner_configuration_id_seq OWNED BY public.redox_configurations.partner_configuration_id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    id integer NOT NULL,
    version_id bigint NOT NULL,
    is_applied boolean NOT NULL,
    tstamp timestamp without time zone DEFAULT now()
);


--
-- Name: schema_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schema_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schema_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schema_migrations_id_seq OWNED BY public.schema_migrations.id;


--
-- Name: service_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_lines (
    id bigint NOT NULL,
    display_name text NOT NULL,
    short_name text NOT NULL,
    genesys_email text NOT NULL,
    allow_bypass_risk_stratification boolean NOT NULL,
    deleted_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE service_lines; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.service_lines IS 'Service line defines what kind of care is delivered and partner applications have different settings for each one';


--
-- Name: COLUMN service_lines.display_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_lines.display_name IS 'Name of service line for display such as Bridge Care';


--
-- Name: COLUMN service_lines.short_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_lines.short_name IS 'Code such as bridge_care than can be used for inter-service communication';


--
-- Name: COLUMN service_lines.allow_bypass_risk_stratification; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_lines.allow_bypass_risk_stratification IS 'Enabled if service line qualifies for risk stratification bypass';


--
-- Name: service_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_lines_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: service_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_lines_id_seq OWNED BY public.service_lines.id;


--
-- Name: sso_configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sso_configurations (
    id bigint NOT NULL,
    partner_configuration_id bigint NOT NULL,
    connection_name text NOT NULL,
    logout_url text,
    enforce_role_presence boolean NOT NULL,
    deleted_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE sso_configurations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.sso_configurations IS 'Setttings required by configurations with redox enabled';


--
-- Name: COLUMN sso_configurations.partner_configuration_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sso_configurations.partner_configuration_id IS 'References a partner_configuration';


--
-- Name: COLUMN sso_configurations.connection_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sso_configurations.connection_name IS 'The name of the connection in Auth0';


--
-- Name: COLUMN sso_configurations.logout_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sso_configurations.logout_url IS 'URL uses to logout users, typically in partner IdP';


--
-- Name: COLUMN sso_configurations.enforce_role_presence; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sso_configurations.enforce_role_presence IS 'Flag, if true, users must include role in SAML assertion';


--
-- Name: sso_configurations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sso_configurations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sso_configurations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sso_configurations_id_seq OWNED BY public.sso_configurations.id;


--
-- Name: sso_configurations_partner_configuration_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sso_configurations_partner_configuration_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sso_configurations_partner_configuration_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sso_configurations_partner_configuration_id_seq OWNED BY public.sso_configurations.partner_configuration_id;


--
-- Name: callback_options id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.callback_options ALTER COLUMN id SET DEFAULT nextval('public.callback_options_id_seq'::regclass);


--
-- Name: care_request_partner_backfill_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_request_partner_backfill_types ALTER COLUMN id SET DEFAULT nextval('public.care_request_partner_backfill_types_id_seq'::regclass);


--
-- Name: care_request_partner_backfills id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_request_partner_backfills ALTER COLUMN id SET DEFAULT nextval('public.care_request_partner_backfills_id_seq'::regclass);


--
-- Name: care_request_partner_origins id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_request_partner_origins ALTER COLUMN id SET DEFAULT nextval('public.care_request_partner_origins_id_seq'::regclass);


--
-- Name: care_request_partners id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_request_partners ALTER COLUMN id SET DEFAULT nextval('public.care_request_partners_id_seq'::regclass);


--
-- Name: email_domains id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_domains ALTER COLUMN id SET DEFAULT nextval('public.email_domains_id_seq'::regclass);


--
-- Name: email_domains partner_configuration_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_domains ALTER COLUMN partner_configuration_id SET DEFAULT nextval('public.email_domains_partner_configuration_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- Name: markets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markets ALTER COLUMN id SET DEFAULT nextval('public.markets_id_seq'::regclass);


--
-- Name: partner_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_categories ALTER COLUMN id SET DEFAULT nextval('public.partner_categories_id_seq'::regclass);


--
-- Name: partner_clinical_providers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_clinical_providers ALTER COLUMN id SET DEFAULT nextval('public.partner_clinical_providers_id_seq'::regclass);


--
-- Name: partner_configuration_market_service_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_configuration_market_service_lines ALTER COLUMN id SET DEFAULT nextval('public.partner_configuration_market_service_lines_id_seq'::regclass);


--
-- Name: partner_configuration_markets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_configuration_markets ALTER COLUMN id SET DEFAULT nextval('public.partner_configuration_markets_id_seq'::regclass);


--
-- Name: partner_configuration_sources id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_configuration_sources ALTER COLUMN id SET DEFAULT nextval('public.partner_configuration_sources_id_seq'::regclass);


--
-- Name: partner_configurations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_configurations ALTER COLUMN id SET DEFAULT nextval('public.partner_configurations_id_seq'::regclass);


--
-- Name: partner_insurance_packages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_insurance_packages ALTER COLUMN id SET DEFAULT nextval('public.partner_insurance_packages_id_seq'::regclass);


--
-- Name: partners id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners ALTER COLUMN id SET DEFAULT nextval('public.partners_id_seq'::regclass);


--
-- Name: pophealth_configurations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pophealth_configurations ALTER COLUMN id SET DEFAULT nextval('public.pophealth_configurations_id_seq'::regclass);


--
-- Name: redox_configurations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redox_configurations ALTER COLUMN id SET DEFAULT nextval('public.redox_configurations_id_seq'::regclass);


--
-- Name: redox_configurations partner_configuration_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redox_configurations ALTER COLUMN partner_configuration_id SET DEFAULT nextval('public.redox_configurations_partner_configuration_id_seq'::regclass);


--
-- Name: schema_migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations ALTER COLUMN id SET DEFAULT nextval('public.schema_migrations_id_seq'::regclass);


--
-- Name: service_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_lines ALTER COLUMN id SET DEFAULT nextval('public.service_lines_id_seq'::regclass);


--
-- Name: sso_configurations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sso_configurations ALTER COLUMN id SET DEFAULT nextval('public.sso_configurations_id_seq'::regclass);


--
-- Name: sso_configurations partner_configuration_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sso_configurations ALTER COLUMN partner_configuration_id SET DEFAULT nextval('public.sso_configurations_partner_configuration_id_seq'::regclass);


--
-- Name: callback_options callback_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.callback_options
    ADD CONSTRAINT callback_options_pkey PRIMARY KEY (id);


--
-- Name: care_request_partner_backfill_types care_request_partner_backfill_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_request_partner_backfill_types
    ADD CONSTRAINT care_request_partner_backfill_types_pkey PRIMARY KEY (id);


--
-- Name: care_request_partner_backfills care_request_partner_backfills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_request_partner_backfills
    ADD CONSTRAINT care_request_partner_backfills_pkey PRIMARY KEY (id);


--
-- Name: care_request_partner_origins care_request_partner_origins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_request_partner_origins
    ADD CONSTRAINT care_request_partner_origins_pkey PRIMARY KEY (id);


--
-- Name: care_request_partners care_request_partners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_request_partners
    ADD CONSTRAINT care_request_partners_pkey PRIMARY KEY (id);


--
-- Name: email_domains email_domains_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_domains
    ADD CONSTRAINT email_domains_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: markets markets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT markets_pkey PRIMARY KEY (id);


--
-- Name: partner_categories partner_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_categories
    ADD CONSTRAINT partner_categories_pkey PRIMARY KEY (id);


--
-- Name: partner_clinical_providers partner_clinical_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_clinical_providers
    ADD CONSTRAINT partner_clinical_providers_pkey PRIMARY KEY (id);


--
-- Name: partner_configuration_market_service_lines partner_configuration_market_service_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_configuration_market_service_lines
    ADD CONSTRAINT partner_configuration_market_service_lines_pkey PRIMARY KEY (id);


--
-- Name: partner_configuration_markets partner_configuration_markets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_configuration_markets
    ADD CONSTRAINT partner_configuration_markets_pkey PRIMARY KEY (id);


--
-- Name: partner_configuration_sources partner_configuration_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_configuration_sources
    ADD CONSTRAINT partner_configuration_sources_pkey PRIMARY KEY (id);


--
-- Name: partner_configurations partner_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_configurations
    ADD CONSTRAINT partner_configurations_pkey PRIMARY KEY (id);


--
-- Name: partner_insurance_packages partner_insurance_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_insurance_packages
    ADD CONSTRAINT partner_insurance_packages_pkey PRIMARY KEY (id);


--
-- Name: partners partners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_pkey PRIMARY KEY (id);


--
-- Name: pophealth_configurations pophealth_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pophealth_configurations
    ADD CONSTRAINT pophealth_configurations_pkey PRIMARY KEY (id);


--
-- Name: redox_configurations redox_configurations_destination_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redox_configurations
    ADD CONSTRAINT redox_configurations_destination_id_key UNIQUE (destination_id);


--
-- Name: redox_configurations redox_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redox_configurations
    ADD CONSTRAINT redox_configurations_pkey PRIMARY KEY (id);


--
-- Name: redox_configurations redox_configurations_source_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redox_configurations
    ADD CONSTRAINT redox_configurations_source_id_key UNIQUE (source_id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);


--
-- Name: service_lines service_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_lines
    ADD CONSTRAINT service_lines_pkey PRIMARY KEY (id);


--
-- Name: sso_configurations sso_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sso_configurations
    ADD CONSTRAINT sso_configurations_pkey PRIMARY KEY (id);


--
-- Name: callback_options_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX callback_options_slug_idx ON public.callback_options USING btree (slug);


--
-- Name: care_request_partner_backfill_types_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX care_request_partner_backfill_types_slug_idx ON public.care_request_partner_backfill_types USING btree (slug);


--
-- Name: care_request_partner_backfills_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX care_request_partner_backfills_created_at_idx ON public.care_request_partner_backfills USING btree (created_at);


--
-- Name: care_request_partner_backfills_partner_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX care_request_partner_backfills_partner_id_idx ON public.care_request_partner_backfills USING btree (partner_id);


--
-- Name: care_request_partner_backfills_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX care_request_partner_backfills_updated_at_idx ON public.care_request_partner_backfills USING btree (updated_at);


--
-- Name: care_request_partner_origins_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX care_request_partner_origins_slug_idx ON public.care_request_partner_origins USING btree (slug);


--
-- Name: care_request_partners_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX care_request_partners_created_at_idx ON public.care_request_partners USING btree (created_at);


--
-- Name: care_request_partners_station_care_request_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX care_request_partners_station_care_request_id_idx ON public.care_request_partners USING btree (station_care_request_id);


--
-- Name: care_request_partners_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX care_request_partners_updated_at_idx ON public.care_request_partners USING btree (updated_at);


--
-- Name: email_domains_partner_configuration_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX email_domains_partner_configuration_idx ON public.email_domains USING btree (partner_configuration_id);


--
-- Name: locations_geo_location_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX locations_geo_location_idx ON public.locations USING btree (latitude_e6, longitude_e6);


--
-- Name: markets_display_name_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX markets_display_name_id_idx ON public.markets USING btree (display_name);


--
-- Name: partner_categories_short_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX partner_categories_short_name_idx ON public.partner_categories USING btree (short_name);


--
-- Name: partner_clinical_providers_partner_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partner_clinical_providers_partner_id_idx ON public.partner_clinical_providers USING btree (partner_id);


--
-- Name: partner_configuration_market_service_lines_partner_configuratio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partner_configuration_market_service_lines_partner_configuratio ON public.partner_configuration_market_service_lines USING btree (partner_configuration_market_id, deleted_at);


--
-- Name: partner_configuration_market_service_lines_service_line_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partner_configuration_market_service_lines_service_line_id_idx ON public.partner_configuration_market_service_lines USING btree (service_line_id);


--
-- Name: partner_configuration_markets_market_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partner_configuration_markets_market_id_idx ON public.partner_configuration_markets USING btree (market_id);


--
-- Name: partner_configuration_markets_partner_configuration_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partner_configuration_markets_partner_configuration_id_idx ON public.partner_configuration_markets USING btree (partner_configuration_id, deleted_at);


--
-- Name: partner_configuration_sources_location_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partner_configuration_sources_location_id_idx ON public.partner_configuration_sources USING btree (location_id);


--
-- Name: partner_configuration_sources_partner_configuration_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partner_configuration_sources_partner_configuration_id_idx ON public.partner_configuration_sources USING btree (partner_configuration_id);


--
-- Name: partner_configurations_display_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partner_configurations_display_name_idx ON public.partner_configurations USING gist (display_name public.gist_trgm_ops);


--
-- Name: partner_configurations_express_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partner_configurations_express_id_idx ON public.partner_configurations USING btree (express_id);


--
-- Name: partner_insurance_packages_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partner_insurance_packages_created_at_idx ON public.partner_insurance_packages USING btree (created_at);


--
-- Name: partner_insurance_packages_package_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partner_insurance_packages_package_id_idx ON public.partner_insurance_packages USING btree (package_id);


--
-- Name: partner_insurance_packages_partner_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partner_insurance_packages_partner_id_idx ON public.partner_insurance_packages USING btree (partner_id);


--
-- Name: partner_insurance_packages_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partner_insurance_packages_updated_at_idx ON public.partner_insurance_packages USING btree (updated_at);


--
-- Name: partners_channel_item_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX partners_channel_item_idx ON public.partners USING btree (station_channel_item_id);


--
-- Name: partners_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partners_created_at_idx ON public.partners USING btree (created_at);


--
-- Name: partners_deactivated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partners_deactivated_at_idx ON public.partners USING btree (deactivated_at);


--
-- Name: partners_display_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partners_display_name_idx ON public.partners USING gist (display_name public.gist_trgm_ops);


--
-- Name: partners_location_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partners_location_id_idx ON public.partners USING btree (location_id);


--
-- Name: partners_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partners_updated_at_idx ON public.partners USING btree (updated_at);


--
-- Name: pophealth_configurations_partner_configuration_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pophealth_configurations_partner_configuration_idx ON public.pophealth_configurations USING btree (partner_configuration_id);


--
-- Name: redox_configurations_partner_configuration_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX redox_configurations_partner_configuration_id_idx ON public.redox_configurations USING btree (partner_configuration_id);


--
-- Name: sso_configurations_partner_configuration_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sso_configurations_partner_configuration_id_idx ON public.sso_configurations USING btree (partner_configuration_id);


--
-- PostgreSQL database dump complete
--

