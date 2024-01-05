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
-- Name: access_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.access_levels (
    id bigint NOT NULL,
    short_name text NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE access_levels; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.access_levels IS 'Types of access levels';


--
-- Name: COLUMN access_levels.short_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.access_levels.short_name IS 'Short name of the access level';


--
-- Name: COLUMN access_levels.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.access_levels.description IS 'Description of the access level';


--
-- Name: access_levels_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.access_levels_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: access_levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.access_levels_id_seq OWNED BY public.access_levels.id;


--
-- Name: account_care_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_care_requests (
    id bigint NOT NULL,
    account_id bigint NOT NULL,
    care_request_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE account_care_requests; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.account_care_requests IS 'mapping table of which accounts created which care requests';


--
-- Name: account_care_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.account_care_requests ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.account_care_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: account_patient_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_patient_links (
    id bigint NOT NULL,
    account_id bigint NOT NULL,
    patient_id bigint,
    unverified_patient_id bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    access_level_id bigint NOT NULL,
    consenting_relationship_id bigint NOT NULL,
    CONSTRAINT account_patients_check CHECK ((((patient_id IS NOT NULL) OR (unverified_patient_id IS NOT NULL)) AND ((patient_id IS NULL) OR (unverified_patient_id IS NULL))))
);


--
-- Name: TABLE account_patient_links; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.account_patient_links IS 'mapping table of which accounts have what access to which patients';


--
-- Name: COLUMN account_patient_links.patient_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.account_patient_links.patient_id IS 'patient ID for this account, which maps to the *company-data-covered* patient ID. exactly one of patient_id and unverified_patient_id must be NULL';


--
-- Name: COLUMN account_patient_links.unverified_patient_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.account_patient_links.unverified_patient_id IS 'unverified patient ID for this account, which maps to a table in patients service. exactly one of patient_id and unverified_patient_id must be NULL';


--
-- Name: COLUMN account_patient_links.access_level_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.account_patient_links.access_level_id IS 'Access level';


--
-- Name: COLUMN account_patient_links.consenting_relationship_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.account_patient_links.consenting_relationship_id IS 'consenting relationship';


--
-- Name: account_patients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.account_patient_links ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.account_patients_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id bigint NOT NULL,
    auth0_id text NOT NULL,
    email text NOT NULL,
    given_name text,
    family_name text,
    phone_number text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE accounts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.accounts IS 'account information for patients and patient-adjacent users requesting care';


--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.accounts ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.accounts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.addresses (
    id bigint NOT NULL,
    account_id bigint NOT NULL,
    address_line_one text,
    address_line_two text,
    city text,
    state_code text,
    zipcode text,
    location_details text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    latitude_e6 integer,
    longitude_e6 integer,
    facility_type_id bigint DEFAULT 1 NOT NULL
);


--
-- Name: TABLE addresses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.addresses IS 'addresses previously used by a patient account';


--
-- Name: COLUMN addresses.location_details; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.addresses.location_details IS 'miscellaneous information about the address (ex: gate code, parking instructions, etc.)';


--
-- Name: COLUMN addresses.latitude_e6; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.addresses.latitude_e6 IS 'Latitude of the address multiplied by 1e6';


--
-- Name: COLUMN addresses.longitude_e6; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.addresses.longitude_e6 IS 'Longitude of the address multiplied by 1e6';


--
-- Name: COLUMN addresses.facility_type_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.addresses.facility_type_id IS 'ID of the facility type where care is given, i.e. Home, Virtual Visit, Long-term Care Facility';


--
-- Name: addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.addresses ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.addresses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: consenting_relationships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consenting_relationships (
    id bigint NOT NULL,
    short_name text NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE consenting_relationships; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.consenting_relationships IS 'Types of consenting relationships between an account holder and a patient';


--
-- Name: COLUMN consenting_relationships.short_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.consenting_relationships.short_name IS 'Short name of the consenting relationship';


--
-- Name: COLUMN consenting_relationships.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.consenting_relationships.description IS 'Description of the consenting relationship';


--
-- Name: consenting_relationships_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.consenting_relationships_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: consenting_relationships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.consenting_relationships_id_seq OWNED BY public.consenting_relationships.id;


--
-- Name: facility_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.facility_type (
    id bigint NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE facility_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.facility_type IS 'Types of facilities where care is given';


--
-- Name: COLUMN facility_type.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.facility_type.name IS 'Name of the facility type, i.e. home, virtual_visit, long_term_care_facility';


--
-- Name: facility_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.facility_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: facility_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.facility_type_id_seq OWNED BY public.facility_type.id;


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
-- Name: access_levels id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_levels ALTER COLUMN id SET DEFAULT nextval('public.access_levels_id_seq'::regclass);


--
-- Name: consenting_relationships id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consenting_relationships ALTER COLUMN id SET DEFAULT nextval('public.consenting_relationships_id_seq'::regclass);


--
-- Name: facility_type id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facility_type ALTER COLUMN id SET DEFAULT nextval('public.facility_type_id_seq'::regclass);


--
-- Name: schema_migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations ALTER COLUMN id SET DEFAULT nextval('public.schema_migrations_id_seq'::regclass);


--
-- Name: access_levels access_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_levels
    ADD CONSTRAINT access_levels_pkey PRIMARY KEY (id);


--
-- Name: account_care_requests account_care_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_care_requests
    ADD CONSTRAINT account_care_requests_pkey PRIMARY KEY (id);


--
-- Name: account_patient_links account_patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_patient_links
    ADD CONSTRAINT account_patients_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_auth0_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_auth0_id_key UNIQUE (auth0_id);


--
-- Name: accounts accounts_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_email_key UNIQUE (email);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: consenting_relationships consenting_relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consenting_relationships
    ADD CONSTRAINT consenting_relationships_pkey PRIMARY KEY (id);


--
-- Name: facility_type facility_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facility_type
    ADD CONSTRAINT facility_type_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);


--
-- Name: access_levels_short_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX access_levels_short_name_idx ON public.access_levels USING btree (short_name);


--
-- Name: INDEX access_levels_short_name_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.access_levels_short_name_idx IS 'Lookup index for access levels';


--
-- Name: account_care_request_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX account_care_request_idx ON public.account_care_requests USING btree (care_request_id);


--
-- Name: account_care_request_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX account_care_request_updated_at_idx ON public.account_care_requests USING btree (updated_at);


--
-- Name: account_patients_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX account_patients_idx ON public.account_patient_links USING btree (patient_id, deleted_at);


--
-- Name: account_patients_unverified_patient_id_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX account_patients_unverified_patient_id_uidx ON public.account_patient_links USING btree (unverified_patient_id) WHERE (unverified_patient_id IS NOT NULL);


--
-- Name: INDEX account_patients_unverified_patient_id_uidx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.account_patients_unverified_patient_id_uidx IS 'Unique index to unverified_patient_id column to ensure only one account is associated to an unverified patient';


--
-- Name: account_patients_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX account_patients_updated_at_idx ON public.account_patient_links USING btree (updated_at);


--
-- Name: account_unverified_patients_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX account_unverified_patients_idx ON public.account_patient_links USING btree (unverified_patient_id, deleted_at);


--
-- Name: accounts_auth0_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_auth0_id_idx ON public.accounts USING btree (auth0_id);


--
-- Name: accounts_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_name_idx ON public.accounts USING btree (family_name, given_name);


--
-- Name: accounts_phone_number_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_phone_number_idx ON public.accounts USING btree (phone_number);


--
-- Name: accounts_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_updated_at_idx ON public.accounts USING btree (updated_at);


--
-- Name: addresses_account_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX addresses_account_id_idx ON public.addresses USING btree (account_id);


--
-- Name: addresses_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX addresses_updated_at_idx ON public.addresses USING btree (updated_at);


--
-- Name: consenting_relationships_short_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX consenting_relationships_short_name_idx ON public.consenting_relationships USING btree (short_name);


--
-- Name: INDEX consenting_relationships_short_name_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.consenting_relationships_short_name_idx IS 'Lookup index for consenting relationships';


--
-- Name: account_care_requests account_care_requests_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_care_requests
    ADD CONSTRAINT account_care_requests_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: account_patient_links account_patients_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_patient_links
    ADD CONSTRAINT account_patients_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: addresses addresses_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: account_patient_links fk_account_patient_links_access_levels; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_patient_links
    ADD CONSTRAINT fk_account_patient_links_access_levels FOREIGN KEY (access_level_id) REFERENCES public.access_levels(id);


--
-- Name: account_patient_links fk_account_patient_links_consenting_relationships; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_patient_links
    ADD CONSTRAINT fk_account_patient_links_consenting_relationships FOREIGN KEY (consenting_relationship_id) REFERENCES public.consenting_relationships(id);


--
-- Name: addresses fk_addresses_facility_type; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT fk_addresses_facility_type FOREIGN KEY (facility_type_id) REFERENCES public.facility_type(id);


--
-- PostgreSQL database dump complete
--

