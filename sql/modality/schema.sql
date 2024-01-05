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
-- Name: calculate_modalities_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calculate_modalities_logs (
    id bigint NOT NULL,
    market_id bigint NOT NULL,
    insurance_plan_id bigint NOT NULL,
    service_line_id bigint NOT NULL,
    business_modalities text[],
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE calculate_modalities_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.calculate_modalities_logs IS 'Reference table for logs from modalities calculation';


--
-- Name: COLUMN calculate_modalities_logs.market_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.calculate_modalities_logs.market_id IS 'Id of market used in modalities calculation';


--
-- Name: COLUMN calculate_modalities_logs.insurance_plan_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.calculate_modalities_logs.insurance_plan_id IS 'Id of insurance plan used in modalities calculation';


--
-- Name: COLUMN calculate_modalities_logs.service_line_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.calculate_modalities_logs.service_line_id IS 'Id of service-line used in modalities calculation';


--
-- Name: COLUMN calculate_modalities_logs.business_modalities; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.calculate_modalities_logs.business_modalities IS 'Result of business modalities calculation';


--
-- Name: calculate_modalities_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.calculate_modalities_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: calculate_modalities_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.calculate_modalities_logs_id_seq OWNED BY public.calculate_modalities_logs.id;


--
-- Name: market_modality_configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_modality_configurations (
    id bigint NOT NULL,
    market_id bigint NOT NULL,
    service_line_id bigint NOT NULL,
    modality_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE market_modality_configurations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.market_modality_configurations IS 'Reference table for market modality configurations';


--
-- Name: COLUMN market_modality_configurations.market_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_modality_configurations.market_id IS 'Id of market used in market modality configuration';


--
-- Name: COLUMN market_modality_configurations.service_line_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_modality_configurations.service_line_id IS 'Id of service-line used in market modality configuration';


--
-- Name: COLUMN market_modality_configurations.modality_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_modality_configurations.modality_id IS 'Id of modality used in market modality configuration, also used as foreign key';


--
-- Name: market_modality_configurations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.market_modality_configurations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: market_modality_configurations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.market_modality_configurations_id_seq OWNED BY public.market_modality_configurations.id;


--
-- Name: modalities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modalities (
    id bigint NOT NULL,
    display_name text NOT NULL,
    modality_type text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    display_order integer NOT NULL
);


--
-- Name: TABLE modalities; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.modalities IS 'Reference table for modality types';


--
-- Name: COLUMN modalities.display_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.modalities.display_name IS 'UI-visible name of modality';


--
-- Name: COLUMN modalities.modality_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.modalities.modality_type IS 'Type of modality (used on back-end only)';


--
-- Name: COLUMN modalities.display_order; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.modalities.display_order IS 'Order of display of modalities on frontend clients';


--
-- Name: modalities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.modalities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: modalities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.modalities_id_seq OWNED BY public.modalities.id;


--
-- Name: modality_configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modality_configurations (
    id bigint NOT NULL,
    market_id bigint NOT NULL,
    insurance_plan_id bigint NOT NULL,
    service_line_id bigint NOT NULL,
    modality_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE modality_configurations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.modality_configurations IS 'Reference table for modality configurations';


--
-- Name: COLUMN modality_configurations.market_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.modality_configurations.market_id IS 'Id of market used in configuration';


--
-- Name: COLUMN modality_configurations.insurance_plan_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.modality_configurations.insurance_plan_id IS 'Id of insurance plan used in configuration)';


--
-- Name: COLUMN modality_configurations.service_line_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.modality_configurations.service_line_id IS 'Id of service-line used in configuration';


--
-- Name: COLUMN modality_configurations.modality_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.modality_configurations.modality_id IS 'Id of modality used in configuration, also used as foreign key';


--
-- Name: modality_configurations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.modality_configurations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: modality_configurations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.modality_configurations_id_seq OWNED BY public.modality_configurations.id;


--
-- Name: network_modality_configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.network_modality_configurations (
    id bigint NOT NULL,
    network_id bigint NOT NULL,
    billing_city_id bigint NOT NULL,
    service_line_id bigint NOT NULL,
    modality_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE network_modality_configurations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.network_modality_configurations IS 'Reference table for insurance network modality configurations';


--
-- Name: COLUMN network_modality_configurations.network_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.network_modality_configurations.network_id IS 'ID of insurance network used in network modality configuration';


--
-- Name: COLUMN network_modality_configurations.billing_city_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.network_modality_configurations.billing_city_id IS 'ID of the station billing city used in network modality configuration';


--
-- Name: COLUMN network_modality_configurations.service_line_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.network_modality_configurations.service_line_id IS 'ID of the station service-line used in network modality configuration';


--
-- Name: COLUMN network_modality_configurations.modality_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.network_modality_configurations.modality_id IS 'ID of modality used in network modality configuration, also used as foreign key';


--
-- Name: network_modality_configurations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.network_modality_configurations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: network_modality_configurations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.network_modality_configurations_id_seq OWNED BY public.network_modality_configurations.id;


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
-- Name: calculate_modalities_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calculate_modalities_logs ALTER COLUMN id SET DEFAULT nextval('public.calculate_modalities_logs_id_seq'::regclass);


--
-- Name: market_modality_configurations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_modality_configurations ALTER COLUMN id SET DEFAULT nextval('public.market_modality_configurations_id_seq'::regclass);


--
-- Name: modalities id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modalities ALTER COLUMN id SET DEFAULT nextval('public.modalities_id_seq'::regclass);


--
-- Name: modality_configurations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modality_configurations ALTER COLUMN id SET DEFAULT nextval('public.modality_configurations_id_seq'::regclass);


--
-- Name: network_modality_configurations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.network_modality_configurations ALTER COLUMN id SET DEFAULT nextval('public.network_modality_configurations_id_seq'::regclass);


--
-- Name: schema_migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations ALTER COLUMN id SET DEFAULT nextval('public.schema_migrations_id_seq'::regclass);


--
-- Name: calculate_modalities_logs calculate_modalities_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calculate_modalities_logs
    ADD CONSTRAINT calculate_modalities_logs_pkey PRIMARY KEY (id);


--
-- Name: market_modality_configurations market_modality_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_modality_configurations
    ADD CONSTRAINT market_modality_configurations_pkey PRIMARY KEY (id);


--
-- Name: modalities modalities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modalities
    ADD CONSTRAINT modalities_pkey PRIMARY KEY (id);


--
-- Name: modality_configurations modality_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modality_configurations
    ADD CONSTRAINT modality_configurations_pkey PRIMARY KEY (id);


--
-- Name: network_modality_configurations network_modality_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.network_modality_configurations
    ADD CONSTRAINT network_modality_configurations_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);


--
-- Name: market_modality_configurations_service_line_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX market_modality_configurations_service_line_id_idx ON public.market_modality_configurations USING btree (service_line_id);


--
-- Name: modality_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX modality_type_idx ON public.modalities USING btree (modality_type);


--
-- Name: network_modality_configurations_billing_city_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX network_modality_configurations_billing_city_id_idx ON public.network_modality_configurations USING btree (billing_city_id);


--
-- Name: INDEX network_modality_configurations_billing_city_id_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.network_modality_configurations_billing_city_id_idx IS 'Lookup index for network_modality_configurations by billing_city_id';


--
-- Name: network_modality_configurations_network_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX network_modality_configurations_network_id_idx ON public.network_modality_configurations USING btree (network_id);


--
-- Name: INDEX network_modality_configurations_network_id_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.network_modality_configurations_network_id_idx IS 'Lookup index for network_modality_configurations by network_id';


--
-- Name: network_modality_configurations_service_line_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX network_modality_configurations_service_line_id_idx ON public.network_modality_configurations USING btree (service_line_id);


--
-- Name: INDEX network_modality_configurations_service_line_id_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.network_modality_configurations_service_line_id_idx IS 'Lookup index for network_modality_configurations by service_line_id';


--
-- Name: service_line_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_line_id_idx ON public.modality_configurations USING btree (service_line_id);


--
-- Name: market_modality_configurations market_modality_configurations_modality_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_modality_configurations
    ADD CONSTRAINT market_modality_configurations_modality_id_fkey FOREIGN KEY (modality_id) REFERENCES public.modalities(id);


--
-- Name: modality_configurations modality_configurations_modality_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modality_configurations
    ADD CONSTRAINT modality_configurations_modality_id_fkey FOREIGN KEY (modality_id) REFERENCES public.modalities(id);


--
-- Name: network_modality_configurations network_modality_configurations_modality_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.network_modality_configurations
    ADD CONSTRAINT network_modality_configurations_modality_id_fkey FOREIGN KEY (modality_id) REFERENCES public.modalities(id);


--
-- PostgreSQL database dump complete
--

