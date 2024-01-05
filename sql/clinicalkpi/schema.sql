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
-- Name: calculated_provider_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calculated_provider_metrics (
    provider_id bigint NOT NULL,
    care_requests_completed_last_seven_days integer NOT NULL,
    average_net_promoter_score numeric,
    average_net_promoter_score_change numeric,
    chart_closure_rate numeric,
    chart_closure_rate_change numeric,
    survey_capture_rate numeric,
    survey_capture_rate_change numeric,
    median_on_scene_time_secs integer,
    median_on_scene_time_secs_change integer,
    change_days integer NOT NULL,
    last_care_request_completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_care_requests integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone
);


--
-- Name: TABLE calculated_provider_metrics; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.calculated_provider_metrics IS 'A table that houses metrics with trend calculations. Each row contains change data for each metric and one row per provider.';


--
-- Name: COLUMN calculated_provider_metrics.provider_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.calculated_provider_metrics.provider_id IS 'The ID of the provider that the metrics are associated with.';


--
-- Name: COLUMN calculated_provider_metrics.care_requests_completed_last_seven_days; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.calculated_provider_metrics.care_requests_completed_last_seven_days IS 'The number of care requests completed by the provider in the last 7 days.';


--
-- Name: COLUMN calculated_provider_metrics.average_net_promoter_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.calculated_provider_metrics.average_net_promoter_score IS 'The average score received on the NPS survey.';


--
-- Name: COLUMN calculated_provider_metrics.average_net_promoter_score_change; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.calculated_provider_metrics.average_net_promoter_score_change IS 'The change in the average score received on the NPS survey.';


--
-- Name: COLUMN calculated_provider_metrics.chart_closure_rate; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.calculated_provider_metrics.chart_closure_rate IS 'The percentage of charts closed within 24 hours. Applies to APPs only.';


--
-- Name: COLUMN calculated_provider_metrics.chart_closure_rate_change; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.calculated_provider_metrics.chart_closure_rate_change IS 'The change in the percentage of charts closed within 24 hours. Applies to APPs only.';


--
-- Name: COLUMN calculated_provider_metrics.survey_capture_rate; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.calculated_provider_metrics.survey_capture_rate IS 'The percentage of visits where the patient survery was captured. Applies to DHMTs only.';


--
-- Name: COLUMN calculated_provider_metrics.survey_capture_rate_change; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.calculated_provider_metrics.survey_capture_rate_change IS 'The change in the percentage of visits where the patient survey was captured. Applies to DHMTs only.';


--
-- Name: COLUMN calculated_provider_metrics.median_on_scene_time_secs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.calculated_provider_metrics.median_on_scene_time_secs IS 'The median on-scene time for completed visits in seconds.';


--
-- Name: COLUMN calculated_provider_metrics.median_on_scene_time_secs_change; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.calculated_provider_metrics.median_on_scene_time_secs_change IS 'The change in the median on-scene time for completed visits in seconds.';


--
-- Name: COLUMN calculated_provider_metrics.change_days; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.calculated_provider_metrics.change_days IS 'The number of days over which metric changes are.';


--
-- Name: COLUMN calculated_provider_metrics.last_care_request_completed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.calculated_provider_metrics.last_care_request_completed_at IS 'The timestamp at which the provider completed last care request.';


--
-- Name: COLUMN calculated_provider_metrics.completed_care_requests; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.calculated_provider_metrics.completed_care_requests IS 'The total number of care requests completed by the provider.';


--
-- Name: COLUMN calculated_provider_metrics.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.calculated_provider_metrics.updated_at IS 'The time at which the metrics row was last updated';


--
-- Name: historical_provider_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historical_provider_metrics (
    id bigint NOT NULL,
    provider_id bigint NOT NULL,
    care_requests_completed_last_seven_days integer NOT NULL,
    average_net_promoter_score numeric,
    chart_closure_rate numeric,
    survey_capture_rate numeric,
    median_on_scene_time_secs integer,
    last_care_request_completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_care_requests integer DEFAULT 0 NOT NULL
);


--
-- Name: TABLE historical_provider_metrics; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.historical_provider_metrics IS 'A historical table contains one row per provider for each time metrics are calculated. Used for calculating the change for each key metric over the time period';


--
-- Name: COLUMN historical_provider_metrics.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.historical_provider_metrics.id IS 'The unique ID of the historical provider metrics record.';


--
-- Name: COLUMN historical_provider_metrics.provider_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.historical_provider_metrics.provider_id IS 'The ID of the provider that the metrics are associated with.';


--
-- Name: COLUMN historical_provider_metrics.care_requests_completed_last_seven_days; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.historical_provider_metrics.care_requests_completed_last_seven_days IS 'The number of care requests completed by the provider in the last 7 days.';


