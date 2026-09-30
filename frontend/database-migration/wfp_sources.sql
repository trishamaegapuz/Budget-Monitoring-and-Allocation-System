--
-- PostgreSQL database dump
--

\restrict bBhXaVjYdOZASWXA3r17FVjM8tYeOVlewhq36LcdWc5OQ7aCmqiz6BZlsb72M3U

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
-- Data for Name: wfp_sources; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.wfp_sources (id, code, name, description, is_active, created_at, updated_at) VALUES (1, 'WFP-001', 'Regular WFP', 'Regular Work and Financial Plan', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:38:16.471812');
INSERT INTO public.wfp_sources (id, code, name, description, is_active, created_at, updated_at) VALUES (2, 'WFP-002', 'Special WFP', 'Special Work and Financial Plan', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:38:16.471812');
INSERT INTO public.wfp_sources (id, code, name, description, is_active, created_at, updated_at) VALUES (3, 'WFP-003', 'Project WFP', 'Project-based Work and Financial Plan', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:38:16.471812');
INSERT INTO public.wfp_sources (id, code, name, description, is_active, created_at, updated_at) VALUES (4, 'WFP-REG', 'Regular Programs', 'Regular institutional programs', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.wfp_sources (id, code, name, description, is_active, created_at, updated_at) VALUES (5, 'WFP-PS', 'Personnel Services WFP', 'Personnel Services Work and Financial Plan', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.wfp_sources (id, code, name, description, is_active, created_at, updated_at) VALUES (6, 'WFP-MOOE', 'MOOE WFP', 'MOOE Work and Financial Plan', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.wfp_sources (id, code, name, description, is_active, created_at, updated_at) VALUES (7, 'WFP-CO', 'Capital Outlay WFP', 'Capital Outlay Work and Financial Plan', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.wfp_sources (id, code, name, description, is_active, created_at, updated_at) VALUES (8, 'WFP-RES', 'Research WFP', 'Research and development WFP', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.wfp_sources (id, code, name, description, is_active, created_at, updated_at) VALUES (9, 'WFP-EXT', 'Extension WFP', 'Extension services WFP', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.wfp_sources (id, code, name, description, is_active, created_at, updated_at) VALUES (10, 'WFP-ICT', 'ICT WFP', 'ICT development WFP', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.wfp_sources (id, code, name, description, is_active, created_at, updated_at) VALUES (11, 'WFP-STUDENT', 'Student Services WFP', 'Student development WFP', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.wfp_sources (id, code, name, description, is_active, created_at, updated_at) VALUES (16, 'WFP-DOST', 'DOST Project WFP', 'Work and Financial Plan for DOST-funded projects', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.wfp_sources (id, code, name, description, is_active, created_at, updated_at) VALUES (17, 'WFP-DA', 'DA Project WFP', 'Work and Financial Plan for DA-funded projects', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.wfp_sources (id, code, name, description, is_active, created_at, updated_at) VALUES (18, 'WFP-CHED', 'CHED Project WFP', 'Work and Financial Plan for CHED-funded projects', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.wfp_sources (id, code, name, description, is_active, created_at, updated_at) VALUES (19, 'WFP-OTHER', 'Other Fund WFP', 'Work and Financial Plan for other institutional funds', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');


--
-- Name: wfp_sources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wfp_sources_id_seq', 19, true);


--
-- PostgreSQL database dump complete
--

\unrestrict bBhXaVjYdOZASWXA3r17FVjM8tYeOVlewhq36LcdWc5OQ7aCmqiz6BZlsb72M3U

