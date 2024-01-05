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
-- Name: file_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.file_status AS ENUM (
    'unspecified',
    'new',
    'preprocess',
    'waiting',
    'invalid',
    'failed',
    'processing',
    'processed'
);


SET default_table_access_method = heap;

--
-- Name: bucket_folder_email_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bucket_folder_email_notifications (
    id bigint NOT NULL,
    email text NOT NULL,
    bucket_folder_id bigint NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: bucket_folder_email_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bucket_folder_email_notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bucket_folder_email_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bucket_folder_email_notifications_id_seq OWNED BY public.bucket_folder_email_notifications.id;


--
-- Name: bucket_folders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bucket_folders (
    id bigint NOT NULL,
    name text NOT NULL,
    s3_bucket_name text NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deactivated_at timestamp with time zone
);


--
-- Name: bucket_folders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bucket_folders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bucket_folders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bucket_folders_id_seq OWNED BY public.bucket_folders.id;


--
-- Name: files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.files (
    id bigint NOT NULL,
    filename text NOT NULL,
    aws_object_key text,
    number_of_patients_loaded integer DEFAULT 0 NOT NULL,
    status public.file_status NOT NULL,
    processed_at timestamp with time zone,
    submitted_at timestamp with time zone,
    bucket_folder_id bigint NOT NULL,
    template_id bigint,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    prefect_flow_run_id text,
    file_parameters jsonb DEFAULT '{}'::jsonb NOT NULL,
    patients_deleted_count integer DEFAULT 0 NOT NULL,
    patients_updated_count integer DEFAULT 0 NOT NULL,
    is_backfill boolean DEFAULT false NOT NULL
);


--
-- Name: COLUMN files.file_parameters; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.files.file_parameters IS 'Stores as a json object the force upload flag to be used when creating a prefect request';


--
-- Name: COLUMN files.patients_deleted_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.files.patients_deleted_count IS 'Number of patients deleted, from results file';


--
-- Name: COLUMN files.patients_updated_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.files.patients_updated_count IS 'Number of patients updated, from results file';


--
-- Name: COLUMN files.is_backfill; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.files.is_backfill IS 'Indicates whether is a backfill file or not';


--
-- Name: files_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.files_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.files_id_seq OWNED BY public.files.id;


--
-- Name: files_result_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.files_result_codes (
    id bigint NOT NULL,
    file_id bigint NOT NULL,
    result_code_id bigint NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    number_of_occurrences integer DEFAULT 1 NOT NULL,
    first_occurrence integer,
    fields text,
    error_description text
);


--
-- Name: files_result_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.files_result_codes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: files_result_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.files_result_codes_id_seq OWNED BY public.files_result_codes.id;


--
-- Name: result_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.result_codes (
    id bigint NOT NULL,
    code text NOT NULL,
    code_description text,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    code_level text NOT NULL
);


--
-- Name: result_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.result_codes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: result_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.result_codes_id_seq OWNED BY public.result_codes.id;


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
-- Name: templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.templates (
    id bigint NOT NULL,
    name text NOT NULL,
    file_type text NOT NULL,
    file_identifier_type text NOT NULL,
    file_identifier_value text NOT NULL,
    column_mapping jsonb NOT NULL,
    channel_item_id bigint NOT NULL,
    bucket_folder_id bigint NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    market_id bigint NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.templates_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.templates_id_seq OWNED BY public.templates.id;


--
-- Name: bucket_folder_email_notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bucket_folder_email_notifications ALTER COLUMN id SET DEFAULT nextval('public.bucket_folder_email_notifications_id_seq'::regclass);


--
-- Name: bucket_folders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bucket_folders ALTER COLUMN id SET DEFAULT nextval('public.bucket_folders_id_seq'::regclass);


--
-- Name: files id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files ALTER COLUMN id SET DEFAULT nextval('public.files_id_seq'::regclass);


--
-- Name: files_result_codes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files_result_codes ALTER COLUMN id SET DEFAULT nextval('public.files_result_codes_id_seq'::regclass);


--
-- Name: result_codes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.result_codes ALTER COLUMN id SET DEFAULT nextval('public.result_codes_id_seq'::regclass);


--
-- Name: schema_migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations ALTER COLUMN id SET DEFAULT nextval('public.schema_migrations_id_seq'::regclass);


--
-- Name: templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates ALTER COLUMN id SET DEFAULT nextval('public.templates_id_seq'::regclass);


--
-- Name: bucket_folder_email_notifications bucket_folder_email_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bucket_folder_email_notifications
    ADD CONSTRAINT bucket_folder_email_notifications_pkey PRIMARY KEY (id);


--
-- Name: bucket_folder_email_notifications bucket_folder_email_notifications_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bucket_folder_email_notifications
    ADD CONSTRAINT bucket_folder_email_notifications_unique UNIQUE (bucket_folder_id, email);


--
-- Name: bucket_folders bucket_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bucket_folders
    ADD CONSTRAINT bucket_folders_pkey PRIMARY KEY (id);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: files_result_codes files_result_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files_result_codes
    ADD CONSTRAINT files_result_codes_pkey PRIMARY KEY (id);


--
-- Name: result_codes result_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.result_codes
    ADD CONSTRAINT result_codes_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);


--
-- Name: templates templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_pkey PRIMARY KEY (id);


--
-- Name: bucket_folder_aws_object_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bucket_folder_aws_object_key_idx ON public.files USING btree (bucket_folder_id, aws_object_key);


--
-- Name: bucket_folder_email_notifications_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bucket_folder_email_notifications_updated_at_idx ON public.bucket_folder_email_notifications USING btree (updated_at);


--
-- Name: bucket_folders_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bucket_folders_name_idx ON public.bucket_folders USING btree (name);


--
-- Name: bucket_folders_s3_bucket_name_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX bucket_folders_s3_bucket_name_unique_idx ON public.bucket_folders USING btree (s3_bucket_name);


--
-- Name: bucket_folders_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX bucket_folders_unique_idx ON public.bucket_folders USING btree (name, s3_bucket_name);


--
-- Name: bucket_folders_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bucket_folders_updated_at_idx ON public.bucket_folders USING btree (updated_at);


--
-- Name: code_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX code_unique_idx ON public.result_codes USING btree (code);


--
-- Name: files_bucket_folder_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX files_bucket_folder_id_idx ON public.files USING btree (bucket_folder_id);


--
-- Name: files_result_codes_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX files_result_codes_unique_idx ON public.files_result_codes USING btree (file_id, result_code_id);


--
-- Name: files_result_codes_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX files_result_codes_updated_at_idx ON public.files_result_codes USING btree (updated_at);


--
-- Name: files_sort_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX files_sort_idx ON public.files USING btree (bucket_folder_id, created_at);


--
-- Name: files_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX files_updated_at_idx ON public.files USING btree (updated_at);


--
-- Name: files_updated_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX files_updated_status_idx ON public.files USING btree (status, updated_at);


--
-- Name: lower_filename_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lower_filename_idx ON public.files USING btree (lower(filename));


--
-- Name: prefect_flow_run_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX prefect_flow_run_id_idx ON public.files USING btree (prefect_flow_run_id);


--
-- Name: templates_bucket_folder_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX templates_bucket_folder_id_idx ON public.templates USING btree (bucket_folder_id);


--
-- Name: templates_channel_item_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX templates_channel_item_id_idx ON public.templates USING btree (channel_item_id);


--
-- Name: templates_folder_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX templates_folder_name_idx ON public.templates USING btree (bucket_folder_id, name);


--
-- Name: templates_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX templates_name_idx ON public.templates USING btree (name, updated_at);


--
-- Name: templates_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX templates_updated_at_idx ON public.templates USING btree (updated_at);


--
-- PostgreSQL database dump complete
--

