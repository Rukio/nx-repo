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
-- Name: insurance_network_addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insurance_network_addresses (
    id bigint NOT NULL,
    insurance_network_id bigint NOT NULL,
    address text NOT NULL,
    zipcode text NOT NULL,
    city text NOT NULL,
    billing_state text NOT NULL
);


--
-- Name: TABLE insurance_network_addresses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.insurance_network_addresses IS 'Addresses associated with Insurance Networks';


--
-- Name: COLUMN insurance_network_addresses.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_network_addresses.id IS 'The unique ID of the Insurance Network Address record';


--
-- Name: COLUMN insurance_network_addresses.address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_network_addresses.address IS 'The address to which the Insurance claim for the patient is sent';


--
-- Name: COLUMN insurance_network_addresses.zipcode; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_network_addresses.zipcode IS 'The zipcode to which the Insurance claim for the patient is sent';


--
-- Name: COLUMN insurance_network_addresses.city; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_network_addresses.city IS 'The city to which the Insurance claim for the patient is sent';


--
-- Name: COLUMN insurance_network_addresses.billing_state; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_network_addresses.billing_state IS 'The billing state to which the Insurance claim for the patient is sent';


--
-- Name: insurance_network_address_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.insurance_network_address_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: insurance_network_address_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.insurance_network_address_id_seq OWNED BY public.insurance_network_addresses.id;


--
-- Name: insurance_network_states; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insurance_network_states (
    id bigint NOT NULL,
    insurance_network_id bigint NOT NULL,
    state_abbr character varying(2) NOT NULL
);


--
-- Name: TABLE insurance_network_states; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.insurance_network_states IS 'Insurance Network associated with states';


--
-- Name: COLUMN insurance_network_states.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_network_states.id IS 'The unique ID of the Insurance Network States record';


--
-- Name: COLUMN insurance_network_states.insurance_network_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_network_states.insurance_network_id IS 'Reference to the Insurance Network to which the Insurance Network States belongs to';


--
-- Name: COLUMN insurance_network_states.state_abbr; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_network_states.state_abbr IS 'Reference to the State abbreviation (2 character state code) in station to which the Insurance Network belongs to';


--
-- Name: insurance_network_states_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.insurance_network_states_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: insurance_network_states_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.insurance_network_states_id_seq OWNED BY public.insurance_network_states.id;


--
-- Name: insurance_networks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insurance_networks (
    id bigint NOT NULL,
    notes text,
    insurance_plan_id bigint NOT NULL,
    insurance_payer_id bigint NOT NULL,
    address text,
    zipcode text,
    city text,
    eligibility_check_enabled boolean DEFAULT false NOT NULL,
    provider_enrollment_enabled boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    name text NOT NULL,
    package_id bigint NOT NULL,
    insurance_classification_id bigint NOT NULL,
    billing_state text,
    emc_code text
);


--
-- Name: TABLE insurance_networks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.insurance_networks IS 'Insurance Network records table';


--
-- Name: COLUMN insurance_networks.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_networks.id IS 'The unique ID of the Insurance Network record';


--
-- Name: COLUMN insurance_networks.notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_networks.notes IS 'The notes about Insurance Network';


--
-- Name: COLUMN insurance_networks.insurance_plan_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_networks.insurance_plan_id IS 'Insurance plan of the Insurance Network';


--
-- Name: COLUMN insurance_networks.insurance_payer_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_networks.insurance_payer_id IS 'Reference to the Insurance Payer to which the Insurance Network belongs to';


--
-- Name: COLUMN insurance_networks.address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_networks.address IS 'The address at which the Insurance claim for the patient is sent';


--
-- Name: COLUMN insurance_networks.zipcode; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_networks.zipcode IS 'The zipcode at which the Insurance claim for the patient is sent';


--
-- Name: COLUMN insurance_networks.city; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_networks.city IS 'The city at which the Insurance claim for the patient is sent';


--
-- Name: COLUMN insurance_networks.eligibility_check_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_networks.eligibility_check_enabled IS 'Enables eligibility check for the Insurance Network';


--
-- Name: COLUMN insurance_networks.provider_enrollment_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_networks.provider_enrollment_enabled IS 'Enables provider enrollment for the Insurance Network';


--
-- Name: COLUMN insurance_networks.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_networks.is_active IS 'Active state of the Insurance Network';


--
-- Name: COLUMN insurance_networks.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_networks.created_at IS 'Point in time when the record was created';


