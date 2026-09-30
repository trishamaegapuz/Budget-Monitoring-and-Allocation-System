--
-- PostgreSQL database dump
--

\restrict soKjucktXeuE5L3FDD8Nm8gtmuxgiQlpplTIWjRLcyrJasxYCXiuZsxBM2vShX3

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
-- Data for Name: raod_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.raod_entries (id, registry_no, entry_date, fund_cluster_id, fund_source_id, campus_id, ors_serial_no, serial_no_transferred, payee, particulars, responsibility_center_id, pap_id, uacs_code_id, ref_no, allotment_class_id, uacs_funding_source_code, fiscal_year, month, series, series2, quarter, object_expenditure_id, mfo_id, wfp_source_id, wfp_source_code, allotment_amount, obligation_amount, disbursement_amount, ps_amount, mooe_amount, co_amount, dv_no, po_no, burs_serial_no, remarks, created_by, updated_by, created_at, updated_at, status, old_uacs_code_id, account_title, unpaid_obligation, status_of_po, dv_payroll_no) VALUES (2, 'RAOD-TEST-002', '2026-08-23', 1, 1, NULL, NULL, NULL, 'Test Payee1', 'Test RAOD transaction', NULL, NULL, NULL, NULL, NULL, NULL, 2026, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 200000.00, 120000.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 1, 1, '2026-08-26 09:26:01.865213', '2026-09-17 23:36:18.990659', 'Obligated', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO public.raod_entries (id, registry_no, entry_date, fund_cluster_id, fund_source_id, campus_id, ors_serial_no, serial_no_transferred, payee, particulars, responsibility_center_id, pap_id, uacs_code_id, ref_no, allotment_class_id, uacs_funding_source_code, fiscal_year, month, series, series2, quarter, object_expenditure_id, mfo_id, wfp_source_id, wfp_source_code, allotment_amount, obligation_amount, disbursement_amount, ps_amount, mooe_amount, co_amount, dv_no, po_no, burs_serial_no, remarks, created_by, updated_by, created_at, updated_at, status, old_uacs_code_id, account_title, unpaid_obligation, status_of_po, dv_payroll_no) VALUES (4, 'RAOD-2026-1789652022433', '2026-09-13', 1, NULL, 1, 'ORS 2026 1', NULL, 'Test1', 'gfhhdhhd', 38, NULL, NULL, 'PR 2026 1', NULL, NULL, 2026, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1000000.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, 1, 1, '2026-09-17 21:33:44.126303', '2026-09-17 23:40:11.038294', 'Pending', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO public.raod_entries (id, registry_no, entry_date, fund_cluster_id, fund_source_id, campus_id, ors_serial_no, serial_no_transferred, payee, particulars, responsibility_center_id, pap_id, uacs_code_id, ref_no, allotment_class_id, uacs_funding_source_code, fiscal_year, month, series, series2, quarter, object_expenditure_id, mfo_id, wfp_source_id, wfp_source_code, allotment_amount, obligation_amount, disbursement_amount, ps_amount, mooe_amount, co_amount, dv_no, po_no, burs_serial_no, remarks, created_by, updated_by, created_at, updated_at, status, old_uacs_code_id, account_title, unpaid_obligation, status_of_po, dv_payroll_no) VALUES (3, 'RAOD-TEST-003', '2026-08-23', 1, 2, NULL, NULL, NULL, 'Test 2', 'For testing', 4, NULL, NULL, NULL, NULL, NULL, 2026, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1000000.00, 0.00, 0.00, 0.00, 0.00, 0.00, '5020101000', '2', '3', 'Information & Comm. Tech. Equipment', 1, 1, '2026-08-28 06:20:52.37791', '2026-09-18 18:39:42.932985', 'Obligated', NULL, NULL, 0.00, NULL, '5020101000');
INSERT INTO public.raod_entries (id, registry_no, entry_date, fund_cluster_id, fund_source_id, campus_id, ors_serial_no, serial_no_transferred, payee, particulars, responsibility_center_id, pap_id, uacs_code_id, ref_no, allotment_class_id, uacs_funding_source_code, fiscal_year, month, series, series2, quarter, object_expenditure_id, mfo_id, wfp_source_id, wfp_source_code, allotment_amount, obligation_amount, disbursement_amount, ps_amount, mooe_amount, co_amount, dv_no, po_no, burs_serial_no, remarks, created_by, updated_by, created_at, updated_at, status, old_uacs_code_id, account_title, unpaid_obligation, status_of_po, dv_payroll_no) VALUES (5, '101-2026-0001', '2026-09-18', 1, 1, 1, 'SAMPLE-ORS-0001 ', 'N/A', 'Sample Office Supplies Supplier', 'Purchase of office supplies for FY 2026', NULL, 14, 40, 'REF-2026-0001', 1, ' Sample UACS Code', 2026, 2, NULL, NULL, 1, 7, 1, 11, 'WFP-101-2026', 0.00, 25000.00, 20000.00, 0.00, 25000.00, 0.00, ' DV-SAMPLE-0001', 'PO-SAMPLE-0001', 'BURS-SAMPLE-001', 'ggh', 1, 1, '2026-09-18 19:56:02.181184', '2026-09-18 19:56:02.181184', 'Pending', NULL, NULL, 5000.00, NULL, NULL);


--
-- Name: raod_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.raod_entries_id_seq', 5, true);


--
-- PostgreSQL database dump complete
--

\unrestrict soKjucktXeuE5L3FDD8Nm8gtmuxgiQlpplTIWjRLcyrJasxYCXiuZsxBM2vShX3

