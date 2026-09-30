--
-- PostgreSQL database dump
--

\restrict HSXdARqPcvpaFraYMUDVKpPCDib9rKNXX5Zpg93HVzpPgvm4GXPdhiRNYgbkCE3

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
-- Data for Name: fund_allocations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.fund_allocations (id, fiscal_year, fund_source_id, fund_cluster_id, campus_id, responsibility_center_id, wfp_source_id, allocation_amount, utilized_amount, disbursed_amount, created_at, updated_at) VALUES (1, 2026, 1, 1, 5, NULL, 1, 500000.00, 0.00, 0.00, '2026-08-24 16:07:04.290174', '2026-08-24 16:07:04.290174');
INSERT INTO public.fund_allocations (id, fiscal_year, fund_source_id, fund_cluster_id, campus_id, responsibility_center_id, wfp_source_id, allocation_amount, utilized_amount, disbursed_amount, created_at, updated_at) VALUES (2, 2026, 2, 2, 5, 3, 10, 200000.00, 0.00, 0.00, '2026-08-28 06:29:03.524267', '2026-08-28 06:29:03.524267');


--
-- Name: fund_allocations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fund_allocations_id_seq', 2, true);


--
-- PostgreSQL database dump complete
--

\unrestrict HSXdARqPcvpaFraYMUDVKpPCDib9rKNXX5Zpg93HVzpPgvm4GXPdhiRNYgbkCE3

