--
-- PostgreSQL database dump
--

\restrict liFFFZ1UcfsP0z0VcAdYgsgT8nDaukSPwqCTTBzK7UxMwrny8hbbmHiEIpx4I0p

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
-- Data for Name: budget_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.budget_items (id, fiscal_year, fund_cluster_id, fund_source_id, campus_id, responsibility_center_id, mfo_id, pap_id, uacs_code_id, object_expenditure_id, allotment_class_id, wfp_source_id, approved_budget, ps_amount, mooe_amount, co_amount, quarter, month, status, notes, created_by, updated_by, created_at, updated_at) VALUES (1, 2026, 1, 1, NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, 500000.00, 0.00, 500000.00, 0.00, NULL, NULL, 'Approved', 'Test RBUD budget allocation', NULL, NULL, '2026-08-25 09:09:45.591066', '2026-08-25 09:09:45.591066');


--
-- Name: budget_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.budget_items_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

\unrestrict liFFFZ1UcfsP0z0VcAdYgsgT8nDaukSPwqCTTBzK7UxMwrny8hbbmHiEIpx4I0p

