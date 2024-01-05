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
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


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
-- Name: patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patients (
    id bigint NOT NULL,
    patient_id text NOT NULL,
    dob text NOT NULL,
    legal_sex text,
    first_name text NOT NULL,
    last_name text NOT NULL,
    middle_name text,
    suffix text,
    alt_first_name text,
    home_phone text,
    mobile_phone text,
    email text,
    address_one text,
    address_two text,
    city text,
    state_code text,
    zip text,
    contact_name text,
    contact_relationship text,
    contact_mobile_phone text,
    guarantor_first_name text,
    guarantor_middle_name text,
    guarantor_last_name text,
    guarantor_suffix text,
    guarantor_dob text,
    guarantor_phone text,
    guarantor_email text,
    guarantor_address_one text,
    guarantor_address_two text,
    guarantor_city text,
    guarantor_state_code text,
    guarantor_zip text,
    guarantor_address_same_as_patient text,
    guarantor_relationship_to_patient text,
    department_id text NOT NULL,
    primary_provider_id text,
    portal_access_given text,
    gender_identity text,
    gender_identity_other text,
    birth_sex text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT patients_department_id_check CHECK ((department_id <> ''::text)),
    CONSTRAINT patients_dob_check CHECK ((dob <> ''::text)),
    CONSTRAINT patients_first_name_check CHECK ((first_name <> ''::text)),
    CONSTRAINT patients_last_name_check CHECK ((last_name <> ''::text)),
    CONSTRAINT patients_patient_id_check CHECK ((patient_id <> ''::text))
);


--
-- Name: TABLE patients; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.patients IS 'Athena Service Patients table';


--
-- Name: COLUMN patients.patient_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.patient_id IS 'Athena patient ID';


--
-- Name: COLUMN patients.dob; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.dob IS 'Patient date of birth in mm/dd/yyyy format';


--
-- Name: COLUMN patients.legal_sex; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.legal_sex IS 'Legal sex of the patient, distinct from birth sex. Either M, F, or null';


--
-- Name: COLUMN patients.first_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.first_name IS 'First name of the patient';


--
-- Name: COLUMN patients.last_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.last_name IS 'Last name of the patient';


--
-- Name: COLUMN patients.middle_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.middle_name IS 'Middle name of the patient';


--
-- Name: COLUMN patients.suffix; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.suffix IS 'Suffix of the patient name';


--
-- Name: COLUMN patients.alt_first_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.alt_first_name IS 'Alternate first name of the patient';


--
-- Name: COLUMN patients.home_phone; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.home_phone IS 'Home phone number of the patient. Stored in station as mobile_number';


--
-- Name: COLUMN patients.mobile_phone; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.mobile_phone IS 'Mobile phone number of the patient. Stored in station as verified_mobile_number';


--
-- Name: COLUMN patients.email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.email IS 'Email of the patient, or the string "declined" if patient declined to provide';


--
-- Name: COLUMN patients.address_one; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.address_one IS 'Patient address, first line';


--
-- Name: COLUMN patients.address_two; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.address_two IS 'Patient address, second line';


--
-- Name: COLUMN patients.city; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.city IS 'Patient address city';


--
-- Name: COLUMN patients.state_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.state_code IS 'Two letter abbreviation of the patient address state';


--
-- Name: COLUMN patients.zip; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.zip IS 'Patient address zip code';


--
-- Name: COLUMN patients.contact_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.contact_name IS 'Full name of the patient emergency contact';


--
-- Name: COLUMN patients.contact_relationship; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.contact_relationship IS 'Relationship of the patient to the emergency contact. For example, if the contact is the parent of the patient, this would be PARENT and not CHILD';


--
-- Name: COLUMN patients.contact_mobile_phone; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.contact_mobile_phone IS 'Mobile phone number of the patient emergency contact';


--
-- Name: COLUMN patients.guarantor_first_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.guarantor_first_name IS 'First name of the guarantor for the patient';


--
-- Name: COLUMN patients.guarantor_middle_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.guarantor_middle_name IS 'Middle name of the guarantor for the patient';


