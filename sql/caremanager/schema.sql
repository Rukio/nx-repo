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
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


SET default_table_access_method = heap;

--
-- Name: care_phases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.care_phases (
    id bigint NOT NULL,
    name text NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE care_phases; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.care_phases IS 'The catalog of care phases available';


--
-- Name: COLUMN care_phases.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.care_phases.name IS 'The name of the Care Phase';


--
-- Name: COLUMN care_phases.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.care_phases.is_active IS 'The state of the Care Phase, whether if it is active or not';


--
-- Name: care_phases_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.care_phases_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: care_phases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.care_phases_id_seq OWNED BY public.care_phases.id;


--
-- Name: episodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.episodes (
    id bigint NOT NULL,
    care_day bigint DEFAULT 0,
    admitted_at timestamp without time zone NOT NULL,
    discharged_at timestamp without time zone,
    source text,
    patient_summary text NOT NULL,
    primary_diagnosis text,
    payer text,
    doctors_primary_care text,
    patient_id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp without time zone,
    care_phase_id bigint NOT NULL,
    service_line_id bigint NOT NULL,
    market_id bigint NOT NULL,
    is_waiver boolean DEFAULT false NOT NULL,
    original_care_request_id bigint,
    service_request_id bigint
);


--
-- Name: TABLE episodes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.episodes IS 'CareManager Episode table';


--
-- Name: COLUMN episodes.care_day; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.episodes.care_day IS 'Number of days the patient has been receiving care';


--
-- Name: COLUMN episodes.admitted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.episodes.admitted_at IS 'Date on which the patient was admitted';


--
-- Name: COLUMN episodes.discharged_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.episodes.discharged_at IS 'Date on which the patient was discharged';


--
-- Name: COLUMN episodes.source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.episodes.source IS 'Referral source of episode';


--
-- Name: COLUMN episodes.patient_summary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.episodes.patient_summary IS 'Most relevant patient information for the episode';


--
-- Name: COLUMN episodes.primary_diagnosis; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.episodes.primary_diagnosis IS 'Primary diagnosis of the patient';


--
-- Name: COLUMN episodes.payer; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.episodes.payer IS 'Insurance payer of the episode';


--
-- Name: COLUMN episodes.doctors_primary_care; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.episodes.doctors_primary_care IS 'Primary care doctors';


--
-- Name: COLUMN episodes.patient_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.episodes.patient_id IS 'Patient ID of the episode';


--
-- Name: COLUMN episodes.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.episodes.deleted_at IS 'Date of deletion of the episode';


--
-- Name: COLUMN episodes.care_phase_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.episodes.care_phase_id IS 'The Care Phase associated with this Episode';


--
-- Name: COLUMN episodes.service_line_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.episodes.service_line_id IS 'The Service Line associated with this Episode';


--
-- Name: COLUMN episodes.market_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.episodes.market_id IS 'The Market associated with this Episode';


--
-- Name: COLUMN episodes.is_waiver; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.episodes.is_waiver IS 'Has a partnership with a health care system under CMS''s (https://www.cms.gov/) Acute Hospital Care at Home Individual Waiver.';


--
-- Name: COLUMN episodes.original_care_request_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.episodes.original_care_request_id IS 'The original Care Request id the episode was created from';


--
-- Name: COLUMN episodes.service_request_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.episodes.service_request_id IS 'An optional reference to the Service Request from which the episode originated.';


--
-- Name: episodes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.episodes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: episodes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.episodes_id_seq OWNED BY public.episodes.id;


--
-- Name: episodes_task_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.episodes_task_templates (
    episode_id bigint NOT NULL,
    task_template_id bigint NOT NULL
);


--
-- Name: TABLE episodes_task_templates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.episodes_task_templates IS 'Keeps track of which task templates have been assigned to an episode';


--
-- Name: episodes_task_templates_episode_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.episodes_task_templates_episode_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: episodes_task_templates_episode_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.episodes_task_templates_episode_id_seq OWNED BY public.episodes_task_templates.episode_id;


--
-- Name: episodes_task_templates_task_template_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.episodes_task_templates_task_template_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: episodes_task_templates_task_template_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.episodes_task_templates_task_template_id_seq OWNED BY public.episodes_task_templates.task_template_id;


--
-- Name: external_care_providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.external_care_providers (
    id bigint NOT NULL,
    name text NOT NULL,
    phone_number text,
    fax_number text,
    address text,
    provider_type_id bigint NOT NULL,
    patient_id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp without time zone
);


--
-- Name: COLUMN external_care_providers.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.external_care_providers.name IS 'Name of the external care provider';


--
-- Name: COLUMN external_care_providers.phone_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.external_care_providers.phone_number IS 'Phone number of the external care provider';


--
-- Name: COLUMN external_care_providers.fax_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.external_care_providers.fax_number IS 'Fax number of the external care provider';


--
-- Name: COLUMN external_care_providers.address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.external_care_providers.address IS 'Full text address of the external care provider';


--
-- Name: external_care_providers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.external_care_providers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: external_care_providers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.external_care_providers_id_seq OWNED BY public.external_care_providers.id;


--
-- Name: insurances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insurances (
    id bigint NOT NULL,
    name text NOT NULL,
    member_id text,
    patient_id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    priority integer DEFAULT 1 NOT NULL,
    deleted_at timestamp without time zone
);


--
-- Name: COLUMN insurances.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurances.name IS 'Name of the insurance';


--
-- Name: COLUMN insurances.priority; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurances.priority IS 'Priority of the patients insurance.';


--
-- Name: insurances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.insurances_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: insurances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.insurances_id_seq OWNED BY public.insurances.id;


--
-- Name: medical_decision_makers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medical_decision_makers (
    id bigint NOT NULL,
    first_name text NOT NULL,
    last_name text DEFAULT ''::text NOT NULL,
    phone_number text DEFAULT ''::text,
    address text,
    relationship text DEFAULT ''::text,
    patient_id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN medical_decision_makers.first_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.medical_decision_makers.first_name IS 'First name of the medical decision maker';


--
-- Name: COLUMN medical_decision_makers.last_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.medical_decision_makers.last_name IS 'Last name of the medical decision maker';


--
-- Name: COLUMN medical_decision_makers.phone_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.medical_decision_makers.phone_number IS 'Phone number of the medical decision maker';


--
-- Name: COLUMN medical_decision_makers.address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.medical_decision_makers.address IS 'Full text address of the medical decision maker';


--
-- Name: COLUMN medical_decision_makers.relationship; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.medical_decision_makers.relationship IS 'The type of relationship between the medical decision maker and the patient it is assigned to';


--
-- Name: medical_decision_makers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.medical_decision_makers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: medical_decision_makers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.medical_decision_makers_id_seq OWNED BY public.medical_decision_makers.id;


--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    id bigint NOT NULL,
    body text NOT NULL,
    kind smallint DEFAULT 0 NOT NULL,
    episode_id bigint,
    created_by_user_id bigint,
    pinned boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp without time zone,
    last_updated_by_user_id bigint
);


--
-- Name: TABLE notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.notes IS 'CareManager Notes Table';


--
-- Name: COLUMN notes.body; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notes.body IS 'Main text of the note';


--
-- Name: COLUMN notes.kind; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notes.kind IS 'Note kind';


--
-- Name: COLUMN notes.episode_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notes.episode_id IS 'Reference to the episode to which the note belongs to';


--
-- Name: COLUMN notes.created_by_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notes.created_by_user_id IS 'Reference to the user who created the note';


--
-- Name: COLUMN notes.pinned; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notes.pinned IS 'Pinned state of the note';


--
-- Name: COLUMN notes.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notes.created_at IS 'Point in time when the note was created';


--
-- Name: COLUMN notes.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notes.updated_at IS 'Point in time when the note was updated';


--
-- Name: COLUMN notes.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notes.deleted_at IS 'Point in time when the note was deleted';


--
-- Name: COLUMN notes.last_updated_by_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notes.last_updated_by_user_id IS 'Reference to the user who last updated the note';


--
-- Name: notes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notes_id_seq OWNED BY public.notes.id;


--
-- Name: patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patients (
    id bigint NOT NULL,
    first_name text NOT NULL,
    middle_name text,
    last_name text NOT NULL,
    sex text NOT NULL,
    date_of_birth date NOT NULL,
    phone_number text NOT NULL,
    athena_medical_record_number text,
    medical_power_of_attorney_details text,
    payer text,
    preferred_pharmacy_details text,
    referrer text,
    doctor_details text,
    address_street text NOT NULL,
    address_street_2 text,
    address_city text NOT NULL,
    address_state text NOT NULL,
    address_zipcode text NOT NULL,
    address_notes text,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    address_id bigint,
    full_name text GENERATED ALWAYS AS (TRIM(BOTH FROM ((TRIM(BOTH FROM ((first_name || ' '::text) ||
CASE
    WHEN (middle_name IS NULL) THEN ''::text
    ELSE middle_name
END)) || ' '::text) || last_name))) STORED
);


--
-- Name: TABLE patients; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.patients IS 'CareManager Patient table';


--
-- Name: COLUMN patients.first_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.first_name IS 'First name of the patient';


--
-- Name: COLUMN patients.middle_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.middle_name IS 'Middle name of the patient';


--
-- Name: COLUMN patients.last_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.last_name IS 'Last name of the patient';


--
-- Name: COLUMN patients.sex; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.sex IS 'Sex of the patient';


--
-- Name: COLUMN patients.date_of_birth; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.date_of_birth IS 'Date of birth of the patient';


--
-- Name: COLUMN patients.phone_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.phone_number IS 'Phone number of the patient';


--
-- Name: COLUMN patients.athena_medical_record_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.athena_medical_record_number IS 'Athena Medical Record number of the patient';


--
-- Name: COLUMN patients.medical_power_of_attorney_details; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.medical_power_of_attorney_details IS 'Details related to any medical power of attorney of the patient';


--
-- Name: COLUMN patients.payer; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.payer IS 'Payer of the patient, usually referring to insurance';


--
-- Name: COLUMN patients.preferred_pharmacy_details; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.preferred_pharmacy_details IS 'Details related to any preferred pharmacy of the patient';


--
-- Name: COLUMN patients.referrer; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.referrer IS 'Referrer of the patient';


--
-- Name: COLUMN patients.doctor_details; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.doctor_details IS 'Doctor details of the patient';


--
-- Name: COLUMN patients.address_street; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.address_street IS 'Patient address street';


--
-- Name: COLUMN patients.address_street_2; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.address_street_2 IS 'Patient address street (second line)';


--
-- Name: COLUMN patients.address_city; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.address_city IS 'Patient address city';


--
-- Name: COLUMN patients.address_state; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.address_state IS 'Patient address state';


--
-- Name: COLUMN patients.address_zipcode; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.address_zipcode IS 'Patient address zipcode';


--
-- Name: COLUMN patients.address_notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.address_notes IS 'Patient address notes';


--
-- Name: patients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.patients_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: patients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.patients_id_seq OWNED BY public.patients.id;


--
-- Name: payers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payers (
    id bigint NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE payers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.payers IS 'Names for types of payers';


--
-- Name: COLUMN payers.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.payers.name IS 'Name for payer type';


--
-- Name: payers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payers_id_seq OWNED BY public.payers.id;


--
-- Name: pharmacies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pharmacies (
    id bigint NOT NULL,
    name text NOT NULL,
    phone_number text,
    fax_number text,
    address text,
    patient_id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN pharmacies.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pharmacies.name IS 'Name of the pharmacy';


--
-- Name: COLUMN pharmacies.phone_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pharmacies.phone_number IS 'Phone number of the pharmacy';


--
-- Name: COLUMN pharmacies.fax_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pharmacies.fax_number IS 'Fax number of the pharmacy';


--
-- Name: COLUMN pharmacies.address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pharmacies.address IS 'Full text address of the pharmacy';


--
-- Name: pharmacies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pharmacies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pharmacies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pharmacies_id_seq OWNED BY public.pharmacies.id;


--
-- Name: provider_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_types (
    id bigint NOT NULL,
    name text
);


--
-- Name: COLUMN provider_types.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provider_types.name IS 'Name of the provider type';


--
-- Name: provider_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.provider_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: provider_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.provider_types_id_seq OWNED BY public.provider_types.id;


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
    name text NOT NULL,
    short_name text,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE service_lines; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.service_lines IS 'The catalog of service lines available';


--
-- Name: COLUMN service_lines.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_lines.name IS 'The name of the Service Line';


--
-- Name: COLUMN service_lines.short_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_lines.short_name IS 'The short version of the name of the Service Line';


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
-- Name: service_request_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_request_categories (
    id bigint NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE service_request_categories; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.service_request_categories IS 'This is the list of categories that can be assigned to service_requests via the category_id column';


--
-- Name: COLUMN service_request_categories.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_request_categories.name IS 'The name of the Service Request Category';


--
-- Name: service_request_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_request_categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: service_request_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_request_categories_id_seq OWNED BY public.service_request_categories.id;


--
-- Name: service_request_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_request_notes (
    service_request_id bigint NOT NULL,
    note_id bigint NOT NULL
);


--
-- Name: TABLE service_request_notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.service_request_notes IS 'this is the list of notes that are assigned to service_requests';


--
-- Name: service_request_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_request_status (
    id bigint NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE service_request_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.service_request_status IS 'This is the list of status that can be assigned to records in the service_requests table via its status_id column';


--
-- Name: COLUMN service_request_status.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_request_status.name IS 'The name of the Service Request Status';


--
-- Name: COLUMN service_request_status.slug; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_request_status.slug IS 'A slug representation of the Service Request Category.';


--
-- Name: COLUMN service_request_status.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_request_status.is_active IS 'Used to know if the Status is still marked as active or archived';


--
-- Name: service_request_status_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_request_status_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: service_request_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_request_status_id_seq OWNED BY public.service_request_status.id;


--
-- Name: service_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_requests (
    id bigint NOT NULL,
    care_request_id bigint NOT NULL,
    market_id bigint NOT NULL,
    status_id bigint NOT NULL,
    category_id bigint NOT NULL,
    is_insurance_verified boolean DEFAULT false NOT NULL,
    assigned_to_user_id bigint,
    cms_number text,
    reject_reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_updated_by_user_id bigint,
    rejected_at timestamp without time zone
);


--
-- Name: TABLE service_requests; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.service_requests IS 'CareManager ServiceRequests table';


--
-- Name: COLUMN service_requests.care_request_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_requests.care_request_id IS 'ID of Station''s related Care Request';


--
-- Name: COLUMN service_requests.market_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_requests.market_id IS 'The Market associated with this Service Request';


--
-- Name: COLUMN service_requests.status_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_requests.status_id IS 'The Service Request Status assigned to this Service Request';


--
-- Name: COLUMN service_requests.is_insurance_verified; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_requests.is_insurance_verified IS 'Has the Patient''s insurance been verified';


--
-- Name: COLUMN service_requests.assigned_to_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_requests.assigned_to_user_id IS 'The User assigned to resolve this Service Request';


--
-- Name: COLUMN service_requests.cms_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_requests.cms_number IS 'Has a partnership with a health care system under CMS''s (https://www.cms.gov/) Acute Hospital Care at Home Individual Waiver.';


--
-- Name: COLUMN service_requests.reject_reason; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_requests.reject_reason IS 'A text with the reason why the Service Request was rejected';


--
-- Name: COLUMN service_requests.last_updated_by_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_requests.last_updated_by_user_id IS 'Reference to the user who last updated the service request';


--
-- Name: COLUMN service_requests.rejected_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.service_requests.rejected_at IS 'The date when the Service Request was rejected';


--
-- Name: service_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: service_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_requests_id_seq OWNED BY public.service_requests.id;


--
-- Name: task_template_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_template_tasks (
    id bigint NOT NULL,
    body text NOT NULL,
    type_id bigint NOT NULL,
    template_id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp without time zone
);


--
-- Name: TABLE task_template_tasks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.task_template_tasks IS 'CareManager task template task table. Holds the tasks for each task template';


--
-- Name: COLUMN task_template_tasks.body; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.task_template_tasks.body IS 'Body of the task template task';


--
-- Name: COLUMN task_template_tasks.type_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.task_template_tasks.type_id IS 'Type ID of the task template task';


--
-- Name: COLUMN task_template_tasks.template_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.task_template_tasks.template_id IS 'ID of the task template this task belongs to';


--
-- Name: task_template_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.task_template_tasks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: task_template_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.task_template_tasks_id_seq OWNED BY public.task_template_tasks.id;


--
-- Name: task_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_templates (
    id bigint NOT NULL,
    name text NOT NULL,
    summary text,
    created_by_user_id bigint NOT NULL,
    last_updated_by_user_id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp without time zone,
    care_phase_id bigint,
    service_line_id bigint NOT NULL
);


--
-- Name: TABLE task_templates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.task_templates IS 'CareManager Task Templates table';


--
-- Name: COLUMN task_templates.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.task_templates.name IS 'Name of the task template';


--
-- Name: COLUMN task_templates.summary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.task_templates.summary IS 'Summary of the task template';


--
-- Name: COLUMN task_templates.created_by_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.task_templates.created_by_user_id IS 'ID of the user who created the task template';


--
-- Name: COLUMN task_templates.last_updated_by_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.task_templates.last_updated_by_user_id IS 'ID of the last user who updated the task template';


--
-- Name: COLUMN task_templates.care_phase_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.task_templates.care_phase_id IS 'The Care Phase associated with this Episode';


--
-- Name: COLUMN task_templates.service_line_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.task_templates.service_line_id IS 'The Service Line associated with this Episode';


--
-- Name: task_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.task_templates_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: task_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.task_templates_id_seq OWNED BY public.task_templates.id;


--
-- Name: task_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_types (
    id bigint NOT NULL,
    slug text NOT NULL
);


--
-- Name: TABLE task_types; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.task_types IS 'Catalog of the types that can be assigned to tasks';


--
-- Name: COLUMN task_types.slug; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.task_types.slug IS 'Name of the task type';


--
-- Name: task_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.task_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: task_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.task_types_id_seq OWNED BY public.task_types.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id bigint NOT NULL,
    description text NOT NULL,
    is_completed boolean DEFAULT false NOT NULL,
    episode_id bigint NOT NULL,
    task_type_id bigint NOT NULL,
    completed_by_user_id bigint,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE tasks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tasks IS 'Task entity than can be marked as completed or incompleted';


--
-- Name: COLUMN tasks.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.description IS 'Description of the task itself';


--
-- Name: COLUMN tasks.is_completed; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.is_completed IS 'Whether the task has been completed or not';


--
-- Name: COLUMN tasks.episode_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.episode_id IS 'Episode ID that owns this task';


--
-- Name: COLUMN tasks.task_type_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.task_type_id IS 'TaskType ID assigned to this task';


--
-- Name: COLUMN tasks.completed_by_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.completed_by_user_id IS 'The ID of the user that marked this task as completed';


--
-- Name: COLUMN tasks.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.deleted_at IS 'Date of deletion of the task, it is also used to know if the task is deleted or not';


--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tasks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: visit_summaries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visit_summaries (
    visit_id bigint NOT NULL,
    body text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by_user_id bigint,
    updated_by_user_id bigint
);


--
-- Name: COLUMN visit_summaries.visit_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_summaries.visit_id IS 'The id of the visit the summary belongs to';


--
-- Name: COLUMN visit_summaries.body; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_summaries.body IS 'Text body of of the visit summary';


--
-- Name: COLUMN visit_summaries.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_summaries.created_at IS 'Point in time when the visit summary was created';


--
-- Name: COLUMN visit_summaries.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_summaries.updated_at IS 'Point in time when the visit summary was updated';


--
-- Name: COLUMN visit_summaries.created_by_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_summaries.created_by_user_id IS 'The id of the user who created the visit summary';


--
-- Name: COLUMN visit_summaries.updated_by_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_summaries.updated_by_user_id IS 'The id of the user who updated the visit summary';


--
-- Name: visit_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visit_types (
    id bigint NOT NULL,
    is_call_type boolean DEFAULT false NOT NULL,
    name text NOT NULL
);


--
-- Name: TABLE visit_types; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.visit_types IS 'CareManager Visit Types Table';


--
-- Name: COLUMN visit_types.is_call_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_types.is_call_type IS 'Flag for categorizing those types that can be applied to a call visit.';


--
-- Name: COLUMN visit_types.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_types.name IS 'Human readable name of the visit type.';


--
-- Name: visit_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.visit_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: visit_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.visit_types_id_seq OWNED BY public.visit_types.id;


--
-- Name: visit_values; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visit_values (
    id bigint NOT NULL,
    service_line_id bigint NOT NULL,
    payer_id bigint NOT NULL,
    value_cents bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE visit_values; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.visit_values IS 'Visit value associated with varying types of service lines and payers';


--
-- Name: COLUMN visit_values.service_line_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_values.service_line_id IS 'Service line associated with visit value';


--
-- Name: COLUMN visit_values.payer_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_values.payer_id IS 'Payer associated with visit value';


--
-- Name: COLUMN visit_values.value_cents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visit_values.value_cents IS 'Value in cents associated with service line and payer';


--
-- Name: visit_values_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.visit_values_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: visit_values_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.visit_values_id_seq OWNED BY public.visit_values.id;


--
-- Name: visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visits (
    id bigint NOT NULL,
    care_request_id bigint,
    episode_id bigint NOT NULL,
    visit_type_id bigint,
    updated_by_user_id bigint,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by_user_id bigint,
    status text,
    status_updated_at timestamp without time zone,
    address_id bigint,
    patient_availability_start timestamp without time zone,
    patient_availability_end timestamp without time zone,
    car_name text,
    provider_user_ids bigint[],
    car_id bigint,
    virtual_app_id bigint
);


--
-- Name: TABLE visits; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.visits IS 'CareManager Visits Table, analogous to Station care_requests table';


--
-- Name: COLUMN visits.care_request_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visits.care_request_id IS 'Reference to the id of the care_requests record in Station that the visit originates from';


--
-- Name: COLUMN visits.episode_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visits.episode_id IS 'The id of the episode that the visit belongs to';


--
-- Name: COLUMN visits.visit_type_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visits.visit_type_id IS 'The id of the visit type this visit belongs to';


--
-- Name: COLUMN visits.updated_by_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visits.updated_by_user_id IS 'The id of the user who last updated the visit';


--
-- Name: COLUMN visits.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visits.created_at IS 'Point in time where the visit was created';


--
-- Name: COLUMN visits.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visits.updated_at IS 'Point in time where the visit was last updated';


--
-- Name: COLUMN visits.created_by_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visits.created_by_user_id IS 'The id of the user who created the visit';


--
-- Name: COLUMN visits.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visits.status IS 'The status of the visit, it is free text that comes from an external source';


--
-- Name: COLUMN visits.status_updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visits.status_updated_at IS 'The point in time when the status was updated';


--
-- Name: COLUMN visits.address_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visits.address_id IS 'The id of the visit address';


--
-- Name: COLUMN visits.patient_availability_start; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visits.patient_availability_start IS 'Point in time when the patient availability starts';


--
-- Name: COLUMN visits.patient_availability_end; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visits.patient_availability_end IS 'Point in time when the patient availability ends';


--
-- Name: COLUMN visits.car_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visits.car_name IS 'The name of the car assigned to the visit';


--
-- Name: COLUMN visits.provider_user_ids; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visits.provider_user_ids IS 'A list of the providers user ids';


--
-- Name: COLUMN visits.car_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visits.car_id IS 'The id of the car assigned to the visit';


--
-- Name: COLUMN visits.virtual_app_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visits.virtual_app_id IS 'The user id of the virtual app assigned to the visit';


--
-- Name: visits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.visits_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: visits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.visits_id_seq OWNED BY public.visits.id;


--
-- Name: care_phases id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_phases ALTER COLUMN id SET DEFAULT nextval('public.care_phases_id_seq'::regclass);


--
-- Name: episodes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.episodes ALTER COLUMN id SET DEFAULT nextval('public.episodes_id_seq'::regclass);


--
-- Name: episodes_task_templates episode_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.episodes_task_templates ALTER COLUMN episode_id SET DEFAULT nextval('public.episodes_task_templates_episode_id_seq'::regclass);


--
-- Name: episodes_task_templates task_template_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.episodes_task_templates ALTER COLUMN task_template_id SET DEFAULT nextval('public.episodes_task_templates_task_template_id_seq'::regclass);


--
-- Name: external_care_providers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_care_providers ALTER COLUMN id SET DEFAULT nextval('public.external_care_providers_id_seq'::regclass);


--
-- Name: insurances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurances ALTER COLUMN id SET DEFAULT nextval('public.insurances_id_seq'::regclass);


--
-- Name: medical_decision_makers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_decision_makers ALTER COLUMN id SET DEFAULT nextval('public.medical_decision_makers_id_seq'::regclass);


--
-- Name: notes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes ALTER COLUMN id SET DEFAULT nextval('public.notes_id_seq'::regclass);


--
-- Name: patients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients ALTER COLUMN id SET DEFAULT nextval('public.patients_id_seq'::regclass);


--
-- Name: payers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payers ALTER COLUMN id SET DEFAULT nextval('public.payers_id_seq'::regclass);


--
-- Name: pharmacies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pharmacies ALTER COLUMN id SET DEFAULT nextval('public.pharmacies_id_seq'::regclass);


--
-- Name: provider_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_types ALTER COLUMN id SET DEFAULT nextval('public.provider_types_id_seq'::regclass);


--
-- Name: schema_migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations ALTER COLUMN id SET DEFAULT nextval('public.schema_migrations_id_seq'::regclass);


--
-- Name: service_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_lines ALTER COLUMN id SET DEFAULT nextval('public.service_lines_id_seq'::regclass);


--
-- Name: service_request_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_request_categories ALTER COLUMN id SET DEFAULT nextval('public.service_request_categories_id_seq'::regclass);


--
-- Name: service_request_status id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_request_status ALTER COLUMN id SET DEFAULT nextval('public.service_request_status_id_seq'::regclass);


--
-- Name: service_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_requests ALTER COLUMN id SET DEFAULT nextval('public.service_requests_id_seq'::regclass);


--
-- Name: task_template_tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_template_tasks ALTER COLUMN id SET DEFAULT nextval('public.task_template_tasks_id_seq'::regclass);


--
-- Name: task_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_templates ALTER COLUMN id SET DEFAULT nextval('public.task_templates_id_seq'::regclass);


--
-- Name: task_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_types ALTER COLUMN id SET DEFAULT nextval('public.task_types_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: visit_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_types ALTER COLUMN id SET DEFAULT nextval('public.visit_types_id_seq'::regclass);


--
-- Name: visit_values id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_values ALTER COLUMN id SET DEFAULT nextval('public.visit_values_id_seq'::regclass);


--
-- Name: visits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits ALTER COLUMN id SET DEFAULT nextval('public.visits_id_seq'::regclass);


--
-- Name: care_phases care_phases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_phases
    ADD CONSTRAINT care_phases_pkey PRIMARY KEY (id);


--
-- Name: episodes episodes_original_care_request_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.episodes
    ADD CONSTRAINT episodes_original_care_request_id_key UNIQUE (original_care_request_id);


--
-- Name: episodes episodes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.episodes
    ADD CONSTRAINT episodes_pkey PRIMARY KEY (id);


--
-- Name: external_care_providers external_care_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_care_providers
    ADD CONSTRAINT external_care_providers_pkey PRIMARY KEY (id);


--
-- Name: insurances insurances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurances
    ADD CONSTRAINT insurances_pkey PRIMARY KEY (id);


--
-- Name: medical_decision_makers medical_decision_makers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_decision_makers
    ADD CONSTRAINT medical_decision_makers_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: payers payers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payers
    ADD CONSTRAINT payers_pkey PRIMARY KEY (id);


--
-- Name: pharmacies pharmacies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pharmacies
    ADD CONSTRAINT pharmacies_pkey PRIMARY KEY (id);


--
-- Name: provider_types provider_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_types
    ADD CONSTRAINT provider_types_pkey PRIMARY KEY (id);


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
-- Name: service_request_categories service_request_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_request_categories
    ADD CONSTRAINT service_request_categories_pkey PRIMARY KEY (id);


--
-- Name: service_request_categories service_request_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_request_categories
    ADD CONSTRAINT service_request_categories_slug_key UNIQUE (slug);


--
-- Name: service_request_status service_request_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_request_status
    ADD CONSTRAINT service_request_status_pkey PRIMARY KEY (id);


--
-- Name: service_request_status service_request_status_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_request_status
    ADD CONSTRAINT service_request_status_slug_key UNIQUE (slug);


--
-- Name: service_requests service_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_pkey PRIMARY KEY (id);


--
-- Name: task_template_tasks task_template_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_template_tasks
    ADD CONSTRAINT task_template_tasks_pkey PRIMARY KEY (id);


--
-- Name: task_templates task_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_templates
    ADD CONSTRAINT task_templates_pkey PRIMARY KEY (id);


--
-- Name: task_types task_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_types
    ADD CONSTRAINT task_types_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: visit_summaries visit_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_summaries
    ADD CONSTRAINT visit_summaries_pkey PRIMARY KEY (visit_id);


--
-- Name: visit_types visit_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_types
    ADD CONSTRAINT visit_types_pkey PRIMARY KEY (id);


--
-- Name: visit_values visit_values_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_values
    ADD CONSTRAINT visit_values_pkey PRIMARY KEY (id);


--
-- Name: visits visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_pkey PRIMARY KEY (id);


--
-- Name: episode_market_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX episode_market_id ON public.episodes USING btree (market_id);


--
-- Name: episodes_original_care_request_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX episodes_original_care_request_id_idx ON public.episodes USING btree (original_care_request_id);


--
-- Name: external_care_providers_patient_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX external_care_providers_patient_id_idx ON public.external_care_providers USING btree (patient_id);


--
-- Name: idx_athena_medical_record_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_athena_medical_record_number ON public.patients USING btree (athena_medical_record_number);


--
-- Name: idx_care_request_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_care_request_id ON public.service_requests USING btree (care_request_id);


--
-- Name: insurances_patient_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX insurances_patient_id_idx ON public.insurances USING btree (patient_id);


--
-- Name: insurances_patient_id_priority_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX insurances_patient_id_priority_idx ON public.insurances USING btree (patient_id, priority);


--
-- Name: medical_decision_makers_patient_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX medical_decision_makers_patient_id_idx ON public.medical_decision_makers USING btree (patient_id);


--
-- Name: notes_episode_id_pinned_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notes_episode_id_pinned_updated_at_idx ON public.notes USING btree (episode_id, pinned DESC, updated_at DESC);


--
-- Name: patients_full_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_full_name_idx ON public.patients USING gin (full_name public.gin_trgm_ops);


--
-- Name: payer_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payer_name_idx ON public.payers USING btree (name);


--
-- Name: pharmacies_patient_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pharmacies_patient_id_idx ON public.pharmacies USING btree (patient_id);


--
-- Name: service_line_short_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_line_short_name_idx ON public.service_lines USING btree (short_name);


--
-- Name: service_request_notes_note_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX service_request_notes_note_id_idx ON public.service_request_notes USING btree (note_id);


--
-- Name: service_request_notes_service_request_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_request_notes_service_request_id_idx ON public.service_request_notes USING btree (service_request_id);


--
-- Name: task_template_tasks_template_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX task_template_tasks_template_id_idx ON public.task_template_tasks USING btree (template_id);


--
-- Name: task_templates_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX task_templates_id_created_at_idx ON public.task_templates USING btree (id, created_at);


--
-- Name: task_templates_name_trgm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX task_templates_name_trgm_idx ON public.task_templates USING gin (name public.gin_trgm_ops);


--
-- Name: tasks_episode_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_episode_id_created_at_idx ON public.tasks USING btree (episode_id, created_at);


--
-- Name: visit_value_service_line_payer_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX visit_value_service_line_payer_idx ON public.visit_values USING btree (service_line_id, payer_id, created_at);


--
-- Name: visits_care_request_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX visits_care_request_id_idx ON public.visits USING btree (care_request_id);


--
-- Name: visits_episode_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX visits_episode_id_idx ON public.visits USING btree (episode_id, created_at DESC);


--
-- Name: episodes episodes_care_phase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.episodes
    ADD CONSTRAINT episodes_care_phase_id_fkey FOREIGN KEY (care_phase_id) REFERENCES public.care_phases(id);


--
-- Name: episodes episodes_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.episodes
    ADD CONSTRAINT episodes_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: episodes episodes_service_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.episodes
    ADD CONSTRAINT episodes_service_line_id_fkey FOREIGN KEY (service_line_id) REFERENCES public.service_lines(id);


--
-- Name: episodes episodes_service_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.episodes
    ADD CONSTRAINT episodes_service_request_id_fkey FOREIGN KEY (service_request_id) REFERENCES public.service_requests(id);


--
-- Name: episodes_task_templates episodes_task_templates_episode_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.episodes_task_templates
    ADD CONSTRAINT episodes_task_templates_episode_id_fkey FOREIGN KEY (episode_id) REFERENCES public.episodes(id);


--
-- Name: episodes_task_templates episodes_task_templates_task_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.episodes_task_templates
    ADD CONSTRAINT episodes_task_templates_task_template_id_fkey FOREIGN KEY (task_template_id) REFERENCES public.task_templates(id);


--
-- Name: external_care_providers external_care_providers_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_care_providers
    ADD CONSTRAINT external_care_providers_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: external_care_providers external_care_providers_provider_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_care_providers
    ADD CONSTRAINT external_care_providers_provider_type_id_fkey FOREIGN KEY (provider_type_id) REFERENCES public.provider_types(id);


--
-- Name: insurances insurances_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurances
    ADD CONSTRAINT insurances_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: medical_decision_makers medical_decision_makers_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_decision_makers
    ADD CONSTRAINT medical_decision_makers_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: notes notes_episode_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_episode_id_fkey FOREIGN KEY (episode_id) REFERENCES public.episodes(id);


--
-- Name: pharmacies pharmacies_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pharmacies
    ADD CONSTRAINT pharmacies_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: service_request_notes service_request_notes_note_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_request_notes
    ADD CONSTRAINT service_request_notes_note_id_fkey FOREIGN KEY (note_id) REFERENCES public.notes(id);


--
-- Name: service_request_notes service_request_notes_service_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_request_notes
    ADD CONSTRAINT service_request_notes_service_request_id_fkey FOREIGN KEY (service_request_id) REFERENCES public.service_requests(id);


--
-- Name: service_requests service_requests_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_request_categories(id);


--
-- Name: service_requests service_requests_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.service_request_status(id);


--
-- Name: task_template_tasks task_template_tasks_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_template_tasks
    ADD CONSTRAINT task_template_tasks_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.task_templates(id);


--
-- Name: task_template_tasks task_template_tasks_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_template_tasks
    ADD CONSTRAINT task_template_tasks_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.task_types(id);


--
-- Name: task_templates task_templates_care_phase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_templates
    ADD CONSTRAINT task_templates_care_phase_id_fkey FOREIGN KEY (care_phase_id) REFERENCES public.care_phases(id);


--
-- Name: task_templates task_templates_service_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_templates
    ADD CONSTRAINT task_templates_service_line_id_fkey FOREIGN KEY (service_line_id) REFERENCES public.service_lines(id);


--
-- Name: tasks tasks_episode_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_episode_id_fkey FOREIGN KEY (episode_id) REFERENCES public.episodes(id);


--
-- Name: tasks tasks_task_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_task_type_id_fkey FOREIGN KEY (task_type_id) REFERENCES public.task_types(id);


--
-- Name: visit_summaries visit_summaries_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_summaries
    ADD CONSTRAINT visit_summaries_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id);


--
-- Name: visit_values visit_values_payer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_values
    ADD CONSTRAINT visit_values_payer_id_fkey FOREIGN KEY (payer_id) REFERENCES public.payers(id);


--
-- Name: visit_values visit_values_service_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_values
    ADD CONSTRAINT visit_values_service_line_id_fkey FOREIGN KEY (service_line_id) REFERENCES public.service_lines(id);


--
-- Name: visits visits_episode_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_episode_id_fkey FOREIGN KEY (episode_id) REFERENCES public.episodes(id);


--
-- Name: visits visits_visit_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_visit_type_id_fkey FOREIGN KEY (visit_type_id) REFERENCES public.visit_types(id);


--
-- PostgreSQL database dump complete
--

