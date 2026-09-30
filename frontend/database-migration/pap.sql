--
-- PostgreSQL database dump
--

\restrict SBQCdrelXULPsW0pyXoj2DqfhSKgwg1euT9ubZVnuSmztdloOxuHuY6a6QdhB05

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
-- Data for Name: pap; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.pap (id, code, name, description, is_active, created_at, updated_at) VALUES (1, 'PAP-001', 'Regular Operations', 'Regular institutional operations', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:45:39.92231');
INSERT INTO public.pap (id, code, name, description, is_active, created_at, updated_at) VALUES (2, 'PAP-002', 'Personnel Services', 'Personnel-related programs and activities', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:45:39.92231');
INSERT INTO public.pap (id, code, name, description, is_active, created_at, updated_at) VALUES (3, 'PAP-003', 'Maintenance and Other Operating Expenses', 'Regular MOOE activities', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:45:39.92231');
INSERT INTO public.pap (id, code, name, description, is_active, created_at, updated_at) VALUES (4, 'PAP-004', 'Capital Outlay Program', 'Capital outlay projects and activities', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:45:39.92231');
INSERT INTO public.pap (id, code, name, description, is_active, created_at, updated_at) VALUES (5, 'PAP-005', 'Research and Development Program', 'Research and development activities', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:45:39.92231');
INSERT INTO public.pap (id, code, name, description, is_active, created_at, updated_at) VALUES (11, 'PAP-006', 'Extension Services Program', 'Community extension programs', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.pap (id, code, name, description, is_active, created_at, updated_at) VALUES (12, 'PAP-007', 'Student Development Program', 'Student development and support activities', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.pap (id, code, name, description, is_active, created_at, updated_at) VALUES (13, 'PAP-008', 'Infrastructure Development', 'Infrastructure and facility improvement projects', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.pap (id, code, name, description, is_active, created_at, updated_at) VALUES (14, 'PAP-009', 'ICT Development Program', 'Information technology development projects', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.pap (id, code, name, description, is_active, created_at, updated_at) VALUES (15, 'PAP-010', 'Procurement Program', 'Institutional procurement activities', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.pap (id, code, name, description, is_active, created_at, updated_at) VALUES (26, 'PAP-011', 'Scholarship Program', 'Student scholarship and financial assistance', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.pap (id, code, name, description, is_active, created_at, updated_at) VALUES (27, 'PAP-012', 'Community Outreach', 'Community outreach and development activities', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.pap (id, code, name, description, is_active, created_at, updated_at) VALUES (28, 'PAP-013', 'Institutional Development', 'Institutional development initiatives', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.pap (id, code, name, description, is_active, created_at, updated_at) VALUES (29, 'PAP-014', 'Disaster Risk Reduction', 'Disaster preparedness and risk reduction', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.pap (id, code, name, description, is_active, created_at, updated_at) VALUES (30, 'PAP-015', 'Gender and Development', 'Gender and development activities', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');


--
-- Name: pap_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pap_id_seq', 30, true);


--
-- PostgreSQL database dump complete
--

\unrestrict SBQCdrelXULPsW0pyXoj2DqfhSKgwg1euT9ubZVnuSmztdloOxuHuY6a6QdhB05

