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

SET default_table_access_method = heap;

--
-- Name: attributes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attributes (
    id bigint NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE attributes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.attributes IS 'Attributes for shift teams and visits';


--
-- Name: COLUMN attributes.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.attributes.name IS 'Name of attribute';


--
-- Name: attributes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attributes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: attributes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attributes_id_seq OWNED BY public.attributes.id;


--
-- Name: check_feasibility_queries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.check_feasibility_queries (
    id bigint NOT NULL,
    care_request_id bigint,
    service_region_id bigint,
    location_id bigint,
    service_date date,
    arrival_time_window_start_timestamp_sec bigint,
    arrival_time_window_end_timestamp_sec bigint,
    service_duration_sec bigint,
    optimizer_run_id bigint,
    best_schedule_id bigint,
    best_schedule_is_feasible boolean,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    response_status text
);


--
-- Name: TABLE check_feasibility_queries; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.check_feasibility_queries IS 'Check feasibility diagnostic information';


--
-- Name: COLUMN check_feasibility_queries.care_request_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.check_feasibility_queries.care_request_id IS 'Care request to check feasibility';


--
-- Name: COLUMN check_feasibility_queries.service_region_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.check_feasibility_queries.service_region_id IS 'The service region to check feasibility';


--
-- Name: COLUMN check_feasibility_queries.location_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.check_feasibility_queries.location_id IS 'The location to check for feasibility';


--
-- Name: COLUMN check_feasibility_queries.service_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.check_feasibility_queries.service_date IS 'The service date to check for feasibility';


--
-- Name: COLUMN check_feasibility_queries.arrival_time_window_start_timestamp_sec; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.check_feasibility_queries.arrival_time_window_start_timestamp_sec IS 'The requested arrival time window start, in seconds';


--
-- Name: COLUMN check_feasibility_queries.arrival_time_window_end_timestamp_sec; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.check_feasibility_queries.arrival_time_window_end_timestamp_sec IS 'The requested arrival time window end, in seconds';


--
-- Name: COLUMN check_feasibility_queries.service_duration_sec; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.check_feasibility_queries.service_duration_sec IS 'The estimated service duration in seconds';


--
-- Name: COLUMN check_feasibility_queries.optimizer_run_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.check_feasibility_queries.optimizer_run_id IS 'The optimizer run against which feasibility was checked';


--
-- Name: COLUMN check_feasibility_queries.best_schedule_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.check_feasibility_queries.best_schedule_id IS 'The last schedule returned by the optimizer for this check feasibility query';


--
-- Name: COLUMN check_feasibility_queries.best_schedule_is_feasible; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.check_feasibility_queries.best_schedule_is_feasible IS 'Is the best schedule feasible';


--
-- Name: COLUMN check_feasibility_queries.response_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.check_feasibility_queries.response_status IS 'the status response for the check feasibility query, in string form';


--
-- Name: check_feasibility_queries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.check_feasibility_queries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: check_feasibility_queries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.check_feasibility_queries_id_seq OWNED BY public.check_feasibility_queries.id;


--
-- Name: check_feasibility_query_attributes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.check_feasibility_query_attributes (
    id bigint NOT NULL,
    check_feasibility_query_id bigint NOT NULL,
    attribute_id bigint NOT NULL,
    is_required boolean DEFAULT false,
    is_forbidden boolean DEFAULT false,
    is_preferred boolean DEFAULT false,
    is_unwanted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE check_feasibility_query_attributes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.check_feasibility_query_attributes IS 'Check feasibility query attributes';


--
-- Name: COLUMN check_feasibility_query_attributes.check_feasibility_query_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.check_feasibility_query_attributes.check_feasibility_query_id IS 'Check feasibility query';


--
-- Name: COLUMN check_feasibility_query_attributes.attribute_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.check_feasibility_query_attributes.attribute_id IS 'Attribute';


--
-- Name: COLUMN check_feasibility_query_attributes.is_required; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.check_feasibility_query_attributes.is_required IS 'Is required attribute';


--
-- Name: COLUMN check_feasibility_query_attributes.is_forbidden; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.check_feasibility_query_attributes.is_forbidden IS 'Is forbidden attribute';


--
-- Name: COLUMN check_feasibility_query_attributes.is_preferred; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.check_feasibility_query_attributes.is_preferred IS 'Is preferred attribute';


--
-- Name: COLUMN check_feasibility_query_attributes.is_unwanted; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.check_feasibility_query_attributes.is_unwanted IS 'Is unwanted attribute';


--
-- Name: check_feasibility_query_attributes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.check_feasibility_query_attributes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: check_feasibility_query_attributes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.check_feasibility_query_attributes_id_seq OWNED BY public.check_feasibility_query_attributes.id;


--
-- Name: clinical_urgency_level_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinical_urgency_level_configs (
    id bigint NOT NULL,
    clinical_urgency_level_id bigint NOT NULL,
    optimizer_urgency_level bigint NOT NULL,
    clinical_window_duration_sec bigint,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE clinical_urgency_level_configs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.clinical_urgency_level_configs IS 'Clinical urgency window information based on urgency level';


--
-- Name: COLUMN clinical_urgency_level_configs.clinical_urgency_level_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clinical_urgency_level_configs.clinical_urgency_level_id IS 'Clinical urgency level';


--
-- Name: COLUMN clinical_urgency_level_configs.optimizer_urgency_level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clinical_urgency_level_configs.optimizer_urgency_level IS 'Urgency level to be sent to optimizer';


--
-- Name: COLUMN clinical_urgency_level_configs.clinical_window_duration_sec; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clinical_urgency_level_configs.clinical_window_duration_sec IS 'Clinical urgency time window in seconds';


--
-- Name: COLUMN clinical_urgency_level_configs.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clinical_urgency_level_configs.description IS 'Clinical urgency level short name and time window duration';


--
-- Name: clinical_urgency_level_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clinical_urgency_level_configs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clinical_urgency_level_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clinical_urgency_level_configs_id_seq OWNED BY public.clinical_urgency_level_configs.id;


--
-- Name: clinical_urgency_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinical_urgency_levels (
    id bigint NOT NULL,
    short_name text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE clinical_urgency_levels; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.clinical_urgency_levels IS 'Available clinical urgency levels';


--
-- Name: COLUMN clinical_urgency_levels.short_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clinical_urgency_levels.short_name IS 'Short name to identify the level of urgency (low, medium, high, etc)';


--
-- Name: clinical_urgency_levels_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clinical_urgency_levels_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clinical_urgency_levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clinical_urgency_levels_id_seq OWNED BY public.clinical_urgency_levels.id;


--
-- Name: distance_sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.distance_sources (
    id bigint NOT NULL,
    short_name text,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE distance_sources; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.distance_sources IS 'Sources of Distance information';


--
-- Name: COLUMN distance_sources.short_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.distance_sources.short_name IS 'Short name of source';


--
-- Name: COLUMN distance_sources.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.distance_sources.description IS 'Description of source';


--
-- Name: distance_sources_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.distance_sources_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: distance_sources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.distance_sources_id_seq OWNED BY public.distance_sources.id;


--
-- Name: distances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.distances (
    id bigint NOT NULL,
    source_id bigint NOT NULL,
    from_location_id bigint NOT NULL,
    to_location_id bigint NOT NULL,
    distance_meters integer NOT NULL,
    duration_seconds integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE distances; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.distances IS 'Distances between locations';


--
-- Name: COLUMN distances.source_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.distances.source_id IS 'Distance source used to get distance';


--
-- Name: COLUMN distances.from_location_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.distances.from_location_id IS 'From location';


--
-- Name: COLUMN distances.to_location_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.distances.to_location_id IS 'To location';


--
-- Name: COLUMN distances.distance_meters; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.distances.distance_meters IS 'Meters between from_location_id and to_location_id';


--
-- Name: COLUMN distances.duration_seconds; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.distances.duration_seconds IS 'Seconds between from_location_id and to_location_id';


--
-- Name: distances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.distances_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: distances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.distances_id_seq OWNED BY public.distances.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locations (
    id bigint NOT NULL,
    latitude_e6 integer NOT NULL,
    longitude_e6 integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE locations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.locations IS 'Locations (latitude, longitude)';


--
-- Name: COLUMN locations.latitude_e6; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.latitude_e6 IS 'Latitude, multiplied by 1e6';


--
-- Name: COLUMN locations.longitude_e6; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.longitude_e6 IS 'Longitude, multiplied by 1e6';


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
    station_market_id bigint NOT NULL,
    short_name text NOT NULL,
    service_region_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE markets; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.markets IS 'Markets in service regions';


--
-- Name: COLUMN markets.station_market_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.markets.station_market_id IS 'Equivalent market ID from Station database';


--
-- Name: COLUMN markets.short_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.markets.short_name IS 'Equivalent market short name (i.e, "DEN" for Denver) from Station database';


--
-- Name: COLUMN markets.service_region_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.markets.service_region_id IS 'Service region that market belongs to';


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
-- Name: optimizer_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.optimizer_configs (
    id bigint NOT NULL,
    termination_duration_ms bigint NOT NULL,
    per_visit_revenue_usd_cents bigint NOT NULL,
    app_hourly_cost_usd_cents bigint NOT NULL,
    dhmt_hourly_cost_usd_cents bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE optimizer_configs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.optimizer_configs IS 'Configuration values for optimizer';


--
-- Name: COLUMN optimizer_configs.termination_duration_ms; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_configs.termination_duration_ms IS 'Time limit for running the optimizer, in milliseconds';


--
-- Name: COLUMN optimizer_configs.per_visit_revenue_usd_cents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_configs.per_visit_revenue_usd_cents IS 'Per visit revenue, in USD cents';


--
-- Name: COLUMN optimizer_configs.app_hourly_cost_usd_cents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_configs.app_hourly_cost_usd_cents IS 'APP hourly cost, in USD cents';


--
-- Name: COLUMN optimizer_configs.dhmt_hourly_cost_usd_cents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_configs.dhmt_hourly_cost_usd_cents IS 'DHMT hourly cost, in USD cents';


--
-- Name: optimizer_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.optimizer_configs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: optimizer_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.optimizer_configs_id_seq OWNED BY public.optimizer_configs.id;


--
-- Name: optimizer_constraint_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.optimizer_constraint_configs (
    id bigint NOT NULL,
    config jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE optimizer_constraint_configs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.optimizer_constraint_configs IS 'Constraint configs used to run the optimizer';


--
-- Name: COLUMN optimizer_constraint_configs.config; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_constraint_configs.config IS 'JSON representation of VRPConstraintConfig used for the optimizer';


--
-- Name: optimizer_constraint_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.optimizer_constraint_configs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: optimizer_constraint_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.optimizer_constraint_configs_id_seq OWNED BY public.optimizer_constraint_configs.id;


--
-- Name: optimizer_run_error_sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.optimizer_run_error_sources (
    id bigint NOT NULL,
    short_name text NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE optimizer_run_error_sources; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.optimizer_run_error_sources IS 'Sources of errors for optimizer runs';


--
-- Name: COLUMN optimizer_run_error_sources.short_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_run_error_sources.short_name IS 'Short name of the optimizer run error source';


--
-- Name: COLUMN optimizer_run_error_sources.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_run_error_sources.description IS 'Description of the optimizer run source type';


--
-- Name: optimizer_run_error_sources_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.optimizer_run_error_sources_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: optimizer_run_error_sources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.optimizer_run_error_sources_id_seq OWNED BY public.optimizer_run_error_sources.id;


--
-- Name: optimizer_run_errors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.optimizer_run_errors (
    id bigint NOT NULL,
    optimizer_run_id bigint NOT NULL,
    error_value text NOT NULL,
    optimizer_run_error_source_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE optimizer_run_errors; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.optimizer_run_errors IS 'Sources of errors for optimizer runs';


--
-- Name: COLUMN optimizer_run_errors.optimizer_run_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_run_errors.optimizer_run_id IS 'The optimizer run for the error';


--
-- Name: COLUMN optimizer_run_errors.error_value; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_run_errors.error_value IS 'The string error value';


--
-- Name: COLUMN optimizer_run_errors.optimizer_run_error_source_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_run_errors.optimizer_run_error_source_id IS 'Identifier for the source of the error';


--
-- Name: optimizer_run_errors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.optimizer_run_errors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: optimizer_run_errors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.optimizer_run_errors_id_seq OWNED BY public.optimizer_run_errors.id;


--
-- Name: optimizer_run_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.optimizer_run_types (
    id bigint NOT NULL,
    name text NOT NULL
);


--
-- Name: TABLE optimizer_run_types; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.optimizer_run_types IS 'Enum of the possible optimizer run types';


--
-- Name: COLUMN optimizer_run_types.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_run_types.name IS 'Name of the type';


--
-- Name: optimizer_run_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.optimizer_run_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: optimizer_run_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.optimizer_run_types_id_seq OWNED BY public.optimizer_run_types.id;


--
-- Name: optimizer_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.optimizer_runs (
    id bigint NOT NULL,
    service_region_id bigint NOT NULL,
    service_date date NOT NULL,
    open_hours_schedule_day_id bigint NOT NULL,
    open_hours_start_timestamp_sec bigint NOT NULL,
    open_hours_end_timestamp_sec bigint NOT NULL,
    earliest_distance_timestamp timestamp with time zone NOT NULL,
    latest_distance_timestamp timestamp with time zone NOT NULL,
    snapshot_timestamp timestamp with time zone NOT NULL,
    optimizer_config_id bigint NOT NULL,
    service_version text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    distance_source_id bigint DEFAULT 0 NOT NULL,
    optimizer_constraint_config_id bigint,
    optimizer_settings_id bigint,
    optimizer_run_type_id bigint NOT NULL
);


--
-- Name: TABLE optimizer_runs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.optimizer_runs IS 'Optimizer run history';


--
-- Name: COLUMN optimizer_runs.service_region_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_runs.service_region_id IS 'Service region';


--
-- Name: COLUMN optimizer_runs.service_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_runs.service_date IS 'Service date';


--
-- Name: COLUMN optimizer_runs.open_hours_schedule_day_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_runs.open_hours_schedule_day_id IS 'Opening hours schedule day';


--
-- Name: COLUMN optimizer_runs.open_hours_start_timestamp_sec; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_runs.open_hours_start_timestamp_sec IS 'Opening hours start timestamp, in seconds';


--
-- Name: COLUMN optimizer_runs.open_hours_end_timestamp_sec; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_runs.open_hours_end_timestamp_sec IS 'Opening hours end timestamp, in seconds';


--
-- Name: COLUMN optimizer_runs.earliest_distance_timestamp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_runs.earliest_distance_timestamp IS 'Earliest distance timestamp';


--
-- Name: COLUMN optimizer_runs.latest_distance_timestamp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_runs.latest_distance_timestamp IS 'Latest distance timestamp';


--
-- Name: COLUMN optimizer_runs.snapshot_timestamp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_runs.snapshot_timestamp IS 'Snapshot timestamp used for collecting data for the run';


--
-- Name: COLUMN optimizer_runs.optimizer_config_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_runs.optimizer_config_id IS 'Optimizer config used';


--
-- Name: COLUMN optimizer_runs.service_version; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_runs.service_version IS 'Version of Logistics/Go used to invoke the optimizer';


--
-- Name: COLUMN optimizer_runs.distance_source_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_runs.distance_source_id IS 'distance source used to get distances';


--
-- Name: COLUMN optimizer_runs.optimizer_constraint_config_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_runs.optimizer_constraint_config_id IS 'Constraint config used to run the optimizer';


--
-- Name: COLUMN optimizer_runs.optimizer_settings_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_runs.optimizer_settings_id IS 'Settings used to run the optimizer';


--
-- Name: COLUMN optimizer_runs.optimizer_run_type_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_runs.optimizer_run_type_id IS 'The id of the associated run type';


--
-- Name: optimizer_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.optimizer_runs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: optimizer_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.optimizer_runs_id_seq OWNED BY public.optimizer_runs.id;


--
-- Name: optimizer_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.optimizer_settings (
    id bigint NOT NULL,
    settings jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE optimizer_settings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.optimizer_settings IS 'Settings used to run the optimizer';


--
-- Name: COLUMN optimizer_settings.settings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.optimizer_settings.settings IS 'JSON representation of optimizersettings.Settings used for the optimizer run';


--
-- Name: optimizer_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.optimizer_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: optimizer_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.optimizer_settings_id_seq OWNED BY public.optimizer_settings.id;


--
-- Name: schedule_diagnostics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_diagnostics (
    id bigint NOT NULL,
    schedule_id bigint NOT NULL,
    debug_explanation text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    unassigned_visits_diff bigint
);


--
-- Name: TABLE schedule_diagnostics; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.schedule_diagnostics IS 'Non-critical diagnostic information for a schedule';


--
-- Name: COLUMN schedule_diagnostics.schedule_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_diagnostics.schedule_id IS 'The schedule whose diagnostics are stored';


--
-- Name: COLUMN schedule_diagnostics.debug_explanation; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_diagnostics.debug_explanation IS 'Text explanation of constraint matches and indictments to explain the schedule';


--
-- Name: COLUMN schedule_diagnostics.unassigned_visits_diff; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_diagnostics.unassigned_visits_diff IS 'the number of unassigned visits between the base schedule and the result schedule';


--
-- Name: schedule_diagnostics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schedule_diagnostics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schedule_diagnostics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schedule_diagnostics_id_seq OWNED BY public.schedule_diagnostics.id;


--
-- Name: schedule_rest_breaks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_rest_breaks (
    id bigint NOT NULL,
    schedule_id bigint NOT NULL,
    schedule_route_id bigint NOT NULL,
    shift_team_break_request_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE schedule_rest_breaks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.schedule_rest_breaks IS 'Rest break information associated with a schedule route stop';


--
-- Name: COLUMN schedule_rest_breaks.schedule_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_rest_breaks.schedule_id IS 'Schedule to which this rest break stop belongs';


--
-- Name: COLUMN schedule_rest_breaks.schedule_route_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_rest_breaks.schedule_route_id IS 'Schedule route to which this rest break stop belongs';


--
-- Name: COLUMN schedule_rest_breaks.shift_team_break_request_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_rest_breaks.shift_team_break_request_id IS 'Break request associated with the rest break stop';


--
-- Name: schedule_rest_breaks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schedule_rest_breaks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schedule_rest_breaks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schedule_rest_breaks_id_seq OWNED BY public.schedule_rest_breaks.id;


--
-- Name: schedule_routes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_routes (
    id bigint NOT NULL,
    schedule_id bigint NOT NULL,
    shift_team_snapshot_id bigint NOT NULL,
    depot_arrival_timestamp_sec bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE schedule_routes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.schedule_routes IS 'Routes for shift teams in a schedule';


--
-- Name: COLUMN schedule_routes.schedule_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_routes.schedule_id IS 'Schedule this route belongs to';


--
-- Name: COLUMN schedule_routes.shift_team_snapshot_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_routes.shift_team_snapshot_id IS 'Source shift team snapshot';


--
-- Name: COLUMN schedule_routes.depot_arrival_timestamp_sec; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_routes.depot_arrival_timestamp_sec IS 'Time the shift team should arrive back at the depot';


--
-- Name: schedule_routes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schedule_routes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schedule_routes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schedule_routes_id_seq OWNED BY public.schedule_routes.id;


--
-- Name: schedule_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_stats (
    id bigint NOT NULL,
    schedule_id bigint NOT NULL,
    drive_duration_sec bigint,
    drive_distance_meters bigint,
    service_duration_sec bigint
);


--
-- Name: TABLE schedule_stats; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.schedule_stats IS 'Stats for a schedule';


--
-- Name: COLUMN schedule_stats.schedule_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_stats.schedule_id IS 'Associated schedule';


--
-- Name: COLUMN schedule_stats.drive_duration_sec; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_stats.drive_duration_sec IS 'Total driving duration, in seconds';


--
-- Name: COLUMN schedule_stats.drive_distance_meters; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_stats.drive_distance_meters IS 'Total driving distance, in meters';


--
-- Name: COLUMN schedule_stats.service_duration_sec; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_stats.service_duration_sec IS 'Total service duration, in seconds';


--
-- Name: schedule_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schedule_stats_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schedule_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schedule_stats_id_seq OWNED BY public.schedule_stats.id;


--
-- Name: schedule_stops; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_stops (
    id bigint NOT NULL,
    schedule_id bigint NOT NULL,
    schedule_route_id bigint NOT NULL,
    route_index integer NOT NULL,
    schedule_visit_id bigint,
    schedule_rest_break_id bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_stop_type_check CHECK (((((schedule_visit_id IS NOT NULL))::integer + ((schedule_rest_break_id IS NOT NULL))::integer) = 1))
);


--
-- Name: TABLE schedule_stops; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.schedule_stops IS 'Route stops within a schedule';


--
-- Name: COLUMN schedule_stops.schedule_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_stops.schedule_id IS 'Schedule to which the route and stops belong';


--
-- Name: COLUMN schedule_stops.schedule_route_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_stops.schedule_route_id IS 'Route within the schedule to which the stops belong ';


--
-- Name: COLUMN schedule_stops.route_index; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_stops.route_index IS 'Index of the stop within the schedule route';


--
-- Name: COLUMN schedule_stops.schedule_visit_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_stops.schedule_visit_id IS 'Schedule visit at this stop, if not null';


--
-- Name: COLUMN schedule_stops.schedule_rest_break_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_stops.schedule_rest_break_id IS 'Rest break at this stop, if not null';


--
-- Name: schedule_stops_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schedule_stops_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schedule_stops_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schedule_stops_id_seq OWNED BY public.schedule_stops.id;


--
-- Name: schedule_visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_visits (
    id bigint NOT NULL,
    schedule_id bigint NOT NULL,
    schedule_route_id bigint NOT NULL,
    visit_snapshot_id bigint,
    arrival_timestamp_sec bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    service_region_availability_visit_id bigint,
    CONSTRAINT unique_visit_type_check CHECK (((((visit_snapshot_id IS NOT NULL))::integer + ((service_region_availability_visit_id IS NOT NULL))::integer) = 1))
);


--
-- Name: TABLE schedule_visits; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.schedule_visits IS 'Visits for routes on a schedule';


--
-- Name: COLUMN schedule_visits.schedule_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_visits.schedule_id IS 'Schedule this visit belongs to';


--
-- Name: COLUMN schedule_visits.schedule_route_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_visits.schedule_route_id IS 'Route this visit belongs to';


--
-- Name: COLUMN schedule_visits.visit_snapshot_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_visits.visit_snapshot_id IS 'Source visit snapshot';


--
-- Name: COLUMN schedule_visits.arrival_timestamp_sec; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_visits.arrival_timestamp_sec IS 'Arrival timestamp, in seconds';


--
-- Name: COLUMN schedule_visits.service_region_availability_visit_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_visits.service_region_availability_visit_id IS 'The assigned visit to an availability schedule';


--
-- Name: schedule_visits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schedule_visits_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schedule_visits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schedule_visits_id_seq OWNED BY public.schedule_visits.id;


--
-- Name: schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedules (
    id bigint NOT NULL,
    service_region_id bigint NOT NULL,
    optimizer_run_id bigint NOT NULL,
    hard_score bigint NOT NULL,
    unassigned_visits_score bigint NOT NULL,
    soft_score bigint NOT NULL,
    optimizer_version text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE schedules; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.schedules IS 'Schedules generated by optimizer runs';


--
-- Name: COLUMN schedules.service_region_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedules.service_region_id IS 'Service region';


--
-- Name: COLUMN schedules.optimizer_run_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedules.optimizer_run_id IS 'Optimizer run used to produce this schedule';


--
-- Name: COLUMN schedules.hard_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedules.hard_score IS 'Hard score';


--
-- Name: COLUMN schedules.unassigned_visits_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedules.unassigned_visits_score IS 'Score for unassigned visits';


--
-- Name: COLUMN schedules.soft_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedules.soft_score IS 'Soft score';


--
-- Name: COLUMN schedules.optimizer_version; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedules.optimizer_version IS 'Optimizer version used to produce this schedule';


--
-- Name: schedules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schedules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schedules_id_seq OWNED BY public.schedules.id;


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
-- Name: service_region_availability_queries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_region_availability_queries (
    id bigint NOT NULL,
    service_region_id bigint NOT NULL,
    service_date date NOT NULL,
    reference_schedule_id bigint,
    feasibility_status text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE service_region_availability_queries; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.service_region_availability_queries IS 'Service region availability diagnostic information';


--
-- Name: COLUMN service_region_availability_queries.service_region_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_availability_queries.service_region_id IS 'The service region identifier';


--
-- Name: COLUMN service_region_availability_queries.service_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_availability_queries.service_date IS 'The service date for service region availability';


--
-- Name: COLUMN service_region_availability_queries.reference_schedule_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_availability_queries.reference_schedule_id IS 'The reference schedule all availability VRP problems are built against';


--
-- Name: COLUMN service_region_availability_queries.feasibility_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_availability_queries.feasibility_status IS 'One of the logistics.CheckFeasibilityResponse.Status enum values';


--
-- Name: service_region_availability_queries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_region_availability_queries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: service_region_availability_queries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_region_availability_queries_id_seq OWNED BY public.service_region_availability_queries.id;


--
-- Name: service_region_availability_query_attributes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_region_availability_query_attributes (
    id bigint NOT NULL,
    service_region_availability_query_id bigint NOT NULL,
    attribute_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE service_region_availability_query_attributes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.service_region_availability_query_attributes IS 'Join table between service_region_availability_queries and attributes';


--
-- Name: COLUMN service_region_availability_query_attributes.service_region_availability_query_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_availability_query_attributes.service_region_availability_query_id IS 'The associated availability query';


--
-- Name: COLUMN service_region_availability_query_attributes.attribute_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_availability_query_attributes.attribute_id IS 'The associated attribute';


--
-- Name: service_region_availability_query_attributes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_region_availability_query_attributes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: service_region_availability_query_attributes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_region_availability_query_attributes_id_seq OWNED BY public.service_region_availability_query_attributes.id;


--
-- Name: service_region_availability_visit_attributes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_region_availability_visit_attributes (
    id bigint NOT NULL,
    service_region_availability_visit_id bigint NOT NULL,
    attribute_id bigint NOT NULL,
    is_required boolean NOT NULL,
    is_forbidden boolean NOT NULL,
    is_preferred boolean NOT NULL,
    is_unwanted boolean NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE service_region_availability_visit_attributes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.service_region_availability_visit_attributes IS 'Join table between availability_visits and attributes';


--
-- Name: COLUMN service_region_availability_visit_attributes.service_region_availability_visit_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_availability_visit_attributes.service_region_availability_visit_id IS 'The associated availability visit';


--
-- Name: COLUMN service_region_availability_visit_attributes.attribute_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_availability_visit_attributes.attribute_id IS 'The associated attribute';


--
-- Name: COLUMN service_region_availability_visit_attributes.is_required; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_availability_visit_attributes.is_required IS 'Is required';


--
-- Name: COLUMN service_region_availability_visit_attributes.is_forbidden; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_availability_visit_attributes.is_forbidden IS 'Is forbidden';


--
-- Name: COLUMN service_region_availability_visit_attributes.is_preferred; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_availability_visit_attributes.is_preferred IS 'Is preferred';


--
-- Name: COLUMN service_region_availability_visit_attributes.is_unwanted; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_availability_visit_attributes.is_unwanted IS 'Is unwanted';


--
-- Name: service_region_availability_visit_attributes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_region_availability_visit_attributes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: service_region_availability_visit_attributes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_region_availability_visit_attributes_id_seq OWNED BY public.service_region_availability_visit_attributes.id;


--
-- Name: service_region_availability_visit_sets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_region_availability_visit_sets (
    id bigint NOT NULL,
    service_region_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE service_region_availability_visit_sets; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.service_region_availability_visit_sets IS 'Set of the availability visits in a service region';


--
-- Name: COLUMN service_region_availability_visit_sets.service_region_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_availability_visit_sets.service_region_id IS 'The associated service region';


--
-- Name: service_region_availability_visit_sets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_region_availability_visit_sets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: service_region_availability_visit_sets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_region_availability_visit_sets_id_seq OWNED BY public.service_region_availability_visit_sets.id;


--
-- Name: service_region_availability_visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_region_availability_visits (
    id bigint NOT NULL,
    arrival_start_time time without time zone NOT NULL,
    arrival_end_time time without time zone NOT NULL,
    service_region_availability_visit_set_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    location_id bigint NOT NULL,
    service_duration_sec bigint DEFAULT 0 NOT NULL
);


--
-- Name: TABLE service_region_availability_visits; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.service_region_availability_visits IS 'Availability visits for a service region';


--
-- Name: COLUMN service_region_availability_visits.arrival_start_time; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_availability_visits.arrival_start_time IS 'The visit arrival start time';


--
-- Name: COLUMN service_region_availability_visits.arrival_end_time; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_availability_visits.arrival_end_time IS 'The visit arrival end time';


--
-- Name: COLUMN service_region_availability_visits.service_region_availability_visit_set_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_availability_visits.service_region_availability_visit_set_id IS 'The associated set';


--
-- Name: COLUMN service_region_availability_visits.location_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_availability_visits.location_id IS 'The location associated to the visit';


--
-- Name: COLUMN service_region_availability_visits.service_duration_sec; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_availability_visits.service_duration_sec IS 'service duration for availability visits, in seconds';


--
-- Name: service_region_availability_visits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_region_availability_visits_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: service_region_availability_visits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_region_availability_visits_id_seq OWNED BY public.service_region_availability_visits.id;


--
-- Name: service_region_canonical_location_sets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_region_canonical_location_sets (
    id bigint NOT NULL,
    service_region_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE service_region_canonical_location_sets; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.service_region_canonical_location_sets IS 'Sets of canonical locations for service regions';


--
-- Name: COLUMN service_region_canonical_location_sets.service_region_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_canonical_location_sets.service_region_id IS 'Service region';


--
-- Name: service_region_canonical_location_sets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_region_canonical_location_sets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: service_region_canonical_location_sets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_region_canonical_location_sets_id_seq OWNED BY public.service_region_canonical_location_sets.id;


--
-- Name: service_region_canonical_locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_region_canonical_locations (
    id bigint NOT NULL,
    service_region_canonical_location_set_id bigint NOT NULL,
    location_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE service_region_canonical_locations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.service_region_canonical_locations IS 'Canonical location for service region';


--
-- Name: COLUMN service_region_canonical_locations.service_region_canonical_location_set_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_canonical_locations.service_region_canonical_location_set_id IS 'Set of locations that this location belongs to';


--
-- Name: COLUMN service_region_canonical_locations.location_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_canonical_locations.location_id IS 'Location';


--
-- Name: service_region_canonical_locations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_region_canonical_locations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: service_region_canonical_locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_region_canonical_locations_id_seq OWNED BY public.service_region_canonical_locations.id;


--
-- Name: service_region_canonical_visit_durations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_region_canonical_visit_durations (
    id bigint NOT NULL,
    service_region_id bigint NOT NULL,
    service_duration_min_sec bigint NOT NULL,
    service_duration_max_sec bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE service_region_canonical_visit_durations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.service_region_canonical_visit_durations IS 'The visit durations for service regions, for checking feasibility';


--
-- Name: COLUMN service_region_canonical_visit_durations.service_region_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_canonical_visit_durations.service_region_id IS 'Service region';


--
-- Name: COLUMN service_region_canonical_visit_durations.service_duration_min_sec; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_canonical_visit_durations.service_duration_min_sec IS 'Minimal visit duration';


--
-- Name: COLUMN service_region_canonical_visit_durations.service_duration_max_sec; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_canonical_visit_durations.service_duration_max_sec IS 'Maximum visit duration';


--
-- Name: service_region_canonical_visit_durations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_region_canonical_visit_durations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: service_region_canonical_visit_durations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_region_canonical_visit_durations_id_seq OWNED BY public.service_region_canonical_visit_durations.id;


--
-- Name: service_region_minimal_visit_durations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_region_minimal_visit_durations (
    id bigint NOT NULL,
    service_region_id bigint NOT NULL,
    service_duration_sec bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE service_region_minimal_visit_durations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.service_region_minimal_visit_durations IS 'Minimum visit durations for service regions, for checking feasibility';


--
-- Name: COLUMN service_region_minimal_visit_durations.service_region_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_minimal_visit_durations.service_region_id IS 'Service region';


--
-- Name: COLUMN service_region_minimal_visit_durations.service_duration_sec; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_minimal_visit_durations.service_duration_sec IS 'Minimal visit duration';


--
-- Name: service_region_minimal_visit_durations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_region_minimal_visit_durations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: service_region_minimal_visit_durations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_region_minimal_visit_durations_id_seq OWNED BY public.service_region_minimal_visit_durations.id;


--
-- Name: service_region_open_hours_schedule_days; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_region_open_hours_schedule_days (
    id bigint NOT NULL,
    service_region_open_hours_schedule_id bigint NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE service_region_open_hours_schedule_days; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.service_region_open_hours_schedule_days IS 'Per day open hours in service region';


--
-- Name: COLUMN service_region_open_hours_schedule_days.service_region_open_hours_schedule_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_open_hours_schedule_days.service_region_open_hours_schedule_id IS 'Schedule for this day';


--
-- Name: COLUMN service_region_open_hours_schedule_days.day_of_week; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_open_hours_schedule_days.day_of_week IS 'Day of week (Sunday = 0, Monday = 1, ...)';


--
-- Name: COLUMN service_region_open_hours_schedule_days.start_time; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_open_hours_schedule_days.start_time IS 'Opening time on day, inclusive';


--
-- Name: COLUMN service_region_open_hours_schedule_days.end_time; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_open_hours_schedule_days.end_time IS 'Closing time on day, inclusive';


--
-- Name: service_region_open_hours_schedule_days_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_region_open_hours_schedule_days_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: service_region_open_hours_schedule_days_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_region_open_hours_schedule_days_id_seq OWNED BY public.service_region_open_hours_schedule_days.id;


--
-- Name: service_region_open_hours_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_region_open_hours_schedules (
    id bigint NOT NULL,
    service_region_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE service_region_open_hours_schedules; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.service_region_open_hours_schedules IS 'Schedule of open hours for service regions';


--
-- Name: COLUMN service_region_open_hours_schedules.service_region_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_region_open_hours_schedules.service_region_id IS 'Service region';


--
-- Name: service_region_open_hours_schedules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_region_open_hours_schedules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: service_region_open_hours_schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_region_open_hours_schedules_id_seq OWNED BY public.service_region_open_hours_schedules.id;


--
-- Name: service_regions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_regions (
    id bigint NOT NULL,
    description text NOT NULL,
    iana_time_zone_name text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE service_regions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.service_regions IS 'Service regions are aggregated markets in a geographical region';


--
-- Name: COLUMN service_regions.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_regions.description IS 'Description of the service region';


--
-- Name: COLUMN service_regions.iana_time_zone_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_regions.iana_time_zone_name IS 'Time zone for service region in IANA format (https://www.iana.org/time-zones)';


--
-- Name: service_regions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_regions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: service_regions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_regions_id_seq OWNED BY public.service_regions.id;


--
-- Name: shift_team_attributes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shift_team_attributes (
    id bigint NOT NULL,
    shift_team_snapshot_id bigint NOT NULL,
    attribute_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE shift_team_attributes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.shift_team_attributes IS 'Shift team attributes';


--
-- Name: COLUMN shift_team_attributes.shift_team_snapshot_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.shift_team_attributes.shift_team_snapshot_id IS 'Shift team snapshot';


--
-- Name: COLUMN shift_team_attributes.attribute_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.shift_team_attributes.attribute_id IS 'Attribute';


--
-- Name: shift_team_attributes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shift_team_attributes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shift_team_attributes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shift_team_attributes_id_seq OWNED BY public.shift_team_attributes.id;


--
-- Name: shift_team_locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shift_team_locations (
    id bigint NOT NULL,
    shift_team_snapshot_id bigint NOT NULL,
    location_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE shift_team_locations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.shift_team_locations IS 'Location history for shift team snapshots';


--
-- Name: COLUMN shift_team_locations.shift_team_snapshot_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.shift_team_locations.shift_team_snapshot_id IS 'Shift team snapshot';


--
-- Name: COLUMN shift_team_locations.location_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.shift_team_locations.location_id IS 'Location';


--
-- Name: shift_team_locations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shift_team_locations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shift_team_locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shift_team_locations_id_seq OWNED BY public.shift_team_locations.id;


--
-- Name: shift_team_rest_break_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shift_team_rest_break_requests (
    id bigint NOT NULL,
    shift_team_id bigint NOT NULL,
    start_timestamp_sec bigint NOT NULL,
    duration_sec bigint NOT NULL,
    location_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE shift_team_rest_break_requests; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.shift_team_rest_break_requests IS 'Shift team break requests received via API';


--
-- Name: COLUMN shift_team_rest_break_requests.shift_team_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.shift_team_rest_break_requests.shift_team_id IS 'Shift team that requested the break';


--
-- Name: COLUMN shift_team_rest_break_requests.start_timestamp_sec; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.shift_team_rest_break_requests.start_timestamp_sec IS 'Start timestamp of the requested break';


--
-- Name: COLUMN shift_team_rest_break_requests.duration_sec; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.shift_team_rest_break_requests.duration_sec IS 'Length of the requested break, in seconds';


--
-- Name: COLUMN shift_team_rest_break_requests.location_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.shift_team_rest_break_requests.location_id IS 'Location associated with the break request';


--
-- Name: shift_team_rest_break_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shift_team_rest_break_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shift_team_rest_break_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shift_team_rest_break_requests_id_seq OWNED BY public.shift_team_rest_break_requests.id;


--
-- Name: shift_team_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shift_team_snapshots (
    id bigint NOT NULL,
    shift_team_id bigint NOT NULL,
    service_region_id bigint NOT NULL,
    base_location_id bigint NOT NULL,
    start_timestamp_sec bigint NOT NULL,
    end_timestamp_sec bigint NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    num_app_members integer DEFAULT 0 NOT NULL,
    num_dhmt_members integer DEFAULT 0 NOT NULL,
    CONSTRAINT shift_team_snapshots_valid_time_window CHECK ((start_timestamp_sec < end_timestamp_sec))
);


--
-- Name: TABLE shift_team_snapshots; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.shift_team_snapshots IS 'Snapshots of shift team data';


--
-- Name: COLUMN shift_team_snapshots.shift_team_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.shift_team_snapshots.shift_team_id IS 'Shift team ID';


--
-- Name: COLUMN shift_team_snapshots.service_region_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.shift_team_snapshots.service_region_id IS 'Service region';


--
-- Name: COLUMN shift_team_snapshots.base_location_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.shift_team_snapshots.base_location_id IS 'Location';


--
-- Name: COLUMN shift_team_snapshots.start_timestamp_sec; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.shift_team_snapshots.start_timestamp_sec IS 'Shift start timestamp, in seconds';


--
-- Name: COLUMN shift_team_snapshots.end_timestamp_sec; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.shift_team_snapshots.end_timestamp_sec IS 'Shift end timestamp, in seconds';


--
-- Name: COLUMN shift_team_snapshots.num_app_members; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.shift_team_snapshots.num_app_members IS 'number of members that are APP on the shift team.';


--
-- Name: COLUMN shift_team_snapshots.num_dhmt_members; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.shift_team_snapshots.num_dhmt_members IS 'number of members that are DHMT on the shift team.';


--
-- Name: shift_team_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shift_team_snapshots_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shift_team_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shift_team_snapshots_id_seq OWNED BY public.shift_team_snapshots.id;


--
-- Name: unassigned_schedule_visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unassigned_schedule_visits (
    id bigint NOT NULL,
    schedule_id bigint NOT NULL,
    visit_snapshot_id bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    service_region_availability_visit_id bigint,
    CONSTRAINT unassigned_schedule_visits_unique_visit_type_check CHECK (((((visit_snapshot_id IS NOT NULL))::integer + ((service_region_availability_visit_id IS NOT NULL))::integer) = 1))
);


--
-- Name: TABLE unassigned_schedule_visits; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.unassigned_schedule_visits IS 'Known unassigned visits on a schedule. These are accepted visits that the optimizer could not fit into a feasible schedule, but will keep trying. If the situation persists, manual intervention may be needed.';


--
-- Name: COLUMN unassigned_schedule_visits.schedule_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.unassigned_schedule_visits.schedule_id IS 'Schedule this unassigned visit belongs to';


--
-- Name: COLUMN unassigned_schedule_visits.visit_snapshot_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.unassigned_schedule_visits.visit_snapshot_id IS 'Source visit snapshot';


--
-- Name: COLUMN unassigned_schedule_visits.service_region_availability_visit_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.unassigned_schedule_visits.service_region_availability_visit_id IS 'The unassigned visit to an availability schedule';


--
-- Name: unassigned_schedule_visits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.unassigned_schedule_visits_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: unassigned_schedule_visits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.unassigned_schedule_visits_id_seq OWNED BY public.unassigned_schedule_visits.id;


--
-- Name: virtual_app_visit_phase_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.virtual_app_visit_phase_snapshots (
    id bigint NOT NULL,
    visit_snapshot_id bigint NOT NULL,
    virtual_app_visit_phase_type_id bigint NOT NULL,
    visit_phase_source_type_id bigint NOT NULL,
    station_user_id bigint,
    shift_team_id bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE virtual_app_visit_phase_snapshots; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.virtual_app_visit_phase_snapshots IS 'Snapshots of visit APP phases, 1:1 with telepresentation visit_snapshots';


--
-- Name: COLUMN virtual_app_visit_phase_snapshots.visit_snapshot_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.virtual_app_visit_phase_snapshots.visit_snapshot_id IS 'Visit snapshot ID for the virtual APP visit phase';


--
-- Name: COLUMN virtual_app_visit_phase_snapshots.virtual_app_visit_phase_type_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.virtual_app_visit_phase_snapshots.virtual_app_visit_phase_type_id IS 'Virtual APP visit phase type';


--
-- Name: COLUMN virtual_app_visit_phase_snapshots.visit_phase_source_type_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.virtual_app_visit_phase_snapshots.visit_phase_source_type_id IS 'Virtual APP visit phase source type';


--
-- Name: COLUMN virtual_app_visit_phase_snapshots.station_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.virtual_app_visit_phase_snapshots.station_user_id IS 'Station User ID that added this virtual APP visit phase';


--
-- Name: COLUMN virtual_app_visit_phase_snapshots.shift_team_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.virtual_app_visit_phase_snapshots.shift_team_id IS 'The shift team associated with the care requests status';


--
-- Name: virtual_app_visit_phase_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.virtual_app_visit_phase_snapshots_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: virtual_app_visit_phase_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.virtual_app_visit_phase_snapshots_id_seq OWNED BY public.virtual_app_visit_phase_snapshots.id;


--
-- Name: virtual_app_visit_phase_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.virtual_app_visit_phase_types (
    id bigint NOT NULL,
    short_name text,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE virtual_app_visit_phase_types; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.virtual_app_visit_phase_types IS 'Status of visits as members of Virtual APP shifts interact with them';


--
-- Name: COLUMN virtual_app_visit_phase_types.short_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.virtual_app_visit_phase_types.short_name IS 'Short name for Virtual APP phase';


--
-- Name: COLUMN virtual_app_visit_phase_types.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.virtual_app_visit_phase_types.description IS 'Description of the virtual APP phase';


--
-- Name: virtual_app_visit_phase_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.virtual_app_visit_phase_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: virtual_app_visit_phase_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.virtual_app_visit_phase_types_id_seq OWNED BY public.virtual_app_visit_phase_types.id;


--
-- Name: visit_acuity_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visit_acuity_snapshots (
    id bigint NOT NULL,
    visit_snapshot_id bigint NOT NULL,
    clinical_urgency_level_id bigint,
    patient_age bigint,
    chief_complaint text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE visit_acuity_snapshots; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.visit_acuity_snapshots IS 'Acuity information for a visit snapshot';


--
-- Name: COLUMN visit_acuity_snapshots.visit_snapshot_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_acuity_snapshots.visit_snapshot_id IS 'Visit Snapshot ID';


--
-- Name: COLUMN visit_acuity_snapshots.clinical_urgency_level_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_acuity_snapshots.clinical_urgency_level_id IS 'Clinical urgency level';


--
-- Name: COLUMN visit_acuity_snapshots.patient_age; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_acuity_snapshots.patient_age IS 'Age of the patient';


--
-- Name: COLUMN visit_acuity_snapshots.chief_complaint; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_acuity_snapshots.chief_complaint IS 'The protocol name from the risk strat record';


--
-- Name: visit_acuity_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.visit_acuity_snapshots_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: visit_acuity_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.visit_acuity_snapshots_id_seq OWNED BY public.visit_acuity_snapshots.id;


--
-- Name: visit_attributes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visit_attributes (
    id bigint NOT NULL,
    visit_snapshot_id bigint NOT NULL,
    attribute_id bigint NOT NULL,
    is_required boolean NOT NULL,
    is_forbidden boolean NOT NULL,
    is_preferred boolean NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_unwanted boolean DEFAULT false
);


--
-- Name: TABLE visit_attributes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.visit_attributes IS 'Visit attributes';


--
-- Name: COLUMN visit_attributes.visit_snapshot_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_attributes.visit_snapshot_id IS 'Visit snapshot';


--
-- Name: COLUMN visit_attributes.attribute_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_attributes.attribute_id IS 'Attribute';


--
-- Name: COLUMN visit_attributes.is_required; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_attributes.is_required IS 'Is a required attribute';


--
-- Name: COLUMN visit_attributes.is_forbidden; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_attributes.is_forbidden IS 'Is a forbidden attribute';


--
-- Name: COLUMN visit_attributes.is_unwanted; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_attributes.is_unwanted IS 'Is unwanted attribute';


--
-- Name: visit_attributes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.visit_attributes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: visit_attributes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.visit_attributes_id_seq OWNED BY public.visit_attributes.id;


--
-- Name: visit_phase_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visit_phase_snapshots (
    id bigint NOT NULL,
    visit_snapshot_id bigint NOT NULL,
    visit_phase_type_id bigint NOT NULL,
    visit_phase_source_type_id bigint NOT NULL,
    station_user_id bigint,
    status_created_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    shift_team_id bigint
);


--
-- Name: TABLE visit_phase_snapshots; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.visit_phase_snapshots IS 'Snapshots of visit phases, 1:1 with visit_snapshots';


--
-- Name: COLUMN visit_phase_snapshots.visit_snapshot_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_phase_snapshots.visit_snapshot_id IS 'Visit snapshot ID for the phase';


--
-- Name: COLUMN visit_phase_snapshots.visit_phase_type_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_phase_snapshots.visit_phase_type_id IS 'Visit phase source type, user role who took the action';


--
-- Name: COLUMN visit_phase_snapshots.station_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_phase_snapshots.station_user_id IS 'Station User ID that added this visit phase';


--
-- Name: COLUMN visit_phase_snapshots.status_created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_phase_snapshots.status_created_at IS 'Timestamp of when the care request status was created, before this row creation';


--
-- Name: COLUMN visit_phase_snapshots.shift_team_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_phase_snapshots.shift_team_id IS 'the shift team id associated with the care requests status';


--
-- Name: visit_phase_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.visit_phase_snapshots_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: visit_phase_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.visit_phase_snapshots_id_seq OWNED BY public.visit_phase_snapshots.id;


--
-- Name: visit_phase_source_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visit_phase_source_types (
    id bigint NOT NULL,
    short_name text NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE visit_phase_source_types; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.visit_phase_source_types IS 'Source types of visit phase information';


--
-- Name: COLUMN visit_phase_source_types.short_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_phase_source_types.short_name IS 'Short name of the visit phase source type';


--
-- Name: COLUMN visit_phase_source_types.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_phase_source_types.description IS 'Description of the visit phase source type';


--
-- Name: visit_phase_source_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.visit_phase_source_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: visit_phase_source_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.visit_phase_source_types_id_seq OWNED BY public.visit_phase_source_types.id;


--
-- Name: visit_phase_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visit_phase_types (
    id bigint NOT NULL,
    short_name text NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE visit_phase_types; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.visit_phase_types IS 'Types of visit phases';


--
-- Name: COLUMN visit_phase_types.short_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_phase_types.short_name IS 'Short name of the visit phase type';


--
-- Name: COLUMN visit_phase_types.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_phase_types.description IS 'Description of the visit phase type';


--
-- Name: visit_phase_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.visit_phase_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: visit_phase_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.visit_phase_types_id_seq OWNED BY public.visit_phase_types.id;


--
-- Name: visit_priority_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visit_priority_snapshots (
    id bigint NOT NULL,
    visit_snapshot_id bigint NOT NULL,
    requested_by_user_id bigint,
    requested_timestamp_sec bigint,
    note text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE visit_priority_snapshots; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.visit_priority_snapshots IS 'Priority information for a visit snapshot';


--
-- Name: COLUMN visit_priority_snapshots.visit_snapshot_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_priority_snapshots.visit_snapshot_id IS 'Visit Snapshot ID';


--
-- Name: COLUMN visit_priority_snapshots.requested_by_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_priority_snapshots.requested_by_user_id IS 'Station User ID that prioritized the visit';


--
-- Name: COLUMN visit_priority_snapshots.requested_timestamp_sec; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_priority_snapshots.requested_timestamp_sec IS 'Timestamp of the prioritization of the visit';


--
-- Name: COLUMN visit_priority_snapshots.note; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_priority_snapshots.note IS 'Note explaining the reason for the prioritization of the visit';


--
-- Name: visit_priority_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.visit_priority_snapshots_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: visit_priority_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.visit_priority_snapshots_id_seq OWNED BY public.visit_priority_snapshots.id;


--
-- Name: visit_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visit_snapshots (
    id bigint NOT NULL,
    care_request_id bigint NOT NULL,
    service_region_id bigint NOT NULL,
    location_id bigint NOT NULL,
    arrival_start_timestamp_sec bigint,
    arrival_end_timestamp_sec bigint,
    service_duration_sec bigint NOT NULL,
    is_manual_override boolean NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT visit_snapshots_valid_arrival_time_window CHECK ((arrival_start_timestamp_sec < arrival_end_timestamp_sec))
);


--
-- Name: TABLE visit_snapshots; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.visit_snapshots IS 'Snapshots of visit data';


--
-- Name: COLUMN visit_snapshots.care_request_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_snapshots.care_request_id IS 'Care request ID';


--
-- Name: COLUMN visit_snapshots.service_region_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_snapshots.service_region_id IS 'Service region';


--
-- Name: COLUMN visit_snapshots.location_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_snapshots.location_id IS 'Location';


--
-- Name: COLUMN visit_snapshots.arrival_start_timestamp_sec; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_snapshots.arrival_start_timestamp_sec IS 'Visit arrival time window start timestamp, in seconds';


--
-- Name: COLUMN visit_snapshots.arrival_end_timestamp_sec; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_snapshots.arrival_end_timestamp_sec IS 'Visit arrival time window end timestamp, in seconds';


--
-- Name: COLUMN visit_snapshots.service_duration_sec; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_snapshots.service_duration_sec IS 'Service duration, in seconds';


--
-- Name: visit_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.visit_snapshots_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: visit_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.visit_snapshots_id_seq OWNED BY public.visit_snapshots.id;


--
-- Name: visit_value_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visit_value_snapshots (
    id bigint NOT NULL,
    visit_snapshot_id bigint NOT NULL,
    completion_value_cents bigint,
    partner_priority_score bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    partner_influenced_completion_value_cents bigint
);


--
-- Name: TABLE visit_value_snapshots; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.visit_value_snapshots IS 'Computed values for a given visit snapshot based on potential revenue and partner priority';


--
-- Name: COLUMN visit_value_snapshots.visit_snapshot_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_value_snapshots.visit_snapshot_id IS 'The visit snapshot the value data belongs to';


--
-- Name: COLUMN visit_value_snapshots.completion_value_cents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_value_snapshots.completion_value_cents IS 'Number of 1/100 points for completing the care request';


--
-- Name: COLUMN visit_value_snapshots.partner_priority_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_value_snapshots.partner_priority_score IS 'Score given to prioritize a partner visit';


--
-- Name: COLUMN visit_value_snapshots.partner_influenced_completion_value_cents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_value_snapshots.partner_influenced_completion_value_cents IS 'The calculated number of 1/100 points for completing a care request using partner priority score';


--
-- Name: visit_value_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.visit_value_snapshots_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: visit_value_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.visit_value_snapshots_id_seq OWNED BY public.visit_value_snapshots.id;


--
-- Name: attributes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attributes ALTER COLUMN id SET DEFAULT nextval('public.attributes_id_seq'::regclass);


--
-- Name: check_feasibility_queries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.check_feasibility_queries ALTER COLUMN id SET DEFAULT nextval('public.check_feasibility_queries_id_seq'::regclass);


--
-- Name: check_feasibility_query_attributes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.check_feasibility_query_attributes ALTER COLUMN id SET DEFAULT nextval('public.check_feasibility_query_attributes_id_seq'::regclass);


--
-- Name: clinical_urgency_level_configs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_urgency_level_configs ALTER COLUMN id SET DEFAULT nextval('public.clinical_urgency_level_configs_id_seq'::regclass);


--
-- Name: clinical_urgency_levels id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_urgency_levels ALTER COLUMN id SET DEFAULT nextval('public.clinical_urgency_levels_id_seq'::regclass);


--
-- Name: distance_sources id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.distance_sources ALTER COLUMN id SET DEFAULT nextval('public.distance_sources_id_seq'::regclass);


--
-- Name: distances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.distances ALTER COLUMN id SET DEFAULT nextval('public.distances_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- Name: markets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markets ALTER COLUMN id SET DEFAULT nextval('public.markets_id_seq'::regclass);


--
-- Name: optimizer_configs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimizer_configs ALTER COLUMN id SET DEFAULT nextval('public.optimizer_configs_id_seq'::regclass);


--
-- Name: optimizer_constraint_configs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimizer_constraint_configs ALTER COLUMN id SET DEFAULT nextval('public.optimizer_constraint_configs_id_seq'::regclass);


--
-- Name: optimizer_run_error_sources id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimizer_run_error_sources ALTER COLUMN id SET DEFAULT nextval('public.optimizer_run_error_sources_id_seq'::regclass);


--
-- Name: optimizer_run_errors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimizer_run_errors ALTER COLUMN id SET DEFAULT nextval('public.optimizer_run_errors_id_seq'::regclass);


--
-- Name: optimizer_run_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimizer_run_types ALTER COLUMN id SET DEFAULT nextval('public.optimizer_run_types_id_seq'::regclass);


--
-- Name: optimizer_runs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimizer_runs ALTER COLUMN id SET DEFAULT nextval('public.optimizer_runs_id_seq'::regclass);


--
-- Name: optimizer_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimizer_settings ALTER COLUMN id SET DEFAULT nextval('public.optimizer_settings_id_seq'::regclass);


--
-- Name: schedule_diagnostics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_diagnostics ALTER COLUMN id SET DEFAULT nextval('public.schedule_diagnostics_id_seq'::regclass);


--
-- Name: schedule_rest_breaks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_rest_breaks ALTER COLUMN id SET DEFAULT nextval('public.schedule_rest_breaks_id_seq'::regclass);


--
-- Name: schedule_routes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_routes ALTER COLUMN id SET DEFAULT nextval('public.schedule_routes_id_seq'::regclass);


--
-- Name: schedule_stats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_stats ALTER COLUMN id SET DEFAULT nextval('public.schedule_stats_id_seq'::regclass);


--
-- Name: schedule_stops id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_stops ALTER COLUMN id SET DEFAULT nextval('public.schedule_stops_id_seq'::regclass);


--
-- Name: schedule_visits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_visits ALTER COLUMN id SET DEFAULT nextval('public.schedule_visits_id_seq'::regclass);


--
-- Name: schedules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedules ALTER COLUMN id SET DEFAULT nextval('public.schedules_id_seq'::regclass);


--
-- Name: schema_migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations ALTER COLUMN id SET DEFAULT nextval('public.schema_migrations_id_seq'::regclass);


--
-- Name: service_region_availability_queries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_region_availability_queries ALTER COLUMN id SET DEFAULT nextval('public.service_region_availability_queries_id_seq'::regclass);


--
-- Name: service_region_availability_query_attributes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_region_availability_query_attributes ALTER COLUMN id SET DEFAULT nextval('public.service_region_availability_query_attributes_id_seq'::regclass);


--
-- Name: service_region_availability_visit_attributes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_region_availability_visit_attributes ALTER COLUMN id SET DEFAULT nextval('public.service_region_availability_visit_attributes_id_seq'::regclass);


--
-- Name: service_region_availability_visit_sets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_region_availability_visit_sets ALTER COLUMN id SET DEFAULT nextval('public.service_region_availability_visit_sets_id_seq'::regclass);


--
-- Name: service_region_availability_visits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_region_availability_visits ALTER COLUMN id SET DEFAULT nextval('public.service_region_availability_visits_id_seq'::regclass);


--
-- Name: service_region_canonical_location_sets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_region_canonical_location_sets ALTER COLUMN id SET DEFAULT nextval('public.service_region_canonical_location_sets_id_seq'::regclass);


--
-- Name: service_region_canonical_locations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_region_canonical_locations ALTER COLUMN id SET DEFAULT nextval('public.service_region_canonical_locations_id_seq'::regclass);


--
-- Name: service_region_canonical_visit_durations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_region_canonical_visit_durations ALTER COLUMN id SET DEFAULT nextval('public.service_region_canonical_visit_durations_id_seq'::regclass);


--
-- Name: service_region_minimal_visit_durations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_region_minimal_visit_durations ALTER COLUMN id SET DEFAULT nextval('public.service_region_minimal_visit_durations_id_seq'::regclass);


--
-- Name: service_region_open_hours_schedule_days id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_region_open_hours_schedule_days ALTER COLUMN id SET DEFAULT nextval('public.service_region_open_hours_schedule_days_id_seq'::regclass);


--
-- Name: service_region_open_hours_schedules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_region_open_hours_schedules ALTER COLUMN id SET DEFAULT nextval('public.service_region_open_hours_schedules_id_seq'::regclass);


--
-- Name: service_regions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_regions ALTER COLUMN id SET DEFAULT nextval('public.service_regions_id_seq'::regclass);


--
-- Name: shift_team_attributes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_team_attributes ALTER COLUMN id SET DEFAULT nextval('public.shift_team_attributes_id_seq'::regclass);


--
-- Name: shift_team_locations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_team_locations ALTER COLUMN id SET DEFAULT nextval('public.shift_team_locations_id_seq'::regclass);


--
-- Name: shift_team_rest_break_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_team_rest_break_requests ALTER COLUMN id SET DEFAULT nextval('public.shift_team_rest_break_requests_id_seq'::regclass);


--
-- Name: shift_team_snapshots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_team_snapshots ALTER COLUMN id SET DEFAULT nextval('public.shift_team_snapshots_id_seq'::regclass);


--
-- Name: unassigned_schedule_visits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unassigned_schedule_visits ALTER COLUMN id SET DEFAULT nextval('public.unassigned_schedule_visits_id_seq'::regclass);


--
-- Name: virtual_app_visit_phase_snapshots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.virtual_app_visit_phase_snapshots ALTER COLUMN id SET DEFAULT nextval('public.virtual_app_visit_phase_snapshots_id_seq'::regclass);


--
-- Name: virtual_app_visit_phase_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.virtual_app_visit_phase_types ALTER COLUMN id SET DEFAULT nextval('public.virtual_app_visit_phase_types_id_seq'::regclass);


--
-- Name: visit_acuity_snapshots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_acuity_snapshots ALTER COLUMN id SET DEFAULT nextval('public.visit_acuity_snapshots_id_seq'::regclass);


--
-- Name: visit_attributes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_attributes ALTER COLUMN id SET DEFAULT nextval('public.visit_attributes_id_seq'::regclass);


--
-- Name: visit_phase_snapshots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_phase_snapshots ALTER COLUMN id SET DEFAULT nextval('public.visit_phase_snapshots_id_seq'::regclass);


--
-- Name: visit_phase_source_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_phase_source_types ALTER COLUMN id SET DEFAULT nextval('public.visit_phase_source_types_id_seq'::regclass);


--
-- Name: visit_phase_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_phase_types ALTER COLUMN id SET DEFAULT nextval('public.visit_phase_types_id_seq'::regclass);


--
-- Name: visit_priority_snapshots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_priority_snapshots ALTER COLUMN id SET DEFAULT nextval('public.visit_priority_snapshots_id_seq'::regclass);


--
-- Name: visit_snapshots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_snapshots ALTER COLUMN id SET DEFAULT nextval('public.visit_snapshots_id_seq'::regclass);


--
-- Name: visit_value_snapshots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_value_snapshots ALTER COLUMN id SET DEFAULT nextval('public.visit_value_snapshots_id_seq'::regclass);


--
-- Name: attributes attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attributes
    ADD CONSTRAINT attributes_pkey PRIMARY KEY (id);


--
-- Name: attributes attributes_unique_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attributes
    ADD CONSTRAINT attributes_unique_name UNIQUE (name);


--
-- Name: CONSTRAINT attributes_unique_name ON attributes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT attributes_unique_name ON public.attributes IS 'Unique index on attribute names';


--
-- Name: check_feasibility_queries check_feasibility_queries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.check_feasibility_queries
    ADD CONSTRAINT check_feasibility_queries_pkey PRIMARY KEY (id);


--
-- Name: check_feasibility_query_attributes check_feasibility_query_attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.check_feasibility_query_attributes
    ADD CONSTRAINT check_feasibility_query_attributes_pkey PRIMARY KEY (id);


--
-- Name: clinical_urgency_level_configs clinical_urgency_level_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_urgency_level_configs
    ADD CONSTRAINT clinical_urgency_level_configs_pkey PRIMARY KEY (id);


--
-- Name: clinical_urgency_levels clinical_urgency_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_urgency_levels
    ADD CONSTRAINT clinical_urgency_levels_pkey PRIMARY KEY (id);


--
-- Name: distance_sources distance_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.distance_sources
    ADD CONSTRAINT distance_sources_pkey PRIMARY KEY (id);


--
-- Name: distances distances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.distances
    ADD CONSTRAINT distances_pkey PRIMARY KEY (id);


--
-- Name: locations location_unique_lat_lng; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT location_unique_lat_lng UNIQUE (latitude_e6, longitude_e6);


--
-- Name: CONSTRAINT location_unique_lat_lng ON locations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT location_unique_lat_lng ON public.locations IS 'Unique index of locations';


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
-- Name: optimizer_configs optimizer_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimizer_configs
    ADD CONSTRAINT optimizer_configs_pkey PRIMARY KEY (id);


--
-- Name: optimizer_constraint_configs optimizer_constraint_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimizer_constraint_configs
    ADD CONSTRAINT optimizer_constraint_configs_pkey PRIMARY KEY (id);


--
-- Name: optimizer_constraint_configs optimizer_constraint_configs_unique_configs; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimizer_constraint_configs
    ADD CONSTRAINT optimizer_constraint_configs_unique_configs UNIQUE (config);


--
-- Name: optimizer_run_error_sources optimizer_run_error_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimizer_run_error_sources
    ADD CONSTRAINT optimizer_run_error_sources_pkey PRIMARY KEY (id);


--
-- Name: optimizer_run_errors optimizer_run_errors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimizer_run_errors
    ADD CONSTRAINT optimizer_run_errors_pkey PRIMARY KEY (id);


--
-- Name: optimizer_run_types optimizer_run_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimizer_run_types
    ADD CONSTRAINT optimizer_run_types_pkey PRIMARY KEY (id);


--
-- Name: optimizer_runs optimizer_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimizer_runs
    ADD CONSTRAINT optimizer_runs_pkey PRIMARY KEY (id);


--
-- Name: optimizer_settings optimizer_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimizer_settings
    ADD CONSTRAINT optimizer_settings_pkey PRIMARY KEY (id);


--
-- Name: optimizer_settings optimizer_settings_unique_settings; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimizer_settings
    ADD CONSTRAINT optimizer_settings_unique_settings UNIQUE (settings);


--
-- Name: schedule_diagnostics schedule_diagnostics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_diagnostics
    ADD CONSTRAINT schedule_diagnostics_pkey PRIMARY KEY (id);


--
-- Name: schedule_rest_breaks schedule_rest_breaks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_rest_breaks
    ADD CONSTRAINT schedule_rest_breaks_pkey PRIMARY KEY (id);


--
-- Name: schedule_routes schedule_routes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_routes
    ADD CONSTRAINT schedule_routes_pkey PRIMARY KEY (id);


--
-- Name: schedule_stats schedule_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_stats
    ADD CONSTRAINT schedule_stats_pkey PRIMARY KEY (id);


--
-- Name: schedule_stops schedule_stops_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_stops
    ADD CONSTRAINT schedule_stops_pkey PRIMARY KEY (id);


--
-- Name: schedule_visits schedule_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_visits
    ADD CONSTRAINT schedule_visits_pkey PRIMARY KEY (id);


--
-- Name: schedules schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);


--
-- Name: service_region_availability_queries service_region_availability_queries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_region_availability_queries
    ADD CONSTRAINT service_region_availability_queries_pkey PRIMARY KEY (id);


--
-- Name: service_region_availability_query_attributes service_region_availability_query_attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_region_availability_query_attributes
    ADD CONSTRAINT service_region_availability_query_attributes_pkey PRIMARY KEY (id);


--
-- Name: service_region_availability_visit_attributes service_region_availability_visit_attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_region_availability_visit_attributes
    ADD CONSTRAINT service_region_availability_visit_attributes_pkey PRIMARY KEY (id);


--
-- Name: service_region_availability_visit_sets service_region_availability_visit_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_region_availability_visit_sets
    ADD CONSTRAINT service_region_availability_visit_sets_pkey PRIMARY KEY (id);


--
-- Name: service_region_availability_visits service_region_availability_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_region_availability_visits
    ADD CONSTRAINT service_region_availability_visits_pkey PRIMARY KEY (id);


--
-- Name: service_region_canonical_location_sets service_region_canonical_location_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_region_canonical_location_sets
    ADD CONSTRAINT service_region_canonical_location_sets_pkey PRIMARY KEY (id);


--
-- Name: service_region_canonical_locations service_region_canonical_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_region_canonical_locations
    ADD CONSTRAINT service_region_canonical_locations_pkey PRIMARY KEY (id);


--
-- Name: service_region_canonical_visit_durations service_region_canonical_visit_durations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_region_canonical_visit_durations
    ADD CONSTRAINT service_region_canonical_visit_durations_pkey PRIMARY KEY (id);


--
-- Name: service_region_minimal_visit_durations service_region_minimal_visit_durations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_region_minimal_visit_durations
    ADD CONSTRAINT service_region_minimal_visit_durations_pkey PRIMARY KEY (id);


--
-- Name: service_region_open_hours_schedule_days service_region_open_hours_schedule_days_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_region_open_hours_schedule_days
    ADD CONSTRAINT service_region_open_hours_schedule_days_pkey PRIMARY KEY (id);


--
-- Name: service_region_open_hours_schedules service_region_open_hours_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_region_open_hours_schedules
    ADD CONSTRAINT service_region_open_hours_schedules_pkey PRIMARY KEY (id);


--
-- Name: service_regions service_regions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_regions
    ADD CONSTRAINT service_regions_pkey PRIMARY KEY (id);


--
-- Name: shift_team_attributes shift_team_attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_team_attributes
    ADD CONSTRAINT shift_team_attributes_pkey PRIMARY KEY (id);


--
-- Name: shift_team_attributes shift_team_attributes_unique_shift_attribute; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_team_attributes
    ADD CONSTRAINT shift_team_attributes_unique_shift_attribute UNIQUE (shift_team_snapshot_id, attribute_id);


--
-- Name: CONSTRAINT shift_team_attributes_unique_shift_attribute ON shift_team_attributes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT shift_team_attributes_unique_shift_attribute ON public.shift_team_attributes IS 'Unique index on shift team attributes';


--
-- Name: shift_team_locations shift_team_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_team_locations
    ADD CONSTRAINT shift_team_locations_pkey PRIMARY KEY (id);


--
-- Name: shift_team_rest_break_requests shift_team_rest_break_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_team_rest_break_requests
    ADD CONSTRAINT shift_team_rest_break_requests_pkey PRIMARY KEY (id);


--
-- Name: shift_team_snapshots shift_team_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_team_snapshots
    ADD CONSTRAINT shift_team_snapshots_pkey PRIMARY KEY (id);


--
-- Name: unassigned_schedule_visits unassigned_schedule_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unassigned_schedule_visits
    ADD CONSTRAINT unassigned_schedule_visits_pkey PRIMARY KEY (id);


--
-- Name: virtual_app_visit_phase_snapshots virtual_app_visit_phase_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.virtual_app_visit_phase_snapshots
    ADD CONSTRAINT virtual_app_visit_phase_snapshots_pkey PRIMARY KEY (id);


--
-- Name: virtual_app_visit_phase_types virtual_app_visit_phase_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.virtual_app_visit_phase_types
    ADD CONSTRAINT virtual_app_visit_phase_types_pkey PRIMARY KEY (id);


--
-- Name: visit_acuity_snapshots visit_acuity_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_acuity_snapshots
    ADD CONSTRAINT visit_acuity_snapshots_pkey PRIMARY KEY (id);


--
-- Name: visit_attributes visit_attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_attributes
    ADD CONSTRAINT visit_attributes_pkey PRIMARY KEY (id);


--
-- Name: visit_attributes visit_attributes_unique_visit_attribute; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_attributes
    ADD CONSTRAINT visit_attributes_unique_visit_attribute UNIQUE (visit_snapshot_id, attribute_id);


--
-- Name: CONSTRAINT visit_attributes_unique_visit_attribute ON visit_attributes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT visit_attributes_unique_visit_attribute ON public.visit_attributes IS 'Unique index on visit attributes';


--
-- Name: visit_phase_snapshots visit_phase_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_phase_snapshots
    ADD CONSTRAINT visit_phase_snapshots_pkey PRIMARY KEY (id);


--
-- Name: visit_phase_source_types visit_phase_source_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_phase_source_types
    ADD CONSTRAINT visit_phase_source_types_pkey PRIMARY KEY (id);


--
-- Name: visit_phase_types visit_phase_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_phase_types
    ADD CONSTRAINT visit_phase_types_pkey PRIMARY KEY (id);


--
-- Name: visit_priority_snapshots visit_priority_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_priority_snapshots
    ADD CONSTRAINT visit_priority_snapshots_pkey PRIMARY KEY (id);


--
-- Name: visit_snapshots visit_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_snapshots
    ADD CONSTRAINT visit_snapshots_pkey PRIMARY KEY (id);


--
-- Name: visit_value_snapshots visit_value_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_value_snapshots
    ADD CONSTRAINT visit_value_snapshots_pkey PRIMARY KEY (id);


--
-- Name: INDEX attributes_unique_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.attributes_unique_name IS 'Unique index on attribute names';


--
-- Name: check_feasibility_queries_care_request_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX check_feasibility_queries_care_request_idx ON public.check_feasibility_queries USING btree (care_request_id, created_at DESC);


--
-- Name: check_feasibility_query_attributes_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX check_feasibility_query_attributes_idx ON public.check_feasibility_query_attributes USING btree (check_feasibility_query_id, attribute_id);


--
-- Name: clinical_urgency_level_configs_clinical_urgency_level_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clinical_urgency_level_configs_clinical_urgency_level_idx ON public.clinical_urgency_level_configs USING btree (clinical_urgency_level_id, created_at DESC);


--
-- Name: INDEX clinical_urgency_level_configs_clinical_urgency_level_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.clinical_urgency_level_configs_clinical_urgency_level_idx IS 'Clinical urgency level ID, sorted by created_at';


--
-- Name: clinical_urgency_levels_short_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX clinical_urgency_levels_short_name_idx ON public.clinical_urgency_levels USING btree (short_name);


--
-- Name: distance_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX distance_idx ON public.distances USING btree (from_location_id, to_location_id, source_id, created_at DESC);


--
-- Name: INDEX distance_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.distance_idx IS 'Index of distances';


--
-- Name: distance_source_short_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX distance_source_short_name_idx ON public.distance_sources USING btree (short_name);


--
-- Name: INDEX distance_source_short_name_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.distance_source_short_name_idx IS 'Index of distance source short names';


--
-- Name: distances_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX distances_created_at_idx ON public.distances USING btree (created_at DESC);


--
-- Name: INDEX location_unique_lat_lng; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.location_unique_lat_lng IS 'Unique index of locations';


--
-- Name: locations_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX locations_created_at_idx ON public.locations USING btree (created_at DESC);


--
-- Name: markets_service_region_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX markets_service_region_idx ON public.markets USING btree (service_region_id);


--
-- Name: INDEX markets_service_region_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.markets_service_region_idx IS 'Lookup index of service region on markets';


--
-- Name: markets_station_market_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX markets_station_market_idx ON public.markets USING btree (station_market_id, created_at DESC);


--
-- Name: INDEX markets_station_market_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.markets_station_market_idx IS 'Lookup index of station_market_id on markets';


--
-- Name: optimizer_run_error_optimizer_run_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX optimizer_run_error_optimizer_run_idx ON public.optimizer_run_errors USING btree (optimizer_run_id, created_at DESC);


--
-- Name: optimizer_run_error_sources_short_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX optimizer_run_error_sources_short_name_idx ON public.optimizer_run_error_sources USING btree (short_name);


--
-- Name: optimizer_run_types_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX optimizer_run_types_idx ON public.optimizer_runs USING btree (optimizer_run_type_id);


--
-- Name: optimizer_runs_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX optimizer_runs_created_at_idx ON public.optimizer_runs USING btree (created_at DESC);


--
-- Name: optimizer_runs_service_region_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX optimizer_runs_service_region_date_idx ON public.optimizer_runs USING btree (service_region_id, service_date, created_at DESC);


--
-- Name: INDEX optimizer_runs_service_region_date_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.optimizer_runs_service_region_date_idx IS 'Lookup index on optimizer runs by service region and date';


--
-- Name: schedule_diagnostics_schedule_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX schedule_diagnostics_schedule_id_idx ON public.schedule_diagnostics USING btree (schedule_id);


--
-- Name: schedule_optimizer_run_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX schedule_optimizer_run_idx ON public.schedules USING btree (optimizer_run_id, created_at DESC);


--
-- Name: INDEX schedule_optimizer_run_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.schedule_optimizer_run_idx IS 'Lookups of schedules by optimizer run';


--
-- Name: schedule_rest_break_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX schedule_rest_break_idx ON public.schedule_rest_breaks USING btree (shift_team_break_request_id);


--
-- Name: schedule_rest_break_schedule_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX schedule_rest_break_schedule_idx ON public.schedule_rest_breaks USING btree (schedule_id);


--
-- Name: schedule_rest_breaks_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX schedule_rest_breaks_created_at_idx ON public.schedule_rest_breaks USING btree (created_at DESC);


--
-- Name: schedule_route_shift_teams_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX schedule_route_shift_teams_unique_idx ON public.schedule_routes USING btree (schedule_id, shift_team_snapshot_id);


--
-- Name: INDEX schedule_route_shift_teams_unique_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.schedule_route_shift_teams_unique_idx IS 'Unique index of shift teams on a route';


--
-- Name: schedule_routes_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX schedule_routes_created_at_idx ON public.schedule_routes USING btree (created_at DESC);


--
-- Name: schedule_routes_shift_team_snapshot_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX schedule_routes_shift_team_snapshot_id_idx ON public.schedule_routes USING btree (shift_team_snapshot_id);


--
-- Name: schedule_service_region_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX schedule_service_region_idx ON public.schedules USING btree (service_region_id, created_at DESC);


--
-- Name: INDEX schedule_service_region_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.schedule_service_region_idx IS 'Lookups of schedules by service region';


--
-- Name: schedule_stats_schedule_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX schedule_stats_schedule_idx ON public.schedule_stats USING btree (schedule_id);


--
-- Name: INDEX schedule_stats_schedule_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.schedule_stats_schedule_idx IS 'Lookup index of stats for a schedule';


--
-- Name: schedule_stop_route_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX schedule_stop_route_unique_idx ON public.schedule_stops USING btree (schedule_route_id, route_index);


--
-- Name: schedule_stop_schedule_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX schedule_stop_schedule_idx ON public.schedule_stops USING btree (schedule_id);


--
-- Name: schedule_stops_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX schedule_stops_created_at_idx ON public.schedule_stops USING btree (created_at DESC);


--
-- Name: schedule_visit_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX schedule_visit_idx ON public.schedule_visits USING btree (visit_snapshot_id);


--
-- Name: INDEX schedule_visit_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.schedule_visit_idx IS 'Index of visit snapshots in schedule visits';


--
-- Name: schedule_visit_schedule_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX schedule_visit_schedule_idx ON public.schedule_visits USING btree (schedule_id);


--
-- Name: INDEX schedule_visit_schedule_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.schedule_visit_schedule_idx IS 'Index of schedule in schedule visits';


--
-- Name: schedule_visits_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX schedule_visits_created_at_idx ON public.schedule_visits USING btree (created_at DESC);


--
-- Name: schedules_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX schedules_created_at_idx ON public.schedules USING btree (created_at DESC);


--
-- Name: service_region_availability_queries_service_region_service_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_region_availability_queries_service_region_service_date ON public.service_region_availability_queries USING btree (service_region_id, service_date, created_at DESC);


--
-- Name: service_region_availability_query_attributes_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX service_region_availability_query_attributes_idx ON public.service_region_availability_query_attributes USING btree (service_region_availability_query_id, attribute_id);


--
-- Name: service_region_availability_visit_attributes_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_region_availability_visit_attributes_created_idx ON public.service_region_availability_visit_attributes USING btree (created_at DESC);


--
-- Name: service_region_availability_visit_attributes_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_region_availability_visit_attributes_idx ON public.service_region_availability_visit_attributes USING btree (service_region_availability_visit_id, attribute_id);


--
-- Name: service_region_availability_visit_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_region_availability_visit_created_at_idx ON public.service_region_availability_visits USING btree (created_at DESC);


--
-- Name: service_region_availability_visit_set_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_region_availability_visit_set_idx ON public.service_region_availability_visits USING btree (service_region_availability_visit_set_id);


--
-- Name: service_region_availability_visit_sets_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_region_availability_visit_sets_created_idx ON public.service_region_availability_visit_sets USING btree (created_at DESC);


--
-- Name: service_region_availability_visit_sets_service_region_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_region_availability_visit_sets_service_region_idx ON public.service_region_availability_visit_sets USING btree (service_region_id);


--
-- Name: service_region_canonical_location_sets_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_region_canonical_location_sets_idx ON public.service_region_canonical_location_sets USING btree (service_region_id, created_at DESC);


--
-- Name: INDEX service_region_canonical_location_sets_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.service_region_canonical_location_sets_idx IS 'Lookup index on canonical locations for service regions';


--
-- Name: service_region_canonical_locations_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_region_canonical_locations_idx ON public.service_region_canonical_locations USING btree (service_region_canonical_location_set_id);


--
-- Name: INDEX service_region_canonical_locations_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.service_region_canonical_locations_idx IS 'Lookup index of canonical locations in a set';


--
-- Name: service_region_canonical_visit_durations_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_region_canonical_visit_durations_idx ON public.service_region_canonical_visit_durations USING btree (service_region_id, created_at DESC);


--
-- Name: INDEX service_region_canonical_visit_durations_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.service_region_canonical_visit_durations_idx IS 'Lookup index on visit durations';


--
-- Name: service_region_minimal_visit_durations_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_region_minimal_visit_durations_idx ON public.service_region_minimal_visit_durations USING btree (service_region_id, created_at DESC);


--
-- Name: INDEX service_region_minimal_visit_durations_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.service_region_minimal_visit_durations_idx IS 'Lookup index on minimum visit durations';


--
-- Name: service_region_open_hours_schedule_days_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX service_region_open_hours_schedule_days_idx ON public.service_region_open_hours_schedule_days USING btree (service_region_open_hours_schedule_id, day_of_week);


--
-- Name: INDEX service_region_open_hours_schedule_days_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.service_region_open_hours_schedule_days_idx IS 'Unique index of weekday to schedule for open hours';


--
-- Name: service_region_open_hours_schedules_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_region_open_hours_schedules_idx ON public.service_region_open_hours_schedules USING btree (service_region_id, created_at DESC);


--
-- Name: shift_team_attributes_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shift_team_attributes_created_at_idx ON public.shift_team_attributes USING btree (created_at DESC);


--
-- Name: shift_team_locations_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shift_team_locations_created_at_idx ON public.shift_team_locations USING btree (created_at DESC);


--
-- Name: shift_team_locations_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shift_team_locations_created_idx ON public.shift_team_locations USING btree (created_at DESC);


--
-- Name: INDEX shift_team_locations_created_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.shift_team_locations_created_idx IS 'Lookup index of shift team locations, sorted by created_at';


--
-- Name: shift_team_locations_snapshot_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shift_team_locations_snapshot_idx ON public.shift_team_locations USING btree (shift_team_snapshot_id, created_at DESC);


--
-- Name: INDEX shift_team_locations_snapshot_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.shift_team_locations_snapshot_idx IS 'Lookup index of shift team locations';


--
-- Name: shift_team_rest_breaks_requests_shift_team_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shift_team_rest_breaks_requests_shift_team_id_idx ON public.shift_team_rest_break_requests USING btree (shift_team_id, created_at DESC);


--
-- Name: shift_team_snapshots_region_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shift_team_snapshots_region_created_idx ON public.shift_team_snapshots USING btree (service_region_id, created_at DESC);


--
-- Name: INDEX shift_team_snapshots_region_created_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.shift_team_snapshots_region_created_idx IS 'Lookup index on shift teams in service region, sorted by created_at';


--
-- Name: shift_team_snapshots_region_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shift_team_snapshots_region_idx ON public.shift_team_snapshots USING btree (start_timestamp_sec, end_timestamp_sec, service_region_id, created_at DESC);


--
-- Name: INDEX shift_team_snapshots_region_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.shift_team_snapshots_region_idx IS 'Lookup index on shift teams in service region';


--
-- Name: shift_team_snapshots_service_region_time_window_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shift_team_snapshots_service_region_time_window_idx ON public.shift_team_snapshots USING btree (service_region_id, created_at DESC, start_timestamp_sec, end_timestamp_sec DESC);


--
-- Name: shift_team_snapshots_shift_team_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shift_team_snapshots_shift_team_idx ON public.shift_team_snapshots USING btree (shift_team_id, created_at DESC);


--
-- Name: INDEX shift_team_snapshots_shift_team_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.shift_team_snapshots_shift_team_idx IS 'Lookup index on shift teams, by Shift Team ID';


--
-- Name: unassigned_schedule_visit_schedule_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX unassigned_schedule_visit_schedule_idx ON public.unassigned_schedule_visits USING btree (schedule_id);


--
-- Name: virtual_app_visit_phase_snapshots_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX virtual_app_visit_phase_snapshots_created_at_idx ON public.virtual_app_visit_phase_snapshots USING btree (created_at DESC);


--
-- Name: virtual_app_visit_phase_snapshots_snapshot_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX virtual_app_visit_phase_snapshots_snapshot_idx ON public.virtual_app_visit_phase_snapshots USING btree (visit_snapshot_id);


--
-- Name: visit_acuity_snapshots_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX visit_acuity_snapshots_created_at_idx ON public.visit_acuity_snapshots USING btree (created_at DESC);


--
-- Name: visit_acuity_snapshots_visit_snapshot_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX visit_acuity_snapshots_visit_snapshot_idx ON public.visit_acuity_snapshots USING btree (visit_snapshot_id);


--
-- Name: INDEX visit_acuity_snapshots_visit_snapshot_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.visit_acuity_snapshots_visit_snapshot_idx IS 'Lookup index on visits acuity, by visit snapshot ID';


--
-- Name: visit_attributes_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX visit_attributes_created_at_idx ON public.visit_attributes USING btree (created_at DESC);


--
-- Name: visit_phase_snapshots_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX visit_phase_snapshots_created_at_idx ON public.visit_phase_snapshots USING btree (created_at DESC);


--
-- Name: visit_phase_snapshots_snapshot_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX visit_phase_snapshots_snapshot_idx ON public.visit_phase_snapshots USING btree (visit_snapshot_id);


--
-- Name: INDEX visit_phase_snapshots_snapshot_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.visit_phase_snapshots_snapshot_idx IS 'Lookup index by 1:1 visit_snapshot_id';


--
-- Name: visit_phase_source_types_short_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX visit_phase_source_types_short_name_idx ON public.visit_phase_source_types USING btree (short_name);


--
-- Name: INDEX visit_phase_source_types_short_name_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.visit_phase_source_types_short_name_idx IS 'Lookup index for short names for visit phase source types';


--
-- Name: visit_phase_types_short_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX visit_phase_types_short_name_idx ON public.visit_phase_types USING btree (short_name);


--
-- Name: INDEX visit_phase_types_short_name_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.visit_phase_types_short_name_idx IS 'Lookup index for short names for visit phases';


--
-- Name: visit_priority_snapshots_visit_snapshot_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX visit_priority_snapshots_visit_snapshot_idx ON public.visit_priority_snapshots USING btree (visit_snapshot_id);


--
-- Name: INDEX visit_priority_snapshots_visit_snapshot_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.visit_priority_snapshots_visit_snapshot_idx IS 'Lookup index on visits priority, by visit snapshot ID';


--
-- Name: visit_snapshots_care_request_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX visit_snapshots_care_request_idx ON public.visit_snapshots USING btree (care_request_id, created_at DESC);


--
-- Name: INDEX visit_snapshots_care_request_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.visit_snapshots_care_request_idx IS 'Lookup index on visits, by Care Request ID';


--
-- Name: visit_snapshots_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX visit_snapshots_created_at_idx ON public.visit_snapshots USING btree (created_at DESC);


--
-- Name: visit_snapshots_region_arrival_time_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX visit_snapshots_region_arrival_time_idx ON public.visit_snapshots USING btree (service_region_id, created_at DESC, arrival_start_timestamp_sec, arrival_end_timestamp_sec DESC);


--
-- Name: visit_snapshots_region_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX visit_snapshots_region_created_idx ON public.visit_snapshots USING btree (service_region_id, created_at DESC);


--
-- Name: INDEX visit_snapshots_region_created_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.visit_snapshots_region_created_idx IS 'Lookup index on visits in service region, sorted by created_at';


--
-- Name: visit_snapshots_region_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX visit_snapshots_region_idx ON public.visit_snapshots USING btree (arrival_start_timestamp_sec, arrival_end_timestamp_sec, service_region_id, created_at DESC);


--
-- Name: INDEX visit_snapshots_region_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.visit_snapshots_region_idx IS 'Lookup index on visits in service region';


--
-- Name: visit_value_snapshots_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX visit_value_snapshots_created_at_idx ON public.visit_value_snapshots USING btree (created_at DESC);


--
-- Name: visit_value_snapshots_visit_snapshot_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX visit_value_snapshots_visit_snapshot_id_idx ON public.visit_value_snapshots USING btree (visit_snapshot_id);


--
-- PostgreSQL database dump complete
--

