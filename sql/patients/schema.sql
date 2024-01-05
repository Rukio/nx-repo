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
-- Name: gender_identity; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.gender_identity AS ENUM (
    'm',
    'f',
    'mtf',
    'ftm',
    'nb',
    'u',
    'other',
    'undisclosed'
);


--
-- Name: TYPE gender_identity; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.gender_identity IS 'm=male, f=female, mtf=male-to-female, ftm=female-to-male, nb=nonbinary, u=unknown, undisclosed=choose not to disclose, and other=other';


--
-- Name: sex; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sex AS ENUM (
    'm',
    'f',
    'u'
);


--
-- Name: TYPE sex; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.sex IS 'm=male, f=female, and u=unknown';


SET default_table_access_method = heap;

--
-- Name: birth_sex; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.birth_sex (
    id bigint NOT NULL,
    short_name text NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE birth_sex; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.birth_sex IS 'Categories of birth sex';


--
-- Name: COLUMN birth_sex.short_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.birth_sex.short_name IS 'Short name of the birth sex category';


--
-- Name: COLUMN birth_sex.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.birth_sex.description IS 'Description of the birth sex category';


--
-- Name: birth_sex_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.birth_sex_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: birth_sex_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.birth_sex_id_seq OWNED BY public.birth_sex.id;


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
-- Name: unverified_patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unverified_patients (
    id bigint NOT NULL,
    athena_id bigint,
    date_of_birth date NOT NULL,
    given_name text NOT NULL,
    family_name text NOT NULL,
    phone_number text,
    legal_sex public.sex NOT NULL,
    gender_identity public.gender_identity,
    gender_identity_details text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    patient_id bigint,
    birth_sex_id bigint
);


--
-- Name: TABLE unverified_patients; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.unverified_patients IS 'staging patients table used for accounts that do not have a verified assocation with a patient';


--
-- Name: COLUMN unverified_patients.athena_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.unverified_patients.athena_id IS 'athena id, used only for certain write operations. never exposed to caller.';


--
-- Name: COLUMN unverified_patients.gender_identity_details; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.unverified_patients.gender_identity_details IS 'if gender identity is OTHER, then additional details are stored here';


--
-- Name: COLUMN unverified_patients.patient_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.unverified_patients.patient_id IS 'The Dispatch Health patient ID. Defined if the unverified patient is associated with a patient record.';


--
-- Name: COLUMN unverified_patients.birth_sex_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.unverified_patients.birth_sex_id IS 'Birth sex of the patient';


--
-- Name: unverified_patients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.unverified_patients ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.unverified_patients_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: birth_sex id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.birth_sex ALTER COLUMN id SET DEFAULT nextval('public.birth_sex_id_seq'::regclass);


--
-- Name: schema_migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations ALTER COLUMN id SET DEFAULT nextval('public.schema_migrations_id_seq'::regclass);


--
-- Name: birth_sex birth_sex_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.birth_sex
    ADD CONSTRAINT birth_sex_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);


--
-- Name: unverified_patients unverified_patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unverified_patients
    ADD CONSTRAINT unverified_patients_pkey PRIMARY KEY (id);


--
-- Name: birth_sex_short_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX birth_sex_short_name_idx ON public.birth_sex USING btree (short_name);


--
-- Name: INDEX birth_sex_short_name_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.birth_sex_short_name_idx IS 'Lookup index for birth sex';


--
-- Name: unverified_patients_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX unverified_patients_updated_at_idx ON public.unverified_patients USING btree (updated_at);


--
-- Name: unverified_patients fk_unverified_patients_birth_sex; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unverified_patients
    ADD CONSTRAINT fk_unverified_patients_birth_sex FOREIGN KEY (birth_sex_id) REFERENCES public.birth_sex(id);


--
-- PostgreSQL database dump complete
--

