--
-- PostgreSQL database dump
--

\restrict 0Kd3xHjhw5zKdUSgYyhmuqodY1UBWbWdPnvTYNpVyoWOemaPcEI7vB9iDEhh48q

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public."PostMortem" DROP CONSTRAINT IF EXISTS "PostMortem_incidentId_fkey";
ALTER TABLE IF EXISTS ONLY public."Incident" DROP CONSTRAINT IF EXISTS "Incident_serviceId_fkey";
DROP INDEX IF EXISTS public."Service_name_environment_key";
DROP INDEX IF EXISTS public."PostMortem_incidentId_key";
DROP INDEX IF EXISTS public."Incident_status_createdAt_idx";
DROP INDEX IF EXISTS public."Incident_serviceId_idx";
DROP INDEX IF EXISTS public."Incident_open_createdAt_idx";
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public."Service" DROP CONSTRAINT IF EXISTS "Service_pkey";
ALTER TABLE IF EXISTS ONLY public."PostMortem" DROP CONSTRAINT IF EXISTS "PostMortem_pkey";
ALTER TABLE IF EXISTS ONLY public."Incident" DROP CONSTRAINT IF EXISTS "Incident_pkey";
ALTER TABLE IF EXISTS public."Service" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."PostMortem" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."Incident" ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP SEQUENCE IF EXISTS public."Service_id_seq";
DROP TABLE IF EXISTS public."Service";
DROP SEQUENCE IF EXISTS public."PostMortem_id_seq";
DROP TABLE IF EXISTS public."PostMortem";
DROP SEQUENCE IF EXISTS public."Incident_id_seq";
DROP TABLE IF EXISTS public."Incident";
DROP TYPE IF EXISTS public."Status";
DROP TYPE IF EXISTS public."Severity";
DROP TYPE IF EXISTS public."Environment";
--
-- Name: Environment; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Environment" AS ENUM (
    'PRODUCTION',
    'STAGING',
    'QA'
);


--
-- Name: Severity; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Severity" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


--
-- Name: Status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Status" AS ENUM (
    'OPEN',
    'RESOLVED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Incident; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Incident" (
    id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    severity public."Severity" NOT NULL,
    status public."Status" DEFAULT 'OPEN'::public."Status" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "serviceId" integer NOT NULL
);


--
-- Name: Incident_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Incident_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Incident_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Incident_id_seq" OWNED BY public."Incident".id;


--
-- Name: PostMortem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PostMortem" (
    id integer NOT NULL,
    "rootCause" text NOT NULL,
    "resolutionSteps" text NOT NULL,
    "timeSpentMinutes" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "incidentId" integer NOT NULL
);


--
-- Name: PostMortem_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."PostMortem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: PostMortem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."PostMortem_id_seq" OWNED BY public."PostMortem".id;


--
-- Name: Service; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Service" (
    id integer NOT NULL,
    name text NOT NULL,
    environment public."Environment" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Service_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Service_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Service_id_seq" OWNED BY public."Service".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: Incident id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Incident" ALTER COLUMN id SET DEFAULT nextval('public."Incident_id_seq"'::regclass);


--
-- Name: PostMortem id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PostMortem" ALTER COLUMN id SET DEFAULT nextval('public."PostMortem_id_seq"'::regclass);


--
-- Name: Service id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Service" ALTER COLUMN id SET DEFAULT nextval('public."Service_id_seq"'::regclass);


--
-- Data for Name: Incident; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Incident" (id, title, description, severity, status, "createdAt", "serviceId") FROM stdin;
40073	High latency on user authentication token verification	Auth token verification requests taking over 3 seconds under peak load.	CRITICAL	OPEN	2026-10-24 07:18:28.44	65
40074	Push notification delivery queue delay	Background worker queue backing up during marketing broadcast delivery.	MEDIUM	OPEN	2026-10-24 07:18:28.442	67
40075	Invoice PDF generation timeout	Monthly billing cycle invoice generation job timed out due to memory limits.	HIGH	RESOLVED	2026-10-24 07:18:28.445	66
\.


--
-- Data for Name: PostMortem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PostMortem" (id, "rootCause", "resolutionSteps", "timeSpentMinutes", "createdAt", "incidentId") FROM stdin;
38041	Chromium headless process memory leak during parallel batch rendering of PDF invoices.	Allocated 4GB container memory limit and pooled Chromium browser instances with automatic worker recycling.	90	2026-10-24 07:18:28.447	40075
\.


--
-- Data for Name: Service; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Service" (id, name, environment, "createdAt") FROM stdin;
65	User Auth	PRODUCTION	2026-10-24 07:18:28.417
66	Billing Engine	PRODUCTION	2026-10-24 07:18:28.433
67	Notification API	STAGING	2026-10-24 07:18:28.436
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
bc4ccc83-01f7-4ceb-8bc2-043b426b9338	0a45c874004fab7dab9bfd154163e60543cff3fe69a75c694e04594abcacc038	2026-10-23 15:28:26.978319+05:30	20261023095826_init	\N	\N	2026-10-23 15:28:26.897522+05:30	1
5342739a-d4a0-4eaa-839c-9c056e36d438	23d322f6850d737f3a094dd7ed0b8e29ea0160556679c7a1b8114ccd89e5a3da	2026-10-24 11:33:02.642496+05:30	20261024054943_add_partial_open_incident_index	\N	\N	2026-10-24 11:33:02.617515+05:30	1
\.


--
-- Name: Incident_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Incident_id_seq"', 40075, true);


--
-- Name: PostMortem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."PostMortem_id_seq"', 38041, true);


--
-- Name: Service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Service_id_seq"', 67, true);


--
-- Name: Incident Incident_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Incident"
    ADD CONSTRAINT "Incident_pkey" PRIMARY KEY (id);


--
-- Name: PostMortem PostMortem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PostMortem"
    ADD CONSTRAINT "PostMortem_pkey" PRIMARY KEY (id);


--
-- Name: Service Service_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Service"
    ADD CONSTRAINT "Service_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Incident_open_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Incident_open_createdAt_idx" ON public."Incident" USING btree ("createdAt" DESC) WHERE (status = 'OPEN'::public."Status");


--
-- Name: Incident_serviceId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Incident_serviceId_idx" ON public."Incident" USING btree ("serviceId");


--
-- Name: Incident_status_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Incident_status_createdAt_idx" ON public."Incident" USING btree (status, "createdAt");


--
-- Name: PostMortem_incidentId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PostMortem_incidentId_key" ON public."PostMortem" USING btree ("incidentId");


--
-- Name: Service_name_environment_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Service_name_environment_key" ON public."Service" USING btree (name, environment);


--
-- Name: Incident Incident_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Incident"
    ADD CONSTRAINT "Incident_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public."Service"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PostMortem PostMortem_incidentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PostMortem"
    ADD CONSTRAINT "PostMortem_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES public."Incident"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict 0Kd3xHjhw5zKdUSgYyhmuqodY1UBWbWdPnvTYNpVyoWOemaPcEI7vB9iDEhh48q

