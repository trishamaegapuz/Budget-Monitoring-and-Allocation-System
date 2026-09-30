--
-- PostgreSQL database dump
--

\restrict n2f65xvRo8VwHLh3QtHid1xiTCBbv0cFlq9g2SCb6cEVncd3d1t0678RADFFrIJ

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
-- Data for Name: fund_sources; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.fund_sources (id, code, name, description, is_active, created_at, updated_at) VALUES (1, 'MAIN', 'Main Fund', 'Main institutional fund', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:45:39.92231');
INSERT INTO public.fund_sources (id, code, name, description, is_active, created_at, updated_at) VALUES (3, 'OTHER', 'Other Funds', 'Other institutional funds', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:45:39.92231');
INSERT INTO public.fund_sources (id, code, name, description, is_active, created_at, updated_at) VALUES (4, 'DOST', 'DOST Fund', 'Department of Science and Technology Fund', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:45:39.92231');
INSERT INTO public.fund_sources (id, code, name, description, is_active, created_at, updated_at) VALUES (5, 'DA', 'DA Fund', 'Department of Agriculture Fund', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:45:39.92231');
INSERT INTO public.fund_sources (id, code, name, description, is_active, created_at, updated_at) VALUES (6, 'CHED', 'CHED Fund', 'Commission on Higher Education Fund', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:45:39.92231');
INSERT INTO public.fund_sources (id, code, name, description, is_active, created_at, updated_at) VALUES (2, 'BGD', 'BGD Fund', 'Budgetary Government Fund', true, '2026-08-24 15:38:16.471812', '2026-08-26 08:00:20.751176');


--
-- Name: fund_sources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fund_sources_id_seq', 15, true);


--
-- PostgreSQL database dump complete
--

\unrestrict n2f65xvRo8VwHLh3QtHid1xiTCBbv0cFlq9g2SCb6cEVncd3d1t0678RADFFrIJ

