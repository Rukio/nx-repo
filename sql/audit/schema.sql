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
-- Name: audit_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_events (
    id bigint NOT NULL,
    source text NOT NULL,
    agent text NOT NULL,
    event_type text NOT NULL,
    event_timestamp timestamp with time zone NOT NULL,
    event_data_type text NOT NULL,
    event_data json,
    context_metadata json,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN audit_events.source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audit_events.source IS 'The source system (service, application, or otherwise) generating the audit event';


--
-- Name: COLUMN audit_events.agent; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audit_events.agent IS 'The user or account initiating the audit event';


--
-- Name: COLUMN audit_events.event_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audit_events.event_type IS 'The name of the action or event generating the audit event data';


--
-- Name: COLUMN audit_events.event_timestamp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audit_events.event_timestamp IS 'The timestamp of audited event';


--
-- Name: COLUMN audit_events.event_data_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audit_events.event_data_type IS 'The logical entity being mutated or accessed';


--
-- Name: COLUMN audit_events.event_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audit_events.event_data IS 'Any data related to the audited event and its data type itself which may also include PHI';


--
-- Name: COLUMN audit_events.context_metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audit_events.context_metadata IS 'Any data related to the system context in which the audited event occurred';


--
-- Name: COLUMN audit_events.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audit_events.created_at IS 'The creation timestamp of audited event record itself';


--
-- Name: audit_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_events_id_seq OWNED BY public.audit_events.id;


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
-- Name: audit_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_events ALTER COLUMN id SET DEFAULT nextval('public.audit_events_id_seq'::regclass);


--
-- Name: schema_migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations ALTER COLUMN id SET DEFAULT nextval('public.schema_migrations_id_seq'::regclass);


--
-- Name: audit_events audit_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_events
    ADD CONSTRAINT audit_events_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

