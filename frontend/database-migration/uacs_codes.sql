--
-- PostgreSQL database dump
--

\restrict NBJx0cqqdvMIFuxSxqbvfos4gaabMdrJaGk0w1DYUdw7zsD5KLMmd53e59diok7

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
-- Data for Name: uacs_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (5, '5060405000', NULL, 'Machinery and Equipment', 'Machinery and equipment', NULL, 'Capital Outlay', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:38:16.471812');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (1, '5010101000', NULL, 'Salaries and Wages - Regular', 'Salaries and Wages', 'Regular salaries and wages', 'Personnel Services', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:45:39.92231');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (7, '5010201000', '71102010', 'Other Compensation', 'Other Compensation', 'Other personnel compensation', 'Personnel Services', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (2, '5020101000', NULL, 'Traveling Expenses', 'Traveling Expenses', 'Domestic and foreign travel expenses', 'MOOE', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:45:39.92231');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (3, '5020201000', NULL, 'Training Expenses', 'Training Expenses', 'Training and development expenses', 'MOOE', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:45:39.92231');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (4, '5020301000', NULL, 'Office Supplies Expenses', 'Office Supplies Expenses', 'Office supplies and materials', 'MOOE', true, '2026-08-24 15:38:16.471812', '2026-08-24 15:45:39.92231');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (11, '5020401000', '72104010', 'Fuel, Oil and Lubricants', 'Fuel, Oil and Lubricants', 'Fuel and related expenses', 'MOOE', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (12, '5020501000', '72105010', 'Utility Expenses', 'Utility Expenses', 'Electricity, water and communication utilities', 'MOOE', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (13, '5020601000', '72106010', 'Communication Expenses', 'Communication Expenses', 'Communication expenses', 'MOOE', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (14, '5020701000', '72107010', 'Professional Services', 'Professional Services', 'Professional and consultancy services', 'MOOE', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (15, '5020801000', '72108010', 'General Services', 'General Services', 'General administrative services', 'MOOE', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (16, '5029901000', '72199010', 'Other Maintenance and Operating Expenses', 'Other MOOE', 'Other maintenance and operating expenses', 'MOOE', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (17, '5060101000', '73101010', 'Land and Land Improvements', 'Land and Land Improvements', 'Land acquisition and improvements', 'Capital Outlay', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (18, '5060201000', '73102010', 'Buildings and Other Structures', 'Buildings and Other Structures', 'Construction and improvement of buildings', 'Capital Outlay', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (19, '5060301000', '73103010', 'Machinery and Equipment', 'Machinery and Equipment', 'Machinery and equipment acquisition', 'Capital Outlay', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (20, '5060401000', '73104010', 'Transportation Equipment', 'Transportation Equipment', 'Transportation equipment acquisition', 'Capital Outlay', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (21, '5060501000', '73105010', 'Furniture and Fixtures', 'Furniture and Fixtures', 'Furniture and fixture acquisition', 'Capital Outlay', true, '2026-08-24 15:45:39.92231', '2026-08-24 15:45:39.92231');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (22, '5-01-01-010', NULL, 'Salaries and Wages', 'Basic salary and wages', 'Compensation for services rendered by personnel', 'Personnel Services', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (23, '5-01-02-010', NULL, 'Other Compensation', 'Personnel benefits and allowances', 'Other compensation and personnel benefits', 'Personnel Services', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (24, '5-02-01-010', NULL, 'Traveling Expenses', 'Traveling expenses', 'Domestic and foreign travel expenses', 'MOOE', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (25, '5-02-02-010', NULL, 'Training Expenses', 'Training and development expenses', 'Expenses for training and capacity development', 'MOOE', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (26, '5-02-03-010', NULL, 'Office Supplies Expenses', 'Office supplies', 'Expenses for office supplies and materials', 'MOOE', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (27, '5-02-03-020', NULL, 'Accountable Forms Expenses', 'Accountable forms', 'Expenses for accountable forms', 'MOOE', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (28, '5-02-03-030', NULL, 'Non-Accountable Forms Expenses', 'Non-accountable forms', 'Expenses for non-accountable forms', 'MOOE', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (29, '5-02-04-010', NULL, 'Water Expenses', 'Water utility expenses', 'Expenses for water services', 'MOOE', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (30, '5-02-04-020', NULL, 'Electricity Expenses', 'Electricity utility expenses', 'Expenses for electricity', 'MOOE', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (31, '5-02-04-030', NULL, 'Communication Expenses', 'Communication expenses', 'Telephone, internet and communication expenses', 'MOOE', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (32, '5-02-05-010', NULL, 'Repairs and Maintenance', 'Repairs and maintenance', 'Repair and maintenance of facilities and equipment', 'MOOE', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (33, '5-02-06-010', NULL, 'Taxes, Insurance Premiums and Other Fees', 'Taxes and insurance', 'Taxes, insurance premiums and related fees', 'MOOE', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (34, '5-02-07-010', NULL, 'Professional Services', 'Professional services', 'Payments for professional and technical services', 'MOOE', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (35, '5-02-08-010', NULL, 'General Services', 'General services', 'Payments for general services', 'MOOE', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (36, '5-02-09-010', NULL, 'Other Maintenance and Operating Expenses', 'Other operating expenses', 'Other necessary operating expenses', 'MOOE', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (37, '5-03-01-010', NULL, 'Property, Plant and Equipment', 'Property, plant and equipment', 'Acquisition of property, plant and equipment', 'Capital Outlay', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (38, '5-03-01-020', NULL, 'Buildings and Structures', 'Buildings and structures', 'Construction and acquisition of buildings and structures', 'Capital Outlay', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (39, '5-03-01-030', NULL, 'Machinery and Equipment', 'Machinery and equipment', 'Acquisition of machinery and equipment', 'Capital Outlay', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');
INSERT INTO public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) VALUES (40, '5-03-01-040', NULL, 'Information and Communication Technology Equipment', 'ICT equipment', 'Acquisition of ICT equipment', 'Capital Outlay', true, '2026-08-24 15:52:36.668272', '2026-08-24 15:52:36.668272');


--
-- Name: uacs_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.uacs_codes_id_seq', 40, true);


--
-- PostgreSQL database dump complete
--

\unrestrict NBJx0cqqdvMIFuxSxqbvfos4gaabMdrJaGk0w1DYUdw7zsD5KLMmd53e59diok7

