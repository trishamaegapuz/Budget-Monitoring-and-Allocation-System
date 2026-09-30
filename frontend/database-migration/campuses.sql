--
-- PostgreSQL database dump
--

\restrict SB0miH6Hotlb1hCle550tYfdQkcxGKKBIallRDZiLNcmRBfW1TxaEf8LERaawwC

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
-- Data for Name: campuses; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.campuses (id, code, name, abbreviation, is_active, created_at, updated_at) VALUES (2, 'CAMPUS2', 'Campus 2', 'C2', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:38:16.471812');
INSERT INTO public.campuses (id, code, name, abbreviation, is_active, created_at, updated_at) VALUES (1, 'MAIN', 'Main Campus', 'MC', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:45:39.92231');
INSERT INTO public.campuses (id, code, name, abbreviation, is_active, created_at, updated_at) VALUES (4, 'LABO', 'Labo Campus', 'LC', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.campuses (id, code, name, abbreviation, is_active, created_at, updated_at) VALUES (5, 'CASS', 'College of Arts and Sciences Campus', 'CAS', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.campuses (id, code, name, abbreviation, is_active, created_at, updated_at) VALUES (6, 'TECH', 'Technical Campus', 'TC', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.campuses (id, code, name, abbreviation, is_active, created_at, updated_at) VALUES (8, 'ADMIN', 'Administrative Campus', 'ADMIN', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.campuses (id, code, name, abbreviation, is_active, created_at, updated_at) VALUES (9, 'SAT', 'Satellite Campus', 'SAT', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.campuses (id, code, name, abbreviation, is_active, created_at, updated_at) VALUES (10, 'EXT', 'Extension Campus', 'EXT', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');


--
-- Name: campuses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.campuses_id_seq', 10, true);


--
-- PostgreSQL database dump complete
--

\unrestrict SB0miH6Hotlb1hCle550tYfdQkcxGKKBIallRDZiLNcmRBfW1TxaEf8LERaawwC

