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


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_table_access_method = heap;

--
-- Name: care_request_symptoms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.care_request_symptoms (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    symptom_data jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    care_request_id bigint NOT NULL
);


--
-- Name: legacy_risk_protocols; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.legacy_risk_protocols (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE legacy_risk_protocols; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.legacy_risk_protocols IS 'Stores Legacy risk protocols from TurfOrSurf by their name to associate back to a symptom';


--
-- Name: COLUMN legacy_risk_protocols.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.legacy_risk_protocols.name IS 'The name of the risk protocol';


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
-- Name: symptom_aliases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.symptom_aliases (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    symptom_id uuid NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: TABLE symptom_aliases; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.symptom_aliases IS 'Alternative aliased names of canonical symptoms';


--
-- Name: COLUMN symptom_aliases.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.symptom_aliases.name IS 'The name of the symptom alias';


--
-- Name: symptoms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.symptoms (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    legacy_risk_protocol_id uuid
);


--
-- Name: TABLE symptoms; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.symptoms IS 'Canonical set of symptom names';


--
-- Name: COLUMN symptoms.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.symptoms.name IS 'The name of the symptom';


--
-- Name: time_sensitive_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.time_sensitive_questions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    survey_version_id uuid NOT NULL,
    question text NOT NULL,
    signs jsonb DEFAULT '{}'::jsonb NOT NULL,
    display_order smallint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE time_sensitive_questions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.time_sensitive_questions IS 'Stores time sensitive questions asked during screening';


--
-- Name: COLUMN time_sensitive_questions.survey_version_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.time_sensitive_questions.survey_version_id IS 'UUID v4 ID of the Survey';


--
-- Name: COLUMN time_sensitive_questions.question; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.time_sensitive_questions.question IS 'Question text';


--
-- Name: COLUMN time_sensitive_questions.signs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.time_sensitive_questions.signs IS 'jsonb of signs that indicate a question should be answered with Yes';


--
-- Name: COLUMN time_sensitive_questions.display_order; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.time_sensitive_questions.display_order IS 'Ordering of the question';


--
-- Name: COLUMN time_sensitive_questions.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.time_sensitive_questions.created_at IS 'Point in time when the record was created';


--
-- Name: COLUMN time_sensitive_questions.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.time_sensitive_questions.updated_at IS 'Point in time when the record was updated';


--
-- Name: time_sensitive_screenings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.time_sensitive_screenings (
    id bigint NOT NULL,
    care_request_id bigint NOT NULL,
    escalated boolean NOT NULL,
    escalated_question_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    survey_version_id uuid NOT NULL,
    secondary_screening_id bigint
);


--
-- Name: TABLE time_sensitive_screenings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.time_sensitive_screenings IS 'Time sensitive screening metadata for a given care request';


--
-- Name: COLUMN time_sensitive_screenings.care_request_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.time_sensitive_screenings.care_request_id IS 'Care request being screened';


--
-- Name: COLUMN time_sensitive_screenings.escalated; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.time_sensitive_screenings.escalated IS 'Escalation result for this time sensitive screening';


--
-- Name: COLUMN time_sensitive_screenings.escalated_question_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.time_sensitive_screenings.escalated_question_id IS 'The time sensitive question that triggered escalation';


--
-- Name: COLUMN time_sensitive_screenings.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.time_sensitive_screenings.created_at IS 'Point in time when the record was created';


--
-- Name: COLUMN time_sensitive_screenings.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.time_sensitive_screenings.updated_at IS 'Point in time when the record was updated';


--
-- Name: COLUMN time_sensitive_screenings.survey_version_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.time_sensitive_screenings.survey_version_id IS 'The survey version id that was used for secondary screening';


--
-- Name: COLUMN time_sensitive_screenings.secondary_screening_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.time_sensitive_screenings.secondary_screening_id IS 'Secondary Screening Id from Station Database';


--
-- Name: time_sensitive_screenings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.time_sensitive_screenings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: time_sensitive_screenings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.time_sensitive_screenings_id_seq OWNED BY public.time_sensitive_screenings.id;


--
-- Name: time_sensitive_survey_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.time_sensitive_survey_versions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE time_sensitive_survey_versions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.time_sensitive_survey_versions IS 'Stores survey versions for historical data purposes';


--
-- Name: COLUMN time_sensitive_survey_versions.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.time_sensitive_survey_versions.created_at IS 'Point in time when the record was created';


--
-- Name: schema_migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations ALTER COLUMN id SET DEFAULT nextval('public.schema_migrations_id_seq'::regclass);


--
-- Name: time_sensitive_screenings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_sensitive_screenings ALTER COLUMN id SET DEFAULT nextval('public.time_sensitive_screenings_id_seq'::regclass);


--
-- Name: care_request_symptoms care_request_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_request_symptoms
    ADD CONSTRAINT care_request_id_unique UNIQUE (care_request_id);


--
-- Name: care_request_symptoms care_request_symptoms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_request_symptoms
    ADD CONSTRAINT care_request_symptoms_pkey PRIMARY KEY (id);


--
-- Name: legacy_risk_protocols legacy_risk_protocols_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legacy_risk_protocols
    ADD CONSTRAINT legacy_risk_protocols_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);


--
-- Name: symptom_aliases symptom_aliases_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.symptom_aliases
    ADD CONSTRAINT symptom_aliases_name_key UNIQUE (name);


--
-- Name: symptom_aliases symptom_aliases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.symptom_aliases
    ADD CONSTRAINT symptom_aliases_pkey PRIMARY KEY (id);


--
-- Name: symptoms symptoms_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.symptoms
    ADD CONSTRAINT symptoms_name_key UNIQUE (name);


--
-- Name: symptoms symptoms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.symptoms
    ADD CONSTRAINT symptoms_pkey PRIMARY KEY (id);


--
-- Name: time_sensitive_questions time_sensitive_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_sensitive_questions
    ADD CONSTRAINT time_sensitive_questions_pkey PRIMARY KEY (id);


--
-- Name: time_sensitive_screenings time_sensitive_screenings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_sensitive_screenings
    ADD CONSTRAINT time_sensitive_screenings_pkey PRIMARY KEY (id);


--
-- Name: time_sensitive_survey_versions time_sensitive_survey_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_sensitive_survey_versions
    ADD CONSTRAINT time_sensitive_survey_versions_pkey PRIMARY KEY (id);


--
-- Name: care_request_screening_survey_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX care_request_screening_survey_idx ON public.time_sensitive_screenings USING btree (care_request_id, survey_version_id, secondary_screening_id) WHERE (secondary_screening_id IS NOT NULL);


--
-- Name: care_request_survey_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX care_request_survey_idx ON public.time_sensitive_screenings USING btree (care_request_id, survey_version_id) WHERE (secondary_screening_id IS NULL);


--
-- Name: symptom_aliases_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX symptom_aliases_name_idx ON public.symptom_aliases USING gin (name public.gin_trgm_ops);


--
-- Name: symptom_aliases_uuid_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX symptom_aliases_uuid_idx ON public.symptom_aliases USING btree (id);


--
-- Name: symptoms_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX symptoms_name_idx ON public.symptoms USING gin (name public.gin_trgm_ops);


--
-- Name: symptoms_uuid_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX symptoms_uuid_idx ON public.symptoms USING btree (id);


--
-- Name: symptom_aliases symptom_aliases_symptom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.symptom_aliases
    ADD CONSTRAINT symptom_aliases_symptom_id_fkey FOREIGN KEY (symptom_id) REFERENCES public.symptoms(id);


--
-- Name: symptoms symptoms_legacy_risk_protocol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.symptoms
    ADD CONSTRAINT symptoms_legacy_risk_protocol_id_fkey FOREIGN KEY (legacy_risk_protocol_id) REFERENCES public.legacy_risk_protocols(id);


--
-- Name: time_sensitive_questions time_sensitive_questions_survey_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_sensitive_questions
    ADD CONSTRAINT time_sensitive_questions_survey_version_id_fkey FOREIGN KEY (survey_version_id) REFERENCES public.time_sensitive_survey_versions(id);


--
-- Name: time_sensitive_screenings time_sensitive_screenings_escalated_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_sensitive_screenings
    ADD CONSTRAINT time_sensitive_screenings_escalated_question_id_fkey FOREIGN KEY (escalated_question_id) REFERENCES public.time_sensitive_questions(id);


--
-- Name: time_sensitive_screenings time_sensitive_screenings_survey_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_sensitive_screenings
    ADD CONSTRAINT time_sensitive_screenings_survey_version_id_fkey FOREIGN KEY (survey_version_id) REFERENCES public.time_sensitive_survey_versions(id);


--
-- PostgreSQL database dump complete
--