--
-- Name: COLUMN patients.guarantor_last_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.guarantor_last_name IS 'Last name of the guarantor for the patient';


--
-- Name: COLUMN patients.guarantor_suffix; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.guarantor_suffix IS 'Suffix of the name of the guarantor for the patient';


--
-- Name: COLUMN patients.guarantor_dob; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.guarantor_dob IS 'Date of birth of the guarantor for the patient, in mm/dd/yyyy format';


--
-- Name: COLUMN patients.guarantor_phone; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.guarantor_phone IS 'Phone number of the guarantor for the patient';


--
-- Name: COLUMN patients.guarantor_email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.guarantor_email IS 'Email of the guarantor for the patient';


--
-- Name: COLUMN patients.guarantor_address_one; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.guarantor_address_one IS 'Guarantor address, first line';


--
-- Name: COLUMN patients.guarantor_address_two; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.guarantor_address_two IS 'Guarantor address, second line';


--
-- Name: COLUMN patients.guarantor_city; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.guarantor_city IS 'Guarantor address city';


--
-- Name: COLUMN patients.guarantor_state_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.guarantor_state_code IS 'Two letter abbreviation of the Guarantor address state';


--
-- Name: COLUMN patients.guarantor_address_same_as_patient; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.guarantor_address_same_as_patient IS 'True if the guarantor address is the same as the patient address';


--
-- Name: COLUMN patients.guarantor_relationship_to_patient; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.guarantor_relationship_to_patient IS 'Relationship of the guarantor to the patient. Uses Athena Patient Relationship Mapping (https://docs.athenahealth.com/api/workflows/patient-relationship-mapping)';


--
-- Name: COLUMN patients.department_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.department_id IS 'Department ID that the patient is associated with';


--
-- Name: COLUMN patients.primary_provider_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.primary_provider_id IS 'ID of the primary provider for the patient';


--
-- Name: COLUMN patients.portal_access_given; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.portal_access_given IS 'True if portal access has been given to the patient';


--
-- Name: COLUMN patients.gender_identity; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.gender_identity IS 'Gender identity of the patient, using 2015 Ed. CEHRT values';


--
-- Name: COLUMN patients.gender_identity_other; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.gender_identity_other IS 'Self-described gender identity of patient. Only valid when used in conjunction with a gender identity choice that allows the patient to describe their identity';


--
-- Name: patients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.patients ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.patients_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


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
-- Name: schema_migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations ALTER COLUMN id SET DEFAULT nextval('public.schema_migrations_id_seq'::regclass);


--
-- Name: patients patients_patient_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_patient_id_key UNIQUE (patient_id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);


--
-- Name: patients_alt_first_name_dmetaphone_alt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_alt_first_name_dmetaphone_alt_idx ON public.patients USING btree (public.dmetaphone_alt(alt_first_name));


--
-- Name: patients_alt_full_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_alt_full_name_idx ON public.patients USING gin ((((alt_first_name || ' '::text) || last_name)) public.gin_trgm_ops);


--
-- Name: patients_alt_full_name_metaphone_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_alt_full_name_metaphone_idx ON public.patients USING btree (public.metaphone(((alt_first_name || ' '::text) || last_name), 15) text_pattern_ops);


--
-- Name: patients_first_name_dmetaphone_alt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_first_name_dmetaphone_alt_idx ON public.patients USING btree (public.dmetaphone_alt(first_name));


--
-- Name: patients_full_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_full_name_idx ON public.patients USING gin ((((first_name || ' '::text) || last_name)) public.gin_trgm_ops);


--
-- Name: patients_full_name_metaphone_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_full_name_metaphone_idx ON public.patients USING btree (public.metaphone(((first_name || ' '::text) || last_name), 15) text_pattern_ops);


--
-- Name: patients_last_name_dmetaphone_alt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_last_name_dmetaphone_alt_idx ON public.patients USING btree (public.dmetaphone_alt(last_name));


--
-- PostgreSQL database dump complete
--

