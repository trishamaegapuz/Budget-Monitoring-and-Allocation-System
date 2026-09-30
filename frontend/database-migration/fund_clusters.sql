--
-- PostgreSQL database dump
--

\restrict dNEbxs3lupTYuFBhaO5fPmSDXu6FgjeazxiebC3QckFbKEgG2JuYJzxuIZv2R4W

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
-- Data for Name: fund_clusters; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.fund_clusters (id, fund_source_id, code, name, description, is_active, created_at, updated_at) VALUES (1, 1, '101', 'General Fund', 'General Fund', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:38:16.471812');
INSERT INTO public.fund_clusters (id, fund_source_id, code, name, description, is_active, created_at, updated_at) VALUES (2, 2, '102', 'Special Purpose Fund', 'Budgetary government fund', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:38:16.471812');
INSERT INTO public.fund_clusters (id, fund_source_id, code, name, description, is_active, created_at, updated_at) VALUES (3, 3, '103', 'Other Institutional Funds', 'Other funds', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:38:16.471812');
INSERT INTO public.fund_clusters (id, fund_source_id, code, name, description, is_active, created_at, updated_at) VALUES (4, 4, '104', 'DOST Fund', 'DOST funded projects', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:38:16.471812');
INSERT INTO public.fund_clusters (id, fund_source_id, code, name, description, is_active, created_at, updated_at) VALUES (5, 5, '105', 'DA Fund', 'DA funded projects', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:38:16.471812');
INSERT INTO public.fund_clusters (id, fund_source_id, code, name, description, is_active, created_at, updated_at) VALUES (6, 6, '106', 'CHED Fund', 'CHED funded projects', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:38:16.471812');


--
-- Name: fund_clusters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fund_clusters_id_seq', 14, true);


--
-- PostgreSQL database dump complete
--

\unrestrict dNEbxs3lupTYuFBhaO5fPmSDXu6FgjeazxiebC3QckFbKEgG2JuYJzxuIZv2R4W

