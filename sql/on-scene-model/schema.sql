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
-- Name: ml_predictions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ml_predictions (
    id bigint NOT NULL,
    care_request_id bigint NOT NULL,
    feature_hash bytea NOT NULL,
    prediction bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_queried_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    model_version text
);


--
-- Name: TABLE ml_predictions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ml_predictions IS 'Table to store prediction value from on_scene_model_server';


--
-- Name: COLUMN ml_predictions.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ml_predictions.id IS 'Auto-incrementing ID';


--
-- Name: COLUMN ml_predictions.care_request_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ml_predictions.care_request_id IS 'ID of care request';


--
-- Name: COLUMN ml_predictions.feature_hash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ml_predictions.feature_hash IS 'SHA256 of the input features (including care_request_id, model_version AND date)';


--
-- Name: COLUMN ml_predictions.prediction; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ml_predictions.prediction IS 'Predicted on-scene time in minutes.';


--
-- Name: COLUMN ml_predictions.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ml_predictions.created_at IS 'Timestamp that prediction for this feature hash was created';


--
-- Name: COLUMN ml_predictions.last_queried_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ml_predictions.last_queried_at IS 'Timestamp that this cached record was last queried';


--
-- Name: COLUMN ml_predictions.model_version; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ml_predictions.model_version IS 'Model version';


--
-- Name: ml_predictions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ml_predictions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ml_predictions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ml_predictions_id_seq OWNED BY public.ml_predictions.id;


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
-- Name: ml_predictions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ml_predictions ALTER COLUMN id SET DEFAULT nextval('public.ml_predictions_id_seq'::regclass);


--
-- Name: schema_migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations ALTER COLUMN id SET DEFAULT nextval('public.schema_migrations_id_seq'::regclass);


--
-- Name: ml_predictions ml_predictions_feature_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ml_predictions
    ADD CONSTRAINT ml_predictions_feature_hash_key UNIQUE (feature_hash);


--
-- Name: ml_predictions ml_predictions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ml_predictions
    ADD CONSTRAINT ml_predictions_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);


--
-- Name: ml_predictions_feature_hash_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ml_predictions_feature_hash_idx ON public.ml_predictions USING btree (feature_hash);


--
-- PostgreSQL database dump complete
--