--
-- Name: COLUMN insurance_networks.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_networks.updated_at IS 'Point in time when the record was updated';


--
-- Name: COLUMN insurance_networks.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_networks.deleted_at IS 'Point in time when the record was deleted';


--
-- Name: COLUMN insurance_networks.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_networks.name IS 'The name of the Insurance Network';


--
-- Name: COLUMN insurance_networks.package_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_networks.package_id IS 'The ID of the Insurance Package in Athena that this Insurance Network belongs to';


--
-- Name: COLUMN insurance_networks.insurance_classification_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_networks.insurance_classification_id IS 'The ID of the Insurance Classification that this Insurance Network belongs to';


--
-- Name: COLUMN insurance_networks.billing_state; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_networks.billing_state IS 'The state to which the insurance claim for the patient is sent';


--
-- Name: COLUMN insurance_networks.emc_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_networks.emc_code IS 'The EMC code of this Insurance Network';


--
-- Name: insurance_networks_appointment_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insurance_networks_appointment_types (
    id bigint NOT NULL,
    network_id bigint NOT NULL,
    service_line_id bigint NOT NULL,
    modality_type text NOT NULL,
    new_patient_appointment_type text NOT NULL,
    existing_patient_appointment_type text NOT NULL
);


--
-- Name: TABLE insurance_networks_appointment_types; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.insurance_networks_appointment_types IS 'Reference table for insurance networks Athena appointment types';


--
-- Name: COLUMN insurance_networks_appointment_types.network_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_networks_appointment_types.network_id IS 'ID of insurance network';


--
-- Name: COLUMN insurance_networks_appointment_types.service_line_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_networks_appointment_types.service_line_id IS 'ID of the station service-line';


--
-- Name: COLUMN insurance_networks_appointment_types.modality_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_networks_appointment_types.modality_type IS 'Represents type of modality associated with appointment types';


--
-- Name: COLUMN insurance_networks_appointment_types.new_patient_appointment_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_networks_appointment_types.new_patient_appointment_type IS 'Athena appointment type for new patient';


--
-- Name: COLUMN insurance_networks_appointment_types.existing_patient_appointment_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_networks_appointment_types.existing_patient_appointment_type IS 'Athena appointment type for existing patient';


--
-- Name: insurance_networks_appointment_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.insurance_networks_appointment_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: insurance_networks_appointment_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.insurance_networks_appointment_types_id_seq OWNED BY public.insurance_networks_appointment_types.id;


--
-- Name: insurance_networks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.insurance_networks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: insurance_networks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.insurance_networks_id_seq OWNED BY public.insurance_networks.id;


--
-- Name: insurance_payers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insurance_payers (
    id bigint NOT NULL,
    name text NOT NULL,
    notes text,
    is_active boolean DEFAULT false NOT NULL,
    payer_group_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: TABLE insurance_payers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.insurance_payers IS 'Insurance Payer records table';


--
-- Name: COLUMN insurance_payers.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_payers.id IS 'The unique ID of the insurance payer record';


--
-- Name: COLUMN insurance_payers.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_payers.name IS 'The name of the insurance payer';


--
-- Name: COLUMN insurance_payers.notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_payers.notes IS 'The notes about insurance payer';


--
-- Name: COLUMN insurance_payers.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_payers.is_active IS 'Active state of the Insurance Payer';


--
-- Name: COLUMN insurance_payers.payer_group_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_payers.payer_group_id IS 'The ID of the payer group that the insurance payer are associated with';


--
-- Name: COLUMN insurance_payers.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_payers.created_at IS 'Point in time when the record was created';


--
-- Name: COLUMN insurance_payers.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_payers.updated_at IS 'Point in time when the record was updated';


--
-- Name: COLUMN insurance_payers.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurance_payers.deleted_at IS 'Point in time when the record was deleted';


--
-- Name: insurance_payers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.insurance_payers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: insurance_payers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.insurance_payers_id_seq OWNED BY public.insurance_payers.id;


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
-- Name: insurance_network_addresses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_network_addresses ALTER COLUMN id SET DEFAULT nextval('public.insurance_network_address_id_seq'::regclass);


--
-- Name: insurance_network_states id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_network_states ALTER COLUMN id SET DEFAULT nextval('public.insurance_network_states_id_seq'::regclass);


--
-- Name: insurance_networks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_networks ALTER COLUMN id SET DEFAULT nextval('public.insurance_networks_id_seq'::regclass);


--
-- Name: insurance_networks_appointment_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_networks_appointment_types ALTER COLUMN id SET DEFAULT nextval('public.insurance_networks_appointment_types_id_seq'::regclass);


--
-- Name: insurance_payers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_payers ALTER COLUMN id SET DEFAULT nextval('public.insurance_payers_id_seq'::regclass);


--
-- Name: schema_migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations ALTER COLUMN id SET DEFAULT nextval('public.schema_migrations_id_seq'::regclass);


--
-- Name: insurance_network_addresses insurance_network_address_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_network_addresses
    ADD CONSTRAINT insurance_network_address_pkey PRIMARY KEY (id);


--
-- Name: insurance_network_states insurance_network_states_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_network_states
    ADD CONSTRAINT insurance_network_states_pkey PRIMARY KEY (id);


--
-- Name: insurance_networks_appointment_types insurance_networks_appointment_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_networks_appointment_types
    ADD CONSTRAINT insurance_networks_appointment_types_pkey PRIMARY KEY (id);


--
-- Name: insurance_networks insurance_networks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_networks
    ADD CONSTRAINT insurance_networks_pkey PRIMARY KEY (id);


--
-- Name: insurance_payers insurance_payers_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_payers
    ADD CONSTRAINT insurance_payers_name_key UNIQUE (name);


--
-- Name: insurance_payers insurance_payers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_payers
    ADD CONSTRAINT insurance_payers_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);


