--
-- PostgreSQL database dump
--

\restrict OQxzoRxrg6FmAAQ3dnj868SxuAiIK44skqexbu8Qgcri0fx9CsmcKYFgQbPFmb4

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
-- Data for Name: responsibility_centers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (1, 'ADMIN', 'Administration', 'Administrative offices', 'Administration', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:38:16.471812');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (2, 'ACADEMIC', 'Academic Affairs', 'Academic offices and units', 'Academic', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:38:16.471812');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (3, 'FINANCE', 'Finance Office', 'Finance and budget operations', 'Administration', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:38:16.471812');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (6, 'ADM', 'Office of the President', 'Office of the President', 'Administration', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (7, 'VPAA', 'Office of the Vice President for Academic Affairs', 'Academic Affairs', 'Administration', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (8, 'VPFA', 'Office of the Vice President for Finance and Administration', 'Finance and Administration', 'Administration', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (9, 'BUDGET', 'Budget Office', 'Institutional Budget Office', 'Finance', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (10, 'ACCOUNTING', 'Accounting Office', 'Institutional Accounting Office', 'Finance', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (11, 'CASHIER', 'Cashier Office', 'Institutional Cashier Office', 'Finance', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (4, 'HR', 'Human Resource Management Office', 'Human Resource Management Office', 'Administration', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:45:39.92231');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (5, 'PROC', 'Procurement Office', 'Procurement Office', 'Administration', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:45:39.92231');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (14, 'SUPPLY', 'Supply Office', 'Supply and Property Office', 'Administration', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (15, 'ICT', 'Information and Communications Technology Office', 'ICT Office', 'Support', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (16, 'RESEARCH', 'Research and Development Office', 'Research and Development', 'Academic', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (17, 'EXT', 'Extension Services Office', 'Extension Services', 'Academic', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (18, 'LIB', 'Library', 'Library Services', 'Academic', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (19, 'STUDENT', 'Student Affairs Office', 'Student Affairs', 'Student Services', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (20, 'COLLEGE', 'Academic Departments', 'Academic Departments', 'Academic', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (21, 'RC-001', 'Office of the President', 'Office of the President', 'Administration', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (22, 'RC-002', 'Office of the Vice President', 'Office of the Vice President', 'Administration', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (23, 'RC-003', 'Finance Office', 'Finance and budget management office', 'Administration', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (24, 'RC-004', 'Accounting Office', 'Accounting and financial reporting office', 'Administration', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (25, 'RC-005', 'Budget Office', 'Budget planning, allocation and monitoring office', 'Administration', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (26, 'RC-006', 'Human Resource Management Office', 'Human resource management office', 'Administration', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (27, 'RC-007', 'Procurement Office', 'Procurement and supply management office', 'Administration', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (28, 'RC-008', 'General Services Office', 'General services and property management', 'Administration', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (29, 'RC-009', 'Information Technology Office', 'Information technology services', 'Administration', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (30, 'RC-010', 'College of Teacher Education', 'Academic responsibility center', 'Academic', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (31, 'RC-011', 'College of Arts and Sciences', 'Academic responsibility center', 'Academic', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (32, 'RC-012', 'College of Business and Management', 'Academic responsibility center', 'Academic', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (33, 'RC-013', 'College of Agriculture', 'Academic responsibility center', 'Academic', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (34, 'RC-014', 'Research and Development Office', 'Research and development programs', 'Academic', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (35, 'RC-015', 'Extension Services Office', 'Community extension and outreach programs', 'Academic', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) VALUES (38, 'CMCS', 'College of Mathematics and Computing Sciences', NULL, 'MAIN', true, '2026-09-17 20:56:41.822515', '2026-09-17 20:56:41.822515');


--
-- Name: responsibility_centers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.responsibility_centers_id_seq', 38, true);


--
-- PostgreSQL database dump complete
--

\unrestrict OQxzoRxrg6FmAAQ3dnj868SxuAiIK44skqexbu8Qgcri0fx9CsmcKYFgQbPFmb4

