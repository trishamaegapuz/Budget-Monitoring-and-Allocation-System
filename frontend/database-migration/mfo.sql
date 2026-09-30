--
-- PostgreSQL database dump
--

\restrict AdNF4iwsP1PJRrZmelWLfblC78ypEoSRiHLlOxck7xmy2SfbRsHasSDJD19zB1J

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
-- Data for Name: mfo; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.mfo (id, code, name, description, is_active, created_at, updated_at) VALUES (1, 'MFO1', 'Higher Education Program', 'Higher education services', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:38:16.471812');
INSERT INTO public.mfo (id, code, name, description, is_active, created_at, updated_at) VALUES (2, 'MFO2', 'Research and Development', 'Research and development activities', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:38:16.471812');
INSERT INTO public.mfo (id, code, name, description, is_active, created_at, updated_at) VALUES (3, 'MFO3', 'Extension Services', 'Community extension services', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:38:16.471812');
INSERT INTO public.mfo (id, code, name, description, is_active, created_at, updated_at) VALUES (4, 'MFO4', 'Administration and Support', 'Administrative and support services', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:38:16.471812');
INSERT INTO public.mfo (id, code, name, description, is_active, created_at, updated_at) VALUES (5, 'MFO-01', 'Higher Education Services', 'Provision of quality higher education services', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.mfo (id, code, name, description, is_active, created_at, updated_at) VALUES (6, 'MFO-02', 'Advanced Education Services', 'Provision of advanced education and graduate programs', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.mfo (id, code, name, description, is_active, created_at, updated_at) VALUES (7, 'MFO-03', 'Research Services', 'Conduct of research and development activities', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.mfo (id, code, name, description, is_active, created_at, updated_at) VALUES (8, 'MFO-04', 'Technical Advisory and Extension Services', 'Provision of extension and technical advisory services', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.mfo (id, code, name, description, is_active, created_at, updated_at) VALUES (9, 'MFO-05', 'Institutional Management Services', 'Institutional administration and support services', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.mfo (id, code, name, description, is_active, created_at, updated_at) VALUES (10, 'MFO-001', 'Higher Education Program', 'Provision of quality higher education services', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.mfo (id, code, name, description, is_active, created_at, updated_at) VALUES (11, 'MFO-002', 'Advanced Education Program', 'Advanced education and graduate-level programs', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.mfo (id, code, name, description, is_active, created_at, updated_at) VALUES (12, 'MFO-003', 'Research Program', 'Research and development activities', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.mfo (id, code, name, description, is_active, created_at, updated_at) VALUES (13, 'MFO-004', 'Technical and Advisory Extension Program', 'Extension and community services', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.mfo (id, code, name, description, is_active, created_at, updated_at) VALUES (14, 'MFO-005', 'General Administration and Support', 'General administration and institutional support', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.mfo (id, code, name, description, is_active, created_at, updated_at) VALUES (15, 'MFO-006', 'Support to Operations', 'Institutional operational support services', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');


--
-- Name: mfo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mfo_id_seq', 15, true);


--
-- PostgreSQL database dump complete
--

\unrestrict AdNF4iwsP1PJRrZmelWLfblC78ypEoSRiHLlOxck7xmy2SfbRsHasSDJD19zB1J

