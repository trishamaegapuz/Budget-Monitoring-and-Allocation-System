--
-- PostgreSQL database dump
--

\restrict ToTMlVHwfxvdSBvPPbsCT45oOZlUpRwL5stJfeQBhcRrwpHJgu8PZg8pmqIAUm1

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
-- Data for Name: allocation_activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.allocation_activities (id, action_type, description, details, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: allotment_classes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.allotment_classes (id, code, name, description, is_active, created_at, updated_at) FROM stdin;
1	PS	Personnel Services	Personnel Services allotment	t	2026-08-24 15:38:16.471812	2026-08-24 15:45:39.92231
2	MOOE	Maintenance and Other Operating Expenses	MOOE allotment	t	2026-08-24 15:38:16.471812	2026-08-24 15:45:39.92231
3	CO	Capital Outlay	Capital Outlay allotment	t	2026-08-24 15:38:16.471812	2026-08-24 15:45:39.92231
7	FINEX	Financial Expenses	Financial expenses allotment	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_log (id, user_id, action, table_name, record_id, old_data, new_data, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: fund_sources; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fund_sources (id, code, name, description, is_active, created_at, updated_at) FROM stdin;
1	MAIN	Main Fund	Main institutional fund	t	2026-08-24 15:38:16.471812	2026-08-24 15:45:39.92231
3	OTHER	Other Funds	Other institutional funds	t	2026-08-24 15:38:16.471812	2026-08-24 15:45:39.92231
4	DOST	DOST Fund	Department of Science and Technology Fund	t	2026-08-24 15:38:16.471812	2026-08-24 15:45:39.92231
5	DA	DA Fund	Department of Agriculture Fund	t	2026-08-24 15:38:16.471812	2026-08-24 15:45:39.92231
6	CHED	CHED Fund	Commission on Higher Education Fund	t	2026-08-24 15:38:16.471812	2026-08-24 15:45:39.92231
2	BGD	BGD Fund	Budgetary Government Fund	t	2026-08-24 15:38:16.471812	2026-08-26 08:00:20.751176
\.


--
-- Data for Name: fund_clusters; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fund_clusters (id, fund_source_id, code, name, description, is_active, created_at, updated_at) FROM stdin;
1	1	101	General Fund	General Fund	t	2026-08-24 15:38:16.471812	2026-08-24 15:38:16.471812
2	2	102	Special Purpose Fund	Budgetary government fund	t	2026-08-24 15:38:16.471812	2026-08-24 15:38:16.471812
3	3	103	Other Institutional Funds	Other funds	t	2026-08-24 15:38:16.471812	2026-08-24 15:38:16.471812
4	4	104	DOST Fund	DOST funded projects	t	2026-08-24 15:38:16.471812	2026-08-24 15:38:16.471812
5	5	105	DA Fund	DA funded projects	t	2026-08-24 15:38:16.471812	2026-08-24 15:38:16.471812
6	6	106	CHED Fund	CHED funded projects	t	2026-08-24 15:38:16.471812	2026-08-24 15:38:16.471812
\.


--
-- Data for Name: budget_adjustments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.budget_adjustments (id, maf_no, fiscal_year, fund_cluster_id, fund_source_id, department, prepared_by, adjustment_date, source_program, source_rc, source_allotment_class, source_object_expenditure, source_amount, deficient_program, deficient_rc, deficient_allotment_class, deficient_object_expenditure, deficient_amount, status, remarks, approved_by, approved_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: campuses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.campuses (id, code, name, abbreviation, is_active, created_at, updated_at) FROM stdin;
2	CAMPUS2	Campus 2	C2	t	2026-08-24 15:38:16.471812	2026-08-24 15:38:16.471812
1	MAIN	Main Campus	MC	t	2026-08-24 15:38:16.471812	2026-08-24 15:45:39.92231
4	LABO	Labo Campus	LC	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
5	CASS	College of Arts and Sciences Campus	CAS	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
6	TECH	Technical Campus	TC	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
8	ADMIN	Administrative Campus	ADMIN	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
9	SAT	Satellite Campus	SAT	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
10	EXT	Extension Campus	EXT	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
\.


--
-- Data for Name: mfo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mfo (id, code, name, description, is_active, created_at, updated_at) FROM stdin;
1	MFO1	Higher Education Program	Higher education services	t	2026-08-24 15:38:16.471812	2026-08-24 15:38:16.471812
2	MFO2	Research and Development	Research and development activities	t	2026-08-24 15:38:16.471812	2026-08-24 15:38:16.471812
3	MFO3	Extension Services	Community extension services	t	2026-08-24 15:38:16.471812	2026-08-24 15:38:16.471812
4	MFO4	Administration and Support	Administrative and support services	t	2026-08-24 15:38:16.471812	2026-08-24 15:38:16.471812
5	MFO-01	Higher Education Services	Provision of quality higher education services	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
6	MFO-02	Advanced Education Services	Provision of advanced education and graduate programs	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
7	MFO-03	Research Services	Conduct of research and development activities	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
8	MFO-04	Technical Advisory and Extension Services	Provision of extension and technical advisory services	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
9	MFO-05	Institutional Management Services	Institutional administration and support services	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
10	MFO-001	Higher Education Program	Provision of quality higher education services	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
11	MFO-002	Advanced Education Program	Advanced education and graduate-level programs	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
12	MFO-003	Research Program	Research and development activities	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
13	MFO-004	Technical and Advisory Extension Program	Extension and community services	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
14	MFO-005	General Administration and Support	General administration and institutional support	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
15	MFO-006	Support to Operations	Institutional operational support services	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
\.


--
-- Data for Name: object_expenditures; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.object_expenditures (id, code, name, description, is_active, created_at, updated_at) FROM stdin;
1	OE-PS	Personal Services	Personnel expenditures	t	2026-08-24 15:38:16.471812	2026-08-24 15:38:16.471812
2	OE-MOOE	Maintenance and Other Operating Expenses	Operating expenditures	t	2026-08-24 15:38:16.471812	2026-08-24 15:38:16.471812
3	OE-CO	Capital Outlay	Capital expenditures	t	2026-08-24 15:38:16.471812	2026-08-24 15:38:16.471812
4	PS	Personnel Services	Personnel-related expenditures	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
5	MOOE	Maintenance and Other Operating Expenses	Maintenance and operating expenditures	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
6	CO	Capital Outlay	Capital expenditures	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
7	TRAVEL	Travel Expenses	Travel-related expenses	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
8	TRAINING	Training Expenses	Training and development expenses	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
9	OFFICE	Office Supplies	Office supplies and materials	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
10	UTILITIES	Utilities	Electricity, water and communication	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
11	PROFESSIONAL	Professional Services	Professional and consultancy services	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
12	EQUIPMENT	Equipment	Machinery and equipment	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
13	INFRA	Infrastructure	Infrastructure and building projects	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
17	OE-SW	Salaries and Wages	Basic salaries and wages	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
18	OE-TRAVEL	Traveling Expenses	Travel-related expenditures	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
19	OE-TRAINING	Training Expenses	Training and development expenses	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
20	OE-SUPPLIES	Office Supplies	Office supplies and materials	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
21	OE-UTILITIES	Utilities	Water, electricity and communication utilities	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
22	OE-REPAIR	Repairs and Maintenance	Repair and maintenance expenses	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
23	OE-SERVICES	Professional and General Services	Professional and general services	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
24	OE-EQUIPMENT	Equipment	Procurement of equipment	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
25	OE-INFRA	Infrastructure	Infrastructure and building projects	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
\.


--
-- Data for Name: pap; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pap (id, code, name, description, is_active, created_at, updated_at) FROM stdin;
1	PAP-001	Regular Operations	Regular institutional operations	t	2026-08-24 15:38:16.471812	2026-08-24 15:45:39.92231
2	PAP-002	Personnel Services	Personnel-related programs and activities	t	2026-08-24 15:38:16.471812	2026-08-24 15:45:39.92231
3	PAP-003	Maintenance and Other Operating Expenses	Regular MOOE activities	t	2026-08-24 15:38:16.471812	2026-08-24 15:45:39.92231
4	PAP-004	Capital Outlay Program	Capital outlay projects and activities	t	2026-08-24 15:38:16.471812	2026-08-24 15:45:39.92231
5	PAP-005	Research and Development Program	Research and development activities	t	2026-08-24 15:38:16.471812	2026-08-24 15:45:39.92231
11	PAP-006	Extension Services Program	Community extension programs	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
12	PAP-007	Student Development Program	Student development and support activities	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
13	PAP-008	Infrastructure Development	Infrastructure and facility improvement projects	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
14	PAP-009	ICT Development Program	Information technology development projects	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
15	PAP-010	Procurement Program	Institutional procurement activities	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
26	PAP-011	Scholarship Program	Student scholarship and financial assistance	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
27	PAP-012	Community Outreach	Community outreach and development activities	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
28	PAP-013	Institutional Development	Institutional development initiatives	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
29	PAP-014	Disaster Risk Reduction	Disaster preparedness and risk reduction	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
30	PAP-015	Gender and Development	Gender and development activities	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
\.


--
-- Data for Name: responsibility_centers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) FROM stdin;
1	ADMIN	Administration	Administrative offices	Administration	t	2026-08-24 15:38:16.471812	2026-08-24 15:38:16.471812
2	ACADEMIC	Academic Affairs	Academic offices and units	Academic	t	2026-08-24 15:38:16.471812	2026-08-24 15:38:16.471812
3	FINANCE	Finance Office	Finance and budget operations	Administration	t	2026-08-24 15:38:16.471812	2026-08-24 15:38:16.471812
6	ADM	Office of the President	Office of the President	Administration	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
7	VPAA	Office of the Vice President for Academic Affairs	Academic Affairs	Administration	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
8	VPFA	Office of the Vice President for Finance and Administration	Finance and Administration	Administration	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
9	BUDGET	Budget Office	Institutional Budget Office	Finance	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
10	ACCOUNTING	Accounting Office	Institutional Accounting Office	Finance	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
11	CASHIER	Cashier Office	Institutional Cashier Office	Finance	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
4	HR	Human Resource Management Office	Human Resource Management Office	Administration	t	2026-08-24 15:38:16.471812	2026-08-24 15:45:39.92231
5	PROC	Procurement Office	Procurement Office	Administration	t	2026-08-24 15:38:16.471812	2026-08-24 15:45:39.92231
14	SUPPLY	Supply Office	Supply and Property Office	Administration	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
15	ICT	Information and Communications Technology Office	ICT Office	Support	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
16	RESEARCH	Research and Development Office	Research and Development	Academic	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
17	EXT	Extension Services Office	Extension Services	Academic	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
18	LIB	Library	Library Services	Academic	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
19	STUDENT	Student Affairs Office	Student Affairs	Student Services	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
20	COLLEGE	Academic Departments	Academic Departments	Academic	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
21	RC-001	Office of the President	Office of the President	Administration	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
22	RC-002	Office of the Vice President	Office of the Vice President	Administration	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
23	RC-003	Finance Office	Finance and budget management office	Administration	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
24	RC-004	Accounting Office	Accounting and financial reporting office	Administration	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
25	RC-005	Budget Office	Budget planning, allocation and monitoring office	Administration	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
26	RC-006	Human Resource Management Office	Human resource management office	Administration	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
27	RC-007	Procurement Office	Procurement and supply management office	Administration	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
28	RC-008	General Services Office	General services and property management	Administration	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
29	RC-009	Information Technology Office	Information technology services	Administration	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
30	RC-010	College of Teacher Education	Academic responsibility center	Academic	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
31	RC-011	College of Arts and Sciences	Academic responsibility center	Academic	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
32	RC-012	College of Business and Management	Academic responsibility center	Academic	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
33	RC-013	College of Agriculture	Academic responsibility center	Academic	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
34	RC-014	Research and Development Office	Research and development programs	Academic	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
35	RC-015	Extension Services Office	Community extension and outreach programs	Academic	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
38	CMCS	College of Mathematics and Computing Sciences	\N	MAIN	t	2026-09-17 20:56:41.822515	2026-09-17 20:56:41.822515
\.


--
-- Data for Name: uacs_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) FROM stdin;
5	5060405000	\N	Machinery and Equipment	Machinery and equipment	\N	Capital Outlay	t	2026-08-24 15:38:16.471812	2026-08-24 15:38:16.471812
1	5010101000	\N	Salaries and Wages - Regular	Salaries and Wages	Regular salaries and wages	Personnel Services	t	2026-08-24 15:38:16.471812	2026-08-24 15:45:39.92231
7	5010201000	71102010	Other Compensation	Other Compensation	Other personnel compensation	Personnel Services	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
2	5020101000	\N	Traveling Expenses	Traveling Expenses	Domestic and foreign travel expenses	MOOE	t	2026-08-24 15:38:16.471812	2026-08-24 15:45:39.92231
3	5020201000	\N	Training Expenses	Training Expenses	Training and development expenses	MOOE	t	2026-08-24 15:38:16.471812	2026-08-24 15:45:39.92231
4	5020301000	\N	Office Supplies Expenses	Office Supplies Expenses	Office supplies and materials	MOOE	t	2026-08-24 15:38:16.471812	2026-08-24 15:45:39.92231
11	5020401000	72104010	Fuel, Oil and Lubricants	Fuel, Oil and Lubricants	Fuel and related expenses	MOOE	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
12	5020501000	72105010	Utility Expenses	Utility Expenses	Electricity, water and communication utilities	MOOE	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
13	5020601000	72106010	Communication Expenses	Communication Expenses	Communication expenses	MOOE	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
14	5020701000	72107010	Professional Services	Professional Services	Professional and consultancy services	MOOE	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
15	5020801000	72108010	General Services	General Services	General administrative services	MOOE	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
16	5029901000	72199010	Other Maintenance and Operating Expenses	Other MOOE	Other maintenance and operating expenses	MOOE	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
17	5060101000	73101010	Land and Land Improvements	Land and Land Improvements	Land acquisition and improvements	Capital Outlay	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
18	5060201000	73102010	Buildings and Other Structures	Buildings and Other Structures	Construction and improvement of buildings	Capital Outlay	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
19	5060301000	73103010	Machinery and Equipment	Machinery and Equipment	Machinery and equipment acquisition	Capital Outlay	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
20	5060401000	73104010	Transportation Equipment	Transportation Equipment	Transportation equipment acquisition	Capital Outlay	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
21	5060501000	73105010	Furniture and Fixtures	Furniture and Fixtures	Furniture and fixture acquisition	Capital Outlay	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
22	5-01-01-010	\N	Salaries and Wages	Basic salary and wages	Compensation for services rendered by personnel	Personnel Services	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
23	5-01-02-010	\N	Other Compensation	Personnel benefits and allowances	Other compensation and personnel benefits	Personnel Services	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
24	5-02-01-010	\N	Traveling Expenses	Traveling expenses	Domestic and foreign travel expenses	MOOE	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
25	5-02-02-010	\N	Training Expenses	Training and development expenses	Expenses for training and capacity development	MOOE	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
26	5-02-03-010	\N	Office Supplies Expenses	Office supplies	Expenses for office supplies and materials	MOOE	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
27	5-02-03-020	\N	Accountable Forms Expenses	Accountable forms	Expenses for accountable forms	MOOE	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
28	5-02-03-030	\N	Non-Accountable Forms Expenses	Non-accountable forms	Expenses for non-accountable forms	MOOE	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
29	5-02-04-010	\N	Water Expenses	Water utility expenses	Expenses for water services	MOOE	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
30	5-02-04-020	\N	Electricity Expenses	Electricity utility expenses	Expenses for electricity	MOOE	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
31	5-02-04-030	\N	Communication Expenses	Communication expenses	Telephone, internet and communication expenses	MOOE	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
32	5-02-05-010	\N	Repairs and Maintenance	Repairs and maintenance	Repair and maintenance of facilities and equipment	MOOE	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
33	5-02-06-010	\N	Taxes, Insurance Premiums and Other Fees	Taxes and insurance	Taxes, insurance premiums and related fees	MOOE	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
34	5-02-07-010	\N	Professional Services	Professional services	Payments for professional and technical services	MOOE	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
35	5-02-08-010	\N	General Services	General services	Payments for general services	MOOE	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
36	5-02-09-010	\N	Other Maintenance and Operating Expenses	Other operating expenses	Other necessary operating expenses	MOOE	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
37	5-03-01-010	\N	Property, Plant and Equipment	Property, plant and equipment	Acquisition of property, plant and equipment	Capital Outlay	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
38	5-03-01-020	\N	Buildings and Structures	Buildings and structures	Construction and acquisition of buildings and structures	Capital Outlay	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
39	5-03-01-030	\N	Machinery and Equipment	Machinery and equipment	Acquisition of machinery and equipment	Capital Outlay	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
40	5-03-01-040	\N	Information and Communication Technology Equipment	ICT equipment	Acquisition of ICT equipment	Capital Outlay	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
\.


--
-- Data for Name: wfp_sources; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wfp_sources (id, code, name, description, is_active, created_at, updated_at) FROM stdin;
1	WFP-001	Regular WFP	Regular Work and Financial Plan	t	2026-08-24 15:38:16.471812	2026-08-24 15:38:16.471812
2	WFP-002	Special WFP	Special Work and Financial Plan	t	2026-08-24 15:38:16.471812	2026-08-24 15:38:16.471812
3	WFP-003	Project WFP	Project-based Work and Financial Plan	t	2026-08-24 15:38:16.471812	2026-08-24 15:38:16.471812
4	WFP-REG	Regular Programs	Regular institutional programs	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
5	WFP-PS	Personnel Services WFP	Personnel Services Work and Financial Plan	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
6	WFP-MOOE	MOOE WFP	MOOE Work and Financial Plan	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
7	WFP-CO	Capital Outlay WFP	Capital Outlay Work and Financial Plan	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
8	WFP-RES	Research WFP	Research and development WFP	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
9	WFP-EXT	Extension WFP	Extension services WFP	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
10	WFP-ICT	ICT WFP	ICT development WFP	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
11	WFP-STUDENT	Student Services WFP	Student development WFP	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
16	WFP-DOST	DOST Project WFP	Work and Financial Plan for DOST-funded projects	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
17	WFP-DA	DA Project WFP	Work and Financial Plan for DA-funded projects	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
18	WFP-CHED	CHED Project WFP	Work and Financial Plan for CHED-funded projects	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
19	WFP-OTHER	Other Fund WFP	Work and Financial Plan for other institutional funds	t	2026-08-24 15:52:36.668272	2026-08-24 15:52:36.668272
\.


--
-- Data for Name: budget_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.budget_items (id, fiscal_year, fund_cluster_id, fund_source_id, campus_id, responsibility_center_id, mfo_id, pap_id, uacs_code_id, object_expenditure_id, allotment_class_id, wfp_source_id, approved_budget, ps_amount, mooe_amount, co_amount, quarter, month, status, notes, created_by, updated_by, created_at, updated_at) FROM stdin;
1	2026	1	1	\N	1	\N	\N	\N	\N	\N	\N	500000.00	0.00	500000.00	0.00	\N	\N	Approved	Test RBUD budget allocation	\N	\N	2026-08-25 09:09:45.591066	2026-08-25 09:09:45.591066
\.


--
-- Data for Name: budget_proposals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.budget_proposals (proposal_id, proposal_no, fiscal_year, proposal_title, department_unit, fund_source, category, program_project_activity, requested_amount, justification, expected_outputs, supporting_documents, status, submitted_at, reviewed_at, endorsed_at, approved_at, returned_at, rejection_reason, remarks, created_by, reviewed_by, endorsed_by, approved_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: fhe_deficiency; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fhe_deficiency (id, fiscal_year, academic_year, enrolled_students, qualified_students, saro_no, saro_date, nca_no, nca_date, saro_amount, nca_received, actual_billing, mdp, deficiency_amount, remarks, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: financial_reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.financial_reports (id, report_type, report_name, fiscal_year, period_type, period_value, fund_cluster_id, generated_by, file_format, file_path, status, created_at) FROM stdin;
2	Financial	Monthly Budget Report	2026	monthly	2026-08	\N	\N	PDF	\N	Generated	2026-08-26 11:02:29.121903
3	RBUD	RBUD	2026	monthly	2026-08	\N	\N	PDF	\N	Generated	2026-08-26 18:52:46.248344
4	RBUD	RBUD Registry Report	2026	monthly	2026-08	\N	\N	PDF	\N	Generated	2026-08-27 05:27:38.681769
5	RAOD	Raod	2026	monthly	2026-08	\N	\N	PDF	\N	Generated	2026-08-27 06:03:22.449342
6	FAR	FAR 1	2026	yearly	annual	\N	1	Excel	\N	Generated	2026-09-06 10:23:22.574558
7	FAR	FAR 1	2026	yearly	annual	\N	1	PDF	\N	Generated	2026-09-06 10:24:02.699084
8	OTHER	Budget Utilization Report	2026	yearly	annual	\N	1	PDF	\N	Generated	2026-09-06 10:40:51.978515
9	OTHER	Budget Utilization Report	2026	yearly	annual	\N	1	Excel	\N	Generated	2026-09-06 10:43:13.273384
10	FAR	FAR 1	2026	yearly	annual	\N	1	Excel	\N	Generated	2026-09-06 10:51:17.109947
11	FAR	FAR 1	2026	yearly	annual	\N	1	PDF	\N	Generated	2026-09-06 10:51:21.29632
12	WFP	WFP Balance	2026	yearly	annual	\N	1	Excel	\N	Generated	2026-09-06 10:53:45.628801
13	WFP	WFP Balance	2026	yearly	annual	\N	1	PDF	\N	Generated	2026-09-06 10:53:50.963037
14	WFP	WFP Balance	2026	yearly	annual	\N	1	Excel	\N	Generated	2026-09-06 10:54:07.203138
15	WFP	WFP Balance	2026	yearly	annual	\N	1	Excel	\N	Generated	2026-09-06 10:57:15.026779
16	WFP	WFP Balance	2026	yearly	annual	\N	1	PDF	\N	Generated	2026-09-06 10:57:57.603293
17	OTHER	Breakdown Report	2026	yearly	annual	\N	1	PDF	\N	Generated	2026-09-06 11:05:03.670231
18	FAR	FAR 1	2026	yearly	annual	\N	1	Excel	\N	Generated	2026-09-06 11:06:17.617504
19	FAR	FAR 1	2026	yearly	annual	\N	1	PDF	\N	Generated	2026-09-06 11:06:38.988477
20	FAR	FAR 2	2026	yearly	annual	\N	1	Excel	\N	Generated	2026-09-06 11:12:01.810057
21	FAR	FAR 2	2026	yearly	annual	\N	1	PDF	\N	Generated	2026-09-06 11:12:20.036885
22	FAR	FAR 2a	2026	yearly	annual	\N	1	Excel	\N	Generated	2026-09-06 11:14:00.687774
23	FAR	FAR 2a	2026	yearly	annual	\N	1	PDF	\N	Generated	2026-09-06 11:14:22.663541
\.


--
-- Data for Name: fiscal_years; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fiscal_years (id, year, is_current, is_closed, created_at) FROM stdin;
2	2024	f	t	2026-08-24 15:45:39.92231
3	2025	f	t	2026-08-24 15:45:39.92231
1	2026	t	f	2026-08-24 12:19:40.903736
8	2027	f	f	2026-08-24 15:52:36.668272
\.


--
-- Data for Name: fund_allocations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fund_allocations (id, fiscal_year, fund_source_id, fund_cluster_id, campus_id, responsibility_center_id, wfp_source_id, allocation_amount, utilized_amount, disbursed_amount, created_at, updated_at) FROM stdin;
1	2026	1	1	5	\N	1	500000.00	0.00	0.00	2026-08-24 16:07:04.290174	2026-08-24 16:07:04.290174
2	2026	2	2	5	3	10	200000.00	0.00	0.00	2026-08-28 06:29:03.524267	2026-08-28 06:29:03.524267
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, recipient_role, title, message, type, is_read, created_at) FROM stdin;
7	6	\N	Account Approved!	Congratulations Trisha Mae Gapuz, your BMAS account has been approved. You can now log in.	approval	f	2026-08-27 11:54:36.146274
9	7	\N	Account Approved!	Congratulations Alyssa B. Ban-o, your BMAS account has been approved. You can now log in.	approval	f	2026-09-10 16:31:37.624976
11	8	\N	Account Approved!	Congratulations Alysssa Bacatan, your BMAS account has been approved. You can now log in.	approval	f	2026-09-10 16:38:09.038375
16	12	\N	Account Approved!	Congratulations Mae Trisha Gapuz, your BMAS account has been approved. You can now log in.	approval	f	2026-09-18 00:41:05.658712
17	12	\N	Account Updated	Your BMAS account information was updated by the Administrator.	system	f	2026-09-18 09:51:56.6747
1	\N	Administrator	New User Registration	A new user "Trisha Mae Gapuz" has registered and is awaiting approval.	registration	t	2026-08-27 09:42:48.922489
3	\N	Administrator	New User Registration	Trisha Mae Gapuz has registered as Budget Staff and is awaiting approval.	registration	t	2026-08-27 10:32:44.416416
4	\N	Administrator	New User Registration	A new user "Trisha Mae Gapuz" has registered as Staff and is waiting for approval.	registration	t	2026-08-27 10:53:30.724065
5	\N	Administrator	New User Registration	A new user "Trisha Mae Gapuz" has registered as Staff and is waiting for approval.	registration	t	2026-08-27 11:40:18.169795
6	\N	Administrator	New User Registration	A new user "Trisha Mae Gapuz" has registered as Staff and is waiting for approval.	registration	t	2026-08-27 11:53:24.845813
8	\N	Administrator	New User Registration	A new user "Alyssa B. Ban-o" has registered as Accountant and is waiting for approval.	registration	t	2026-09-10 16:30:39.913701
10	\N	Administrator	New User Registration	A new user "Alysssa Bacatan" has registered as Staff and is waiting for approval.	registration	t	2026-09-10 16:37:14.699445
12	\N	Administrator	New User Registration	A new user "Mae Trisha Gapuz" has registered as Staff and is waiting for approval.	registration	t	2026-09-18 00:05:38.980545
13	\N	Administrator	New User Registration	A new user "Mae Trisha Gapuz" has registered as Staff and is waiting for approval.	registration	t	2026-09-18 00:13:05.578617
14	\N	Administrator	New User Registration	A new user "Mae Trisha Gapuz" has registered as Staff and is waiting for approval.	registration	t	2026-09-18 00:24:31.81264
15	\N	Administrator	New User Registration	A new user "Mae Trisha Gapuz" has registered as Staff and is waiting for approval.	registration	t	2026-09-18 00:39:52.231206
\.


--
-- Data for Name: preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.preferences (id, user_id, items_per_page, theme, sidebar_position, dashboard_overview, auto_logout_minutes, confirm_before_delete, enable_animations, created_at, updated_at) FROM stdin;
1	1	10	Light	Fixed	t	30	t	t	2026-08-24 15:45:39.92231	2026-08-24 15:45:39.92231
\.


--
-- Data for Name: raod_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.raod_entries (id, registry_no, entry_date, fund_cluster_id, fund_source_id, campus_id, ors_serial_no, serial_no_transferred, payee, particulars, responsibility_center_id, pap_id, uacs_code_id, ref_no, allotment_class_id, uacs_funding_source_code, fiscal_year, month, series, series2, quarter, object_expenditure_id, mfo_id, wfp_source_id, wfp_source_code, allotment_amount, obligation_amount, disbursement_amount, ps_amount, mooe_amount, co_amount, dv_no, po_no, burs_serial_no, remarks, created_by, updated_by, created_at, updated_at, status, old_uacs_code_id, account_title, unpaid_obligation, status_of_po, dv_payroll_no) FROM stdin;
2	RAOD-TEST-002	2026-08-23	1	1	\N	\N	\N	Test Payee1	Test RAOD transaction	\N	\N	\N	\N	\N	\N	2026	\N	\N	\N	\N	\N	\N	\N	\N	200000.00	120000.00	0.00	0.00	0.00	0.00	\N	\N	\N	\N	1	1	2026-08-26 09:26:01.865213	2026-09-17 23:36:18.990659	Obligated	\N	\N	0.00	\N	\N
4	RAOD-2026-1789652022433	2026-09-13	1	\N	1	ORS 2026 1	\N	Test1	gfhhdhhd	38	\N	\N	PR 2026 1	\N	\N	2026	\N	\N	\N	\N	\N	\N	\N	\N	1000000.00	0.00	0.00	0.00	0.00	0.00	\N	\N	\N	\N	1	1	2026-09-17 21:33:44.126303	2026-09-17 23:40:11.038294	Pending	\N	\N	0.00	\N	\N
3	RAOD-TEST-003	2026-08-23	1	2	\N	\N	\N	Test 2	For testing	4	\N	\N	\N	\N	\N	2026	\N	\N	\N	\N	\N	\N	\N	\N	1000000.00	0.00	0.00	0.00	0.00	0.00	5020101000	2	3	Information & Comm. Tech. Equipment	1	1	2026-08-28 06:20:52.37791	2026-09-18 18:39:42.932985	Obligated	\N	\N	0.00	\N	5020101000
5	101-2026-0001	2026-09-18	1	1	1	SAMPLE-ORS-0001 	N/A	Sample Office Supplies Supplier	Purchase of office supplies for FY 2026	\N	14	40	REF-2026-0001	1	 Sample UACS Code	2026	2	\N	\N	1	7	1	11	WFP-101-2026	0.00	25000.00	20000.00	0.00	25000.00	0.00	 DV-SAMPLE-0001	PO-SAMPLE-0001	BURS-SAMPLE-001	ggh	1	1	2026-09-18 19:56:02.181184	2026-09-18 19:56:02.181184	Pending	\N	\N	5000.00	\N	\N
\.


--
-- Data for Name: rbud_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rbud_entries (id, registry_no, entry_date, fund_cluster_id, fund_source_id, campus_id, burs_serial_no, serial_no_transferred, payee, particulars, responsibility_center_id, pap_id, uacs_code_id, ref_no, allotment_class_id, uacs_funding_source_code, fiscal_year, month, series, series2, quarter, object_expenditure_id, mfo_id, old_uacs_code_id, account_title, utilization_amount, ps_utilization, mooe_utilization, co_utilization, wfp_source_id, wfp_source_code, dv_payroll_no, disbursement_amount, running_balance, remarks, unpaid_utilization, created_by, updated_by, created_at, updated_at, status, po_no, status_of_po) FROM stdin;
1	RBUD-2026-0001	2026-08-24	1	1	\N	\N	\N	Test Payee	Test RBUD transaction	1	\N	\N	\N	\N	\N	2026	\N	\N	\N	\N	\N	\N	\N	\N	10000.00	0.00	10000.00	0.00	\N	\N	\N	5000.00	485000.00	\N	0.00	\N	\N	2026-08-24 19:08:47.397693	2026-08-24 19:08:47.397693	Approved	\N	\N
4	RBUD-202-003	2026-09-01	1	\N	\N	\N	\N	test3	\N	7	\N	\N	\N	\N	\N	2026	\N	\N	\N	\N	\N	\N	\N	\N	100000.00	0.00	0.00	0.00	\N	\N	\N	0.00	0.00	\N	0.00	\N	\N	2026-09-01 11:17:01.548499	2026-09-01 11:17:01.548499	Active	\N	\N
5	RBUD-2026-004	2026-09-01	2	\N	\N	\N	\N	gg	\N	3	\N	\N	\N	\N	\N	2026	\N	\N	\N	\N	\N	\N	\N	\N	10000.00	0.00	0.00	0.00	\N	\N	\N	0.00	0.00	\N	0.00	\N	\N	2026-09-01 11:19:25.310189	2026-09-01 11:19:25.310189	Active	\N	\N
6	RBUD-2026-4	2026-09-01	2	\N	\N	\N	\N	kkkm	\N	31	\N	\N	\N	\N	\N	2026	\N	\N	\N	\N	\N	\N	\N	\N	50000.00	0.00	0.00	0.00	\N	\N	\N	0.00	0.00	\N	0.00	\N	\N	2026-09-01 11:21:31.605304	2026-09-01 11:21:31.605304	Active	\N	\N
\.


--
-- Data for Name: report_exports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.report_exports (id, report_type, fiscal_year, fund_cluster_id, format, generated_by, file_name, created_at) FROM stdin;
1	Financial	2026	\N	PDF	\N	Monthly Budget Report.pdf	2026-08-26 10:40:57.723872
2	Financial	2026	\N	PDF	\N	Monthly Budget Report.pdf	2026-08-26 11:03:49.275095
3	Financial	2026	\N	PDF	\N	Monthly Budget Report.pdf	2026-08-26 11:08:04.462528
4	Financial	2026	\N	PDF	\N	Monthly Budget Report.pdf	2026-08-26 11:10:17.523282
5	RBUD	2026	\N	PDF	\N	RBUD.pdf	2026-08-26 18:52:58.17368
6	RBUD	2026	\N	PDF	\N	RBUD.pdf	2026-08-26 18:53:57.873487
7	Financial	2026	\N	PDF	\N	Monthly Budget Report.pdf	2026-08-26 18:54:37.844349
8	RBUD	2026	\N	PDF	\N	RBUD Registry Report.pdf	2026-08-27 05:27:58.612228
9	RAOD	2026	\N	PDF	\N	Raod.pdf	2026-08-27 06:03:33.144966
10	RAOD	2026	\N	PDF	\N	Raod.pdf	2026-08-27 07:22:56.81851
11	Financial	2026	\N	Excel	\N	RBUD Registry Report.xlsx	2026-08-27 07:28:37.653885
12	Registry	2026	\N	PDF	\N	RBUD Registry Report.pdf	2026-08-27 07:47:45.722762
13	FAR 1	2026	\N	Excel	1	FAR 1.xlsx	2026-09-06 10:23:22.781938
14	FAR 1	2026	\N	PDF	1	FAR 1.pdf	2026-09-06 10:24:02.875088
15	Budget Utilization Report	2026	\N	PDF	1	Budget Utilization Report.pdf	2026-09-06 10:40:52.457165
16	Budget Utilization Report	2026	\N	Excel	1	Budget Utilization Report.xlsx	2026-09-06 10:43:13.712653
17	FAR 1	2026	\N	Excel	1	FAR 1.xlsx	2026-09-06 10:51:17.449429
18	FAR 1	2026	\N	PDF	1	FAR 1.pdf	2026-09-06 10:51:21.44673
19	WFP Balance	2026	\N	PDF	1	WFP Balance.pdf	2026-09-06 10:53:52.280122
20	WFP Balance	2026	\N	Excel	1	WFP Balance.xlsx	2026-09-06 10:57:15.339696
21	WFP Balance	2026	\N	PDF	1	WFP Balance.pdf	2026-09-06 10:57:57.790929
22	Breakdown Report	2026	\N	PDF	1	Breakdown Report.pdf	2026-09-06 11:05:03.924691
23	FAR 1	2026	\N	Excel	1	FAR 1.xlsx	2026-09-06 11:06:17.785028
24	FAR 1	2026	\N	PDF	1	FAR 1.pdf	2026-09-06 11:06:39.095374
25	FAR 2	2026	\N	Excel	1	FAR 2.xlsx	2026-09-06 11:12:01.957812
26	FAR 2	2026	\N	PDF	1	FAR 2.pdf	2026-09-06 11:12:20.173451
27	FAR 2a	2026	\N	Excel	1	FAR 2a.xlsx	2026-09-06 11:14:00.785503
28	FAR 2a	2026	\N	PDF	1	FAR 2a.pdf	2026-09-06 11:14:22.806841
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.settings (id, system_name, system_acronym, institution, default_fiscal_year, default_date_format, default_timezone, currency_code, currency_symbol, created_at, updated_at) FROM stdin;
1	Budget Monitoring and Allocation System	BMAS	Abra State Institute of Sciences and Technology	2026	MM/DD/YYYY	Asia/Manila	PHP	₱	2026-08-24 12:19:40.903736	2026-08-24 12:19:40.903736
\.


--
-- Data for Name: wfp_balances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wfp_balances (id, fiscal_year, fund_cluster_id, fund_source_id, campus_id, responsibility_center_id, wfp_source_id, wfp_source_code, wfp_description, beginning_balance, appropriation, adjustments, adjusted_appropriation, nca_received, allotment_received, obligation, unobligated_appropriation, unobligated_allotment, disbursement, unpaid_obligation, remarks, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: wfp_balance_details; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wfp_balance_details (id, wfp_balance_id, component_name, component_value, year_label, period_label, component_type, source_label, remarks, created_at, updated_at) FROM stdin;
\.


--
-- Name: allocation_activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.allocation_activities_id_seq', 1, false);


--
-- Name: allotment_classes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.allotment_classes_id_seq', 10, true);


--
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_log_id_seq', 1, false);


--
-- Name: budget_adjustments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.budget_adjustments_id_seq', 1, false);


--
-- Name: budget_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.budget_items_id_seq', 1, false);


--
-- Name: budget_proposals_proposal_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.budget_proposals_proposal_id_seq', 1, false);


--
-- Name: campuses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.campuses_id_seq', 10, true);


--
-- Name: fhe_deficiency_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fhe_deficiency_id_seq', 1, false);


--
-- Name: financial_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.financial_reports_id_seq', 23, true);


--
-- Name: fiscal_years_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fiscal_years_id_seq', 8, true);


--
-- Name: fund_allocations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fund_allocations_id_seq', 2, true);


--
-- Name: fund_clusters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fund_clusters_id_seq', 14, true);


--
-- Name: fund_sources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fund_sources_id_seq', 15, true);


--
-- Name: mfo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.mfo_id_seq', 15, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 17, true);


--
-- Name: object_expenditures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.object_expenditures_id_seq', 26, true);


--
-- Name: pap_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pap_id_seq', 30, true);


--
-- Name: preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.preferences_id_seq', 1, true);


--
-- Name: raod_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.raod_entries_id_seq', 5, true);


--
-- Name: rbud_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rbud_entries_id_seq', 6, true);


--
-- Name: report_exports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.report_exports_id_seq', 28, true);


--
-- Name: responsibility_centers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.responsibility_centers_id_seq', 38, true);


--
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.settings_id_seq', 1, true);


--
-- Name: uacs_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.uacs_codes_id_seq', 40, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 12, true);


--
-- Name: wfp_balance_details_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.wfp_balance_details_id_seq', 1, false);


--
-- Name: wfp_balances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.wfp_balances_id_seq', 1, false);


--
-- Name: wfp_sources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.wfp_sources_id_seq', 19, true);


--
-- PostgreSQL database dump complete
--

\unrestrict ToTMlVHwfxvdSBvPPbsCT45oOZlUpRwL5stJfeQBhcRrwpHJgu8PZg8pmqIAUm1

