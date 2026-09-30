--
-- PostgreSQL database dump
--

\restrict hDVdwbgZ2Bd5fGduIwA5tu4umEKvgmwgLiaBRq0LQSuK6om0v6ADEVsPOfbWVcx

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
-- Data for Name: object_expenditures; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.object_expenditures (id, code, name, description, is_active, created_at, updated_at) VALUES (1, 'OE-PS', 'Personal Services', 'Personnel expenditures', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:38:16.471812');
INSERT INTO public.object_expenditures (id, code, name, description, is_active, created_at, updated_at) VALUES (2, 'OE-MOOE', 'Maintenance and Other Operating Expenses', 'Operating expenditures', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:38:16.471812');
INSERT INTO public.object_expenditures (id, code, name, description, is_active, created_at, updated_at) VALUES (3, 'OE-CO', 'Capital Outlay', 'Capital expenditures', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:38:16.471812');
INSERT INTO public.object_expenditures (id, code, name, description, is_active, created_at, updated_at) VALUES (4, 'PS', 'Personnel Services', 'Personnel-related expenditures', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.object_expenditures (id, code, name, description, is_active, created_at, updated_at) VALUES (5, 'MOOE', 'Maintenance and Other Operating Expenses', 'Maintenance and operating expenditures', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.object_expenditures (id, code, name, description, is_active, created_at, updated_at) VALUES (6, 'CO', 'Capital Outlay', 'Capital expenditures', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.object_expenditures (id, code, name, description, is_active, created_at, updated_at) VALUES (7, 'TRAVEL', 'Travel Expenses', 'Travel-related expenses', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.object_expenditures (id, code, name, description, is_active, created_at, updated_at) VALUES (8, 'TRAINING', 'Training Expenses', 'Training and development expenses', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.object_expenditures (id, code, name, description, is_active, created_at, updated_at) VALUES (9, 'OFFICE', 'Office Supplies', 'Office supplies and materials', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.object_expenditures (id, code, name, description, is_active, created_at, updated_at) VALUES (10, 'UTILITIES', 'Utilities', 'Electricity, water and communication', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.object_expenditures (id, code, name, description, is_active, created_at, updated_at) VALUES (11, 'PROFESSIONAL', 'Professional Services', 'Professional and consultancy services', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.object_expenditures (id, code, name, description, is_active, created_at, updated_at) VALUES (12, 'EQUIPMENT', 'Equipment', 'Machinery and equipment', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.object_expenditures (id, code, name, description, is_active, created_at, updated_at) VALUES (13, 'INFRA', 'Infrastructure', 'Infrastructure and building projects', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.object_expenditures (id, code, name, description, is_active, created_at, updated_at) VALUES (17, 'OE-SW', 'Salaries and Wages', 'Basic salaries and wages', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.object_expenditures (id, code, name, description, is_active, created_at, updated_at) VALUES (18, 'OE-TRAVEL', 'Traveling Expenses', 'Travel-related expenditures', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.object_expenditures (id, code, name, description, is_active, created_at, updated_at) VALUES (19, 'OE-TRAINING', 'Training Expenses', 'Training and development expenses', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.object_expenditures (id, code, name, description, is_active, created_at, updated_at) VALUES (20, 'OE-SUPPLIES', 'Office Supplies', 'Office supplies and materials', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.object_expenditures (id, code, name, description, is_active, created_at, updated_at) VALUES (21, 'OE-UTILITIES', 'Utilities', 'Water, electricity and communication utilities', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.object_expenditures (id, code, name, description, is_active, created_at, updated_at) VALUES (22, 'OE-REPAIR', 'Repairs and Maintenance', 'Repair and maintenance expenses', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.object_expenditures (id, code, name, description, is_active, created_at, updated_at) VALUES (23, 'OE-SERVICES', 'Professional and General Services', 'Professional and general services', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.object_expenditures (id, code, name, description, is_active, created_at, updated_at) VALUES (24, 'OE-EQUIPMENT', 'Equipment', 'Procurement of equipment', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.object_expenditures (id, code, name, description, is_active, created_at, updated_at) VALUES (25, 'OE-INFRA', 'Infrastructure', 'Infrastructure and building projects', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');


--
-- Name: object_expenditures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.object_expenditures_id_seq', 26, true);


--
-- PostgreSQL database dump complete
--

\unrestrict hDVdwbgZ2Bd5fGduIwA5tu4umEKvgmwgLiaBRq0LQSuK6om0v6ADEVsPOfbWVcx