--
-- Name: insurance_network_addresses_insurance_network_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX insurance_network_addresses_insurance_network_id_idx ON public.insurance_network_addresses USING btree (insurance_network_id);


--
-- Name: INDEX insurance_network_addresses_insurance_network_id_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.insurance_network_addresses_insurance_network_id_idx IS 'Lookup index for insurance_network_addresses by insurance_network_id';


--
-- Name: insurance_network_states_insurance_network_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX insurance_network_states_insurance_network_idx ON public.insurance_network_states USING btree (insurance_network_id);


--
-- Name: insurance_network_states_state_abbr_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX insurance_network_states_state_abbr_idx ON public.insurance_network_states USING btree (state_abbr);


--
-- Name: insurance_networks_appointment_types_network_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX insurance_networks_appointment_types_network_id_idx ON public.insurance_networks_appointment_types USING btree (network_id);


--
-- Name: INDEX insurance_networks_appointment_types_network_id_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.insurance_networks_appointment_types_network_id_idx IS 'Lookup index for insurance_networks_appointment_types by network_id';


--
-- Name: insurance_networks_appointment_types_service_line_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX insurance_networks_appointment_types_service_line_id_idx ON public.insurance_networks_appointment_types USING btree (service_line_id);


--
-- Name: INDEX insurance_networks_appointment_types_service_line_id_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.insurance_networks_appointment_types_service_line_id_idx IS 'Lookup index for insurance_networks_appointment_types by service_line_id';


--
-- Name: insurance_networks_insurance_classification_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX insurance_networks_insurance_classification_idx ON public.insurance_networks USING btree (insurance_classification_id);


--
-- Name: INDEX insurance_networks_insurance_classification_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.insurance_networks_insurance_classification_idx IS 'Lookup index on insurance network by insurance classification ID';


--
-- Name: insurance_networks_insurance_payer_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX insurance_networks_insurance_payer_idx ON public.insurance_networks USING btree (insurance_payer_id);


--
-- Name: insurance_payers_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX insurance_payers_name_idx ON public.insurance_payers USING btree (name);


--
-- Name: INDEX insurance_payers_name_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.insurance_payers_name_idx IS 'Lookup index on insurance payer by name of payer';


--
-- Name: insurance_payers_name_trgm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX insurance_payers_name_trgm_idx ON public.insurance_payers USING gin (lower(name) public.gin_trgm_ops);


--
-- Name: insurance_network_addresses insurance_network_address_insurance_network_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_network_addresses
    ADD CONSTRAINT insurance_network_address_insurance_network_id_fkey FOREIGN KEY (insurance_network_id) REFERENCES public.insurance_networks(id);


--
-- Name: insurance_networks insurance_networks_insurance_payer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_networks
    ADD CONSTRAINT insurance_networks_insurance_payer_id_fkey FOREIGN KEY (insurance_payer_id) REFERENCES public.insurance_payers(id);


--
-- PostgreSQL database dump complete
--