--
-- Name: COLUMN historical_provider_metrics.average_net_promoter_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.historical_provider_metrics.average_net_promoter_score IS 'The average score received on the NPS survey.';


--
-- Name: COLUMN historical_provider_metrics.chart_closure_rate; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.historical_provider_metrics.chart_closure_rate IS 'The percentage of charts closed within 24 hours. Applies to APPs only.';


--
-- Name: COLUMN historical_provider_metrics.survey_capture_rate; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.historical_provider_metrics.survey_capture_rate IS 'The percentage of visits where the patient survery was captured. Applies to DHMTs only.';


--
-- Name: COLUMN historical_provider_metrics.median_on_scene_time_secs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.historical_provider_metrics.median_on_scene_time_secs IS 'The median on-scene time for completed visits in seconds.';


--
-- Name: COLUMN historical_provider_metrics.last_care_request_completed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.historical_provider_metrics.last_care_request_completed_at IS 'The timestamp at which the provider completed last care request.';


--
-- Name: COLUMN historical_provider_metrics.completed_care_requests; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.historical_provider_metrics.completed_care_requests IS 'The total number of care requests completed by the provider.';


--
-- Name: historical_provider_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.historical_provider_metrics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: historical_provider_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.historical_provider_metrics_id_seq OWNED BY public.historical_provider_metrics.id;


