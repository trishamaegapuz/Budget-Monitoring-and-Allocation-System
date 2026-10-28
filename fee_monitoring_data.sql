--
-- PostgreSQL database dump
--

\restrict inae9Bon3sl4ZRSeYIxTWbGMAdotzVCxtLop7oEw4aiU93bZ1WATQUjXGKsVvRO

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


--
-- Data for Name: rbud_fee_budget_reference; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rbud_fee_budget_reference (id, fiscal_year, campus, fee_category, particulars, budget_amount, source_reference, created_by, updated_by, created_at, updated_at) FROM stdin;
1	2026	LAGANGILANG	Fiduciary Fees	Registration Fees	100000.00	WFP PRE sheet	1	1	2026-10-22 18:25:53.890446+08	2026-10-22 18:25:53.890446+08
2	2026	LA PAZ	Non-Fiduciary Fees	Laboratory Fee	100000.00	WFP PRE sheet	1	1	2026-10-22 19:42:32.462415+08	2026-10-22 19:42:32.462415+08
\.


--
-- Data for Name: rbud_fee_monitoring; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rbud_fee_monitoring (id, fiscal_year, fee_category, particulars, campus, billing_period, reference_no, billing_amount, collected_amount, obligated_amount, disbursed_amount, remarks, created_by, updated_by, created_at, updated_at) FROM stdin;
4	2026	Fiduciary Fees	Registration Fees	BANGUED	2nd Sem Ay 2025 - 2026	002	100000.00	10000.00	0.00	0.00	gg	1	1	2026-10-22 18:28:37.791286+08	2026-10-22 19:39:57.390017+08
3	2026	Fiduciary Fees	Registration Fees	LAGANGILANG	2nd Sem AY 2025 - 2026	001	10000.00	2000.00	0.00	0.00	fdhfhf	1	1	2026-10-22 16:03:45.69594+08	2026-10-22 19:40:23.653433+08
5	2026	Non-Fiduciary Fees	Library Fee	LA PAZ	2nd Sem AY 2025 - 2026	003	20000.00	3000.00	0.00	0.00	\N	1	\N	2026-10-22 19:44:16.404844+08	2026-10-22 19:44:16.404844+08
\.


--
-- PostgreSQL database dump complete
--

\unrestrict inae9Bon3sl4ZRSeYIxTWbGMAdotzVCxtLop7oEw4aiU93bZ1WATQUjXGKsVvRO

