--
-- PostgreSQL database dump
--

\restrict 80Tshhylga2saotvraxD2wourj7EOzi7pKRwbWZutrz4ghbyRV2szUNas1seDon

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
-- Data for Name: rbud_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.rbud_entries (id, registry_no, entry_date, fund_cluster_id, fund_source_id, campus_id, burs_serial_no, serial_no_transferred, payee, particulars, responsibility_center_id, pap_id, uacs_code_id, ref_no, allotment_class_id, uacs_funding_source_code, fiscal_year, month, series, series2, quarter, object_expenditure_id, mfo_id, old_uacs_code_id, account_title, utilization_amount, ps_utilization, mooe_utilization, co_utilization, wfp_source_id, wfp_source_code, dv_payroll_no, disbursement_amount, running_balance, remarks, unpaid_utilization, created_by, updated_by, created_at, updated_at, status, po_no, status_of_po) VALUES (1, 'RBUD-2026-0001', '2026-08-24', 1, 1, NULL, NULL, NULL, 'Test Payee', 'Test RBUD transaction', 1, NULL, NULL, NULL, NULL, NULL, 2026, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 10000.00, 0.00, 10000.00, 0.00, NULL, NULL, NULL, 5000.00, 485000.00, NULL, 0.00, NULL, NULL, '2026-08-24 19:08:47.397693', '2026-08-24 19:08:47.397693', 'Approved', NULL, NULL);
INSERT INTO public.rbud_entries (id, registry_no, entry_date, fund_cluster_id, fund_source_id, campus_id, burs_serial_no, serial_no_transferred, payee, particulars, responsibility_center_id, pap_id, uacs_code_id, ref_no, allotment_class_id, uacs_funding_source_code, fiscal_year, month, series, series2, quarter, object_expenditure_id, mfo_id, old_uacs_code_id, account_title, utilization_amount, ps_utilization, mooe_utilization, co_utilization, wfp_source_id, wfp_source_code, dv_payroll_no, disbursement_amount, running_balance, remarks, unpaid_utilization, created_by, updated_by, created_at, updated_at, status, po_no, status_of_po) VALUES (4, 'RBUD-202-003', '2026-09-01', 1, NULL, NULL, NULL, NULL, 'test3', NULL, 7, NULL, NULL, NULL, NULL, NULL, 2026, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 100000.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, 0.00, 0.00, NULL, 0.00, NULL, NULL, '2026-09-01 11:17:01.548499', '2026-09-01 11:17:01.548499', 'Active', NULL, NULL);
INSERT INTO public.rbud_entries (id, registry_no, entry_date, fund_cluster_id, fund_source_id, campus_id, burs_serial_no, serial_no_transferred, payee, particulars, responsibility_center_id, pap_id, uacs_code_id, ref_no, allotment_class_id, uacs_funding_source_code, fiscal_year, month, series, series2, quarter, object_expenditure_id, mfo_id, old_uacs_code_id, account_title, utilization_amount, ps_utilization, mooe_utilization, co_utilization, wfp_source_id, wfp_source_code, dv_payroll_no, disbursement_amount, running_balance, remarks, unpaid_utilization, created_by, updated_by, created_at, updated_at, status, po_no, status_of_po) VALUES (5, 'RBUD-2026-004', '2026-09-01', 2, NULL, NULL, NULL, NULL, 'gg', NULL, 3, NULL, NULL, NULL, NULL, NULL, 2026, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 10000.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, 0.00, 0.00, NULL, 0.00, NULL, NULL, '2026-09-01 11:19:25.310189', '2026-09-01 11:19:25.310189', 'Active', NULL, NULL);
INSERT INTO public.rbud_entries (id, registry_no, entry_date, fund_cluster_id, fund_source_id, campus_id, burs_serial_no, serial_no_transferred, payee, particulars, responsibility_center_id, pap_id, uacs_code_id, ref_no, allotment_class_id, uacs_funding_source_code, fiscal_year, month, series, series2, quarter, object_expenditure_id, mfo_id, old_uacs_code_id, account_title, utilization_amount, ps_utilization, mooe_utilization, co_utilization, wfp_source_id, wfp_source_code, dv_payroll_no, disbursement_amount, running_balance, remarks, unpaid_utilization, created_by, updated_by, created_at, updated_at, status, po_no, status_of_po) VALUES (6, 'RBUD-2026-4', '2026-09-01', 2, NULL, NULL, NULL, NULL, 'kkkm', NULL, 31, NULL, NULL, NULL, NULL, NULL, 2026, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 50000.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, 0.00, 0.00, NULL, 0.00, NULL, NULL, '2026-09-01 11:21:31.605304', '2026-09-01 11:21:31.605304', 'Active', NULL, NULL);


--
-- Name: rbud_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rbud_entries_id_seq', 6, true);


--
-- PostgreSQL database dump complete
--

\unrestrict 80Tshhylga2saotvraxD2wourj7EOzi7pKRwbWZutrz4ghbyRV2szUNas1seDon

