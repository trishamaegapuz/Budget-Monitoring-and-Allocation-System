--
-- PostgreSQL database dump
--

\restrict f6Mbw0CV1GSklZhKbLEMDuNOxvi7P2RcBpPrKr9Gkd3wElkBbh31TOiDOasbOwY

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
-- Data for Name: allotment_classes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.allotment_classes (id, code, name, description, is_active, created_at, updated_at) VALUES (1, 'PS', 'Personnel Services', 'Personnel Services allotment', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:45:39.92231');
INSERT INTO public.allotment_classes (id, code, name, description, is_active, created_at, updated_at) VALUES (2, 'MOOE', 'Maintenance and Other Operating Expenses', 'MOOE allotment', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:45:39.92231');
INSERT INTO public.allotment_classes (id, code, name, description, is_active, created_at, updated_at) VALUES (3, 'CO', 'Capital Outlay', 'Capital Outlay allotment', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:45:39.92231');
INSERT INTO public.allotment_classes (id, code, name, description, is_active, created_at, updated_at) VALUES (7, 'FINEX', 'Financial Expenses', 'Financial expenses allotment', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');


--
-- Name: allotment_classes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.allotment_classes_id_seq', 10, true);


--
-- PostgreSQL database dump complete
--

\unrestrict f6Mbw0CV1GSklZhKbLEMDuNOxvi7P2RcBpPrKr9Gkd3wElkBbh31TOiDOasbOwY