--
-- Name: market_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_groups (
    id bigint NOT NULL,
    market_group_id bigint NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE market_groups; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.market_groups IS 'A table which contains information about market groups from Redshift.';


--
-- Name: COLUMN market_groups.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_groups.id IS 'The unique ID of the market group record.';


--
-- Name: COLUMN market_groups.market_group_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_groups.market_group_id IS 'The Redshift ID of the market group.';


--
-- Name: COLUMN market_groups.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_groups.name IS 'The name of the market group. E.g. Denver|Colorado Springs.';


--
-- Name: market_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.market_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: market_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.market_groups_id_seq OWNED BY public.market_groups.id;


--
-- Name: market_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_metrics (
    id bigint NOT NULL,
    market_id bigint NOT NULL,
    on_scene_time_median_seconds integer,
    on_scene_time_week_change_seconds integer,
    chart_closure_rate double precision,
    chart_closure_rate_week_change double precision,
    survey_capture_rate double precision,
    survey_capture_rate_week_change double precision,
    net_promoter_score_average double precision,
    net_promoter_score_week_change double precision,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE market_metrics; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.market_metrics IS 'Metrics associated with markets.';


--
-- Name: COLUMN market_metrics.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_metrics.id IS 'The unique ID of the market metrics record.';


--
-- Name: COLUMN market_metrics.market_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_metrics.market_id IS 'The unique ID of the market that the metrics are associated with.';


--
-- Name: COLUMN market_metrics.on_scene_time_median_seconds; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_metrics.on_scene_time_median_seconds IS 'The median on-scene time for completed visits in seconds.';


--
-- Name: COLUMN market_metrics.on_scene_time_week_change_seconds; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_metrics.on_scene_time_week_change_seconds IS 'Change of the median on-scene time for completed visits in seconds metric in the last 7 days.';


--
-- Name: COLUMN market_metrics.chart_closure_rate; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_metrics.chart_closure_rate IS 'The percentage of charts closed within 24 hours. Applies to APPs only.';


--
-- Name: COLUMN market_metrics.chart_closure_rate_week_change; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_metrics.chart_closure_rate_week_change IS 'Change of the percentage of charts closed within 24 hours metric in the last 7 days. Applies to APPs only.';


--
-- Name: COLUMN market_metrics.survey_capture_rate; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_metrics.survey_capture_rate IS 'The percentage of visits where the patient survey was captured. Applies to DHMTs only.';


--
-- Name: COLUMN market_metrics.survey_capture_rate_week_change; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_metrics.survey_capture_rate_week_change IS 'Change of the percentage of visits where the patient survey was captured metric in the last 7 days. Applies to DHMTs only.';


--
-- Name: COLUMN market_metrics.net_promoter_score_average; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_metrics.net_promoter_score_average IS 'The average score received on the NPS survey.';


--
-- Name: COLUMN market_metrics.net_promoter_score_week_change; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_metrics.net_promoter_score_week_change IS 'Change of the average score received on the NPS survey metric in the last 7 days.';


--
-- Name: market_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.market_metrics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: market_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.market_metrics_id_seq OWNED BY public.market_metrics.id;


--
-- Name: market_provider_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_provider_metrics (
    id bigint NOT NULL,
    provider_id bigint NOT NULL,
    market_id bigint NOT NULL,
    on_scene_time_median_seconds integer,
    on_scene_time_week_change_seconds integer,
    chart_closure_rate double precision,
    chart_closure_rate_week_change double precision,
    survey_capture_rate double precision,
    survey_capture_rate_week_change double precision,
    net_promoter_score_average double precision,
    net_promoter_score_week_change double precision,
    on_task_percent double precision,
    on_task_percent_week_change double precision,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE market_provider_metrics; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.market_provider_metrics IS 'Metrics associated with provider by markets.';


--
-- Name: COLUMN market_provider_metrics.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_provider_metrics.id IS 'The unique ID of the provider by market metrics record.';


--
-- Name: COLUMN market_provider_metrics.provider_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_provider_metrics.provider_id IS 'The Station ID of the provider that the metrics are associated with.';


--
-- Name: COLUMN market_provider_metrics.market_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_provider_metrics.market_id IS 'The Station ID of the market that the metrics are associated with.';


--
-- Name: COLUMN market_provider_metrics.on_scene_time_median_seconds; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_provider_metrics.on_scene_time_median_seconds IS 'The median on-scene time for completed visits in seconds';


--
-- Name: COLUMN market_provider_metrics.on_scene_time_week_change_seconds; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_provider_metrics.on_scene_time_week_change_seconds IS 'Change of the median on-scene time for completed visits in seconds metric in the last 7 days.';


--
-- Name: COLUMN market_provider_metrics.chart_closure_rate; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_provider_metrics.chart_closure_rate IS 'The percentage of charts closed within 24 hours. Applies to APPs only.';


--
-- Name: COLUMN market_provider_metrics.chart_closure_rate_week_change; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_provider_metrics.chart_closure_rate_week_change IS 'Change of the percentage of charts closed within 24 hours metric in the last 7 days. Applies to APPs only.';


--
-- Name: COLUMN market_provider_metrics.survey_capture_rate; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_provider_metrics.survey_capture_rate IS 'The percentage of visits where the patient survey was captured. Applies to DHMTs only.';


--
-- Name: COLUMN market_provider_metrics.survey_capture_rate_week_change; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_provider_metrics.survey_capture_rate_week_change IS 'Change of the percentage of visits where the patient survey was captured metric in the last 7 days. Applies to DHMTs only.';


--
-- Name: COLUMN market_provider_metrics.net_promoter_score_average; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_provider_metrics.net_promoter_score_average IS 'The average score received on the NPS survey.';


--
-- Name: COLUMN market_provider_metrics.net_promoter_score_week_change; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_provider_metrics.net_promoter_score_week_change IS 'Change of the average score received on the NPS survey metric in the last 7 days.';


--
-- Name: COLUMN market_provider_metrics.on_task_percent; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_provider_metrics.on_task_percent IS 'The average time percent provider are on-tasks.';


--
-- Name: COLUMN market_provider_metrics.on_task_percent_week_change; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_provider_metrics.on_task_percent_week_change IS 'Change of the time percent provider are on-tasks metric in the last 7 days.';


--
-- Name: market_provider_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.market_provider_metrics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: market_provider_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.market_provider_metrics_id_seq OWNED BY public.market_provider_metrics.id;


--
-- Name: markets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.markets (
    id bigint NOT NULL,
    market_id bigint NOT NULL,
    name text NOT NULL,
    short_name text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    market_group_id bigint,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN markets.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.markets.id IS 'The unique ID of the markets record.';


--
-- Name: COLUMN markets.market_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.markets.market_id IS 'The Station ID of the market.';


--
-- Name: COLUMN markets.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.markets.name IS 'The name of the market. E.g. Denver.';


--
-- Name: COLUMN markets.short_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.markets.short_name IS 'The short name of the market. E.g. DEN.';


--
-- Name: COLUMN markets.market_group_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.markets.market_group_id IS 'The Redshift ID of the market group.';


--
-- Name: markets_active_providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.markets_active_providers (
    provider_id bigint NOT NULL,
    market_id bigint NOT NULL
);


--
-- Name: TABLE markets_active_providers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.markets_active_providers IS 'Mapping table for markets to providers active in those markets.';


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
-- Name: provider_daily_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_daily_metrics (
    id bigint NOT NULL,
    provider_id bigint NOT NULL,
    market_id bigint NOT NULL,
    service_date date NOT NULL,
    patients_seen integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    on_shift_duration_seconds integer NOT NULL
);


--
-- Name: TABLE provider_daily_metrics; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.provider_daily_metrics IS 'A table which contain provider metrics for a specific day and market.';


--
-- Name: COLUMN provider_daily_metrics.provider_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_daily_metrics.provider_id IS 'The ID of the provider that the metrics are associated with. Same as station user ID.';


--
-- Name: COLUMN provider_daily_metrics.market_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_daily_metrics.market_id IS 'The ID of the market that the metrics are associated with.';


--
-- Name: COLUMN provider_daily_metrics.service_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_daily_metrics.service_date IS 'Day when provider was on duty and had visits.';


--
-- Name: COLUMN provider_daily_metrics.patients_seen; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_daily_metrics.patients_seen IS 'Number of patients seen by provider in a specific day.';


--
-- Name: COLUMN provider_daily_metrics.on_shift_duration_seconds; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_daily_metrics.on_shift_duration_seconds IS 'Total duration of all of the provider''s shifts in market for the service date.';


--
-- Name: provider_daily_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.provider_daily_metrics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: provider_daily_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.provider_daily_metrics_id_seq OWNED BY public.provider_daily_metrics.id;


--
-- Name: provider_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_metrics (
    id bigint NOT NULL,
    provider_id bigint NOT NULL,
    on_scene_time_median_seconds integer,
    chart_closure_rate double precision,
    survey_capture_rate double precision,
    net_promoter_score_average double precision,
    on_task_percent double precision,
    escalation_rate double precision,
    abx_prescribing_rate double precision,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE provider_metrics; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.provider_metrics IS 'Metrics associated with provider across all markets.';


--
-- Name: COLUMN provider_metrics.provider_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_metrics.provider_id IS 'The Station user ID of the provider that the metrics are associated with.';


--
-- Name: COLUMN provider_metrics.on_scene_time_median_seconds; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_metrics.on_scene_time_median_seconds IS 'The median on-scene time for completed visits in seconds.';


--
-- Name: COLUMN provider_metrics.chart_closure_rate; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_metrics.chart_closure_rate IS 'The percentage of charts closed within 24 hours. Applies to APPs only.';


--
-- Name: COLUMN provider_metrics.survey_capture_rate; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_metrics.survey_capture_rate IS 'The percentage of visits where the patient survey was captured. Applies to DHMTs only.';


--
-- Name: COLUMN provider_metrics.net_promoter_score_average; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_metrics.net_promoter_score_average IS 'The average score received on the NPS survey.';


--
-- Name: COLUMN provider_metrics.on_task_percent; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_metrics.on_task_percent IS 'On task rate of all time "on shift" time over the last 30 days.';


--
-- Name: COLUMN provider_metrics.escalation_rate; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_metrics.escalation_rate IS 'The percent of cases that were escalated.';


--
-- Name: COLUMN provider_metrics.abx_prescribing_rate; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_metrics.abx_prescribing_rate IS 'The percent of cases for which antibiotics were prescribed.';


--
-- Name: provider_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.provider_metrics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: provider_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.provider_metrics_id_seq OWNED BY public.provider_metrics.id;


--
-- Name: provider_shifts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_shifts (
    id bigint NOT NULL,
    shift_team_id bigint NOT NULL,
    provider_id bigint NOT NULL,
    service_date date NOT NULL,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone NOT NULL,
    patients_seen integer,
    out_the_door_duration_seconds integer,
    en_route_duration_seconds integer,
    on_scene_duration_seconds integer,
    on_break_duration_seconds integer,
    idle_duration_seconds integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE provider_shifts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.provider_shifts IS 'Provider`s shifts across all markets for the latest 80 days.';


--
-- Name: COLUMN provider_shifts.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_shifts.id IS 'The unique ID of the provider metrics record.';


--
-- Name: COLUMN provider_shifts.shift_team_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_shifts.shift_team_id IS 'The unique ID of the shift team in Station DB.';


--
-- Name: COLUMN provider_shifts.provider_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_shifts.provider_id IS 'The ID of the provider in Station DB.';


--
-- Name: COLUMN provider_shifts.service_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_shifts.service_date IS 'The date of the shift.';


--
-- Name: COLUMN provider_shifts.start_time; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_shifts.start_time IS 'Start time of the shift.';


--
-- Name: COLUMN provider_shifts.end_time; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_shifts.end_time IS 'End time of the shift.';


--
-- Name: COLUMN provider_shifts.patients_seen; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_shifts.patients_seen IS 'Amount of patients that were seen on shift.';


--
-- Name: COLUMN provider_shifts.out_the_door_duration_seconds; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_shifts.out_the_door_duration_seconds IS 'Time duration when provider was out the door.';


--
-- Name: COLUMN provider_shifts.en_route_duration_seconds; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_shifts.en_route_duration_seconds IS 'Time duration when provider was on route.';


--
-- Name: COLUMN provider_shifts.on_scene_duration_seconds; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_shifts.on_scene_duration_seconds IS 'Time duration when provider was on scene.';


--
-- Name: COLUMN provider_shifts.on_break_duration_seconds; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_shifts.on_break_duration_seconds IS 'Time duration when provider was on break.';


--
-- Name: COLUMN provider_shifts.idle_duration_seconds; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_shifts.idle_duration_seconds IS 'Time duration of idle time.';


--
-- Name: provider_shifts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.provider_shifts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: provider_shifts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.provider_shifts_id_seq OWNED BY public.provider_shifts.id;


--
-- Name: provider_visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_visits (
    id bigint NOT NULL,
    care_request_id bigint NOT NULL,
    provider_id bigint NOT NULL,
    patient_first_name text NOT NULL,
    patient_last_name text NOT NULL,
    patient_athena_id text NOT NULL,
    service_date date NOT NULL,
    chief_complaint text,
    diagnosis text,
    is_abx_prescribed boolean DEFAULT false NOT NULL,
    abx_details text,
    is_escalated boolean DEFAULT false NOT NULL,
    escalated_reason text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE provider_visits; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.provider_visits IS 'Provider`s visits across all markets for the latest 80 days.';


--
-- Name: COLUMN provider_visits.care_request_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_visits.care_request_id IS 'The unique ID of the care request.';


--
-- Name: COLUMN provider_visits.provider_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_visits.provider_id IS 'The station user ID of the provider.';


--
-- Name: COLUMN provider_visits.patient_first_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_visits.patient_first_name IS 'First name of the Patient of the visit.';


--
-- Name: COLUMN provider_visits.patient_last_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_visits.patient_last_name IS 'Last name of the Patient of the visit.';


--
-- Name: COLUMN provider_visits.patient_athena_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_visits.patient_athena_id IS 'Athena ID of the Patient of the visit.';


--
-- Name: COLUMN provider_visits.service_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_visits.service_date IS 'Date the visit was made.';


--
-- Name: COLUMN provider_visits.chief_complaint; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_visits.chief_complaint IS 'Patient`s chief complaint.';


--
-- Name: COLUMN provider_visits.diagnosis; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_visits.diagnosis IS 'Diagnosis that was established.';


--
-- Name: COLUMN provider_visits.is_abx_prescribed; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_visits.is_abx_prescribed IS 'Flag that shows if antibiotics were prescribed.';


--
-- Name: COLUMN provider_visits.abx_details; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_visits.abx_details IS 'Details about antibiotics that were prescribed.';


--
-- Name: COLUMN provider_visits.is_escalated; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_visits.is_escalated IS 'Flag that shows if the visit was escalated.';


--
-- Name: COLUMN provider_visits.escalated_reason; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_visits.escalated_reason IS 'Reason why the visit was escalated.';


--
-- Name: provider_visits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.provider_visits_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: provider_visits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.provider_visits_id_seq OWNED BY public.provider_visits.id;


--
-- Name: providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.providers (
    id bigint NOT NULL,
    provider_id bigint NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    avatar_url text,
    job_title text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE providers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.providers IS 'Provider`s personal information.';


--
-- Name: COLUMN providers.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.providers.id IS 'The Station user ID of the provider record.';


--
-- Name: COLUMN providers.provider_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.providers.provider_id IS 'The unique ID of the provider. The value is the same with Station DB.';


--
-- Name: COLUMN providers.first_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.providers.first_name IS 'Provider`s first name.';


--
-- Name: COLUMN providers.last_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.providers.last_name IS 'Provider`s last name.';


--
-- Name: COLUMN providers.avatar_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.providers.avatar_url IS 'Url to provider`s photo.';


--
-- Name: COLUMN providers.job_title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.providers.job_title IS 'Provider`s position.';


--
-- Name: providers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.providers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: providers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.providers_id_seq OWNED BY public.providers.id;


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
-- Name: shift_snapshot_phase_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shift_snapshot_phase_types (
    id bigint NOT NULL,
    short_name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE shift_snapshot_phase_types; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.shift_snapshot_phase_types IS 'Types of shift snapshot phases';


--
-- Name: COLUMN shift_snapshot_phase_types.short_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.shift_snapshot_phase_types.short_name IS 'Short name of the shift snapshot phase type';


--
-- Name: COLUMN shift_snapshot_phase_types.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.shift_snapshot_phase_types.description IS 'Description of the shift snapshot phase type';


--
-- Name: shift_snapshot_phase_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shift_snapshot_phase_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shift_snapshot_phase_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shift_snapshot_phase_types_id_seq OWNED BY public.shift_snapshot_phase_types.id;


--
-- Name: shift_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shift_snapshots (
    id bigint NOT NULL,
    shift_team_id bigint NOT NULL,
    start_timestamp timestamp without time zone NOT NULL,
    end_timestamp timestamp without time zone NOT NULL,
    shift_snapshot_phase_type_id bigint NOT NULL,
    latitude_e6 integer,
    longitude_e6 integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE shift_snapshots; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.shift_snapshots IS 'Snapshot of the provider`s shift.';


--
-- Name: COLUMN shift_snapshots.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.shift_snapshots.id IS 'The unique ID of the snapshot.';


--
-- Name: COLUMN shift_snapshots.shift_team_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.shift_snapshots.shift_team_id IS 'The ID of the shift the snapshot is part of. The same as Station shift team ID';


--
-- Name: COLUMN shift_snapshots.start_timestamp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.shift_snapshots.start_timestamp IS 'Start time of the snapshot.';


--
-- Name: COLUMN shift_snapshots.end_timestamp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.shift_snapshots.end_timestamp IS 'End time of the snapshot.';


--
-- Name: COLUMN shift_snapshots.shift_snapshot_phase_type_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.shift_snapshots.shift_snapshot_phase_type_id IS 'Phase ID of the snapshot from shift_snapshot_phase_types table.';


--
-- Name: COLUMN shift_snapshots.latitude_e6; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.shift_snapshots.latitude_e6 IS 'Latitude coordinate of provider`s location as the start of the snapshot. Multiplied by 1e6.';


--
-- Name: COLUMN shift_snapshots.longitude_e6; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.shift_snapshots.longitude_e6 IS 'Longitude coordinate of provider`s location as the start of the snapshot. Multiplied by 1e6.';


--
-- Name: shift_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shift_snapshots_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shift_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shift_snapshots_id_seq OWNED BY public.shift_snapshots.id;


--
-- Name: staging_provider_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staging_provider_metrics (
    provider_id bigint NOT NULL,
    care_requests_completed_last_seven_days integer NOT NULL,
    average_net_promoter_score numeric,
    chart_closure_rate numeric,
    survey_capture_rate numeric,
    median_on_scene_time_secs integer,
    last_care_request_completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_care_requests integer DEFAULT 0 NOT NULL,
    id bigint NOT NULL,
    market_ids text
);


--
-- Name: TABLE staging_provider_metrics; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.staging_provider_metrics IS 'A staging table with only new calculated metrics. Metrics will be added here until they are processed and validated.';


--
-- Name: COLUMN staging_provider_metrics.provider_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.staging_provider_metrics.provider_id IS 'The ID of the provider that the metrics are associated with.';


--
-- Name: COLUMN staging_provider_metrics.care_requests_completed_last_seven_days; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.staging_provider_metrics.care_requests_completed_last_seven_days IS 'The number of care requests completed by the provider in the last 7 days.';


--
-- Name: COLUMN staging_provider_metrics.average_net_promoter_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.staging_provider_metrics.average_net_promoter_score IS 'The average score received on the NPS survey.';


--
-- Name: COLUMN staging_provider_metrics.chart_closure_rate; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.staging_provider_metrics.chart_closure_rate IS 'The percentage of charts closed within 24 hours. Applies to APPs only.';


--
-- Name: COLUMN staging_provider_metrics.survey_capture_rate; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.staging_provider_metrics.survey_capture_rate IS 'The percentage of visits where the patient survery was captured. Applies to DHMTs only.';


--
-- Name: COLUMN staging_provider_metrics.median_on_scene_time_secs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.staging_provider_metrics.median_on_scene_time_secs IS 'The median on-scene time for completed visits in seconds.';


--
-- Name: COLUMN staging_provider_metrics.last_care_request_completed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.staging_provider_metrics.last_care_request_completed_at IS 'The timestamp at which the provider completed last care request.';


--
-- Name: COLUMN staging_provider_metrics.completed_care_requests; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.staging_provider_metrics.completed_care_requests IS 'The total number of care requests completed by the provider.';


--
-- Name: COLUMN staging_provider_metrics.market_ids; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.staging_provider_metrics.market_ids IS 'A pipe-delimited string of unique market IDs in which the care requests used to calculated the metrics were completed';


--
-- Name: staging_provider_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.staging_provider_metrics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: staging_provider_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.staging_provider_metrics_id_seq OWNED BY public.staging_provider_metrics.id;


--
-- Name: historical_provider_metrics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historical_provider_metrics ALTER COLUMN id SET DEFAULT nextval('public.historical_provider_metrics_id_seq'::regclass);


--
-- Name: market_groups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_groups ALTER COLUMN id SET DEFAULT nextval('public.market_groups_id_seq'::regclass);


--
-- Name: market_metrics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_metrics ALTER COLUMN id SET DEFAULT nextval('public.market_metrics_id_seq'::regclass);


--
-- Name: market_provider_metrics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_provider_metrics ALTER COLUMN id SET DEFAULT nextval('public.market_provider_metrics_id_seq'::regclass);


--
-- Name: markets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markets ALTER COLUMN id SET DEFAULT nextval('public.markets_id_seq'::regclass);


--
-- Name: provider_daily_metrics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_daily_metrics ALTER COLUMN id SET DEFAULT nextval('public.provider_daily_metrics_id_seq'::regclass);


--
-- Name: provider_metrics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_metrics ALTER COLUMN id SET DEFAULT nextval('public.provider_metrics_id_seq'::regclass);


--
-- Name: provider_shifts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_shifts ALTER COLUMN id SET DEFAULT nextval('public.provider_shifts_id_seq'::regclass);


--
-- Name: provider_visits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_visits ALTER COLUMN id SET DEFAULT nextval('public.provider_visits_id_seq'::regclass);


--
-- Name: providers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providers ALTER COLUMN id SET DEFAULT nextval('public.providers_id_seq'::regclass);


--
-- Name: schema_migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations ALTER COLUMN id SET DEFAULT nextval('public.schema_migrations_id_seq'::regclass);


--
-- Name: shift_snapshot_phase_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_snapshot_phase_types ALTER COLUMN id SET DEFAULT nextval('public.shift_snapshot_phase_types_id_seq'::regclass);


--
-- Name: shift_snapshots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_snapshots ALTER COLUMN id SET DEFAULT nextval('public.shift_snapshots_id_seq'::regclass);


--
-- Name: staging_provider_metrics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staging_provider_metrics ALTER COLUMN id SET DEFAULT nextval('public.staging_provider_metrics_id_seq'::regclass);


--
-- Name: calculated_provider_metrics calculated_provider_metrics_provider_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calculated_provider_metrics
    ADD CONSTRAINT calculated_provider_metrics_provider_id_key UNIQUE (provider_id);


--
-- Name: historical_provider_metrics historical_provider_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historical_provider_metrics
    ADD CONSTRAINT historical_provider_metrics_pkey PRIMARY KEY (id);


--
-- Name: market_groups market_groups_market_group_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_groups
    ADD CONSTRAINT market_groups_market_group_id_key UNIQUE (market_group_id);


--
-- Name: market_groups market_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_groups
    ADD CONSTRAINT market_groups_pkey PRIMARY KEY (id);


--
-- Name: market_metrics market_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_metrics
    ADD CONSTRAINT market_metrics_pkey PRIMARY KEY (id);


--
-- Name: market_provider_metrics market_provider_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_provider_metrics
    ADD CONSTRAINT market_provider_metrics_pkey PRIMARY KEY (id);


--
-- Name: markets_active_providers markets_active_providers_provider_id_market_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markets_active_providers
    ADD CONSTRAINT markets_active_providers_provider_id_market_id_key UNIQUE (provider_id, market_id);


--
-- Name: markets markets_market_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT markets_market_id_key UNIQUE (market_id);


--
-- Name: markets markets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT markets_pkey PRIMARY KEY (id);


--
-- Name: provider_daily_metrics provider_daily_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_daily_metrics
    ADD CONSTRAINT provider_daily_metrics_pkey PRIMARY KEY (id);


--
-- Name: provider_daily_metrics provider_daily_metrics_provider_id_market_id_service_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_daily_metrics
    ADD CONSTRAINT provider_daily_metrics_provider_id_market_id_service_date_key UNIQUE (provider_id, market_id, service_date);


--
-- Name: provider_metrics provider_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_metrics
    ADD CONSTRAINT provider_metrics_pkey PRIMARY KEY (id);


--
-- Name: provider_shifts provider_shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_shifts
    ADD CONSTRAINT provider_shifts_pkey PRIMARY KEY (id);


--
-- Name: provider_shifts provider_shifts_shift_team_id_provider_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_shifts
    ADD CONSTRAINT provider_shifts_shift_team_id_provider_id_key UNIQUE (shift_team_id, provider_id);


--
-- Name: provider_visits provider_visits_care_request_id_provider_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_visits
    ADD CONSTRAINT provider_visits_care_request_id_provider_id_key UNIQUE (care_request_id, provider_id);


--
-- Name: provider_visits provider_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_visits
    ADD CONSTRAINT provider_visits_pkey PRIMARY KEY (id);


--
-- Name: providers providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_pkey PRIMARY KEY (id);


--
-- Name: providers providers_provider_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_provider_id_key UNIQUE (provider_id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);


--
-- Name: shift_snapshot_phase_types shift_snapshot_phase_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_snapshot_phase_types
    ADD CONSTRAINT shift_snapshot_phase_types_pkey PRIMARY KEY (id);


--
-- Name: shift_snapshots shift_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_snapshots
    ADD CONSTRAINT shift_snapshots_pkey PRIMARY KEY (id);


--
-- Name: shift_snapshots shift_snapshots_shift_team_id_start_timestamp_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_snapshots
    ADD CONSTRAINT shift_snapshots_shift_team_id_start_timestamp_key UNIQUE (shift_team_id, start_timestamp);


--
-- Name: staging_provider_metrics staging_provider_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staging_provider_metrics
    ADD CONSTRAINT staging_provider_metrics_pkey PRIMARY KEY (id);


--
-- Name: calculated_provider_metrics_provider_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX calculated_provider_metrics_provider_id_idx ON public.calculated_provider_metrics USING btree (provider_id);


--
-- Name: historical_provider_metrics_provider_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX historical_provider_metrics_provider_idx ON public.historical_provider_metrics USING btree (provider_id, created_at DESC);


--
-- Name: INDEX historical_provider_metrics_provider_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.historical_provider_metrics_provider_idx IS 'Lookup index on historical_provider_metrics by provider_id';


--
-- Name: market_metrics_market_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX market_metrics_market_id_idx ON public.market_metrics USING btree (market_id);


--
-- Name: market_provider_metrics_market_id_provider_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX market_provider_metrics_market_id_provider_id_idx ON public.market_provider_metrics USING btree (market_id, provider_id);


--
-- Name: INDEX market_provider_metrics_market_id_provider_id_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.market_provider_metrics_market_id_provider_id_idx IS 'Index of market provider metrics market IDs, provider IDs.';


--
-- Name: markets_active_providers_market_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX markets_active_providers_market_id_idx ON public.markets_active_providers USING btree (market_id);


--
-- Name: INDEX markets_active_providers_market_id_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.markets_active_providers_market_id_idx IS 'Lookup index on markets_active_providers by market ID';


--
-- Name: markets_active_providers_provider_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX markets_active_providers_provider_id_idx ON public.markets_active_providers USING btree (provider_id);


--
-- Name: INDEX markets_active_providers_provider_id_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.markets_active_providers_provider_id_idx IS 'Lookup index on markets_active_providers by provider ID';


--
-- Name: provider_daily_metrics_market_service_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX provider_daily_metrics_market_service_date_idx ON public.provider_daily_metrics USING btree (market_id, service_date);


--
-- Name: INDEX provider_daily_metrics_market_service_date_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.provider_daily_metrics_market_service_date_idx IS 'Lookup index on provider_daily_metrics by market_id and service_date';


--
-- Name: provider_daily_metrics_provider_service_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX provider_daily_metrics_provider_service_date_idx ON public.provider_daily_metrics USING btree (provider_id, service_date);


--
-- Name: INDEX provider_daily_metrics_provider_service_date_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.provider_daily_metrics_provider_service_date_idx IS 'Lookup index on provider_daily_metrics by provider_id and service_date';


--
-- Name: provider_metrics_provider_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX provider_metrics_provider_id_idx ON public.provider_metrics USING btree (provider_id);


--
-- Name: INDEX provider_metrics_provider_id_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.provider_metrics_provider_id_idx IS 'Index of provider metrics provider IDs.';


--
-- Name: provider_shifts_provider_id_service_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX provider_shifts_provider_id_service_date_idx ON public.provider_shifts USING btree (provider_id, service_date);


--
-- Name: INDEX provider_shifts_provider_id_service_date_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.provider_shifts_provider_id_service_date_idx IS 'Index of leader hub provider IDs and shifts dates.';


--
-- Name: provider_visits_provider_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX provider_visits_provider_id_idx ON public.provider_visits USING btree (provider_id);


--
-- Name: INDEX provider_visits_provider_id_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.provider_visits_provider_id_idx IS 'Index of leader hub provider visits provider IDs.';


--
-- Name: provider_visits_provider_id_patient_athena_id_patient_first_nam; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX provider_visits_provider_id_patient_athena_id_patient_first_nam ON public.provider_visits USING btree (provider_id, patient_athena_id, patient_first_name, patient_last_name);


--
-- Name: INDEX provider_visits_provider_id_patient_athena_id_patient_first_nam; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.provider_visits_provider_id_patient_athena_id_patient_first_nam IS 'Index of leader hub provider visits provider IDs, patient athena IDs and patient names.';


--
-- Name: shift_snapshot_phase_types_short_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX shift_snapshot_phase_types_short_name_idx ON public.shift_snapshot_phase_types USING btree (short_name);


--
-- Name: shift_snapshots_shift_team_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shift_snapshots_shift_team_id_idx ON public.shift_snapshots USING btree (shift_team_id);


--
-- Name: INDEX shift_snapshots_shift_team_id_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.shift_snapshots_shift_team_id_idx IS 'Index of shift snapshots shift team IDs.';


--
-- Name: shift_snapshots_start_timestamp_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shift_snapshots_start_timestamp_idx ON public.shift_snapshots USING btree (start_timestamp);


--
-- Name: INDEX shift_snapshots_start_timestamp_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.shift_snapshots_start_timestamp_idx IS 'Index of shift snapshots phase start times.';


--
-- PostgreSQL database dump complete
--

