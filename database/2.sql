--
-- PostgreSQL database dump
--

\restrict ridO0Qd48LozlVdkCw1NSml0NexoCEZovUdhB9FXDJ8g0w5Dz5snnxYVfsbOv1v

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-10-26 13:33:19

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
-- TOC entry 3 (class 3079 OID 38446)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5967 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 2 (class 3079 OID 37495)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5968 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 360 (class 1255 OID 48636)
-- Name: generate_budget_proposal_no(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_budget_proposal_no() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    next_number INTEGER;
BEGIN

    IF NEW.proposal_no IS NULL OR TRIM(NEW.proposal_no) = '' THEN

        SELECT COUNT(*) + 1
        INTO next_number
        FROM budget_proposals
        WHERE fiscal_year = NEW.fiscal_year;

        NEW.proposal_no :=
            'BP-' ||
            NEW.fiscal_year ||
            '-' ||
            LPAD(next_number::TEXT, 5, '0');

    END IF;

    RETURN NEW;

END;
$$;


ALTER FUNCTION public.generate_budget_proposal_no() OWNER TO postgres;

--
-- TOC entry 361 (class 1255 OID 48638)
-- Name: update_budget_proposal_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_budget_proposal_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN

    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;

END;
$$;


ALTER FUNCTION public.update_budget_proposal_timestamp() OWNER TO postgres;

--
-- TOC entry 322 (class 1255 OID 38407)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

--
-- TOC entry 362 (class 1255 OID 48688)
-- Name: update_wfp_balance_details_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_wfp_balance_details_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_wfp_balance_details_timestamp() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 272 (class 1259 OID 38356)
-- Name: allocation_activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.allocation_activities (
    id integer NOT NULL,
    action_type character varying(50) NOT NULL,
    description text NOT NULL,
    details jsonb,
    user_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.allocation_activities OWNER TO postgres;

--
-- TOC entry 271 (class 1259 OID 38355)
-- Name: allocation_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.allocation_activities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.allocation_activities_id_seq OWNER TO postgres;

--
-- TOC entry 5969 (class 0 OID 0)
-- Dependencies: 271
-- Name: allocation_activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.allocation_activities_id_seq OWNED BY public.allocation_activities.id;


--
-- TOC entry 240 (class 1259 OID 37696)
-- Name: allotment_classes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.allotment_classes (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.allotment_classes OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 37695)
-- Name: allotment_classes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.allotment_classes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.allotment_classes_id_seq OWNER TO postgres;

--
-- TOC entry 5970 (class 0 OID 0)
-- Dependencies: 239
-- Name: allotment_classes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.allotment_classes_id_seq OWNED BY public.allotment_classes.id;


--
-- TOC entry 262 (class 1259 OID 38234)
-- Name: audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_log (
    id integer NOT NULL,
    user_id integer,
    action character varying(100) NOT NULL,
    table_name character varying(100),
    record_id integer,
    old_data jsonb,
    new_data jsonb,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role character varying(50),
    module character varying(100),
    old_values jsonb,
    new_values jsonb
);


ALTER TABLE public.audit_log OWNER TO postgres;

--
-- TOC entry 261 (class 1259 OID 38233)
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_log_id_seq OWNER TO postgres;

--
-- TOC entry 5971 (class 0 OID 0)
-- Dependencies: 261
-- Name: audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_log_id_seq OWNED BY public.audit_log.id;


--
-- TOC entry 293 (class 1259 OID 49544)
-- Name: bmas_burs_serial_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bmas_burs_serial_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bmas_burs_serial_seq OWNER TO postgres;

--
-- TOC entry 292 (class 1259 OID 49543)
-- Name: bmas_rbud_registry_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bmas_rbud_registry_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bmas_rbud_registry_seq OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 38140)
-- Name: budget_adjustments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budget_adjustments (
    id integer NOT NULL,
    maf_no character varying(100) NOT NULL,
    fiscal_year integer NOT NULL,
    fund_cluster_id integer,
    fund_source_id integer,
    department character varying(200),
    prepared_by integer,
    adjustment_date date,
    source_program character varying(250),
    source_rc character varying(100),
    source_allotment_class character varying(50),
    source_object_expenditure character varying(150),
    source_amount numeric(18,2) DEFAULT 0 NOT NULL,
    deficient_program character varying(250),
    deficient_rc character varying(100),
    deficient_allotment_class character varying(50),
    deficient_object_expenditure character varying(150),
    deficient_amount numeric(18,2) DEFAULT 0 NOT NULL,
    status character varying(30) DEFAULT 'Pending'::character varying NOT NULL,
    remarks text,
    approved_by integer,
    approved_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.budget_adjustments OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 38139)
-- Name: budget_adjustments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.budget_adjustments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.budget_adjustments_id_seq OWNER TO postgres;

--
-- TOC entry 5972 (class 0 OID 0)
-- Dependencies: 255
-- Name: budget_adjustments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.budget_adjustments_id_seq OWNED BY public.budget_adjustments.id;


--
-- TOC entry 246 (class 1259 OID 37753)
-- Name: budget_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budget_items (
    id integer NOT NULL,
    fiscal_year integer NOT NULL,
    fund_cluster_id integer,
    fund_source_id integer,
    campus_id integer,
    responsibility_center_id integer,
    mfo_id integer,
    pap_id integer,
    uacs_code_id integer,
    object_expenditure_id integer,
    allotment_class_id integer,
    wfp_source_id integer,
    approved_budget numeric(18,2) DEFAULT 0 NOT NULL,
    ps_amount numeric(18,2) DEFAULT 0 NOT NULL,
    mooe_amount numeric(18,2) DEFAULT 0 NOT NULL,
    co_amount numeric(18,2) DEFAULT 0 NOT NULL,
    quarter integer,
    month integer,
    status character varying(30) DEFAULT 'Active'::character varying NOT NULL,
    notes text,
    created_by integer,
    updated_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    budget_proposal_id integer,
    CONSTRAINT budget_items_month_check CHECK (((month >= 1) AND (month <= 12))),
    CONSTRAINT budget_items_quarter_check CHECK (((quarter >= 1) AND (quarter <= 4)))
);


ALTER TABLE public.budget_items OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 37752)
-- Name: budget_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.budget_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.budget_items_id_seq OWNER TO postgres;

--
-- TOC entry 5973 (class 0 OID 0)
-- Dependencies: 245
-- Name: budget_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.budget_items_id_seq OWNED BY public.budget_items.id;


--
-- TOC entry 282 (class 1259 OID 48739)
-- Name: budget_proposal_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budget_proposal_history (
    id bigint NOT NULL,
    proposal_id bigint NOT NULL,
    action character varying(60) NOT NULL,
    status character varying(60),
    remarks text,
    actor_id bigint,
    actor_name character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    details jsonb
);


ALTER TABLE public.budget_proposal_history OWNER TO postgres;

--
-- TOC entry 281 (class 1259 OID 48738)
-- Name: budget_proposal_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.budget_proposal_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.budget_proposal_history_id_seq OWNER TO postgres;

--
-- TOC entry 5974 (class 0 OID 0)
-- Dependencies: 281
-- Name: budget_proposal_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.budget_proposal_history_id_seq OWNED BY public.budget_proposal_history.id;


--
-- TOC entry 278 (class 1259 OID 48610)
-- Name: budget_proposals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budget_proposals (
    proposal_id integer NOT NULL,
    proposal_no character varying(50),
    fiscal_year integer NOT NULL,
    proposal_title character varying(255) NOT NULL,
    department_unit character varying(255) NOT NULL,
    fund_source character varying(255),
    category character varying(100),
    program_project_activity text,
    requested_amount numeric(18,2) DEFAULT 0 NOT NULL,
    justification text,
    expected_outputs text,
    supporting_documents text,
    status character varying(30) DEFAULT 'Draft'::character varying NOT NULL,
    submitted_at timestamp without time zone,
    reviewed_at timestamp without time zone,
    endorsed_at timestamp without time zone,
    approved_at timestamp without time zone,
    returned_at timestamp without time zone,
    rejection_reason text,
    remarks text,
    created_by integer,
    reviewed_by integer,
    endorsed_by integer,
    approved_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fund_cluster_id integer,
    fund_source_id integer,
    campus_id integer,
    responsibility_center_id integer,
    wfp_source_id integer,
    pap_id integer,
    uacs_code_id integer,
    allotment_class_id integer,
    source_code character varying(100),
    mfo_id integer,
    object_expenditure_id integer,
    proposed_ps numeric(18,2) DEFAULT 0 NOT NULL,
    proposed_mooe numeric(18,2) DEFAULT 0 NOT NULL,
    proposed_co numeric(18,2) DEFAULT 0 NOT NULL,
    CONSTRAINT budget_proposals_amount_check CHECK ((requested_amount >= (0)::numeric)),
    CONSTRAINT budget_proposals_status_check CHECK (((status)::text = ANY ((ARRAY['Draft'::character varying, 'Submitted'::character varying, 'Under Review'::character varying, 'For Revision'::character varying, 'Endorsed'::character varying, 'Approved'::character varying, 'Rejected'::character varying])::text[])))
);


ALTER TABLE public.budget_proposals OWNER TO postgres;

--
-- TOC entry 277 (class 1259 OID 48609)
-- Name: budget_proposals_proposal_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.budget_proposals_proposal_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.budget_proposals_proposal_id_seq OWNER TO postgres;

--
-- TOC entry 5975 (class 0 OID 0)
-- Dependencies: 277
-- Name: budget_proposals_proposal_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.budget_proposals_proposal_id_seq OWNED BY public.budget_proposals.proposal_id;


--
-- TOC entry 228 (class 1259 OID 37579)
-- Name: campuses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.campuses (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(150) NOT NULL,
    abbreviation character varying(30),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.campuses OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 37578)
-- Name: campuses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.campuses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.campuses_id_seq OWNER TO postgres;

--
-- TOC entry 5976 (class 0 OID 0)
-- Dependencies: 227
-- Name: campuses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.campuses_id_seq OWNED BY public.campuses.id;


--
-- TOC entry 285 (class 1259 OID 49166)
-- Name: department_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.department_master (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    campus_id integer NOT NULL
);


ALTER TABLE public.department_master OWNER TO postgres;

--
-- TOC entry 284 (class 1259 OID 49165)
-- Name: department_master_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.department_master_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.department_master_id_seq OWNER TO postgres;

--
-- TOC entry 5977 (class 0 OID 0)
-- Dependencies: 284
-- Name: department_master_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.department_master_id_seq OWNED BY public.department_master.id;


--
-- TOC entry 230 (class 1259 OID 37597)
-- Name: responsibility_centers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.responsibility_centers (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    category character varying(100),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.responsibility_centers OWNER TO postgres;

--
-- TOC entry 276 (class 1259 OID 38440)
-- Name: departments; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.departments AS
 SELECT id,
    code,
    name,
    category,
    is_active
   FROM public.responsibility_centers
  WHERE (is_active = true);


ALTER VIEW public.departments OWNER TO postgres;

--
-- TOC entry 305 (class 1259 OID 49835)
-- Name: fee_master_particulars; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fee_master_particulars (
    id bigint NOT NULL,
    code character varying(80) NOT NULL,
    name character varying(200) NOT NULL,
    category character varying(40) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status character varying(12) DEFAULT 'Active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT fee_master_particulars_category_check CHECK (((category)::text = ANY ((ARRAY['Fiduciary Fees'::character varying, 'Non-Fiduciary Fees - Tuition Fees'::character varying, 'Fiduciary Fees - College'::character varying, 'Fiduciary Fees - JHS'::character varying, 'Fiduciary Fees - Other School Fees'::character varying])::text[]))),
    CONSTRAINT fee_master_particulars_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[])))
);


ALTER TABLE public.fee_master_particulars OWNER TO postgres;

--
-- TOC entry 304 (class 1259 OID 49834)
-- Name: fee_master_particulars_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fee_master_particulars_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fee_master_particulars_id_seq OWNER TO postgres;

--
-- TOC entry 5978 (class 0 OID 0)
-- Dependencies: 304
-- Name: fee_master_particulars_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fee_master_particulars_id_seq OWNED BY public.fee_master_particulars.id;


--
-- TOC entry 258 (class 1259 OID 38184)
-- Name: fhe_deficiency; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fhe_deficiency (
    id integer NOT NULL,
    fiscal_year integer NOT NULL,
    academic_year character varying(50),
    enrolled_students integer DEFAULT 0 NOT NULL,
    qualified_students integer DEFAULT 0 NOT NULL,
    saro_no character varying(100),
    saro_date date,
    nca_no character varying(100),
    nca_date date,
    saro_amount numeric(18,2) DEFAULT 0 NOT NULL,
    nca_received numeric(18,2) DEFAULT 0 NOT NULL,
    actual_billing numeric(18,2) DEFAULT 0 NOT NULL,
    mdp character varying(100),
    deficiency_amount numeric(18,2) DEFAULT 0 NOT NULL,
    remarks text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.fhe_deficiency OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 38183)
-- Name: fhe_deficiency_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fhe_deficiency_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fhe_deficiency_id_seq OWNER TO postgres;

--
-- TOC entry 5979 (class 0 OID 0)
-- Dependencies: 257
-- Name: fhe_deficiency_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fhe_deficiency_id_seq OWNED BY public.fhe_deficiency.id;


--
-- TOC entry 264 (class 1259 OID 38252)
-- Name: financial_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financial_reports (
    id integer NOT NULL,
    report_type character varying(50) NOT NULL,
    report_name character varying(200) NOT NULL,
    fiscal_year integer NOT NULL,
    period_type character varying(30),
    period_value character varying(50),
    fund_cluster_id integer,
    generated_by integer,
    file_format character varying(20),
    file_path text,
    status character varying(30) DEFAULT 'Generated'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.financial_reports OWNER TO postgres;

--
-- TOC entry 263 (class 1259 OID 38251)
-- Name: financial_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.financial_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.financial_reports_id_seq OWNER TO postgres;

--
-- TOC entry 5980 (class 0 OID 0)
-- Dependencies: 263
-- Name: financial_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.financial_reports_id_seq OWNED BY public.financial_reports.id;


--
-- TOC entry 244 (class 1259 OID 37736)
-- Name: fiscal_years; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fiscal_years (
    id integer NOT NULL,
    year integer NOT NULL,
    is_current boolean DEFAULT false NOT NULL,
    is_closed boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.fiscal_years OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 37735)
-- Name: fiscal_years_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fiscal_years_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fiscal_years_id_seq OWNER TO postgres;

--
-- TOC entry 5981 (class 0 OID 0)
-- Dependencies: 243
-- Name: fiscal_years_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fiscal_years_id_seq OWNED BY public.fiscal_years.id;


--
-- TOC entry 248 (class 1259 OID 37840)
-- Name: fund_allocations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fund_allocations (
    id integer NOT NULL,
    fiscal_year integer NOT NULL,
    fund_source_id integer,
    fund_cluster_id integer,
    campus_id integer,
    responsibility_center_id integer,
    wfp_source_id integer,
    allocation_amount numeric(18,2) DEFAULT 0 NOT NULL,
    utilized_amount numeric(18,2) DEFAULT 0 NOT NULL,
    disbursed_amount numeric(18,2) DEFAULT 0 NOT NULL,
    remaining_balance numeric(18,2) GENERATED ALWAYS AS ((allocation_amount - utilized_amount)) STORED,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.fund_allocations OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 37839)
-- Name: fund_allocations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fund_allocations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fund_allocations_id_seq OWNER TO postgres;

--
-- TOC entry 5982 (class 0 OID 0)
-- Dependencies: 247
-- Name: fund_allocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fund_allocations_id_seq OWNED BY public.fund_allocations.id;


--
-- TOC entry 226 (class 1259 OID 37554)
-- Name: fund_clusters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fund_clusters (
    id integer NOT NULL,
    fund_source_id integer,
    code character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.fund_clusters OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 37553)
-- Name: fund_clusters_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fund_clusters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fund_clusters_id_seq OWNER TO postgres;

--
-- TOC entry 5983 (class 0 OID 0)
-- Dependencies: 225
-- Name: fund_clusters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fund_clusters_id_seq OWNED BY public.fund_clusters.id;


--
-- TOC entry 303 (class 1259 OID 49807)
-- Name: fund_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fund_codes (
    id integer NOT NULL,
    fund_cluster_id integer NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(250) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.fund_codes OWNER TO postgres;

--
-- TOC entry 5984 (class 0 OID 0)
-- Dependencies: 303
-- Name: TABLE fund_codes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.fund_codes IS 'Fund Codes sourced from the verified FY2026 RBUD Excel registry and linked to Fund Clusters.';


--
-- TOC entry 302 (class 1259 OID 49806)
-- Name: fund_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.fund_codes ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fund_codes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 224 (class 1259 OID 37534)
-- Name: fund_sources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fund_sources (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.fund_sources OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 37533)
-- Name: fund_sources_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fund_sources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fund_sources_id_seq OWNER TO postgres;

--
-- TOC entry 5985 (class 0 OID 0)
-- Dependencies: 223
-- Name: fund_sources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fund_sources_id_seq OWNED BY public.fund_sources.id;


--
-- TOC entry 287 (class 1259 OID 49408)
-- Name: igp_programs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.igp_programs (
    id integer NOT NULL,
    fiscal_year integer NOT NULL,
    fund_source_id integer NOT NULL,
    program_code character varying(100),
    program_name character varying(250) NOT NULL,
    description text,
    campus_id integer,
    responsibility_center_id integer,
    allocation_amount numeric(18,2) DEFAULT 0 NOT NULL,
    status character varying(30) DEFAULT 'Active'::character varying NOT NULL,
    created_by integer,
    updated_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    start_date date,
    fund_cluster_id integer,
    wfp_source_id integer,
    wfp_source_code character varying(100),
    beginning_balance numeric(18,2) DEFAULT 0 NOT NULL,
    projected_income numeric(18,2) DEFAULT 0 NOT NULL,
    CONSTRAINT igp_programs_allocation_amount_check CHECK ((allocation_amount >= (0)::numeric)),
    CONSTRAINT igp_programs_beginning_balance_check CHECK ((beginning_balance >= (0)::numeric)),
    CONSTRAINT igp_programs_projected_income_check CHECK ((projected_income >= (0)::numeric)),
    CONSTRAINT igp_programs_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[])))
);


ALTER TABLE public.igp_programs OWNER TO postgres;

--
-- TOC entry 286 (class 1259 OID 49407)
-- Name: igp_programs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.igp_programs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.igp_programs_id_seq OWNER TO postgres;

--
-- TOC entry 5986 (class 0 OID 0)
-- Dependencies: 286
-- Name: igp_programs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.igp_programs_id_seq OWNED BY public.igp_programs.id;


--
-- TOC entry 288 (class 1259 OID 49455)
-- Name: igp_transaction_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.igp_transaction_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.igp_transaction_seq OWNER TO postgres;

--
-- TOC entry 290 (class 1259 OID 49457)
-- Name: igp_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.igp_transactions (
    id integer NOT NULL,
    transaction_no character varying(100) NOT NULL,
    transaction_date date DEFAULT CURRENT_DATE NOT NULL,
    fiscal_year integer NOT NULL,
    fund_source_id integer NOT NULL,
    igp_program_id integer NOT NULL,
    transaction_type character varying(30) NOT NULL,
    reference_no character varying(150),
    description text,
    income_amount numeric(18,2) DEFAULT 0 NOT NULL,
    utilization_amount numeric(18,2) DEFAULT 0 NOT NULL,
    remarks text,
    status character varying(30) DEFAULT 'Posted'::character varying NOT NULL,
    created_by integer,
    updated_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    program_id integer,
    registry_no character varying(100),
    fund_cluster_id integer,
    campus_id integer,
    burs_serial_no character varying(100),
    serial_no_transferred character varying(100),
    payee character varying(250),
    responsibility_center_id integer,
    pap_id integer,
    uacs_code_id integer,
    allotment_class_id integer,
    uacs_funding_source_code character varying(100),
    month integer,
    series character varying(50),
    series2 character varying(50),
    quarter integer,
    object_expenditure_id integer,
    mfo_id integer,
    old_uacs_code_id integer,
    account_title character varying(250),
    ps_utilization numeric(18,2) DEFAULT 0 NOT NULL,
    mooe_utilization numeric(18,2) DEFAULT 0 NOT NULL,
    co_utilization numeric(18,2) DEFAULT 0 NOT NULL,
    wfp_source_id integer,
    wfp_source_code character varying(100),
    dv_payroll_no character varying(100),
    disbursement_amount numeric(18,2) DEFAULT 0 NOT NULL,
    running_balance numeric(18,2) DEFAULT 0 NOT NULL,
    unpaid_utilization numeric(18,2) DEFAULT 0 NOT NULL,
    po_no character varying(255),
    iar_no character varying(100),
    par_no character varying(100),
    ics_no character varying(100),
    ris_no character varying(100),
    status_of_po character varying(100),
    po_status character varying(50),
    CONSTRAINT igp_transaction_amount_check CHECK (((income_amount >= (0)::numeric) AND (utilization_amount >= (0)::numeric))),
    CONSTRAINT igp_transactions_co_utilization_check CHECK ((co_utilization >= (0)::numeric)),
    CONSTRAINT igp_transactions_disbursement_amount_check CHECK ((disbursement_amount >= (0)::numeric)),
    CONSTRAINT igp_transactions_income_amount_check CHECK ((income_amount >= (0)::numeric)),
    CONSTRAINT igp_transactions_month_check CHECK (((month >= 1) AND (month <= 12))),
    CONSTRAINT igp_transactions_mooe_utilization_check CHECK ((mooe_utilization >= (0)::numeric)),
    CONSTRAINT igp_transactions_ps_utilization_check CHECK ((ps_utilization >= (0)::numeric)),
    CONSTRAINT igp_transactions_quarter_check CHECK (((quarter >= 1) AND (quarter <= 4))),
    CONSTRAINT igp_transactions_running_balance_check CHECK ((running_balance >= (0)::numeric)),
    CONSTRAINT igp_transactions_status_check CHECK (((status)::text = ANY ((ARRAY['Draft'::character varying, 'Posted'::character varying, 'Cancelled'::character varying])::text[]))),
    CONSTRAINT igp_transactions_transaction_type_check CHECK (((transaction_type)::text = ANY ((ARRAY['Income'::character varying, 'Utilization'::character varying, 'Adjustment'::character varying])::text[]))),
    CONSTRAINT igp_transactions_unpaid_utilization_check CHECK ((unpaid_utilization >= (0)::numeric)),
    CONSTRAINT igp_transactions_utilization_amount_check CHECK ((utilization_amount >= (0)::numeric))
);


ALTER TABLE public.igp_transactions OWNER TO postgres;

--
-- TOC entry 289 (class 1259 OID 49456)
-- Name: igp_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.igp_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.igp_transactions_id_seq OWNER TO postgres;

--
-- TOC entry 5987 (class 0 OID 0)
-- Dependencies: 289
-- Name: igp_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.igp_transactions_id_seq OWNED BY public.igp_transactions.id;


--
-- TOC entry 232 (class 1259 OID 37617)
-- Name: mfo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mfo (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.mfo OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 37616)
-- Name: mfo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mfo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mfo_id_seq OWNER TO postgres;

--
-- TOC entry 5988 (class 0 OID 0)
-- Dependencies: 231
-- Name: mfo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mfo_id_seq OWNED BY public.mfo.id;


--
-- TOC entry 260 (class 1259 OID 38211)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer,
    recipient_role character varying(50),
    title character varying(250) NOT NULL,
    message text NOT NULL,
    type character varying(30) DEFAULT 'Info'::character varying NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 38210)
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- TOC entry 5989 (class 0 OID 0)
-- Dependencies: 259
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- TOC entry 238 (class 1259 OID 37676)
-- Name: object_expenditures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.object_expenditures (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.object_expenditures OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 37675)
-- Name: object_expenditures_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.object_expenditures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.object_expenditures_id_seq OWNER TO postgres;

--
-- TOC entry 5990 (class 0 OID 0)
-- Dependencies: 237
-- Name: object_expenditures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.object_expenditures_id_seq OWNED BY public.object_expenditures.id;


--
-- TOC entry 234 (class 1259 OID 37637)
-- Name: pap; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pap (
    id integer NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(250) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.pap OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 37636)
-- Name: pap_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pap_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pap_id_seq OWNER TO postgres;

--
-- TOC entry 5991 (class 0 OID 0)
-- Dependencies: 233
-- Name: pap_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pap_id_seq OWNED BY public.pap.id;


--
-- TOC entry 270 (class 1259 OID 38323)
-- Name: preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preferences (
    id integer NOT NULL,
    user_id integer,
    items_per_page integer DEFAULT 10 NOT NULL,
    theme character varying(30) DEFAULT 'Light'::character varying NOT NULL,
    sidebar_position character varying(30) DEFAULT 'Fixed'::character varying NOT NULL,
    dashboard_overview boolean DEFAULT true NOT NULL,
    auto_logout_minutes integer DEFAULT 30 NOT NULL,
    confirm_before_delete boolean DEFAULT true NOT NULL,
    enable_animations boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.preferences OWNER TO postgres;

--
-- TOC entry 269 (class 1259 OID 38322)
-- Name: preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.preferences_id_seq OWNER TO postgres;

--
-- TOC entry 5992 (class 0 OID 0)
-- Dependencies: 269
-- Name: preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.preferences_id_seq OWNED BY public.preferences.id;


--
-- TOC entry 299 (class 1259 OID 49768)
-- Name: raod_adjustments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.raod_adjustments (
    id bigint NOT NULL,
    raod_entry_id integer NOT NULL,
    registry_no character varying(100),
    fiscal_year integer,
    adjustment_no character varying(100) NOT NULL,
    field_name character varying(100) NOT NULL,
    reason text NOT NULL,
    old_value jsonb,
    new_value jsonb,
    adjusted_by_id integer,
    adjusted_by_name character varying(255),
    adjusted_by_role character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.raod_adjustments OWNER TO postgres;

--
-- TOC entry 298 (class 1259 OID 49767)
-- Name: raod_adjustments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.raod_adjustments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.raod_adjustments_id_seq OWNER TO postgres;

--
-- TOC entry 5993 (class 0 OID 0)
-- Dependencies: 298
-- Name: raod_adjustments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.raod_adjustments_id_seq OWNED BY public.raod_adjustments.id;


--
-- TOC entry 297 (class 1259 OID 49683)
-- Name: raod_audit_trail; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.raod_audit_trail (
    id bigint NOT NULL,
    raod_entry_id integer,
    registry_no character varying(100),
    action character varying(30) NOT NULL,
    performed_by_id integer,
    performed_by_name character varying(200),
    performed_by_email character varying(150),
    performed_by_role character varying(50),
    changed_fields jsonb DEFAULT '[]'::jsonb NOT NULL,
    old_values jsonb,
    new_values jsonb,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.raod_audit_trail OWNER TO postgres;

--
-- TOC entry 296 (class 1259 OID 49682)
-- Name: raod_audit_trail_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.raod_audit_trail_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.raod_audit_trail_id_seq OWNER TO postgres;

--
-- TOC entry 5994 (class 0 OID 0)
-- Dependencies: 296
-- Name: raod_audit_trail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.raod_audit_trail_id_seq OWNED BY public.raod_audit_trail.id;


--
-- TOC entry 252 (class 1259 OID 37985)
-- Name: raod_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.raod_entries (
    id integer NOT NULL,
    registry_no character varying(100) NOT NULL,
    entry_date date NOT NULL,
    fund_cluster_id integer,
    fund_source_id integer,
    campus_id integer,
    ors_serial_no character varying(100),
    serial_no_transferred character varying(100),
    payee character varying(250),
    particulars text,
    responsibility_center_id integer,
    pap_id integer,
    uacs_code_id integer,
    ref_no character varying(100),
    allotment_class_id integer,
    uacs_funding_source_code character varying(100),
    fiscal_year integer NOT NULL,
    month integer,
    series character varying(50),
    series2 character varying(50),
    quarter integer,
    object_expenditure_id integer,
    mfo_id integer,
    wfp_source_id integer,
    wfp_source_code character varying(100),
    allotment_amount numeric(18,2) DEFAULT 0 NOT NULL,
    obligation_amount numeric(18,2) DEFAULT 0 NOT NULL,
    disbursement_amount numeric(18,2) DEFAULT 0 NOT NULL,
    ps_amount numeric(18,2) DEFAULT 0 NOT NULL,
    mooe_amount numeric(18,2) DEFAULT 0 NOT NULL,
    co_amount numeric(18,2) DEFAULT 0 NOT NULL,
    dv_no character varying(100),
    po_no character varying(100),
    burs_serial_no character varying(100),
    remarks text,
    created_by integer,
    updated_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status character varying(30) DEFAULT 'Pending'::character varying NOT NULL,
    old_uacs_code_id integer,
    account_title character varying(255),
    unpaid_obligation numeric(18,2) DEFAULT 0,
    status_of_po character varying(100),
    dv_payroll_no character varying(255),
    iar_no character varying(100),
    par_no character varying(100),
    ics_no character varying(100),
    ris_no character varying(100),
    workflow_status character varying(20) DEFAULT 'ACTIVE'::character varying,
    CONSTRAINT ck_raod_entries_workflow_status CHECK (((workflow_status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'CANCELLED'::character varying])::text[]))),
    CONSTRAINT raod_entries_month_check CHECK (((month >= 1) AND (month <= 12))),
    CONSTRAINT raod_entries_quarter_check CHECK (((quarter >= 1) AND (quarter <= 4)))
);


ALTER TABLE public.raod_entries OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 37984)
-- Name: raod_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.raod_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.raod_entries_id_seq OWNER TO postgres;

--
-- TOC entry 5995 (class 0 OID 0)
-- Dependencies: 251
-- Name: raod_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.raod_entries_id_seq OWNED BY public.raod_entries.id;


--
-- TOC entry 301 (class 1259 OID 49787)
-- Name: raod_final_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.raod_final_reviews (
    id bigint NOT NULL,
    raod_entry_id integer NOT NULL,
    registry_no character varying(100),
    final_review_status character varying(20) NOT NULL,
    reviewed_by_id integer,
    reviewed_by_name character varying(255),
    reviewed_by_role character varying(100),
    remarks text,
    reviewed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ck_raod_final_reviews_status CHECK (((final_review_status)::text = ANY ((ARRAY['APPROVED'::character varying, 'RETURNED'::character varying])::text[])))
);


ALTER TABLE public.raod_final_reviews OWNER TO postgres;

--
-- TOC entry 300 (class 1259 OID 49786)
-- Name: raod_final_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.raod_final_reviews_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.raod_final_reviews_id_seq OWNER TO postgres;

--
-- TOC entry 5996 (class 0 OID 0)
-- Dependencies: 300
-- Name: raod_final_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.raod_final_reviews_id_seq OWNED BY public.raod_final_reviews.id;


--
-- TOC entry 295 (class 1259 OID 49659)
-- Name: rbud_audit_trail; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rbud_audit_trail (
    id bigint NOT NULL,
    rbud_entry_id bigint,
    registry_no character varying(100),
    action character varying(20) NOT NULL,
    performed_by_id character varying(100),
    performed_by_name character varying(255) DEFAULT 'Unknown User'::character varying NOT NULL,
    performed_by_email character varying(255),
    performed_by_role character varying(100),
    changed_fields jsonb DEFAULT '[]'::jsonb NOT NULL,
    old_values jsonb,
    new_values jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.rbud_audit_trail OWNER TO postgres;

--
-- TOC entry 294 (class 1259 OID 49658)
-- Name: rbud_audit_trail_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rbud_audit_trail_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rbud_audit_trail_id_seq OWNER TO postgres;

--
-- TOC entry 5997 (class 0 OID 0)
-- Dependencies: 294
-- Name: rbud_audit_trail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rbud_audit_trail_id_seq OWNED BY public.rbud_audit_trail.id;


--
-- TOC entry 250 (class 1259 OID 37885)
-- Name: rbud_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rbud_entries (
    id integer NOT NULL,
    registry_no character varying(100) NOT NULL,
    entry_date date NOT NULL,
    fund_cluster_id integer,
    fund_source_id integer,
    campus_id integer,
    burs_serial_no character varying(100),
    serial_no_transferred character varying(100),
    payee character varying(250),
    particulars text,
    responsibility_center_id integer,
    pap_id integer,
    uacs_code_id integer,
    ref_no character varying(100),
    allotment_class_id integer,
    uacs_funding_source_code character varying(100),
    fiscal_year integer NOT NULL,
    month integer,
    series character varying(50),
    series2 character varying(50),
    quarter integer,
    object_expenditure_id integer,
    mfo_id integer,
    old_uacs_code_id integer,
    account_title character varying(250),
    utilization_amount numeric(18,2) DEFAULT 0 NOT NULL,
    ps_utilization numeric(18,2) DEFAULT 0 NOT NULL,
    mooe_utilization numeric(18,2) DEFAULT 0 NOT NULL,
    co_utilization numeric(18,2) DEFAULT 0 NOT NULL,
    wfp_source_id integer,
    wfp_source_code character varying(100),
    dv_payroll_no character varying(100),
    disbursement_amount numeric(18,2) DEFAULT 0 NOT NULL,
    running_balance numeric(18,2) DEFAULT 0 NOT NULL,
    remarks text,
    unpaid_utilization numeric(18,2) DEFAULT 0 NOT NULL,
    created_by integer,
    updated_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status character varying(30) DEFAULT 'Active'::character varying NOT NULL,
    po_no character varying(255),
    status_of_po character varying(100),
    po_status character varying(50),
    fund_code character varying(100),
    iar_no character varying(100),
    par_no character varying(100),
    ics_no character varying(100),
    ris_no character varying(100),
    created_by_name text,
    created_by_role text,
    updated_by_name text,
    updated_by_role text,
    CONSTRAINT rbud_entries_month_check CHECK (((month >= 1) AND (month <= 12))),
    CONSTRAINT rbud_entries_quarter_check CHECK (((quarter >= 1) AND (quarter <= 4)))
);


ALTER TABLE public.rbud_entries OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 37884)
-- Name: rbud_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rbud_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rbud_entries_id_seq OWNER TO postgres;

--
-- TOC entry 5998 (class 0 OID 0)
-- Dependencies: 249
-- Name: rbud_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rbud_entries_id_seq OWNED BY public.rbud_entries.id;


--
-- TOC entry 311 (class 1259 OID 49922)
-- Name: rbud_fee_budget_reference; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rbud_fee_budget_reference (
    id bigint NOT NULL,
    fiscal_year integer NOT NULL,
    campus text NOT NULL,
    fee_category text NOT NULL,
    particulars text NOT NULL,
    budget_amount numeric(14,2) DEFAULT 0 NOT NULL,
    source_reference text DEFAULT 'WFP PRE sheet'::text NOT NULL,
    created_by bigint,
    updated_by bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT rbud_fee_budget_reference_budget_amount_check CHECK ((budget_amount >= (0)::numeric))
);


ALTER TABLE public.rbud_fee_budget_reference OWNER TO postgres;

--
-- TOC entry 310 (class 1259 OID 49921)
-- Name: rbud_fee_budget_reference_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rbud_fee_budget_reference_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rbud_fee_budget_reference_id_seq OWNER TO postgres;

--
-- TOC entry 5999 (class 0 OID 0)
-- Dependencies: 310
-- Name: rbud_fee_budget_reference_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rbud_fee_budget_reference_id_seq OWNED BY public.rbud_fee_budget_reference.id;


--
-- TOC entry 309 (class 1259 OID 49900)
-- Name: rbud_fee_enrollment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rbud_fee_enrollment (
    id bigint NOT NULL,
    fiscal_year integer NOT NULL,
    campus text NOT NULL,
    billing_period text NOT NULL,
    enrollee_count integer DEFAULT 0 NOT NULL,
    created_by bigint,
    updated_by bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT rbud_fee_enrollment_enrollee_count_check CHECK ((enrollee_count >= 0))
);


ALTER TABLE public.rbud_fee_enrollment OWNER TO postgres;

--
-- TOC entry 308 (class 1259 OID 49899)
-- Name: rbud_fee_enrollment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rbud_fee_enrollment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rbud_fee_enrollment_id_seq OWNER TO postgres;

--
-- TOC entry 6000 (class 0 OID 0)
-- Dependencies: 308
-- Name: rbud_fee_enrollment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rbud_fee_enrollment_id_seq OWNED BY public.rbud_fee_enrollment.id;


--
-- TOC entry 307 (class 1259 OID 49863)
-- Name: rbud_fee_monitoring; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rbud_fee_monitoring (
    id bigint NOT NULL,
    fiscal_year integer NOT NULL,
    fee_category character varying(80) NOT NULL,
    particulars character varying(180) NOT NULL,
    campus character varying(100) NOT NULL,
    billing_period character varying(160),
    reference_no character varying(120),
    billing_amount numeric(14,2) DEFAULT 0 NOT NULL,
    collected_amount numeric(14,2) DEFAULT 0 NOT NULL,
    obligated_amount numeric(14,2) DEFAULT 0 NOT NULL,
    disbursed_amount numeric(14,2) DEFAULT 0 NOT NULL,
    remarks text,
    created_by bigint,
    updated_by bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT rbud_fee_monitoring_billing_amount_check CHECK ((billing_amount >= (0)::numeric)),
    CONSTRAINT rbud_fee_monitoring_campus_check CHECK ((length(TRIM(BOTH FROM campus)) > 0)),
    CONSTRAINT rbud_fee_monitoring_collected_amount_check CHECK ((collected_amount >= (0)::numeric)),
    CONSTRAINT rbud_fee_monitoring_disbursed_amount_check CHECK ((disbursed_amount >= (0)::numeric)),
    CONSTRAINT rbud_fee_monitoring_obligated_amount_check CHECK ((obligated_amount >= (0)::numeric))
);


ALTER TABLE public.rbud_fee_monitoring OWNER TO postgres;

--
-- TOC entry 306 (class 1259 OID 49862)
-- Name: rbud_fee_monitoring_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rbud_fee_monitoring_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rbud_fee_monitoring_id_seq OWNER TO postgres;

--
-- TOC entry 6001 (class 0 OID 0)
-- Dependencies: 306
-- Name: rbud_fee_monitoring_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rbud_fee_monitoring_id_seq OWNED BY public.rbud_fee_monitoring.id;


--
-- TOC entry 283 (class 1259 OID 48953)
-- Name: rbud_registry_no_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rbud_registry_no_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rbud_registry_no_seq OWNER TO postgres;

--
-- TOC entry 266 (class 1259 OID 38279)
-- Name: report_exports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_exports (
    id integer NOT NULL,
    report_type character varying(100) NOT NULL,
    fiscal_year integer,
    fund_cluster_id integer,
    format character varying(20) NOT NULL,
    generated_by integer,
    file_name character varying(250),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.report_exports OWNER TO postgres;

--
-- TOC entry 265 (class 1259 OID 38278)
-- Name: report_exports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_exports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_exports_id_seq OWNER TO postgres;

--
-- TOC entry 6002 (class 0 OID 0)
-- Dependencies: 265
-- Name: report_exports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_exports_id_seq OWNED BY public.report_exports.id;


--
-- TOC entry 229 (class 1259 OID 37596)
-- Name: responsibility_centers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.responsibility_centers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.responsibility_centers_id_seq OWNER TO postgres;

--
-- TOC entry 6003 (class 0 OID 0)
-- Dependencies: 229
-- Name: responsibility_centers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.responsibility_centers_id_seq OWNED BY public.responsibility_centers.id;


--
-- TOC entry 268 (class 1259 OID 38301)
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    id integer NOT NULL,
    system_name character varying(150) DEFAULT 'Budget Monitoring and Allocation System'::character varying,
    system_acronym character varying(30) DEFAULT 'BMAS'::character varying,
    institution character varying(250) DEFAULT 'Abra State Institute of Sciences and Technology'::character varying,
    default_fiscal_year integer DEFAULT (EXTRACT(year FROM CURRENT_DATE))::integer,
    default_date_format character varying(50) DEFAULT 'MM/DD/YYYY'::character varying,
    default_timezone character varying(100) DEFAULT 'Asia/Manila'::character varying,
    currency_code character varying(10) DEFAULT 'PHP'::character varying,
    currency_symbol character varying(10) DEFAULT '₱'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- TOC entry 267 (class 1259 OID 38300)
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settings_id_seq OWNER TO postgres;

--
-- TOC entry 6004 (class 0 OID 0)
-- Dependencies: 267
-- Name: settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;


--
-- TOC entry 236 (class 1259 OID 37657)
-- Name: uacs_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.uacs_codes (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    old_code character varying(50),
    account_title character varying(250),
    revised_description text,
    account_description text,
    category character varying(100),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.uacs_codes OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 37656)
-- Name: uacs_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.uacs_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.uacs_codes_id_seq OWNER TO postgres;

--
-- TOC entry 6005 (class 0 OID 0)
-- Dependencies: 235
-- Name: uacs_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.uacs_codes_id_seq OWNED BY public.uacs_codes.id;


--
-- TOC entry 222 (class 1259 OID 37507)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    email character varying(150),
    full_name character varying(200) NOT NULL,
    role character varying(50) DEFAULT 'User'::character varying NOT NULL,
    department character varying(200),
    "position" character varying(150),
    status character varying(30) DEFAULT 'Pending'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 37506)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 6006 (class 0 OID 0)
-- Dependencies: 221
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 275 (class 1259 OID 38436)
-- Name: v_budget_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_budget_summary AS
 SELECT fiscal_year,
    count(id) AS total_budget_items,
    COALESCE(sum(approved_budget), (0)::numeric) AS total_approved_budget,
    COALESCE(sum(ps_amount), (0)::numeric) AS total_ps,
    COALESCE(sum(mooe_amount), (0)::numeric) AS total_mooe,
    COALESCE(sum(co_amount), (0)::numeric) AS total_co
   FROM public.budget_items
  GROUP BY fiscal_year;


ALTER VIEW public.v_budget_summary OWNER TO postgres;

--
-- TOC entry 291 (class 1259 OID 49520)
-- Name: v_igp_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_igp_summary AS
 SELECT p.fiscal_year,
    COALESCE(sum(p.allocation_amount), (0)::numeric) AS total_igp_fund,
    COALESCE(sum(p.allocation_amount), (0)::numeric) AS total_allocation,
    COALESCE(sum(
        CASE
            WHEN ((t.status)::text <> 'Cancelled'::text) THEN t.income_amount
            ELSE (0)::numeric
        END), (0)::numeric) AS total_income,
    COALESCE(sum(
        CASE
            WHEN ((t.status)::text <> 'Cancelled'::text) THEN t.utilization_amount
            ELSE (0)::numeric
        END), (0)::numeric) AS total_utilization,
    ((COALESCE(sum(p.allocation_amount), (0)::numeric) + COALESCE(sum(
        CASE
            WHEN ((t.status)::text <> 'Cancelled'::text) THEN t.income_amount
            ELSE (0)::numeric
        END), (0)::numeric)) - COALESCE(sum(
        CASE
            WHEN ((t.status)::text <> 'Cancelled'::text) THEN t.utilization_amount
            ELSE (0)::numeric
        END), (0)::numeric)) AS remaining_balance,
    (count(DISTINCT t.id))::integer AS transaction_count,
    (count(DISTINCT p.id))::integer AS program_count
   FROM (public.igp_programs p
     LEFT JOIN public.igp_transactions t ON ((t.igp_program_id = p.id)))
  WHERE (p.fund_source_id = ( SELECT fund_sources.id
           FROM public.fund_sources
          WHERE ((fund_sources.code)::text = '161'::text)
         LIMIT 1))
  GROUP BY p.fiscal_year;


ALTER VIEW public.v_igp_summary OWNER TO postgres;

--
-- TOC entry 274 (class 1259 OID 38431)
-- Name: v_raod_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_raod_summary AS
 SELECT r.fiscal_year,
    r.fund_cluster_id,
    fc.code AS fund_cluster_code,
    fc.name AS fund_cluster_name,
    count(r.id) AS total_records,
    COALESCE(sum(r.allotment_amount), (0)::numeric) AS total_allotment,
    COALESCE(sum(r.obligation_amount), (0)::numeric) AS total_obligation,
    COALESCE(sum(r.disbursement_amount), (0)::numeric) AS total_disbursement,
    COALESCE((sum(r.allotment_amount) - sum(r.obligation_amount)), (0)::numeric) AS unobligated_balance,
    COALESCE((sum(r.obligation_amount) - sum(r.disbursement_amount)), (0)::numeric) AS undisbursed_balance
   FROM (public.raod_entries r
     LEFT JOIN public.fund_clusters fc ON ((r.fund_cluster_id = fc.id)))
  GROUP BY r.fiscal_year, r.fund_cluster_id, fc.code, fc.name;


ALTER VIEW public.v_raod_summary OWNER TO postgres;

--
-- TOC entry 273 (class 1259 OID 38426)
-- Name: v_rbud_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_rbud_summary AS
 SELECT r.fiscal_year,
    r.fund_cluster_id,
    fc.code AS fund_cluster_code,
    fc.name AS fund_cluster_name,
    count(r.id) AS total_records,
    COALESCE(sum(r.utilization_amount), (0)::numeric) AS total_utilization,
    COALESCE(sum(r.disbursement_amount), (0)::numeric) AS total_disbursement,
    COALESCE(sum(r.unpaid_utilization), (0)::numeric) AS total_unpaid_utilization,
    COALESCE(sum(r.running_balance), (0)::numeric) AS total_balance
   FROM (public.rbud_entries r
     LEFT JOIN public.fund_clusters fc ON ((r.fund_cluster_id = fc.id)))
  GROUP BY r.fiscal_year, r.fund_cluster_id, fc.code, fc.name;


ALTER VIEW public.v_rbud_summary OWNER TO postgres;

--
-- TOC entry 280 (class 1259 OID 48648)
-- Name: wfp_balance_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wfp_balance_details (
    id integer NOT NULL,
    wfp_balance_id integer NOT NULL,
    component_name character varying(255) NOT NULL,
    component_value numeric(18,2) DEFAULT 0,
    year_label character varying(100),
    period_label character varying(100),
    component_type character varying(100),
    source_label character varying(255),
    remarks text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.wfp_balance_details OWNER TO postgres;

--
-- TOC entry 279 (class 1259 OID 48647)
-- Name: wfp_balance_details_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wfp_balance_details_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wfp_balance_details_id_seq OWNER TO postgres;

--
-- TOC entry 6007 (class 0 OID 0)
-- Dependencies: 279
-- Name: wfp_balance_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wfp_balance_details_id_seq OWNED BY public.wfp_balance_details.id;


--
-- TOC entry 254 (class 1259 OID 38078)
-- Name: wfp_balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wfp_balances (
    id integer NOT NULL,
    fiscal_year integer NOT NULL,
    fund_cluster_id integer,
    fund_source_id integer,
    campus_id integer,
    responsibility_center_id integer,
    wfp_source_id integer,
    wfp_source_code character varying(100),
    wfp_description text,
    beginning_balance numeric(18,2) DEFAULT 0 NOT NULL,
    appropriation numeric(18,2) DEFAULT 0 NOT NULL,
    adjustments numeric(18,2) DEFAULT 0 NOT NULL,
    adjusted_appropriation numeric(18,2) DEFAULT 0 NOT NULL,
    nca_received numeric(18,2) DEFAULT 0 NOT NULL,
    allotment_received numeric(18,2) DEFAULT 0 NOT NULL,
    obligation numeric(18,2) DEFAULT 0 NOT NULL,
    unobligated_appropriation numeric(18,2) DEFAULT 0 NOT NULL,
    unobligated_allotment numeric(18,2) DEFAULT 0 NOT NULL,
    disbursement numeric(18,2) DEFAULT 0 NOT NULL,
    unpaid_obligation numeric(18,2) DEFAULT 0 NOT NULL,
    remarks text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.wfp_balances OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 38077)
-- Name: wfp_balances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wfp_balances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wfp_balances_id_seq OWNER TO postgres;

--
-- TOC entry 6008 (class 0 OID 0)
-- Dependencies: 253
-- Name: wfp_balances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wfp_balances_id_seq OWNED BY public.wfp_balances.id;


--
-- TOC entry 242 (class 1259 OID 37716)
-- Name: wfp_sources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wfp_sources (
    id integer NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(250) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.wfp_sources OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 37715)
-- Name: wfp_sources_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wfp_sources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wfp_sources_id_seq OWNER TO postgres;

--
-- TOC entry 6009 (class 0 OID 0)
-- Dependencies: 241
-- Name: wfp_sources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wfp_sources_id_seq OWNED BY public.wfp_sources.id;


--
-- TOC entry 5235 (class 2604 OID 38359)
-- Name: allocation_activities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.allocation_activities ALTER COLUMN id SET DEFAULT nextval('public.allocation_activities_id_seq'::regclass);


--
-- TOC entry 5124 (class 2604 OID 37699)
-- Name: allotment_classes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.allotment_classes ALTER COLUMN id SET DEFAULT nextval('public.allotment_classes_id_seq'::regclass);


--
-- TOC entry 5207 (class 2604 OID 38237)
-- Name: audit_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN id SET DEFAULT nextval('public.audit_log_id_seq'::regclass);


--
-- TOC entry 5188 (class 2604 OID 38143)
-- Name: budget_adjustments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_adjustments ALTER COLUMN id SET DEFAULT nextval('public.budget_adjustments_id_seq'::regclass);


--
-- TOC entry 5136 (class 2604 OID 37756)
-- Name: budget_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_items ALTER COLUMN id SET DEFAULT nextval('public.budget_items_id_seq'::regclass);


--
-- TOC entry 5249 (class 2604 OID 48742)
-- Name: budget_proposal_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_proposal_history ALTER COLUMN id SET DEFAULT nextval('public.budget_proposal_history_id_seq'::regclass);


--
-- TOC entry 5237 (class 2604 OID 48613)
-- Name: budget_proposals proposal_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_proposals ALTER COLUMN proposal_id SET DEFAULT nextval('public.budget_proposals_proposal_id_seq'::regclass);


--
-- TOC entry 5100 (class 2604 OID 37582)
-- Name: campuses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campuses ALTER COLUMN id SET DEFAULT nextval('public.campuses_id_seq'::regclass);


--
-- TOC entry 5251 (class 2604 OID 49169)
-- Name: department_master id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_master ALTER COLUMN id SET DEFAULT nextval('public.department_master_id_seq'::regclass);


--
-- TOC entry 5289 (class 2604 OID 49838)
-- Name: fee_master_particulars id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_master_particulars ALTER COLUMN id SET DEFAULT nextval('public.fee_master_particulars_id_seq'::regclass);


--
-- TOC entry 5194 (class 2604 OID 38187)
-- Name: fhe_deficiency id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fhe_deficiency ALTER COLUMN id SET DEFAULT nextval('public.fhe_deficiency_id_seq'::regclass);


--
-- TOC entry 5209 (class 2604 OID 38255)
-- Name: financial_reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_reports ALTER COLUMN id SET DEFAULT nextval('public.financial_reports_id_seq'::regclass);


--
-- TOC entry 5132 (class 2604 OID 37739)
-- Name: fiscal_years id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiscal_years ALTER COLUMN id SET DEFAULT nextval('public.fiscal_years_id_seq'::regclass);


--
-- TOC entry 5144 (class 2604 OID 37843)
-- Name: fund_allocations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fund_allocations ALTER COLUMN id SET DEFAULT nextval('public.fund_allocations_id_seq'::regclass);


--
-- TOC entry 5096 (class 2604 OID 37557)
-- Name: fund_clusters id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fund_clusters ALTER COLUMN id SET DEFAULT nextval('public.fund_clusters_id_seq'::regclass);


--
-- TOC entry 5092 (class 2604 OID 37537)
-- Name: fund_sources id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fund_sources ALTER COLUMN id SET DEFAULT nextval('public.fund_sources_id_seq'::regclass);


--
-- TOC entry 5255 (class 2604 OID 49411)
-- Name: igp_programs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_programs ALTER COLUMN id SET DEFAULT nextval('public.igp_programs_id_seq'::regclass);


--
-- TOC entry 5262 (class 2604 OID 49460)
-- Name: igp_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_transactions ALTER COLUMN id SET DEFAULT nextval('public.igp_transactions_id_seq'::regclass);


--
-- TOC entry 5108 (class 2604 OID 37620)
-- Name: mfo id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mfo ALTER COLUMN id SET DEFAULT nextval('public.mfo_id_seq'::regclass);


--
-- TOC entry 5203 (class 2604 OID 38214)
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- TOC entry 5120 (class 2604 OID 37679)
-- Name: object_expenditures id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.object_expenditures ALTER COLUMN id SET DEFAULT nextval('public.object_expenditures_id_seq'::regclass);


--
-- TOC entry 5112 (class 2604 OID 37640)
-- Name: pap id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pap ALTER COLUMN id SET DEFAULT nextval('public.pap_id_seq'::regclass);


--
-- TOC entry 5225 (class 2604 OID 38326)
-- Name: preferences id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preferences ALTER COLUMN id SET DEFAULT nextval('public.preferences_id_seq'::regclass);


--
-- TOC entry 5282 (class 2604 OID 49771)
-- Name: raod_adjustments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raod_adjustments ALTER COLUMN id SET DEFAULT nextval('public.raod_adjustments_id_seq'::regclass);


--
-- TOC entry 5279 (class 2604 OID 49686)
-- Name: raod_audit_trail id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raod_audit_trail ALTER COLUMN id SET DEFAULT nextval('public.raod_audit_trail_id_seq'::regclass);


--
-- TOC entry 5162 (class 2604 OID 37988)
-- Name: raod_entries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raod_entries ALTER COLUMN id SET DEFAULT nextval('public.raod_entries_id_seq'::regclass);


--
-- TOC entry 5284 (class 2604 OID 49790)
-- Name: raod_final_reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raod_final_reviews ALTER COLUMN id SET DEFAULT nextval('public.raod_final_reviews_id_seq'::regclass);


--
-- TOC entry 5275 (class 2604 OID 49662)
-- Name: rbud_audit_trail id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_audit_trail ALTER COLUMN id SET DEFAULT nextval('public.rbud_audit_trail_id_seq'::regclass);


--
-- TOC entry 5151 (class 2604 OID 37888)
-- Name: rbud_entries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_entries ALTER COLUMN id SET DEFAULT nextval('public.rbud_entries_id_seq'::regclass);


--
-- TOC entry 5305 (class 2604 OID 49925)
-- Name: rbud_fee_budget_reference id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_fee_budget_reference ALTER COLUMN id SET DEFAULT nextval('public.rbud_fee_budget_reference_id_seq'::regclass);


--
-- TOC entry 5301 (class 2604 OID 49903)
-- Name: rbud_fee_enrollment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_fee_enrollment ALTER COLUMN id SET DEFAULT nextval('public.rbud_fee_enrollment_id_seq'::regclass);


--
-- TOC entry 5294 (class 2604 OID 49866)
-- Name: rbud_fee_monitoring id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_fee_monitoring ALTER COLUMN id SET DEFAULT nextval('public.rbud_fee_monitoring_id_seq'::regclass);


--
-- TOC entry 5212 (class 2604 OID 38282)
-- Name: report_exports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_exports ALTER COLUMN id SET DEFAULT nextval('public.report_exports_id_seq'::regclass);


--
-- TOC entry 5104 (class 2604 OID 37600)
-- Name: responsibility_centers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.responsibility_centers ALTER COLUMN id SET DEFAULT nextval('public.responsibility_centers_id_seq'::regclass);


--
-- TOC entry 5214 (class 2604 OID 38304)
-- Name: settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


--
-- TOC entry 5116 (class 2604 OID 37660)
-- Name: uacs_codes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uacs_codes ALTER COLUMN id SET DEFAULT nextval('public.uacs_codes_id_seq'::regclass);


--
-- TOC entry 5086 (class 2604 OID 37510)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5245 (class 2604 OID 48651)
-- Name: wfp_balance_details id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wfp_balance_details ALTER COLUMN id SET DEFAULT nextval('public.wfp_balance_details_id_seq'::regclass);


--
-- TOC entry 5174 (class 2604 OID 38081)
-- Name: wfp_balances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wfp_balances ALTER COLUMN id SET DEFAULT nextval('public.wfp_balances_id_seq'::regclass);


--
-- TOC entry 5128 (class 2604 OID 37719)
-- Name: wfp_sources id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wfp_sources ALTER COLUMN id SET DEFAULT nextval('public.wfp_sources_id_seq'::regclass);


--
-- TOC entry 5927 (class 0 OID 38356)
-- Dependencies: 272
-- Data for Name: allocation_activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.allocation_activities (id, action_type, description, details, user_id, created_at) FROM stdin;
\.


--
-- TOC entry 5895 (class 0 OID 37696)
-- Dependencies: 240
-- Data for Name: allotment_classes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.allotment_classes (id, code, name, description, is_active, created_at, updated_at) FROM stdin;
1	01	Personnel Services	Personnel Services allotment	t	2026-10-03 13:34:25.864594	2026-10-08 21:37:57.058316
2	02	Maintenance and Other Operating Expenses	MOOE allotment	t	2026-10-03 13:34:25.864594	2026-10-08 21:37:57.058316
3	03	Capital Outlay	Capital Outlay allotment	t	2026-10-03 13:34:25.864594	2026-10-08 21:37:57.058316
\.


--
-- TOC entry 5917 (class 0 OID 38234)
-- Dependencies: 262
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_log (id, user_id, action, table_name, record_id, old_data, new_data, ip_address, user_agent, created_at, role, module, old_values, new_values) FROM stdin;
1	1	UPDATE	igp_programs	1	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36	2026-10-05 09:26:34.033787	Administration	IGP Registry	\N	{"id": 1, "status": "Active", "campus_id": 1, "created_at": "2026-10-04T11:19:47.090Z", "created_by": null, "start_date": null, "updated_at": "2026-10-05T01:26:34.015Z", "updated_by": 1, "description": "BID DOCS", "fiscal_year": 2026, "program_code": "BGD-BID-DOCS", "program_name": "BID DOCS", "wfp_source_id": 7, "fund_source_id": 7, "fund_cluster_id": 12, "wfp_source_code": "CI", "projected_income": "0.00", "allocation_amount": "96426.44", "beginning_balance": "96426.44", "responsibility_center_id": 3}
2	1	UPDATE	igp_programs	4	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36	2026-10-05 09:27:10.222508	Administration	IGP Registry	\N	{"id": 4, "status": "Active", "campus_id": 1, "created_at": "2026-10-04T11:19:47.090Z", "created_by": null, "start_date": null, "updated_at": "2026-10-05T01:27:10.204Z", "updated_by": 1, "description": "RENTALS - CHAIRS", "fiscal_year": 2026, "program_code": "BGD-IGP-RENT-CHAIRS", "program_name": "RENTALS - CHAIRS", "wfp_source_id": 18, "fund_source_id": 7, "fund_cluster_id": 12, "wfp_source_code": "CH", "projected_income": "0.00", "allocation_amount": "37100.00", "beginning_balance": "37100.00", "responsibility_center_id": 3}
3	3	UPDATE	igp_transactions	2	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36	2026-10-05 11:35:41.875149	Procurement	IGP Registry	{"id": 2, "month": 10, "payee": "Test Supplier", "po_no": null, "iar_no": null, "ics_no": null, "mfo_id": 2, "pap_id": 2, "par_no": null, "ris_no": null, "series": null, "status": "Posted", "quarter": 4, "remarks": null, "series2": null, "campus_id": 2, "po_status": null, "created_at": "2026-10-04T23:29:17.743Z", "created_by": 1, "program_id": 8, "updated_at": "2026-10-04T23:29:17.743Z", "updated_by": 1, "description": "Test Utilization", "fiscal_year": 2026, "registry_no": "IGP-161-2026-000003", "reference_no": "IGP-UTIL-TEST-002", "status_of_po": null, "uacs_code_id": 16, "account_title": "Agricultural and Marine Supplies Expenses", "dv_payroll_no": null, "income_amount": "0.00", "wfp_source_id": 8, "burs_serial_no": "BURS-161-2026-000003", "co_utilization": "0.00", "fund_source_id": 7, "igp_program_id": 8, "ps_utilization": "0.00", "transaction_no": "IGP-161-2026-000003", "fund_cluster_id": 11, "running_balance": "0.00", "wfp_source_code": "CS", "mooe_utilization": "3000.00", "old_uacs_code_id": 13, "transaction_date": "2026-10-03T16:00:00.000Z", "transaction_type": "Utilization", "allotment_class_id": 2, "unpaid_utilization": "3000.00", "utilization_amount": "3000.00", "disbursement_amount": "0.00", "object_expenditure_id": 2, "serial_no_transferred": null, "responsibility_center_id": 2, "uacs_funding_source_code": null}	{"id": 2, "month": 10, "payee": "ABC Office Supplies", "po_no": "PO-IGP-2026-001", "iar_no": "IAR-IGP-2026-001", "ics_no": "ICS-IGP-2026-001", "mfo_id": 2, "pap_id": 2, "par_no": "PAR-IGP-2026-001", "ris_no": "RIS-IGP-2026-001", "series": null, "status": "Posted", "quarter": 4, "remarks": null, "series2": null, "campus_id": 2, "po_status": "Completed", "created_at": "2026-10-04T23:29:17.743Z", "created_by": 1, "program_id": 8, "updated_at": "2026-10-05T03:35:41.738Z", "updated_by": 3, "description": "Procurement of Office Supplies for IGP Operations", "fiscal_year": 2026, "registry_no": "IGP-161-2026-000003", "reference_no": "IGP-UTIL-TEST-002", "status_of_po": "Completed", "uacs_code_id": 16, "account_title": "Agricultural and Marine Supplies Expenses", "dv_payroll_no": null, "income_amount": "0.00", "wfp_source_id": 8, "burs_serial_no": "BURS-161-2026-000003", "co_utilization": "0.00", "fund_source_id": 7, "igp_program_id": 8, "ps_utilization": "0.00", "transaction_no": "IGP-161-2026-000003", "fund_cluster_id": 11, "running_balance": "0.00", "wfp_source_code": "CS", "mooe_utilization": "3000.00", "old_uacs_code_id": 13, "transaction_date": "2026-10-04T16:00:00.000Z", "transaction_type": "Utilization", "allotment_class_id": 2, "unpaid_utilization": "3000.00", "utilization_amount": "3000.00", "disbursement_amount": "0.00", "object_expenditure_id": 2, "serial_no_transferred": null, "responsibility_center_id": 2, "uacs_funding_source_code": null}
4	4	UPDATE	igp_transactions	2	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36	2026-10-05 12:50:27.25661	Accountant	IGP Registry	{"id": 2, "month": 10, "payee": "ABC Office Supplies", "po_no": "PO-IGP-2026-001", "iar_no": "IAR-IGP-2026-001", "ics_no": "ICS-IGP-2026-001", "mfo_id": 2, "pap_id": 2, "par_no": "PAR-IGP-2026-001", "ris_no": "RIS-IGP-2026-001", "series": null, "status": "Posted", "quarter": 4, "remarks": null, "series2": null, "campus_id": 2, "po_status": "Completed", "created_at": "2026-10-04T23:29:17.743Z", "created_by": 1, "program_id": 8, "updated_at": "2026-10-05T03:35:41.738Z", "updated_by": 3, "description": "Procurement of Office Supplies for IGP Operations", "fiscal_year": 2026, "registry_no": "IGP-161-2026-000003", "reference_no": "IGP-UTIL-TEST-002", "status_of_po": "Completed", "uacs_code_id": 16, "account_title": "Agricultural and Marine Supplies Expenses", "dv_payroll_no": null, "income_amount": "0.00", "wfp_source_id": 8, "burs_serial_no": "BURS-161-2026-000003", "co_utilization": "0.00", "fund_source_id": 7, "igp_program_id": 8, "ps_utilization": "0.00", "transaction_no": "IGP-161-2026-000003", "fund_cluster_id": 11, "running_balance": "0.00", "wfp_source_code": "CS", "mooe_utilization": "3000.00", "old_uacs_code_id": 13, "transaction_date": "2026-10-04T16:00:00.000Z", "transaction_type": "Utilization", "allotment_class_id": 2, "unpaid_utilization": "3000.00", "utilization_amount": "3000.00", "disbursement_amount": "0.00", "object_expenditure_id": 2, "serial_no_transferred": null, "responsibility_center_id": 2, "uacs_funding_source_code": null}	{"id": 2, "month": 10, "payee": "ABC Office Supplies", "po_no": "PO-IGP-2026-001", "iar_no": "IAR-IGP-2026-001", "ics_no": "ICS-IGP-2026-001", "mfo_id": 2, "pap_id": 2, "par_no": "PAR-IGP-2026-001", "ris_no": "RIS-IGP-2026-001", "series": null, "status": "Posted", "quarter": 4, "remarks": null, "series2": null, "campus_id": 2, "po_status": "Completed", "created_at": "2026-10-04T23:29:17.743Z", "created_by": 1, "program_id": 8, "updated_at": "2026-10-05T04:50:27.242Z", "updated_by": 4, "description": "Procurement of Office Supplies for IGP Operations", "fiscal_year": 2026, "registry_no": "IGP-161-2026-000003", "reference_no": "IGP-UTIL-TEST-002", "status_of_po": "Completed", "uacs_code_id": 16, "account_title": "Agricultural and Marine Supplies Expenses", "dv_payroll_no": "DV-IGP-2026-001", "income_amount": "0.00", "wfp_source_id": 8, "burs_serial_no": "BURS-161-2026-000003", "co_utilization": "0.00", "fund_source_id": 7, "igp_program_id": 8, "ps_utilization": "0.00", "transaction_no": "IGP-161-2026-000003", "fund_cluster_id": 11, "running_balance": "0.00", "wfp_source_code": "CS", "mooe_utilization": "3000.00", "old_uacs_code_id": 13, "transaction_date": "2026-10-03T16:00:00.000Z", "transaction_type": "Utilization", "allotment_class_id": 2, "unpaid_utilization": "3000.00", "utilization_amount": "3000.00", "disbursement_amount": "0.00", "object_expenditure_id": 2, "serial_no_transferred": null, "responsibility_center_id": 2, "uacs_funding_source_code": null}
5	4	UPDATE	igp_transactions	2	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36	2026-10-05 12:50:48.850267	Accountant	IGP Registry	{"id": 2, "month": 10, "payee": "ABC Office Supplies", "po_no": "PO-IGP-2026-001", "iar_no": "IAR-IGP-2026-001", "ics_no": "ICS-IGP-2026-001", "mfo_id": 2, "pap_id": 2, "par_no": "PAR-IGP-2026-001", "ris_no": "RIS-IGP-2026-001", "series": null, "status": "Posted", "quarter": 4, "remarks": null, "series2": null, "campus_id": 2, "po_status": "Completed", "created_at": "2026-10-04T23:29:17.743Z", "created_by": 1, "program_id": 8, "updated_at": "2026-10-05T04:50:27.242Z", "updated_by": 4, "description": "Procurement of Office Supplies for IGP Operations", "fiscal_year": 2026, "registry_no": "IGP-161-2026-000003", "reference_no": "IGP-UTIL-TEST-002", "status_of_po": "Completed", "uacs_code_id": 16, "account_title": "Agricultural and Marine Supplies Expenses", "dv_payroll_no": "DV-IGP-2026-001", "income_amount": "0.00", "wfp_source_id": 8, "burs_serial_no": "BURS-161-2026-000003", "co_utilization": "0.00", "fund_source_id": 7, "igp_program_id": 8, "ps_utilization": "0.00", "transaction_no": "IGP-161-2026-000003", "fund_cluster_id": 11, "running_balance": "0.00", "wfp_source_code": "CS", "mooe_utilization": "3000.00", "old_uacs_code_id": 13, "transaction_date": "2026-10-03T16:00:00.000Z", "transaction_type": "Utilization", "allotment_class_id": 2, "unpaid_utilization": "3000.00", "utilization_amount": "3000.00", "disbursement_amount": "0.00", "object_expenditure_id": 2, "serial_no_transferred": null, "responsibility_center_id": 2, "uacs_funding_source_code": null}	{"id": 2, "month": 10, "payee": "ABC Office Supplies", "po_no": "PO-IGP-2026-001", "iar_no": "IAR-IGP-2026-001", "ics_no": "ICS-IGP-2026-001", "mfo_id": 2, "pap_id": 2, "par_no": "PAR-IGP-2026-001", "ris_no": "RIS-IGP-2026-001", "series": null, "status": "Posted", "quarter": 4, "remarks": "test transaction", "series2": null, "campus_id": 2, "po_status": "Completed", "created_at": "2026-10-04T23:29:17.743Z", "created_by": 1, "program_id": 8, "updated_at": "2026-10-05T04:50:48.844Z", "updated_by": 4, "description": "Procurement of Office Supplies for IGP Operations", "fiscal_year": 2026, "registry_no": "IGP-161-2026-000003", "reference_no": "IGP-UTIL-TEST-002", "status_of_po": "Completed", "uacs_code_id": 16, "account_title": "Agricultural and Marine Supplies Expenses", "dv_payroll_no": "DV-IGP-2026-001", "income_amount": "0.00", "wfp_source_id": 8, "burs_serial_no": "BURS-161-2026-000003", "co_utilization": "0.00", "fund_source_id": 7, "igp_program_id": 8, "ps_utilization": "0.00", "transaction_no": "IGP-161-2026-000003", "fund_cluster_id": 11, "running_balance": "0.00", "wfp_source_code": "CS", "mooe_utilization": "3000.00", "old_uacs_code_id": 13, "transaction_date": "2026-10-02T16:00:00.000Z", "transaction_type": "Utilization", "allotment_class_id": 2, "unpaid_utilization": "3000.00", "utilization_amount": "3000.00", "disbursement_amount": "0.00", "object_expenditure_id": 2, "serial_no_transferred": null, "responsibility_center_id": 2, "uacs_funding_source_code": null}
6	3	PROCUREMENT_UPDATE	igp_transactions	1	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36	2026-10-05 15:04:03.976002	Procurement	IGP Registry	{"id": 1, "month": 10, "payee": "Test Collection", "po_no": null, "iar_no": null, "ics_no": null, "mfo_id": 3, "pap_id": 2, "par_no": null, "ris_no": null, "series": null, "status": "Posted", "quarter": 4, "remarks": "Initial IGP test transaction", "series2": null, "campus_id": 2, "po_status": null, "created_at": "2026-10-04T12:05:15.354Z", "created_by": 1, "program_id": 8, "updated_at": "2026-10-04T12:05:15.354Z", "updated_by": 1, "description": "Test Rice Production Collection", "fiscal_year": 2026, "registry_no": "IGP-161-2026-000002", "reference_no": "IGP-TEST-001", "status_of_po": null, "uacs_code_id": 16, "account_title": "Agricultural and Marine Supplies Expenses", "dv_payroll_no": null, "income_amount": "10000.00", "wfp_source_id": 8, "burs_serial_no": "BURS-161-2026-000002", "co_utilization": "0.00", "fund_source_id": 7, "igp_program_id": 8, "ps_utilization": "0.00", "transaction_no": "IGP-161-2026-000002", "fund_cluster_id": 11, "running_balance": "0.00", "wfp_source_code": "CS", "mooe_utilization": "0.00", "old_uacs_code_id": 15, "transaction_date": "2026-10-03T16:00:00.000Z", "transaction_type": "Income", "allotment_class_id": 1, "unpaid_utilization": "0.00", "utilization_amount": "0.00", "disbursement_amount": "0.00", "object_expenditure_id": 1, "serial_no_transferred": null, "responsibility_center_id": 3, "uacs_funding_source_code": "CS"}	{"id": 1, "month": 10, "payee": "Test Collection", "po_no": "PO-IGP-2026-0001", "iar_no": null, "ics_no": null, "mfo_id": 3, "pap_id": 2, "par_no": null, "ris_no": null, "series": null, "status": "Posted", "quarter": 4, "remarks": "Initial IGP test transaction", "series2": null, "campus_id": 2, "po_status": null, "created_at": "2026-10-04T12:05:15.354Z", "created_by": 1, "program_id": 8, "updated_at": "2026-10-05T07:04:03.966Z", "updated_by": 3, "description": "Test Rice Production Collection", "fiscal_year": 2026, "registry_no": "IGP-161-2026-000002", "reference_no": "IGP-TEST-001", "status_of_po": null, "uacs_code_id": 16, "account_title": "Agricultural and Marine Supplies Expenses", "dv_payroll_no": null, "income_amount": "10000.00", "wfp_source_id": 8, "burs_serial_no": "BURS-161-2026-000002", "co_utilization": "0.00", "fund_source_id": 7, "igp_program_id": 8, "ps_utilization": "0.00", "transaction_no": "IGP-161-2026-000002", "fund_cluster_id": 11, "running_balance": "0.00", "wfp_source_code": "CS", "mooe_utilization": "0.00", "old_uacs_code_id": 15, "transaction_date": "2026-10-02T16:00:00.000Z", "transaction_type": "Income", "allotment_class_id": 1, "unpaid_utilization": "0.00", "utilization_amount": "0.00", "disbursement_amount": "0.00", "object_expenditure_id": 1, "serial_no_transferred": null, "responsibility_center_id": 3, "uacs_funding_source_code": "CS"}
7	1	CREATE	igp_programs	22	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36	2026-10-10 20:03:43.997779	Administration	IGP Registry	\N	{"id": 22, "status": "Active", "campus_id": 3, "created_at": "2026-10-10T12:03:43.944Z", "created_by": 1, "start_date": "2026-10-09T16:00:00.000Z", "updated_at": "2026-10-10T12:03:43.944Z", "updated_by": 1, "description": "dgdggd", "fiscal_year": 2026, "program_code": "LAG IGP RICE PROD", "program_name": "RICE PRODUCTION", "wfp_source_id": 10, "fund_source_id": 7, "fund_cluster_id": 11, "wfp_source_code": "CF", "projected_income": "100000.00", "allocation_amount": "1000000.00", "beginning_balance": "10000.00", "responsibility_center_id": 1}
8	1	CREATE	igp_transactions	4	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36	2026-10-10 20:30:07.888208	Administration	IGP Registry	\N	{"id": 4, "month": 10, "payee": "Trisha Mae Gapuz", "po_no": null, "iar_no": null, "ics_no": null, "mfo_id": 10, "pap_id": 1, "par_no": null, "ris_no": null, "series": null, "status": "Posted", "quarter": 4, "remarks": "lslldhlslhaalh", "series2": null, "campus_id": 3, "po_status": null, "created_at": "2026-10-10T12:30:07.861Z", "created_by": 1, "program_id": 22, "updated_at": "2026-10-10T12:30:07.861Z", "updated_by": 1, "description": "fjfljf", "fiscal_year": 2026, "registry_no": "IGP-161-2026-000008", "reference_no": "001", "status_of_po": null, "uacs_code_id": 17, "account_title": "Other Supplies and Materials Expenses", "dv_payroll_no": null, "income_amount": "10000.00", "wfp_source_id": 10, "burs_serial_no": "BURS-161-2026-000008", "co_utilization": "0.00", "fund_source_id": 7, "igp_program_id": 22, "ps_utilization": "0.00", "transaction_no": "IGP-161-2026-000008", "fund_cluster_id": 11, "running_balance": "0.00", "wfp_source_code": "CF", "mooe_utilization": "0.00", "old_uacs_code_id": 9, "transaction_date": "2026-10-09T16:00:00.000Z", "transaction_type": "Income", "allotment_class_id": 2, "unpaid_utilization": "0.00", "utilization_amount": "0.00", "disbursement_amount": "0.00", "object_expenditure_id": null, "serial_no_transferred": null, "responsibility_center_id": 1, "uacs_funding_source_code": null}
\.


--
-- TOC entry 5911 (class 0 OID 38140)
-- Dependencies: 256
-- Data for Name: budget_adjustments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.budget_adjustments (id, maf_no, fiscal_year, fund_cluster_id, fund_source_id, department, prepared_by, adjustment_date, source_program, source_rc, source_allotment_class, source_object_expenditure, source_amount, deficient_program, deficient_rc, deficient_allotment_class, deficient_object_expenditure, deficient_amount, status, remarks, approved_by, approved_date, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5901 (class 0 OID 37753)
-- Dependencies: 246
-- Data for Name: budget_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.budget_items (id, fiscal_year, fund_cluster_id, fund_source_id, campus_id, responsibility_center_id, mfo_id, pap_id, uacs_code_id, object_expenditure_id, allotment_class_id, wfp_source_id, approved_budget, ps_amount, mooe_amount, co_amount, quarter, month, status, notes, created_by, updated_by, created_at, updated_at, budget_proposal_id) FROM stdin;
3	2026	11	7	3	1	10	1	15	\N	2	2	2000000.00	1000000.00	500000.00	500000.00	\N	\N	Approved	Created from approved Budget Proposal null	\N	\N	2026-10-09 20:15:06.507205	2026-10-09 20:15:06.507205	4
4	2026	1	1	3	1	9	2	16	\N	1	3	100000.00	100000.00	0.00	0.00	\N	\N	Approved	Created from approved Budget Proposal BP-2026-00002	\N	\N	2026-10-11 11:18:45.121416	2026-10-11 11:18:45.121416	5
5	2026	5	2	1	3	8	2	8	\N	2	10	30000.00	10000.00	10000.00	10000.00	\N	\N	Approved	Created from approved Budget Proposal null	\N	\N	2026-10-15 16:57:28.574286	2026-10-15 16:57:28.574286	6
6	2026	7	2	2	4	6	1	1	\N	2	24	1000000.00	1000000.00	0.00	0.00	\N	\N	Approved	Created from approved Budget Proposal BP-2026-00004	\N	\N	2026-10-24 11:33:26.361253	2026-10-24 11:33:26.361253	7
7	2026	12	7	1	5	6	3	10	\N	1	1	10000.00	0.00	10000.00	0.00	\N	\N	Approved	Created from approved Budget Proposal BP-2026-00006	\N	\N	2026-10-24 12:29:33.316648	2026-10-24 12:29:33.316648	9
8	2026	11	7	3	3	8	2	16	\N	1	5	10000.00	10000.00	0.00	0.00	\N	\N	Approved	Created from approved Budget Proposal BP-2026-00005	\N	\N	2026-10-24 12:33:03.353996	2026-10-24 12:33:03.353996	8
9	2026	5	2	1	3	8	1	1	\N	3	10	30000.00	10000.00	10000.00	10000.00	\N	\N	Approved	Created from approved Budget Proposal BP-2026-00010	\N	\N	2026-10-25 21:56:48.206091	2026-10-25 21:56:48.206091	13
\.


--
-- TOC entry 5933 (class 0 OID 48739)
-- Dependencies: 282
-- Data for Name: budget_proposal_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.budget_proposal_history (id, proposal_id, action, status, remarks, actor_id, actor_name, created_at, details) FROM stdin;
1	1	Draft Created	Draft	Test Budget Proposal - FY 2026	2	Trisha Mae Gapuz	2026-10-04 10:43:04.140889+08	\N
2	1	Submitted	Submitted	\N	2	Trisha Mae Gapuz	2026-10-04 10:48:11.581936+08	\N
3	1	Under Review	Under Review	\N	2	Trisha Mae Gapuz	2026-10-04 10:49:43.021048+08	\N
4	1	Endorsed	Endorsed	\N	2	Trisha Mae Gapuz	2026-10-04 10:51:05.827923+08	\N
5	2	Draft Created	Draft	test	2	Trisha	2026-10-04 11:04:42.681066+08	\N
6	2	Submitted	Submitted	\N	2	Trisha Mae Gapuz	2026-10-04 11:05:03.226492+08	\N
7	2	Under Review	Under Review	\N	2	Trisha Mae Gapuz	2026-10-04 11:05:07.488694+08	\N
8	2	For Revision	For Revision	\N	2	Trisha Mae Gapuz	2026-10-04 11:06:15.526497+08	\N
9	2	Submitted	Submitted	\N	2	Trisha Mae Gapuz	2026-10-04 11:12:37.201229+08	\N
10	2	Under Review	Under Review	\N	2	Trisha Mae Gapuz	2026-10-04 11:12:43.616225+08	\N
11	2	Endorsed	Endorsed	\N	2	Trisha Mae Gapuz	2026-10-04 11:12:48.584132+08	\N
12	2	Approved	Approved	\N	2	Trisha Mae Gapuz	2026-10-04 11:13:08.900338+08	\N
13	3	Draft Created	Draft	\N	1	Trisha Mae Gapuz	2026-10-07 20:06:01.145827+08	\N
14	3	Submitted	Submitted	\N	1	System Administrator	2026-10-07 20:06:01.405777+08	\N
15	3	Under Review	Under Review	\N	1	System Administrator	2026-10-07 20:06:15.373788+08	\N
16	3	Endorsed	Endorsed	\N	1	System Administrator	2026-10-07 20:06:23.269661+08	\N
17	3	Approved	Approved	\N	1	System Administrator	2026-10-07 20:06:26.700331+08	\N
18	4	Draft Created	Draft	dhhdgd	1	Trisha Mae Gapuz	2026-10-09 19:56:55.771573+08	\N
19	4	Submitted	Submitted	\N	1	System Administrator	2026-10-09 19:56:55.939102+08	\N
20	4	Under Review	Under Review	\N	1	System Administrator	2026-10-09 19:57:12.086932+08	\N
21	4	For Revision	For Revision	\N	1	System Administrator	2026-10-09 19:57:21.478258+08	\N
22	4	Updated	For Revision	dhhdgd	1	Trisha	2026-10-09 20:14:02.013009+08	\N
23	4	Submitted	Submitted	\N	1	System Administrator	2026-10-09 20:14:02.182605+08	\N
24	4	Under Review	Under Review	\N	1	System Administrator	2026-10-09 20:14:14.768722+08	\N
25	4	For Revision	For Revision	\N	1	System Administrator	2026-10-09 20:14:20.994504+08	\N
26	4	Updated	For Revision	dhhdgd	1	Trisha Mae Gapuz	2026-10-09 20:14:51.069766+08	\N
27	4	Submitted	Submitted	\N	1	System Administrator	2026-10-09 20:14:51.235964+08	\N
28	4	Under Review	Under Review	\N	1	System Administrator	2026-10-09 20:14:58.023125+08	\N
29	4	Endorsed	Endorsed	\N	1	System Administrator	2026-10-09 20:15:03.164336+08	\N
30	4	Approved	Approved	\N	1	System Administrator	2026-10-09 20:15:06.507205+08	\N
31	5	Draft Created	Draft	fkkgfk	1	Trisha Mae	2026-10-11 11:18:32.224587+08	\N
32	5	Submitted	Submitted	\N	1	System Administrator	2026-10-11 11:18:32.391421+08	\N
33	5	Under Review	Under Review	\N	1	System Administrator	2026-10-11 11:18:41.580553+08	\N
34	5	Endorsed	Endorsed	\N	1	System Administrator	2026-10-11 11:18:43.66863+08	\N
35	5	Approved	Approved	\N	1	System Administrator	2026-10-11 11:18:45.121416+08	\N
36	6	Draft Created	Draft	dhfhfh	1	Trisha Mae Gapuz	2026-10-15 16:56:33.572575+08	\N
37	6	Submitted	Submitted	\N	1	Trisha Mae Gapuz	2026-10-15 16:56:33.793756+08	\N
38	6	Under Review	Under Review	\N	1	Trisha Mae Gapuz	2026-10-15 16:56:41.32059+08	\N
39	6	For Revision	For Revision	\N	1	Trisha Mae Gapuz	2026-10-15 16:56:49.448775+08	\N
40	6	Updated	For Revision	dhfhfh	1	admin	2026-10-15 16:57:15.014691+08	\N
41	6	Submitted	Submitted	\N	1	Trisha Mae Gapuz	2026-10-15 16:57:15.205643+08	\N
42	6	Under Review	Under Review	\N	1	Trisha Mae Gapuz	2026-10-15 16:57:20.86756+08	\N
43	6	Endorsed	Endorsed	\N	1	Trisha Mae Gapuz	2026-10-15 16:57:25.115864+08	\N
44	6	Approved	Approved	\N	1	Trisha Mae Gapuz	2026-10-15 16:57:28.574286+08	\N
45	7	Draft Created	Draft	ddkkd	2	trish	2026-10-24 11:12:03.956477+08	\N
46	7	Submitted	Submitted	\N	2	Trisha Mae Gapuz	2026-10-24 11:12:04.133501+08	\N
47	8	Draft Created	Draft	djj	2	trisha	2026-10-24 11:24:00.26749+08	\N
48	8	Submitted	Submitted	\N	2	Trisha Mae Gapuz	2026-10-24 11:24:00.457023+08	\N
49	7	Under Review	Under Review	\N	1	Trisha Mae Gapuz	2026-10-24 11:31:07.305681+08	\N
50	7	Endorsed	Endorsed	\N	1	Trisha Mae Gapuz	2026-10-24 11:31:20.882589+08	\N
51	7	Approved	Approved	\N	1	Trisha Mae Gapuz	2026-10-24 11:33:26.361253+08	\N
52	8	Under Review	Under Review	\N	1	Trisha Mae Gapuz	2026-10-24 11:35:19.769179+08	\N
53	8	Endorsed	Endorsed	\N	1	Trisha Mae Gapuz	2026-10-24 11:41:16.630329+08	\N
54	9	Draft Created	Draft	ss	2	Trisha	2026-10-24 11:44:28.31698+08	\N
55	9	Submitted	Submitted	\N	2	Trisha Mae Gapuz	2026-10-24 11:44:28.480214+08	\N
56	10	Draft Created	Draft	ghyhy	2	trisha	2026-10-24 11:52:56.176368+08	\N
57	10	Submitted	Submitted	\N	2	Trisha Mae Gapuz	2026-10-24 11:52:56.34812+08	\N
58	10	Under Review	Under Review	\N	1	Trisha Mae Gapuz	2026-10-24 12:20:08.57134+08	\N
59	10	Endorsed	Endorsed	\N	1	Trisha Mae Gapuz	2026-10-24 12:21:35.407894+08	\N
60	10	Rejected	Rejected	\N	1	Trisha Mae Gapuz	2026-10-24 12:22:22.268005+08	\N
61	9	Under Review	Under Review	\N	1	Trisha Mae Gapuz	2026-10-24 12:23:15.255894+08	\N
62	9	Endorsed	Endorsed	\N	1	Trisha Mae Gapuz	2026-10-24 12:26:42.811976+08	\N
63	9	Approved	Approved	\N	1	Trisha Mae Gapuz	2026-10-24 12:29:33.316648+08	\N
64	8	Approved	Approved	\N	1	Trisha Mae Gapuz	2026-10-24 12:33:03.353996+08	\N
65	13	Proposal Entered (Draft)	Draft	\N	2	Trisha Mae Gapuz	2026-10-25 20:26:24.453689+08	{"entered_by": "Trisha Mae Gapuz", "form_entry": {"id": 13, "mfo": "", "pap": "", "raw": {"mfo_id": 8, "pap_id": 1, "status": "Draft", "remarks": null, "category": "03", "campus_id": 1, "created_at": "2026-10-25T20:26:24.390954", "created_by": 2, "updated_at": "2026-10-25T20:26:24.390954", "approved_at": null, "approved_by": null, "endorsed_at": null, "endorsed_by": null, "fiscal_year": 2026, "fund_source": "BGD-FIDU-ID-GS", "proposal_id": 13, "proposal_no": "BP-2026-00010", "proposed_co": 10000, "proposed_ps": 10000, "returned_at": null, "reviewed_at": null, "reviewed_by": null, "source_code": "CF", "submitted_at": null, "uacs_code_id": 1, "justification": null, "proposed_mooe": 10000, "wfp_source_id": 10, "fund_source_id": 2, "proposal_title": "Renovate the building", "department_unit": "Information Technology office", "fund_cluster_id": 5, "expected_outputs": null, "rejection_reason": null, "requested_amount": 30000, "allotment_class_id": 3, "supporting_documents": null, "object_expenditure_id": null, "program_project_activity": null, "responsibility_center_id": 3}, "date": "2026-10-25T20:26:24.390954", "title": "Renovate the building", "amount": 30000, "campus": "", "mfo_id": 8, "pap_id": 1, "status": "Draft", "remarks": "", "category": "03", "fundCode": "BGD-FIDU-ID-GS", "uacsCode": "", "campus_id": 1, "fundGroup": "Other Funds", "fund_code": "BGD-FIDU-ID-GS", "proponent": "", "reference": "BP-2026-00010", "created_at": "2026-10-25T20:26:24.390954", "department": "Information Technology office", "fund_group": "Other Funds", "sourceCode": "CF", "updated_at": "2026-10-25T20:26:24.390954", "description": "", "fiscal_year": 2026, "fund_source": "BGD-FIDU-ID-GS", "office_name": "Information Technology office", "particulars": "", "proposal_no": "BP-2026-00010", "proposed_co": 10000, "proposed_ps": 10000, "submitted_at": null, "uacs_code_id": 1, "proposed_mooe": 10000, "wfp_source_id": 10, "fund_source_id": 2, "funding_source": "BGD-FIDU-ID-GS", "wfpDescription": "", "department_name": "Information Technology office", "department_unit": "Information Technology office", "fund_cluster_id": 5, "proposing_office": "Information Technology office", "requested_amount": 30000, "allotment_class_id": 3, "appropriation_type": "", "object_expenditure": "", "responsibilityCenter": "", "supporting_documents": null, "budget_classification": "03", "object_expenditure_id": null, "responsibility_center": "", "responsibility_center_id": 3}, "entered_by_role": "Budget", "entered_by_email": null}
66	13	Submitted	Submitted	\N	2	Trisha Mae Gapuz	2026-10-25 20:26:24.818568+08	\N
67	13	Under Review	Under Review	\N	1	Trisha Mae Gapuz	2026-10-25 21:34:46.448769+08	\N
68	13	Endorsed	Endorsed	\N	1	Trisha Mae Gapuz	2026-10-25 21:55:20.737806+08	\N
69	13	Approved	Approved	\N	1	Trisha Mae Gapuz	2026-10-25 21:56:48.206091+08	\N
70	14	Proposal Entered (Draft)	Draft	\N	2	Trisha Mae Gapuz	2026-10-25 21:59:17.902308+08	{"entered_by": "Trisha Mae Gapuz", "form_entry": {"mfo": "RESEARCH", "pap": "CAFC", "title": "for traveling", "amount": 3000, "campus": "LAGANGILANG", "mfo_id": 8, "pap_id": 2, "remarks": null, "campus_id": 3, "fund_code": "LAG-IGP-ORCHARD", "proponent": "trisha mae gapuz", "uacs_code": "5020101000", "created_by": 2, "department": "college of agriculture", "description": "dggd", "fiscal_year": 2026, "fund_source": "LAG-IGP-ORCHARD", "particulars": "dggd", "proposal_id": 14, "proposal_no": "BP-2026-00011", "proposed_co": 1000, "proposed_ps": 1000, "source_code": "CF", "fund_cluster": "161 MAIN", "uacs_code_id": 2, "justification": null, "proposed_mooe": 1000, "wfp_source_id": 10, "fund_source_id": 7, "fund_cluster_id": 11, "wfp_description": "PRODUCTION", "expected_outputs": null, "proposing_office": "college of agriculture", "allotment_class_id": 1, "budget_classification": "01", "object_expenditure_id": null, "responsibility_center": "III-A", "responsibility_center_id": 3}, "entered_by_role": "Budget", "entered_by_email": null}
71	14	Submitted	Submitted	\N	2	Trisha Mae Gapuz	2026-10-25 21:59:18.113699+08	\N
72	14	Under Review	Under Review	\N	1	Trisha Mae Gapuz	2026-10-25 22:00:16.619122+08	\N
73	14	For Revision	For Revision	\N	1	Trisha Mae Gapuz	2026-10-25 22:00:36.511161+08	\N
74	14	Updated	For Revision	\N	2	Trisha Mae Gapuz	2026-10-25 22:01:50.521319+08	\N
75	14	Submitted	Submitted	\N	2	Trisha Mae Gapuz	2026-10-25 22:01:50.672241+08	\N
76	14	Under Review	Under Review	\N	1	Trisha Mae Gapuz	2026-10-25 22:03:22.657026+08	\N
77	14	Endorsed	Endorsed	\N	1	Trisha Mae Gapuz	2026-10-25 22:03:43.451508+08	\N
78	14	Rejected	Rejected	\N	1	Trisha Mae Gapuz	2026-10-25 22:03:55.133034+08	\N
79	15	Proposal Entered (Draft)	Draft	\N	2	Trisha Mae Gapuz	2026-10-25 22:10:43.947705+08	{"entered_by": "Trisha Mae Gapuz", "form_entry": {"mfo": "AUXILIARY", "pap": "CTE", "title": "for training", "amount": 3000, "campus": "LAGANGILANG", "mfo_id": 10, "pap_id": 3, "remarks": null, "campus_id": 3, "fund_code": null, "proponent": "Trisha Mae Gapuz", "uacs_code": "5020201000", "created_by": 2, "department": "College of Teacher Education", "description": "sjssl", "fiscal_year": 2026, "fund_source": null, "particulars": "sjssl", "proposal_id": 15, "proposal_no": "BP-2026-00012", "proposed_co": 1000, "proposed_ps": 1000, "source_code": "CJ", "fund_cluster": "101 GENERAL FUND", "uacs_code_id": 3, "justification": null, "proposed_mooe": 1000, "wfp_source_id": 15, "fund_source_id": 1, "fund_cluster_id": 1, "wfp_description": "OTHER BUSINESS INCOME", "expected_outputs": null, "proposing_office": "College of Teacher Education", "allotment_class_id": 2, "budget_classification": "02", "object_expenditure_id": null, "responsibility_center": "III-B", "responsibility_center_id": 4}, "entered_by_role": "Budget", "entered_by_email": null}
80	15	Submitted	Submitted	\N	2	Trisha Mae Gapuz	2026-10-25 22:10:44.325827+08	\N
81	15	Under Review	Under Review	\N	1	Trisha Mae Gapuz	2026-10-25 22:11:21.528118+08	\N
82	15	Endorsed	Endorsed	\N	1	Trisha Mae Gapuz	2026-10-25 22:11:36.502198+08	\N
\.


--
-- TOC entry 5929 (class 0 OID 48610)
-- Dependencies: 278
-- Data for Name: budget_proposals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.budget_proposals (proposal_id, proposal_no, fiscal_year, proposal_title, department_unit, fund_source, category, program_project_activity, requested_amount, justification, expected_outputs, supporting_documents, status, submitted_at, reviewed_at, endorsed_at, approved_at, returned_at, rejection_reason, remarks, created_by, reviewed_by, endorsed_by, approved_by, created_at, updated_at, fund_cluster_id, fund_source_id, campus_id, responsibility_center_id, wfp_source_id, pap_id, uacs_code_id, allotment_class_id, source_code, mfo_id, object_expenditure_id, proposed_ps, proposed_mooe, proposed_co) FROM stdin;
4	\N	2026	Renovation	Information Technology	LAG-IGP-SEED-PROD	02	\N	2000000.00	\N	\N	\N	Approved	2026-10-09 20:14:51.235964	2026-10-09 20:14:58.023125	2026-10-09 20:15:03.164336	2026-10-09 20:15:06.507205	2026-10-09 20:14:20.994504	\N	dhhdgd	1	1	1	1	2026-10-09 19:56:55.684147	2026-10-09 20:15:06.507205	11	7	3	1	2	1	15	2	\N	10	\N	1000000.00	500000.00	500000.00
5	BP-2026-00002	2026	Production	College of Agriculture	\N	01	\N	100000.00	\N	\N	\N	Approved	2026-10-11 11:18:32.391421	2026-10-11 11:18:41.580553	2026-10-11 11:18:43.66863	2026-10-11 11:18:45.121416	\N	\N	fkkgfk	1	1	1	1	2026-10-11 11:18:32.123088	2026-10-11 11:18:45.121416	1	1	3	1	3	2	16	1	WFP-CAFC	9	\N	100000.00	0.00	0.00
6	\N	2026	For Equipment	College of Forestry	BGD-FIDU-ID-GS	02	\N	30000.00	\N	\N	\N	Approved	2026-10-15 16:57:15.205643	2026-10-15 16:57:20.86756	2026-10-15 16:57:25.115864	2026-10-15 16:57:28.574286	2026-10-15 16:56:49.448775	\N	dhfhfh	1	1	1	1	2026-10-15 16:56:33.481137	2026-10-15 16:57:28.574286	5	2	1	3	10	2	8	2	CF	8	\N	10000.00	10000.00	10000.00
7	BP-2026-00004	2026	Renovation of room	College of Teacher Education	BGD-FIDU-ATH-COL	02	\N	1000000.00	\N	\N	\N	Approved	2026-10-24 11:12:04.133501	2026-10-24 11:31:07.305681	2026-10-24 11:31:20.882589	2026-10-24 11:33:26.361253	\N	\N	ddkkd	2	1	1	1	2026-10-24 11:12:03.891154	2026-10-24 11:33:26.361253	7	2	2	4	24	1	1	2	CG	6	\N	1000000.00	0.00	0.00
10	BP-2026-00007	2026	Repair for all computer in Lab 2	CMCS	LAG-IGP-SEED-PROD	02	\N	10000.00	\N	\N	\N	Rejected	2026-10-24 11:52:56.34812	2026-10-24 12:20:08.57134	2026-10-24 12:21:35.407894	\N	\N	\N	ghyhy	2	1	1	\N	2026-10-24 11:52:56.113617	2026-10-24 12:22:22.268005	11	7	3	5	10	1	8	2	WFP-INTERNET-COL	6	\N	0.00	10000.00	0.00
9	BP-2026-00006	2026	School supplies	CTE	BGD-OTHERS	01	\N	10000.00	\N	\N	\N	Approved	2026-10-24 11:44:28.480214	2026-10-24 12:23:15.255894	2026-10-24 12:26:42.811976	2026-10-24 12:29:33.316648	\N	\N	ss	2	1	1	1	2026-10-24 11:44:28.300589	2026-10-24 12:29:33.316648	12	7	1	5	1	3	10	1	WFP-CTE	6	\N	0.00	10000.00	0.00
8	BP-2026-00005	2026	seedlings	Cafc	LAG-IGP-SEED-PROD	01	\N	10000.00	\N	\N	\N	Approved	2026-10-24 11:24:00.457023	2026-10-24 11:35:19.769179	2026-10-24 11:41:16.630329	2026-10-24 12:33:03.353996	\N	\N	djj	2	1	1	1	2026-10-24 11:24:00.220857	2026-10-24 12:33:03.353996	11	7	3	3	5	2	16	1	CT	8	\N	10000.00	0.00	0.00
11	BP-2026-00008	2026	materials to buy for renovating the others room	Information Technology	BGD-FIDU-ID-GS	03	\N	10000.00	\N	\N	\N	Draft	\N	\N	\N	\N	\N	\N	gg	2	\N	\N	\N	2026-10-25 19:43:40.894753	2026-10-25 19:43:40.894753	5	2	1	4	10	3	1	3	CF	10	\N	0.00	0.00	10000.00
12	BP-2026-00009	2026	materials to buy for renovating the others room	Information Technology	BGD-FIDU-ID-GS	03	\N	10000.00	\N	\N	\N	Draft	\N	\N	\N	\N	\N	\N	gg	2	\N	\N	\N	2026-10-25 19:44:19.282073	2026-10-25 19:44:19.282073	5	2	1	4	10	3	1	3	CF	10	\N	0.00	0.00	10000.00
13	BP-2026-00010	2026	Renovate the building	Information Technology office	BGD-FIDU-ID-GS	03	\N	30000.00	\N	\N	\N	Approved	2026-10-25 20:26:24.818568	2026-10-25 21:34:46.448769	2026-10-25 21:55:20.737806	2026-10-25 21:56:48.206091	\N	\N	\N	2	1	1	1	2026-10-25 20:26:24.390954	2026-10-25 21:56:48.206091	5	2	1	3	10	1	1	3	CF	8	\N	10000.00	10000.00	10000.00
14	\N	2026	for traveling	college of agriculture	LAG-IGP-ORCHARD	01	dggd	3000.00	\N	\N	\N	Rejected	2026-10-25 22:01:50.672241	2026-10-25 22:03:22.657026	2026-10-25 22:03:43.451508	\N	2026-10-25 22:00:36.511161	\N	\N	2	1	1	\N	2026-10-25 21:59:17.871143	2026-10-25 22:03:55.133034	11	7	3	3	10	2	2	1	CF	8	\N	1000.00	1000.00	1000.00
15	BP-2026-00012	2026	for training	College of Teacher Education	\N	02	sjssl	3000.00	\N	\N	\N	Endorsed	2026-10-25 22:10:44.325827	2026-10-25 22:11:21.528118	2026-10-25 22:11:36.502198	\N	\N	\N	\N	2	1	1	\N	2026-10-25 22:10:43.844891	2026-10-25 22:11:36.502198	1	1	3	4	15	3	3	2	CJ	10	\N	1000.00	1000.00	1000.00
\.


--
-- TOC entry 5883 (class 0 OID 37579)
-- Dependencies: 228
-- Data for Name: campuses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.campuses (id, code, name, abbreviation, is_active, created_at, updated_at) FROM stdin;
1	BANGUED	BANGUED	BGD	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
2	LA PAZ	LA PAZ	LP	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
3	LAGANGILANG	LAGANGILANG	MAIN	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
\.


--
-- TOC entry 5936 (class 0 OID 49166)
-- Dependencies: 285
-- Data for Name: department_master; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.department_master (id, code, name, description, is_active, created_at, updated_at, campus_id) FROM stdin;
1	CMCS	College of Mathematics and Computing Science	Cmcs Department	t	2026-10-17 09:21:26.558707	2026-10-17 09:21:50.251318	3
\.


--
-- TOC entry 5955 (class 0 OID 49835)
-- Dependencies: 305
-- Data for Name: fee_master_particulars; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fee_master_particulars (id, code, name, category, description, status, created_at, updated_at) FROM stdin;
8	FEE-ATHLETIC	Athletic Fee	Fiduciary Fees		Inactive	2026-10-22 14:27:49.752028+08	2026-10-24 15:11:40.207057+08
5	FEE-COMPUTER	Computer Fee	Fiduciary Fees		Inactive	2026-10-22 14:27:49.752028+08	2026-10-24 15:11:40.207057+08
9	FEE-CULTURAL	Cultural Fee	Fiduciary Fees		Inactive	2026-10-22 14:27:49.752028+08	2026-10-24 15:11:40.207057+08
17	FEE-ENTRANCE	Entrance Fee	Fiduciary Fees		Inactive	2026-10-22 14:27:49.752028+08	2026-10-24 15:11:40.207057+08
12	FEE-GUIDANCE	Guidance Fee	Fiduciary Fees		Inactive	2026-10-22 14:27:49.752028+08	2026-10-24 15:11:40.207057+08
14	FEE-HANDBOOK	Handbook	Fiduciary Fees		Inactive	2026-10-22 14:27:49.752028+08	2026-10-24 15:11:40.207057+08
11	FEE-ID	ID	Fiduciary Fees		Inactive	2026-10-22 14:27:49.752028+08	2026-10-24 15:11:40.207057+08
6	FEE-INTERNET	Internet Fee	Fiduciary Fees		Inactive	2026-10-22 14:27:49.752028+08	2026-10-24 15:11:40.207057+08
2	FEE-LABORATORY	Laboratory Fee	Fiduciary Fees		Inactive	2026-10-22 14:27:49.752028+08	2026-10-24 15:11:40.207057+08
3	FEE-LIBRARY	Library Fee	Fiduciary Fees		Inactive	2026-10-22 14:27:49.752028+08	2026-10-24 15:11:40.207057+08
4	FEE-MEDICAL-DENTAL	Medical & Dental Fee	Fiduciary Fees		Inactive	2026-10-22 14:27:49.752028+08	2026-10-24 15:11:40.207057+08
10	FEE-NSTP	NSTP	Fiduciary Fees		Inactive	2026-10-22 14:27:49.752028+08	2026-10-24 15:11:40.207057+08
1	FEE-REGISTRATION	Registration Fees	Fiduciary Fees		Inactive	2026-10-22 14:27:49.752028+08	2026-10-24 15:11:40.207057+08
13	FEE-SCHOOL-PUBLICATION	School Publication	Fiduciary Fees		Inactive	2026-10-22 14:27:49.752028+08	2026-10-24 15:11:40.207057+08
16	FEE-SCUAA	SCUAA Fee	Fiduciary Fees		Inactive	2026-10-22 14:27:49.752028+08	2026-10-24 15:11:40.207057+08
7	FEE-STUDENT-DEVELOPMENT	Student Development Fund	Fiduciary Fees		Inactive	2026-10-22 14:27:49.752028+08	2026-10-24 15:11:40.207057+08
15	FEE-TESTING	Testing Fee	Fiduciary Fees		Inactive	2026-10-22 14:27:49.752028+08	2026-10-24 15:11:40.207057+08
19	A	Higher Education Services CASS	Non-Fiduciary Fees - Tuition Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
20	B	Higher Education Services CAFC	Non-Fiduciary Fees - Tuition Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
21	C	Higher Education Services CTE	Non-Fiduciary Fees - Tuition Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
22	D	Higher Education Services HT	Non-Fiduciary Fees - Tuition Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
23	E	Higher Education Services CMCS	Non-Fiduciary Fees - Tuition Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
24	F	Higher Education Services Quality Assurance	Non-Fiduciary Fees - Tuition Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
25	G	Higher Education Services Vice President of Academic Affairs	Non-Fiduciary Fees - Tuition Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
26	H	Higher Education Services Director - Publication and Information	Non-Fiduciary Fees - Tuition Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
27	I	Higher Education Services Director - Academic Related Services	Non-Fiduciary Fees - Tuition Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
28	J	Higher Education Services Director - Planning and Development	Non-Fiduciary Fees - Tuition Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
29	K	General Administrative and Support Services	Non-Fiduciary Fees - Tuition Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
30	L	Research Services	Non-Fiduciary Fees - Tuition Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
31	M	Extension Services	Non-Fiduciary Fees - Tuition Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
32	N	Production Services	Non-Fiduciary Fees - Tuition Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
33	O	DRRM (Mandatory Reserve)	Non-Fiduciary Fees - Tuition Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
34	P	Common Fund Office of the President	Non-Fiduciary Fees - Tuition Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
35	Q	Common Fund Office of the Vice President for Academic Affairs	Non-Fiduciary Fees - Tuition Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
36	R	Common University-wide events	Non-Fiduciary Fees - Tuition Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
37	S	Common Fund Universityhood	Non-Fiduciary Fees - Tuition Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
38	T1	Registration Fee COL - Registrar	Fiduciary Fees - College	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
39	T2	Registration Fee COL - Student Financial Services	Fiduciary Fees - College	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
40	U1	Laboratory Fee COL CASS	Fiduciary Fees - College	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
41	U2	Laboratory Fee COL CAFC	Fiduciary Fees - College	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
42	U3	Laboratory Fee COL CTE	Fiduciary Fees - College	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
43	U4	Laboratory Fee COL HT	Fiduciary Fees - College	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
44	U5	Laboratory Fee COL CMCS	Fiduciary Fees - College	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
45	V	Library Fee COL	Fiduciary Fees - College	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
46	W	Medical and Dental Fee COL	Fiduciary Fees - College	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
47	X	Computer Fee COL	Fiduciary Fees - College	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
48	Y	Internet Fee COL	Fiduciary Fees - College	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
49	Z	Student Development Fee COL	Fiduciary Fees - College	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
50	AA	Athletic Fee COL	Fiduciary Fees - College	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
51	AB	Cultural Fee COL	Fiduciary Fees - College	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
52	AC	NSTP/ROTC Fee COL	Fiduciary Fees - College	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
53	AD	School ID Fee COL	Fiduciary Fees - College	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
54	AE	Guidance Fee COL	Fiduciary Fees - College	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
55	AF	School Publication Fee COL	Fiduciary Fees - College	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
56	AG	Handbook Fee COL	Fiduciary Fees - College	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
57	AH	Testing/Entrance Fee COL	Fiduciary Fees - College	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
58	AI	SCUAA/CARAA Fee COL	Fiduciary Fees - College	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
59	AJ	Student Development Fee JHS	Fiduciary Fees - JHS	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
60	AK	Computer Fee JHS	Fiduciary Fees - JHS	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
61	AL	Registration Fee JHS	Fiduciary Fees - JHS	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
62	AM	Athletic Fee JHS	Fiduciary Fees - JHS	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
63	AN	Medical and Dental Fee JHS	Fiduciary Fees - JHS	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
64	AO	Library Fee JHS	Fiduciary Fees - JHS	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
65	AP	Guidance Fee JHS	Fiduciary Fees - JHS	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
66	AQ	Socio-Cultural Fee JHS	Fiduciary Fees - JHS	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
67	AR	Student Insurance Fee JHS	Fiduciary Fees - JHS	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
68	AS	OSF - Miscellaneous Fee	Fiduciary Fees - Other School Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
69	AT	OSF - Student Insurance Fees	Fiduciary Fees - Other School Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
70	AU	OSF - Official Transcript of Records	Fiduciary Fees - Other School Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
71	AV	OSF - Authentication/Certification	Fiduciary Fees - Other School Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
72	AW	OSF - Good Moral Character	Fiduciary Fees - Other School Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
73	AX	OSF - Add/Change/Drop Subject/Shifting Fee	Fiduciary Fees - Other School Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
74	AY	OSF - Practice Fee/OJT	Fiduciary Fees - Other School Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
75	AZ	OSF - PLEF	Fiduciary Fees - Other School Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
76	BA	OSF - Affiliation	Fiduciary Fees - Other School Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
77	BB	OSF - Reserve Fund	Fiduciary Fees - Other School Fees	Official FY 2026 WFP particular	Active	2026-10-24 15:11:40.207057+08	2026-10-24 15:11:40.207057+08
\.


--
-- TOC entry 5913 (class 0 OID 38184)
-- Dependencies: 258
-- Data for Name: fhe_deficiency; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fhe_deficiency (id, fiscal_year, academic_year, enrolled_students, qualified_students, saro_no, saro_date, nca_no, nca_date, saro_amount, nca_received, actual_billing, mdp, deficiency_amount, remarks, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5919 (class 0 OID 38252)
-- Dependencies: 264
-- Data for Name: financial_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.financial_reports (id, report_type, report_name, fiscal_year, period_type, period_value, fund_cluster_id, generated_by, file_format, file_path, status, created_at) FROM stdin;
\.


--
-- TOC entry 5899 (class 0 OID 37736)
-- Dependencies: 244
-- Data for Name: fiscal_years; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fiscal_years (id, year, is_current, is_closed, created_at) FROM stdin;
1	2026	t	f	2026-10-03 13:34:25.864594
\.


--
-- TOC entry 5903 (class 0 OID 37840)
-- Dependencies: 248
-- Data for Name: fund_allocations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fund_allocations (id, fiscal_year, fund_source_id, fund_cluster_id, campus_id, responsibility_center_id, wfp_source_id, allocation_amount, utilized_amount, disbursed_amount, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5881 (class 0 OID 37554)
-- Dependencies: 226
-- Data for Name: fund_clusters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fund_clusters (id, fund_source_id, code, name, description, is_active, created_at, updated_at) FROM stdin;
1	1	101 GENERAL FUND	101 GENERAL FUND	General Fund	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
2	1	164 MAIN SHS	164 MAIN SHS	Main Senior High School fund	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
3	1	164 LP TRUST	164 LP TRUST	La Paz Trust fund	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
4	1	164 MAIN TRUST	164 MAIN TRUST	Main Trust fund	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
5	2	164 BGD GS	164 BGD GS	Bangued Grade School fund	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
6	2	164 BGD SHS	164 BGD SHS	Bangued Senior High School fund	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
7	2	164 BGD TRUST	164 BGD TRUST	Bangued Trust fund	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
8	3	164 DOST-NRCP	164 DOST-NRCP	DOST-NRCP fund	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
9	5	164 CHED-CAR-TES	164 CHED-CAR-TES	CHED-CAR TES fund	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
10	6	OTHER FUND	OTHER FUND	Other institutional funds	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
11	7	161 MAIN	161 MAIN	Fund 161 Main - Business Related Funds / IGP.	t	2026-10-03 16:34:21.72019	2026-10-03 16:34:21.72019
12	7	161 BGD	161 BGD	Fund 161 Bangued - Business Related Funds / IGP.	t	2026-10-03 16:34:21.72019	2026-10-03 16:34:21.72019
13	2	164 BGD JHS	164 BGD JHS	Imported from FY2026 RBUD Excel workbook	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
14	3	164 DOST-CAR	164 DOST-CAR	Imported from FY2026 RBUD Excel workbook	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
15	3	164 DOST-PCAARRD	164 DOST-PCAARRD	Imported from FY2026 RBUD Excel workbook	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
16	3	164 DOST-PTRI	164 DOST-PTRI	Imported from FY2026 RBUD Excel workbook	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
17	4	164 DA-COFFEE SEEDLINGS	164 DA-COFFEE SEEDLINGS	Imported from FY2026 RBUD Excel workbook	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
18	4	164 DA-ACEF -MANGO PROCESSING 07 - TRUST RECEIPTS	164 DA-ACEF -MANGO PROCESSING 07 - TRUST RECEIPTS	Imported from FY2026 RBUD Excel workbook	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
19	4	164 DA-ACEF TISSUE CULTURE 07 - TRUST RECEIPTS	164 DA-ACEF TISSUE CULTURE 07 - TRUST RECEIPTS	Imported from FY2026 RBUD Excel workbook	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
20	5	164 CHED-CAR-TDP-TES	164 CHED-CAR-TDP-TES	Imported from FY2026 RBUD Excel workbook	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
21	5	164 CHED-IDIG 07 - TRUST RECEIPTS	164 CHED-IDIG 07 - TRUST RECEIPTS	Imported from FY2026 RBUD Excel workbook	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
\.


--
-- TOC entry 5953 (class 0 OID 49807)
-- Dependencies: 303
-- Data for Name: fund_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fund_codes (id, fund_cluster_id, code, name, description, is_active, created_at, updated_at) FROM stdin;
1	5	BGD-FIDU-ID-GS	BGD-FIDU-ID-GS	\N	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
2	5	BGD-FIDU-LIB-GS	BGD-FIDU-LIB-GS	\N	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
3	5	BGD-FIDU-MDF-GS	BGD-FIDU-MDF-GS	\N	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
4	5	BGD-FIDU-REG-GS	BGD-FIDU-REG-GS	\N	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
5	5	BGD-FIDU-SDF-GS	BGD-FIDU-SDF-GS	\N	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
6	13	BGD-FIDU-ATH-JHS	BGD-FIDU-ATH-JHS	\N	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
7	13	BGD-FIDU-COMP-JHS	BGD-FIDU-COMP-JHS	\N	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
8	13	BGD-FIDU-ID-JHS	BGD-FIDU-ID-JHS	\N	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
9	13	BGD-FIDU-LIB-JHS	BGD-FIDU-LIB-JHS	\N	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
10	13	BGD-FIDU-SDF-JHS	BGD-FIDU-SDF-JHS	\N	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
11	13	BGD-FIDU-SPF-JHS	BGD-FIDU-SPF-JHS	\N	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
12	6	BGD-SHS	BGD-SHS	\N	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
13	20	LAG-CHED-CAR-TDP-TES	LAG-CHED-CAR-TDP-TES	\N	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
14	9	LAG-CHED-CAR-TES	LAG-CHED-CAR-TES	\N	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
15	21	LAG-CHED-IDIG-EPSLT	LAG-CHED-IDIG-EPSLT	\N	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
16	21	LAG-CHED-IDIG-LIB	LAG-CHED-IDIG-LIB	\N	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
17	18	LAG-DA-ACEF MANGO	LAG-DA-ACEF MANGO	\N	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
18	19	LAG-DA-ACEF TISSUE CULTURE	LAG-DA-ACEF TISSUE CULTURE	\N	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
19	17	LAG-DA-ACEF COFFEE	LAG-DA-ACEF COFFEE	\N	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
20	14	LAG-DOST-CAR-AFSOM	LAG-DOST-CAR-AFSOM	\N	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
21	15	LAG-DOST-PCAARRD-LAKATAN	LAG-DOST-PCAARRD-LAKATAN	\N	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
22	16	LAG-DOST-PTRI	LAG-DOST-PTRI	\N	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
23	2	LAG-SHS-OPEX-W	LAG-SHS-OPEX-W	\N	t	2026-10-08 19:46:24.334494	2026-10-08 19:46:24.334494
24	12	BGD-BID-DOCS	BGD-BID-DOCS	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
25	12	BGD-OTHERS	BGD-OTHERS	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
26	12	BGD-PROD-IGP	BGD-PROD-IGP	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
27	11	LAG-IGP-ORCHARD	LAG-IGP-ORCHARD	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
28	11	LAG-IGP-PIGGERY-PROJ	LAG-IGP-PIGGERY-PROJ	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
29	11	LAG-IGP-POULTRY-PROJ	LAG-IGP-POULTRY-PROJ	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
30	11	LAG-IGP-RANCH	LAG-IGP-RANCH	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
31	11	LAG-IGP-RENT-COTTAGES	LAG-IGP-RENT-COTTAGES	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
32	11	LAG-IGP-RENT-CSPACE	LAG-IGP-RENT-CSPACE	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
33	11	LAG-IGP-RENT-DORM	LAG-IGP-RENT-DORM	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
34	11	LAG-IGP-RENT-GH/FFP	LAG-IGP-RENT-GH/FFP	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
35	11	LAG-IGP-RICE-PROD	LAG-IGP-RICE-PROD	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
36	11	LAG-IGP-SEED-PROD	LAG-IGP-SEED-PROD	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
49	7	BGD-FIDU-ATH-COL	BGD-FIDU-ATH-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
50	7	BGD-FIDU-COMP-COL	BGD-FIDU-COMP-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
51	7	BGD-FIDU-CUL-COL	BGD-FIDU-CUL-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
52	7	BGD-FIDU-GF-COL	BGD-FIDU-GF-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
53	7	BGD-FIDU-ID-COL	BGD-FIDU-ID-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
54	7	BGD-FIDU-INTER-COL	BGD-FIDU-INTER-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
55	7	BGD-FIDU-LAB-COL-CE	BGD-FIDU-LAB-COL-CE	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
56	7	BGD-FIDU-LAB-COL-CIT	BGD-FIDU-LAB-COL-CIT	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
57	7	BGD-FIDU-LAB-COL-CTE	BGD-FIDU-LAB-COL-CTE	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
58	7	BGD-FIDU-LIB-COL	BGD-FIDU-LIB-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
59	7	BGD-FIDU-LIB-GS	BGD-FIDU-LIB-GS	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
60	7	BGD-FIDU-MDF-COL	BGD-FIDU-MDF-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
61	7	BGD-FIDU-NSTP-COL	BGD-FIDU-NSTP-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
62	7	BGD-FIDU-REG-COL	BGD-FIDU-REG-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
63	7	BGD-FIDU-SDF-COL	BGD-FIDU-SDF-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
64	7	BGD-FIDU-SDF-GS	BGD-FIDU-SDF-GS	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
65	7	BGD-FIDU-SDF-OSAS-COL	BGD-FIDU-SDF-OSAS-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
66	7	BGD-FIDU-SPF-COL	BGD-FIDU-SPF-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
67	7	BGD-FIDU-TEF-COL	BGD-FIDU-TEF-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
68	7	BGD-NF-TF-AUG-DIR	BGD-NF-TF-AUG-DIR	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
69	7	BGD-NF-TF-AUG-EAO	BGD-NF-TF-AUG-EAO	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
70	7	BGD-NF-TF-AUG-QA	BGD-NF-TF-AUG-QA	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
71	7	BGD-NF-TF-AUG-VPAA	BGD-NF-TF-AUG-VPAA	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
72	7	BGD-NF-TF-CF-ISO/ISA	BGD-NF-TF-CF-ISO/ISA	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
73	7	BGD-NF-TF-CF-NEW VIT	BGD-NF-TF-CF-NEW VIT	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
74	7	BGD-NF-TF-CF-OP	BGD-NF-TF-CF-OP	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
75	7	BGD-NF-TF-CF-RM	BGD-NF-TF-CF-RM	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
76	7	BGD-NF-TF-CF-SW	BGD-NF-TF-CF-SW	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
77	7	BGD-NF-TF-DRRM	BGD-NF-TF-DRRM	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
78	7	BGD-NF-TF-EXT	BGD-NF-TF-EXT	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
79	7	BGD-NF-TF-GASS-ACCTG	BGD-NF-TF-GASS-ACCTG	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
80	7	BGD-NF-TF-GASS-AO	BGD-NF-TF-GASS-AO	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
81	7	BGD-NF-TF-GASS-BUDGET	BGD-NF-TF-GASS-BUDGET	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
82	7	BGD-NF-TF-GASS-CASH	BGD-NF-TF-GASS-CASH	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
83	7	BGD-NF-TF-GASS-GA	BGD-NF-TF-GASS-GA	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
84	7	BGD-NF-TF-GASS-GENSER	BGD-NF-TF-GASS-GENSER	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
85	7	BGD-NF-TF-GASS-HRMO	BGD-NF-TF-GASS-HRMO	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
86	7	BGD-NF-TF-GASS-PPBMO	BGD-NF-TF-GASS-PPBMO	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
87	7	BGD-NF-TF-GASS-SECURITY	BGD-NF-TF-GASS-SECURITY	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
88	7	BGD-NF-TF-GASS-SUPPLY	BGD-NF-TF-GASS-SUPPLY	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
89	7	BGD-NF-TF-GS	BGD-NF-TF-GS	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
90	7	BGD-NF-TF-HED-CASS	BGD-NF-TF-HED-CASS	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
91	7	BGD-NF-TF-HED-CE	BGD-NF-TF-HED-CE	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
92	7	BGD-NF-TF-HED-CIT	BGD-NF-TF-HED-CIT	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
93	7	BGD-NF-TF-HED-CIT DEAN	BGD-NF-TF-HED-CIT DEAN	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
94	7	BGD-NF-TF-HED-CIT Dean	BGD-NF-TF-HED-CIT Dean	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
95	7	BGD-NF-TF-HED-CTE	BGD-NF-TF-HED-CTE	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
96	7	BGD-NF-TF-PROD	BGD-NF-TF-PROD	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
97	7	BGD-NF-TF-RES	BGD-NF-TF-RES	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
98	7	BGD-OSF-CERT/AUTH-COL	BGD-OSF-CERT/AUTH-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
99	7	BGD-OSF-GRADFEE	BGD-OSF-GRADFEE	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
100	7	BGD-OSF-MISC-COL	BGD-OSF-MISC-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
101	7	BGD-OSF-OJT-CASS	BGD-OSF-OJT-CASS	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
102	7	BGD-OSF-OJT-CE	BGD-OSF-OJT-CE	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
103	7	BGD-OSF-OJT-CIT	BGD-OSF-OJT-CIT	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
104	7	BGD-OSF-PLEF-CASS	BGD-OSF-PLEF-CASS	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
105	7	BGD-OSF-PLEF-CE	BGD-OSF-PLEF-CE	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
106	7	BGD-OSF-PLEF-CIT	BGD-OSF-PLEF-CIT	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
107	7	BGD-OSF-PLEF-CTE	BGD-OSF-PLEF-CTE	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
108	7	BGD-OSF-ROTC	BGD-OSF-ROTC	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
117	8	LAG-DOST-NRCP-WEMP	LAG-DOST-NRCP-WEMP	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
120	3	LP-FIDU-ATH-COL	LP-FIDU-ATH-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
121	3	LP-FIDU-CUL-COL	LP-FIDU-CUL-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
122	3	LP-FIDU-GF-COL	LP-FIDU-GF-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
123	3	LP-FIDU-ID-COL	LP-FIDU-ID-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
124	3	LP-FIDU-INTER-COL	LP-FIDU-INTER-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
125	3	LP-FIDU-MDF-COL	LP-FIDU-MDF-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
126	3	LP-FIDU-NSTP-COL	LP-FIDU-NSTP-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
127	3	LP-FIDU-OSF-PLEF	LP-FIDU-OSF-PLEF	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
128	3	LP-FIDU-REG-COL	LP-FIDU-REG-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
129	3	LP-FIDU-REG-COL-SF	LP-FIDU-REG-COL-SF	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
130	3	LP-FIDU-SCUAA-COL	LP-FIDU-SCUAA-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
131	3	LP-FIDU-SDF-COL	LP-FIDU-SDF-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
132	3	LP-FIDU-SPF-COL	LP-FIDU-SPF-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
133	3	LP-FIDU-TEF-COL	LP-FIDU-TEF-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
134	3	LP-NF-TF-CF-OP	LP-NF-TF-CF-OP	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
135	3	LP-NF-TF-CF-VPAA	LP-NF-TF-CF-VPAA	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
136	3	LP-NF-TF-DRRM	LP-NF-TF-DRRM	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
137	3	LP-NF-TF-EXT	LP-NF-TF-EXT	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
138	3	LP-NF-TF-GASS	LP-NF-TF-GASS	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
139	3	LP-NF-TF-HED-CAMPDIR	LP-NF-TF-HED-CAMPDIR	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
140	3	LP-NF-TF-HED-CASS	LP-NF-TF-HED-CASS	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
141	3	LP-NF-TF-HED-CCJE	LP-NF-TF-HED-CCJE	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
142	3	LP-NF-TF-RES	LP-NF-TF-RES	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
144	4	LAG-FIDU-COMP-COL	LAG-FIDU-COMP-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
145	4	LAG-FIDU-COMP-JHS	LAG-FIDU-COMP-JHS	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
146	4	LAG-FIDU-CUL-COL	LAG-FIDU-CUL-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
147	4	LAG-FIDU-GF-COL	LAG-FIDU-GF-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
148	4	LAG-FIDU-GF-JHS	LAG-FIDU-GF-JHS	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
149	4	LAG-FIDU-ID-COL	LAG-FIDU-ID-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
150	4	LAG-FIDU-INTER-COL	LAG-FIDU-INTER-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
151	4	LAG-FIDU-LIB-COL	LAG-FIDU-LIB-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
152	4	LAG-FIDU-MDF-COL	LAG-FIDU-MDF-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
153	4	LAG-FIDU-NSTP-COL	LAG-FIDU-NSTP-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
154	4	LAG-FIDU-OSF-CERT	LAG-FIDU-OSF-CERT	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
155	4	LAG-FIDU-OSF-GRADFEE	LAG-FIDU-OSF-GRADFEE	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
156	4	LAG-FIDU-OSF-INSU	LAG-FIDU-OSF-INSU	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
157	4	LAG-FIDU-OSF-OTR	LAG-FIDU-OSF-OTR	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
158	4	LAG-FIDU-REG-COL	LAG-FIDU-REG-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
159	4	LAG-FIDU-REG-COL-SF	LAG-FIDU-REG-COL-SF	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
160	4	LAG-FIDU-REG-JHS	LAG-FIDU-REG-JHS	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
161	4	LAG-FIDU-SDF-COL	LAG-FIDU-SDF-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
162	4	LAG-FIDU-SDF-JHS	LAG-FIDU-SDF-JHS	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
163	4	LAG-FIDU-SPF-COL	LAG-FIDU-SPF-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
164	4	LAG-FIDU-TEF-COL	LAG-FIDU-TEF-COL	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
165	4	LAG-NF-TF-CF-OP	LAG-NF-TF-CF-OP	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
166	4	LAG-NF-TF-CF-VPAA	LAG-NF-TF-CF-VPAA	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
167	4	LAG-NF-TF-DRRM	LAG-NF-TF-DRRM	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
168	4	LAG-NF-TF-EXT	LAG-NF-TF-EXT	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
169	4	LAG-NF-TF-GASS	LAG-NF-TF-GASS	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
170	4	LAG-NF-TF-HED-CAFC	LAG-NF-TF-HED-CAFC	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
171	4	LAG-NF-TF-HED-CASS	LAG-NF-TF-HED-CASS	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
172	4	LAG-NF-TF-HED-CMCS	LAG-NF-TF-HED-CMCS	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
173	4	LAG-NF-TF-HED-CTE	LAG-NF-TF-HED-CTE	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
174	4	LAG-NF-TF-HED-D-ARS	LAG-NF-TF-HED-D-ARS	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
175	4	LAG-NF-TF-HED-HT	LAG-NF-TF-HED-HT	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
176	4	LAG-NF-TF-HED-QA	LAG-NF-TF-HED-QA	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
177	4	LAG-NF-TF-HED-VPAA	LAG-NF-TF-HED-VPAA	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
178	4	LAG-NF-TF-PROD	LAG-NF-TF-PROD	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
179	4	LAG-NF-TF-RES	LAG-NF-TF-RES	\N	t	2026-10-08 19:56:10.443411	2026-10-08 19:56:10.443411
\.


--
-- TOC entry 5879 (class 0 OID 37534)
-- Dependencies: 224
-- Data for Name: fund_sources; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fund_sources (id, code, name, description, is_active, created_at, updated_at) FROM stdin;
1	MAIN	Main Funds	Main institutional funds	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
2	BGD	Bangued Funds	Funds associated with Bangued campus	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
3	DOST	DOST Funds	Department of Science and Technology funds	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
4	DA	DA Funds	Department of Agriculture funds	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
5	CHED	CHED Funds	Commission on Higher Education funds	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
6	OTHER	Other Funds	Other institutional or external funds	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
7	161	Revolving Fund	Fund 161 - Income Generating Program / Project (IGP), based on FY2026 Excel registry.	t	2026-10-03 16:34:21.72019	2026-10-03 16:34:21.72019
\.


--
-- TOC entry 5938 (class 0 OID 49408)
-- Dependencies: 287
-- Data for Name: igp_programs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.igp_programs (id, fiscal_year, fund_source_id, program_code, program_name, description, campus_id, responsibility_center_id, allocation_amount, status, created_by, updated_by, created_at, updated_at, start_date, fund_cluster_id, wfp_source_id, wfp_source_code, beginning_balance, projected_income) FROM stdin;
22	2026	7	LAG IGP RICE PROD	RICE PRODUCTION	dgdggd	3	1	1000000.00	Active	1	1	2026-10-10 20:03:43.944161	2026-10-10 20:03:43.944161	2026-10-10	11	10	CF	10000.00	100000.00
\.


--
-- TOC entry 5941 (class 0 OID 49457)
-- Dependencies: 290
-- Data for Name: igp_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.igp_transactions (id, transaction_no, transaction_date, fiscal_year, fund_source_id, igp_program_id, transaction_type, reference_no, description, income_amount, utilization_amount, remarks, status, created_by, updated_by, created_at, updated_at, program_id, registry_no, fund_cluster_id, campus_id, burs_serial_no, serial_no_transferred, payee, responsibility_center_id, pap_id, uacs_code_id, allotment_class_id, uacs_funding_source_code, month, series, series2, quarter, object_expenditure_id, mfo_id, old_uacs_code_id, account_title, ps_utilization, mooe_utilization, co_utilization, wfp_source_id, wfp_source_code, dv_payroll_no, disbursement_amount, running_balance, unpaid_utilization, po_no, iar_no, par_no, ics_no, ris_no, status_of_po, po_status) FROM stdin;
4	IGP-161-2026-000008	2026-10-10	2026	7	22	Income	001	fjfljf	10000.00	0.00	lslldhlslhaalh	Posted	1	1	2026-10-10 20:30:07.86168	2026-10-10 20:30:07.86168	22	IGP-161-2026-000008	11	3	BURS-161-2026-000008	\N	Trisha Mae Gapuz	1	1	17	2	\N	10	\N	\N	4	\N	10	9	Other Supplies and Materials Expenses	0.00	0.00	0.00	10	CF	\N	0.00	0.00	0.00	\N	\N	\N	\N	\N	\N	\N
\.


--
-- TOC entry 5887 (class 0 OID 37617)
-- Dependencies: 232
-- Data for Name: mfo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mfo (id, code, name, description, is_active, created_at, updated_at) FROM stdin;
6	HIGHER ED	HIGHER ED	MFO value used in the FY2026 Fund 161 Revolving Fund / IGP Excel.	t	2026-10-04 18:55:51.86026	2026-10-08 21:37:57.058316
7	EXTENSION	EXTENSION	\N	t	2026-10-08 21:37:57.058316	2026-10-08 21:37:57.058316
8	RESEARCH	RESEARCH	\N	t	2026-10-08 21:37:57.058316	2026-10-08 21:37:57.058316
9	GASS	GASS	\N	t	2026-10-08 21:37:57.058316	2026-10-08 21:37:57.058316
10	AUXILIARY	AUXILIARY	\N	t	2026-10-08 21:37:57.058316	2026-10-08 21:37:57.058316
\.


--
-- TOC entry 5915 (class 0 OID 38211)
-- Dependencies: 260
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, recipient_role, title, message, type, is_read, created_at) FROM stdin;
4	4	\N	Account Approved!	Congratulations Mae Trisha Gapuz, your BMAS account has been approved. You can now log in.	approval	t	2026-10-04 08:46:36.659134
7	1	\N	Account Updated	Your BMAS account information was updated by the Administrator.	system	t	2026-10-15 10:00:14.169171
5	3	\N	Account Approved!	Congratulations Gapuz Trisha Mae, your BMAS account has been approved. You can now log in.	approval	t	2026-10-04 08:46:44.751574
6	2	\N	Account Approved!	Congratulations Trisha Mae Gapuz, your BMAS account has been approved. You can now log in.	approval	t	2026-10-04 08:46:49.154505
1	\N	Administration	New User Registration	A new user "Trisha Mae Gapuz" has registered as Budget and is waiting for approval.	registration	t	2026-10-04 08:34:10.09567
2	\N	Administration	New User Registration	A new user "Gapuz Trisha Mae" has registered as Procurement and is waiting for approval.	registration	t	2026-10-04 08:37:10.39549
3	\N	Administration	New User Registration	A new user "Mae Trisha Gapuz" has registered as Accountant and is waiting for approval.	registration	t	2026-10-04 08:38:28.83676
\.


--
-- TOC entry 5893 (class 0 OID 37676)
-- Dependencies: 238
-- Data for Name: object_expenditures; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.object_expenditures (id, code, name, description, is_active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5889 (class 0 OID 37637)
-- Dependencies: 234
-- Data for Name: pap; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pap (id, code, name, description, is_active, created_at, updated_at) FROM stdin;
1	CASS	CASS	P/A/P identifier observed in FY2026 WFP material	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
2	CAFC	CAFC	P/A/P identifier observed in FY2026 WFP material	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
3	CTE	CTE	P/A/P identifier observed in FY2026 WFP material	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
\.


--
-- TOC entry 5925 (class 0 OID 38323)
-- Dependencies: 270
-- Data for Name: preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.preferences (id, user_id, items_per_page, theme, sidebar_position, dashboard_overview, auto_logout_minutes, confirm_before_delete, enable_animations, created_at, updated_at) FROM stdin;
16	2	10	Light	Fixed	t	30	t	t	2026-10-15 16:26:52.950647	2026-10-15 16:26:52.950647
1	1	10	Light	Fixed	t	60	t	t	2026-10-03 19:37:12.388361	2026-10-15 16:52:53.235355
18	3	10	Light	Fixed	t	30	t	t	2026-10-17 09:22:57.566874	2026-10-17 09:22:57.566874
19	4	10	Light	Fixed	t	30	t	t	2026-10-17 09:23:13.604702	2026-10-17 09:23:13.604702
\.


--
-- TOC entry 5949 (class 0 OID 49768)
-- Dependencies: 299
-- Data for Name: raod_adjustments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.raod_adjustments (id, raod_entry_id, registry_no, fiscal_year, adjustment_no, field_name, reason, old_value, new_value, adjusted_by_id, adjusted_by_name, adjusted_by_role, created_at) FROM stdin;
1	3	101-2026-0003	2026	NOA-2026-0001	disbursement_amount	Correction of disbursement amount	{"disbursement_amount": "500.00"}	{"disbursement_amount": 450}	4	Mae Trisha Gapuz	Accountant	2026-10-07 11:26:37.741134
\.


--
-- TOC entry 5947 (class 0 OID 49683)
-- Dependencies: 297
-- Data for Name: raod_audit_trail; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.raod_audit_trail (id, raod_entry_id, registry_no, action, performed_by_id, performed_by_name, performed_by_email, performed_by_role, changed_fields, old_values, new_values, ip_address, user_agent, created_at) FROM stdin;
28	5	101-2026-0001	CREATE	1	System Administrator	\N	Administration	["registry_no", "burs_serial_no", "entry_date", "fund_cluster_id", "fund_source_id", "campus_id", "payee", "particulars", "responsibility_center_id", "pap_id", "uacs_code_id", "ref_no", "allotment_class_id", "fiscal_year", "month", "quarter", "mfo_id", "account_title", "obligation_amount", "ps_amount", "mooe_amount", "co_amount", "wfp_source_id", "wfp_source_code", "disbursement_amount", "unpaid_obligation"]	null	{"id": 5, "dv_no": null, "month": 10, "payee": "Trisha Mae Gapuz", "po_no": null, "iar_no": null, "ics_no": null, "mfo_id": 9, "pap_id": 2, "par_no": null, "ref_no": "001", "ris_no": null, "series": null, "status": "Pending", "quarter": 4, "remarks": null, "series2": null, "campus_id": 3, "co_amount": "0.00", "ps_amount": "100000.00", "created_at": "2026-10-11T04:01:11.559Z", "created_by": 1, "entry_date": "2026-10-10T16:00:00.000Z", "updated_at": "2026-10-11T04:01:11.559Z", "updated_by": 1, "fiscal_year": 2026, "mooe_amount": "0.00", "particulars": "jjfjjd", "registry_no": "101-2026-0001", "status_of_po": null, "uacs_code_id": 12, "account_title": "Other Maintenance and Operating Expenses", "dv_payroll_no": null, "ors_serial_no": "ORS-2026-0001", "wfp_source_id": 5, "burs_serial_no": "BURS-2026-0001", "fund_source_id": 1, "fund_cluster_id": 1, "wfp_source_code": "CT", "workflow_status": "ACTIVE", "allotment_amount": "0.00", "old_uacs_code_id": null, "obligation_amount": "5000.00", "unpaid_obligation": "5000.00", "allotment_class_id": 1, "disbursement_amount": "0.00", "object_expenditure_id": null, "serial_no_transferred": null, "responsibility_center_id": 1, "uacs_funding_source_code": null}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36	2026-10-11 12:01:11.559741
29	5	101-2026-0001	UPDATE	3	Gapuz Trisha Mae	\N	Procurement	["po_no", "iar_no", "par_no", "ics_no", "ris_no", "po_status"]	{"po_no": null, "iar_no": null, "ics_no": null, "par_no": null, "ris_no": null, "po_status": null}	{"po_no": "PO-2026-0001", "iar_no": "IAR-2026-0001", "ics_no": "ICS-2026-0001", "par_no": "PAR-2026-0001", "ris_no": "RIS-2026-0001", "po_status": "COMPLETED"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0	2026-10-15 10:56:32.018969
30	5	101-2026-0001	UPDATE	4	Mae Trisha Gapuz	\N	Accountant	["dv_payroll_no", "disbursement_amount", "unpaid_obligation"]	{"dv_payroll_no": null, "unpaid_obligation": "5000.00", "disbursement_amount": "0.00"}	{"dv_payroll_no": "DV-2026-0001", "unpaid_obligation": "4994.00", "disbursement_amount": "6.00"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0	2026-10-15 10:58:42.621345
\.


--
-- TOC entry 5907 (class 0 OID 37985)
-- Dependencies: 252
-- Data for Name: raod_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.raod_entries (id, registry_no, entry_date, fund_cluster_id, fund_source_id, campus_id, ors_serial_no, serial_no_transferred, payee, particulars, responsibility_center_id, pap_id, uacs_code_id, ref_no, allotment_class_id, uacs_funding_source_code, fiscal_year, month, series, series2, quarter, object_expenditure_id, mfo_id, wfp_source_id, wfp_source_code, allotment_amount, obligation_amount, disbursement_amount, ps_amount, mooe_amount, co_amount, dv_no, po_no, burs_serial_no, remarks, created_by, updated_by, created_at, updated_at, status, old_uacs_code_id, account_title, unpaid_obligation, status_of_po, dv_payroll_no, iar_no, par_no, ics_no, ris_no, workflow_status) FROM stdin;
5	101-2026-0001	2026-10-11	1	1	3	ORS-2026-0001	\N	Trisha Mae Gapuz	jjfjjd	1	2	12	001	1	\N	2026	10	\N	\N	4	\N	9	5	CT	0.00	5000.00	6.00	100000.00	0.00	0.00	\N	PO-2026-0001	BURS-2026-0001	\N	1	4	2026-10-11 12:01:11.559741	2026-10-15 10:58:42.609343	Pending	\N	Other Maintenance and Operating Expenses	4994.00	COMPLETED	DV-2026-0001	IAR-2026-0001	PAR-2026-0001	ICS-2026-0001	RIS-2026-0001	ACTIVE
\.


--
-- TOC entry 5951 (class 0 OID 49787)
-- Dependencies: 301
-- Data for Name: raod_final_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.raod_final_reviews (id, raod_entry_id, registry_no, final_review_status, reviewed_by_id, reviewed_by_name, reviewed_by_role, remarks, reviewed_at) FROM stdin;
\.


--
-- TOC entry 5945 (class 0 OID 49659)
-- Dependencies: 295
-- Data for Name: rbud_audit_trail; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rbud_audit_trail (id, rbud_entry_id, registry_no, action, performed_by_id, performed_by_name, performed_by_email, performed_by_role, changed_fields, old_values, new_values, created_at) FROM stdin;
1	2	RBUD-2026-0002	UPDATE	1	System Administrator	\N	Administration	["entry_date", "remarks"]	{"remarks": "TEST RECORD - FOR SYSTEM TESTING ONLY", "entry_date": "2026-10-02T16:00:00.000Z"}	{"remarks": "TEST RECORD - FOR SYSTEM TESTING ONLY1", "entry_date": "2026-10-01T16:00:00.000Z"}	2026-10-05 20:13:03.397397+08
2	2	RBUD-2026-0002	UPDATE	1	System Administrator	\N	Administration	["entry_date", "particulars"]	{"entry_date": "2026-10-01T16:00:00.000Z", "particulars": "Budget Test"}	{"entry_date": "2026-09-30T16:00:00.000Z", "particulars": "Budget Test1"}	2026-10-05 20:13:40.07131+08
3	2	RBUD-2026-0002	UPDATE	3	Gapuz Trisha Mae	\N	Procurement	["po_no", "iar_no", "par_no", "ics_no", "ris_no", "status_of_po"]	{"po_no": "TEST-PO-001", "iar_no": "", "ics_no": "", "par_no": "", "ris_no": "", "status_of_po": ""}	{"po_no": "PO-RBUD-2026-0001", "iar_no": "IAR-RBUD-2026-0001", "ics_no": "ICS-RBUD-2026-0001", "par_no": "PAR-RBUD-2026-0002", "ris_no": "RIS-RBUD-2026-0001", "status_of_po": "completed"}	2026-10-05 20:20:18.562086+08
4	2	RBUD-2026-0002	UPDATE	4	Mae Trisha Gapuz	\N	Accountant	["dv_payroll_no", "disbursement_amount"]	{"dv_payroll_no": "", "disbursement_amount": "0.00"}	{"dv_payroll_no": "DV-RBUD-2026-001", "disbursement_amount": "2000.00"}	2026-10-05 20:25:18.932273+08
5	2	RBUD-2026-0002	UPDATE	1	System Administrator	\N	Administration	["entry_date", "fund_cluster_id"]	{"entry_date": "2026-09-30T16:00:00.000Z", "fund_cluster_id": 5}	{"entry_date": "2026-09-29T16:00:00.000Z", "fund_cluster_id": 1}	2026-10-05 20:31:06.067903+08
6	2	RBUD-2026-0002	UPDATE	1	System Administrator	\N	Administration	["entry_date", "particulars"]	{"entry_date": "2026-09-29T16:00:00.000Z", "particulars": "Budget Test1"}	{"entry_date": "2026-09-28T16:00:00.000Z", "particulars": "Budget Test"}	2026-10-05 21:36:30.488541+08
7	3	RBUD-2026-0003	CREATE	1	System Administrator	\N	Administration	["registry_no", "entry_date", "fund_cluster_id", "fund_source_id", "campus_id", "fund_code", "burs_serial_no", "payee", "particulars", "responsibility_center_id", "pap_id", "uacs_code_id", "ref_no", "allotment_class_id", "fiscal_year", "object_expenditure_id", "mfo_id", "utilization_amount", "ps_utilization", "mooe_utilization", "co_utilization", "wfp_source_id", "disbursement_amount", "running_balance", "unpaid_utilization"]	null	{"id": 3, "month": null, "payee": "trisha", "po_no": null, "iar_no": null, "ics_no": null, "mfo_id": 2, "pap_id": 1, "par_no": null, "ref_no": "002", "ris_no": null, "series": null, "status": "Active", "quarter": null, "remarks": "", "series2": null, "campus_id": 3, "fund_code": "MAIN", "po_status": null, "created_at": "2026-10-07T12:29:33.365Z", "created_by": null, "entry_date": "2026-10-06T16:00:00.000Z", "updated_at": "2026-10-07T12:29:33.365Z", "updated_by": null, "fiscal_year": 2026, "particulars": "vhhghgh", "registry_no": "RBUD-2026-0003", "status_of_po": null, "uacs_code_id": 15, "account_title": null, "dv_payroll_no": null, "wfp_source_id": 2, "burs_serial_no": "02-5206441-2026-10-0003", "co_utilization": "0.00", "fund_source_id": 1, "ps_utilization": "0.00", "created_by_name": "System Administrator", "created_by_role": "Administration", "fund_cluster_id": 1, "running_balance": "0.00", "updated_by_name": null, "updated_by_role": null, "wfp_source_code": null, "mooe_utilization": "0.00", "old_uacs_code_id": null, "allotment_class_id": 2, "unpaid_utilization": "0.00", "utilization_amount": "1000.00", "disbursement_amount": "0.00", "object_expenditure_id": 2, "serial_no_transferred": "", "responsibility_center_id": 2, "uacs_funding_source_code": null}	2026-10-07 20:29:33.365671+08
8	4	RBUD-2026-0001	CREATE	1	System Administrator	\N	Administration	["registry_no", "entry_date", "fund_cluster_id", "fund_source_id", "campus_id", "fund_code", "burs_serial_no", "payee", "particulars", "responsibility_center_id", "pap_id", "uacs_code_id", "ref_no", "allotment_class_id", "fiscal_year", "month", "quarter", "mfo_id", "utilization_amount", "ps_utilization", "mooe_utilization", "co_utilization", "wfp_source_id", "disbursement_amount", "running_balance", "remarks", "unpaid_utilization"]	null	{"id": 4, "month": 10, "payee": "Trisha Mae Gapuz", "po_no": null, "iar_no": null, "ics_no": null, "mfo_id": 10, "pap_id": 1, "par_no": null, "ref_no": "001", "ris_no": null, "series": null, "status": "Active", "quarter": 4, "remarks": "dgdggdgg", "series2": null, "campus_id": 3, "fund_code": "LAG-IGP-RICE-PROD", "po_status": null, "created_at": "2026-10-09T12:18:11.726Z", "created_by": null, "entry_date": "2026-10-08T16:00:00.000Z", "updated_at": "2026-10-09T12:18:11.726Z", "updated_by": null, "fiscal_year": 2026, "particulars": "ggdgdgdk", "registry_no": "RBUD-2026-0001", "status_of_po": null, "uacs_code_id": 15, "account_title": null, "dv_payroll_no": null, "wfp_source_id": 2, "burs_serial_no": "02-5206441-2026-10-0001", "co_utilization": "0.00", "fund_source_id": 7, "ps_utilization": "0.00", "created_by_name": "System Administrator", "created_by_role": "Administration", "fund_cluster_id": 11, "running_balance": "1990000.00", "updated_by_name": null, "updated_by_role": null, "wfp_source_code": null, "mooe_utilization": "0.00", "old_uacs_code_id": null, "allotment_class_id": 2, "unpaid_utilization": "10000.00", "utilization_amount": "10000.00", "disbursement_amount": "0.00", "object_expenditure_id": null, "serial_no_transferred": "", "responsibility_center_id": 1, "uacs_funding_source_code": null}	2026-10-09 20:18:11.726177+08
9	4	RBUD-2026-0001	UPDATE	2	Trisha Mae Gapuz	\N	Budget	["entry_date", "remarks"]	{"remarks": "dgdggdgg", "entry_date": "2026-10-08T16:00:00.000Z"}	{"remarks": "jkhuj", "entry_date": "2026-10-07T16:00:00.000Z"}	2026-10-25 11:57:30.636811+08
\.


--
-- TOC entry 5905 (class 0 OID 37885)
-- Dependencies: 250
-- Data for Name: rbud_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rbud_entries (id, registry_no, entry_date, fund_cluster_id, fund_source_id, campus_id, burs_serial_no, serial_no_transferred, payee, particulars, responsibility_center_id, pap_id, uacs_code_id, ref_no, allotment_class_id, uacs_funding_source_code, fiscal_year, month, series, series2, quarter, object_expenditure_id, mfo_id, old_uacs_code_id, account_title, utilization_amount, ps_utilization, mooe_utilization, co_utilization, wfp_source_id, wfp_source_code, dv_payroll_no, disbursement_amount, running_balance, remarks, unpaid_utilization, created_by, updated_by, created_at, updated_at, status, po_no, status_of_po, po_status, fund_code, iar_no, par_no, ics_no, ris_no, created_by_name, created_by_role, updated_by_name, updated_by_role) FROM stdin;
4	RBUD-2026-0001	2026-10-08	11	7	3	02-5206441-2026-10-0001		Trisha Mae Gapuz	ggdgdgdk	1	1	15	001	2	\N	2026	10	\N	\N	4	\N	10	\N	\N	10000.00	0.00	0.00	0.00	2	\N	\N	0.00	1990000.00	jkhuj	10000.00	\N	\N	2026-10-09 20:18:11.726177	2026-10-25 11:57:30.461778	Active	\N	\N	\N	LAG-IGP-RICE-PROD	\N	\N	\N	\N	System Administrator	Administration	Trisha Mae Gapuz	Budget
\.


--
-- TOC entry 5961 (class 0 OID 49922)
-- Dependencies: 311
-- Data for Name: rbud_fee_budget_reference; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rbud_fee_budget_reference (id, fiscal_year, campus, fee_category, particulars, budget_amount, source_reference, created_by, updated_by, created_at, updated_at) FROM stdin;
1	2026	LAGANGILANG	Fiduciary Fees	Registration Fees	100000.00	WFP PRE sheet	1	1	2026-10-22 18:25:53.890446+08	2026-10-22 18:25:53.890446+08
2	2026	LA PAZ	Non-Fiduciary Fees	Laboratory Fee	100000.00	WFP PRE sheet	1	1	2026-10-22 19:42:32.462415+08	2026-10-22 19:42:32.462415+08
\.


--
-- TOC entry 5959 (class 0 OID 49900)
-- Dependencies: 309
-- Data for Name: rbud_fee_enrollment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rbud_fee_enrollment (id, fiscal_year, campus, billing_period, enrollee_count, created_by, updated_by, created_at, updated_at) FROM stdin;
1	2026	BANGUED	2nd Sem AY 2025–2026	2	1	1	2026-10-22 18:25:13.492797+08	2026-10-24 20:42:47.061428+08
\.


--
-- TOC entry 5957 (class 0 OID 49863)
-- Dependencies: 307
-- Data for Name: rbud_fee_monitoring; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rbud_fee_monitoring (id, fiscal_year, fee_category, particulars, campus, billing_period, reference_no, billing_amount, collected_amount, obligated_amount, disbursed_amount, remarks, created_by, updated_by, created_at, updated_at) FROM stdin;
4	2026	Fiduciary Fees	Registration Fees	BANGUED	2nd Sem Ay 2025 - 2026	002	100000.00	10000.00	0.00	0.00	gg	1	1	2026-10-22 18:28:37.791286+08	2026-10-22 19:39:57.390017+08
3	2026	Fiduciary Fees	Registration Fees	LAGANGILANG	2nd Sem AY 2025 - 2026	001	10000.00	2000.00	0.00	0.00	fdhfhf	1	1	2026-10-22 16:03:45.69594+08	2026-10-22 19:40:23.653433+08
5	2026	Non-Fiduciary Fees	Library Fee	LA PAZ	2nd Sem AY 2025 - 2026	003	20000.00	3000.00	0.00	0.00	\N	1	\N	2026-10-22 19:44:16.404844+08	2026-10-22 19:44:16.404844+08
7	2026	Non-Fiduciary Fees - Tuition Fees	Higher Education Services CASS	BANGUED	2nd Sem 2025 - 2026	005	1000.00	200.00	0.00	0.00	\N	1	1	2026-10-24 20:58:30.509243+08	2026-10-24 20:59:01.546302+08
8	2026	Fiduciary Fees - College	Registration Fee COL - Registrar	LAGANGILANG	2nd Sem 2025 - 2026	006	10000.00	5000.00	3000.00	999.99	\N	1	\N	2026-10-24 21:02:38.343297+08	2026-10-24 21:02:38.343297+08
\.


--
-- TOC entry 5921 (class 0 OID 38279)
-- Dependencies: 266
-- Data for Name: report_exports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.report_exports (id, report_type, fiscal_year, fund_cluster_id, format, generated_by, file_name, created_at) FROM stdin;
\.


--
-- TOC entry 5885 (class 0 OID 37597)
-- Dependencies: 230
-- Data for Name: responsibility_centers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.responsibility_centers (id, code, name, description, category, is_active, created_at, updated_at) FROM stdin;
1	I-A	I-A	Responsibility Center I-A	Responsibility Center	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
2	II-A	II-A	Responsibility Center II-A	Responsibility Center	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
3	III-A	III-A	Responsibility Center III-A	Responsibility Center	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
4	III-B	III-B	Responsibility Center III-B	Responsibility Center	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
5	III-C	III-C	Responsibility Center III-C	Responsibility Center	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
\.


--
-- TOC entry 5923 (class 0 OID 38301)
-- Dependencies: 268
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (id, system_name, system_acronym, institution, default_fiscal_year, default_date_format, default_timezone, currency_code, currency_symbol, created_at, updated_at) FROM stdin;
1	Budget Monitoring and Allocation System	BMAS	Abra State Institute of Sciences and Technology	2026	MM/DD/YYYY	Asia/Manila	PHP	₱	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
\.


--
-- TOC entry 5891 (class 0 OID 37657)
-- Dependencies: 236
-- Data for Name: uacs_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.uacs_codes (id, code, old_code, account_title, revised_description, account_description, category, is_active, created_at, updated_at) FROM stdin;
1	5010101000	\N	Salaries and Wages - Regular	Salaries and Wages	Regular salaries and wages	Personnel Services	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
2	5020101000	\N	Traveling Expenses	Traveling Expenses	Domestic and foreign travel expenses	MOOE	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
3	5020201000	\N	Training Expenses	Training Expenses	Training and development expenses	MOOE	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
4	5020301000	\N	Office Supplies Expenses	Office Supplies Expenses	Office supplies and materials	MOOE	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
5	5060405000	\N	Machinery and Equipment	Machinery and equipment	\N	Capital Outlay	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
6	5010201000	71102010	Other Compensation	Other Compensation	Other personnel compensation	Personnel Services	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
7	5020401000	72104010	Fuel, Oil and Lubricants	Fuel, Oil and Lubricants	Fuel and related expenses	MOOE	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
8	5020501000	72105010	Utility Expenses	Utility Expenses	Electricity, water and communication utilities	MOOE	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
9	5020601000	72106010	Communication Expenses	Communication Expenses	Communication expenses	MOOE	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
10	5020701000	72107010	Professional Services	Professional Services	Professional and consultancy services	MOOE	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
11	5020801000	72108010	General Services	General Services	General administrative services	MOOE	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
12	5029901000	72199010	Other Maintenance and Operating Expenses	Other MOOE	Other maintenance and operating expenses	MOOE	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
13	50212990-00	795	Other General Services	Other General Services	Other General Services	MOOE	t	2026-10-04 18:44:32.422011	2026-10-04 18:44:32.422011
14	50102100-01	720	Honoraria - Civilian	Honoraria - Civilian	Honoraria - Civilian	PS	t	2026-10-04 18:44:32.422011	2026-10-04 18:44:32.422011
15	50299990-02	969/785/779D	Other Maintenance and Operating Expenses / Storage Expenses / Awards and Indemnities	Other Maintenance and Operating Expenses	Other Maintenance and Operating Expenses / Storage Expenses / Awards and Indemnities	MOOE	t	2026-10-04 18:44:32.422011	2026-10-04 18:44:32.422011
16	50203100-00	762	Agricultural and Marine Supplies Expenses	Agricultural and Marine Supplies Expenses	Agricultural and Marine Supplies Expenses	MOOE	t	2026-10-04 18:44:32.422011	2026-10-04 18:44:32.422011
17	50203990-00	765S/768	Other Supplies and Materials Expenses	Other Supplies and Materials Expenses	Other Supplies and Materials Expenses	MOOE	t	2026-10-04 18:44:32.422011	2026-10-04 18:44:32.422011
18	50201010-00	751	Traveling Expenses - Local	Traveling Expenses - Local	Traveling Expenses - Local	MOOE	t	2026-10-04 18:44:32.422011	2026-10-04 18:44:32.422011
19	50203090-00	761	Fuel, Oil and Lubricants Expenses	Fuel, Oil and Lubricants Expenses	Fuel, Oil and Lubricants Expenses	MOOE	t	2026-10-04 18:44:32.422011	2026-10-04 18:44:32.422011
20	50204020-00	767	Electricity Expenses	Electricity Expenses	Electricity Expenses	MOOE	t	2026-10-04 18:44:32.422011	2026-10-04 18:44:32.422011
\.


--
-- TOC entry 5877 (class 0 OID 37507)
-- Dependencies: 222
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password_hash, email, full_name, role, department, "position", status, is_active, last_login, created_at, updated_at) FROM stdin;
2	trish	$2b$10$QIiTbnPaP3KDTgyWOnId0.xeCKdgtTd8D/tHALEckv/kmDhh9yvxS	trishamaebobiles@gmail.com	Trisha Mae Gapuz	Budget	\N	\N	Approved	t	2026-10-25 22:12:00.503049	2026-10-04 08:34:01.285445	2026-10-25 22:12:00.503049
1	admin	$2a$10$QdH8CvEhlULtE1vkdgLwvONVli4rAh.ZcoF5sNJedN/AmFFnunURu	admin@asist.edu.ph	Trisha Mae Gapuz	Administrator	\N	\N	approved	t	2026-10-26 13:30:59.767498	2026-10-03 13:34:25.864594	2026-10-26 13:30:59.767498
3	shang	$2b$10$nn6rmNhg5nRywDKIyKpGoeX80n85TnK7zfQ27aD8oPa9OF8uy4gbe	gapuzmaetrisha@gmail.com	Gapuz Trisha Mae	Procurement	\N	\N	Approved	t	2026-10-25 11:44:25.495124	2026-10-04 08:37:04.981983	2026-10-25 11:44:25.495124
4	trisha	$2b$10$9adtiTCXTpZpDjoldvSfj.3.xnT1IO3eH3ju6rCF/jgnviERrWL.G	reuseconnect613@gmail.com	Mae Trisha Gapuz	Accountant	\N	\N	Approved	t	2026-10-25 11:45:04.15303	2026-10-04 08:38:21.795806	2026-10-25 11:45:04.15303
\.


--
-- TOC entry 5931 (class 0 OID 48648)
-- Dependencies: 280
-- Data for Name: wfp_balance_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wfp_balance_details (id, wfp_balance_id, component_name, component_value, year_label, period_label, component_type, source_label, remarks, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5909 (class 0 OID 38078)
-- Dependencies: 254
-- Data for Name: wfp_balances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wfp_balances (id, fiscal_year, fund_cluster_id, fund_source_id, campus_id, responsibility_center_id, wfp_source_id, wfp_source_code, wfp_description, beginning_balance, appropriation, adjustments, adjusted_appropriation, nca_received, allotment_received, obligation, unobligated_appropriation, unobligated_allotment, disbursement, unpaid_obligation, remarks, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5897 (class 0 OID 37716)
-- Dependencies: 242
-- Data for Name: wfp_sources; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wfp_sources (id, code, name, description, is_active, created_at, updated_at) FROM stdin;
1	WFP-CTE	Higher Education Services CTE	WFP Source observed in FY2026 WFP material	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
2	WFP-CASS	Higher Education Services CASS	WFP Source observed in FY2026 WFP material	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
3	WFP-CAFC	Higher Education Services CAFC	WFP Source observed in FY2026 WFP material	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
4	WFP-INTERNET-COL	Internet Fee COL	WFP Source observed in FY2026 WFP material	t	2026-10-03 13:34:25.864594	2026-10-03 13:34:25.864594
5	CT	SEED PRODUCTION	WFP Source observed in the FY2026 Fund 161 Revolving Fund / IGP Excel.	t	2026-10-04 18:44:32.422011	2026-10-04 18:44:32.422011
6	CN	RENTALS - COTTAGES	WFP Source observed in the FY2026 Fund 161 Revolving Fund / IGP Excel.	t	2026-10-04 18:44:32.422011	2026-10-04 18:44:32.422011
7	CI	BID DOCS	WFP Source observed in the FY2026 Fund 161 Revolving Fund / IGP Excel.	t	2026-10-04 18:44:32.422011	2026-10-04 18:44:32.422011
8	CS	RICE PRODUCTION	WFP Source observed in the FY2026 Fund 161 Revolving Fund / IGP Excel.	t	2026-10-04 18:44:32.422011	2026-10-04 18:44:32.422011
9	CW	CATTLE FATTENING & OTHER RUMINANTS ANIMAL	WFP Source observed in the FY2026 Fund 161 Revolving Fund / IGP Excel.	t	2026-10-04 18:44:32.422011	2026-10-04 18:44:32.422011
10	CF	PRODUCTION	WFP Source observed in the FY2026 Fund 161 Revolving Fund / IGP Excel.	t	2026-10-04 18:44:32.422011	2026-10-04 18:44:32.422011
11	CL	RENTALS - CAMPUS SPACE	WFP Source observed in the FY2026 Fund 161 Revolving Fund / IGP Excel.	t	2026-10-04 18:44:32.422011	2026-10-04 18:44:32.422011
12	CO	RENTALS - DORMITORIES	WFP Source observed in the FY2026 Fund 161 Revolving Fund / IGP Excel.	t	2026-10-04 18:44:32.422011	2026-10-04 18:44:32.422011
13	CU	POULTRY PROJECT	WFP Source observed in the FY2026 Fund 161 Revolving Fund / IGP Excel.	t	2026-10-04 18:44:32.422011	2026-10-04 18:44:32.422011
14	CX	ORCHARD PROJECT	WFP Source observed in the FY2026 Fund 161 Revolving Fund / IGP Excel.	t	2026-10-04 18:44:32.422011	2026-10-04 18:44:32.422011
15	CJ	OTHER BUSINESS INCOME	WFP Source observed in the FY2026 Fund 161 Revolving Fund / IGP Excel.	t	2026-10-04 18:44:32.422011	2026-10-04 18:44:32.422011
16	CY	PIGGERY PROJECT	WFP Source observed in the FY2026 Fund 161 Revolving Fund / IGP Excel.	t	2026-10-04 18:44:32.422011	2026-10-04 18:44:32.422011
17	CP	RENTALS - GUEST HOUSE AND FFP HALL	WFP Source observed in the FY2026 Fund 161 Revolving Fund / IGP Excel.	t	2026-10-04 18:44:32.422011	2026-10-04 18:44:32.422011
18	CH	RENTALS - CHAIRS	WFP Source from FY2026 Fund 161 Revolving Fund	t	2026-10-04 19:19:47.090763	2026-10-04 19:19:47.090763
19	CM	RENTALS - CHAIRS	WFP Source from FY2026 Fund 161 Revolving Fund	t	2026-10-04 19:19:47.090763	2026-10-04 19:19:47.090763
20	CY2	OTHER BUSINESS INCOME - ASTRAY ANIMALS	WFP Source from FY2026 Fund 161 Revolving Fund	t	2026-10-04 19:19:47.090763	2026-10-04 19:19:47.090763
21	CR	RENTALS - LAGANGILANG WATER DISTRICT	WFP Source from FY2026 Fund 161 Revolving Fund	t	2026-10-04 19:19:47.090763	2026-10-04 19:19:47.090763
22	CQ	RENTALS - GYMNASIUM	WFP Source from FY2026 Fund 161 Revolving Fund	t	2026-10-04 19:19:47.090763	2026-10-04 19:19:47.090763
23	CV	AQUA-CULTURE PROJECT	WFP Source from FY2026 Fund 161 Revolving Fund	t	2026-10-04 19:19:47.090763	2026-10-04 19:19:47.090763
24	CG	RENTALS - CAMPUS SPACE	WFP Source from FY2026 Fund 161 Revolving Fund	t	2026-10-04 19:19:47.090763	2026-10-04 19:19:47.090763
25	CY3	OTHER BUSINESS INCOME - WATER BILL	WFP Source from FY2026 Fund 161 Revolving Fund	t	2026-10-04 19:19:47.090763	2026-10-04 19:19:47.090763
\.


--
-- TOC entry 6010 (class 0 OID 0)
-- Dependencies: 271
-- Name: allocation_activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.allocation_activities_id_seq', 1, false);


--
-- TOC entry 6011 (class 0 OID 0)
-- Dependencies: 239
-- Name: allotment_classes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.allotment_classes_id_seq', 3, true);


--
-- TOC entry 6012 (class 0 OID 0)
-- Dependencies: 261
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_log_id_seq', 8, true);


--
-- TOC entry 6013 (class 0 OID 0)
-- Dependencies: 293
-- Name: bmas_burs_serial_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bmas_burs_serial_seq', 1, true);


--
-- TOC entry 6014 (class 0 OID 0)
-- Dependencies: 292
-- Name: bmas_rbud_registry_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bmas_rbud_registry_seq', 1, true);


--
-- TOC entry 6015 (class 0 OID 0)
-- Dependencies: 255
-- Name: budget_adjustments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.budget_adjustments_id_seq', 1, false);


--
-- TOC entry 6016 (class 0 OID 0)
-- Dependencies: 245
-- Name: budget_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.budget_items_id_seq', 9, true);


--
-- TOC entry 6017 (class 0 OID 0)
-- Dependencies: 281
-- Name: budget_proposal_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.budget_proposal_history_id_seq', 82, true);


--
-- TOC entry 6018 (class 0 OID 0)
-- Dependencies: 277
-- Name: budget_proposals_proposal_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.budget_proposals_proposal_id_seq', 15, true);


--
-- TOC entry 6019 (class 0 OID 0)
-- Dependencies: 227
-- Name: campuses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.campuses_id_seq', 3, true);


--
-- TOC entry 6020 (class 0 OID 0)
-- Dependencies: 284
-- Name: department_master_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.department_master_id_seq', 1, true);


--
-- TOC entry 6021 (class 0 OID 0)
-- Dependencies: 304
-- Name: fee_master_particulars_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fee_master_particulars_id_seq', 77, true);


--
-- TOC entry 6022 (class 0 OID 0)
-- Dependencies: 257
-- Name: fhe_deficiency_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fhe_deficiency_id_seq', 1, false);


--
-- TOC entry 6023 (class 0 OID 0)
-- Dependencies: 263
-- Name: financial_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.financial_reports_id_seq', 1, false);


--
-- TOC entry 6024 (class 0 OID 0)
-- Dependencies: 243
-- Name: fiscal_years_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fiscal_years_id_seq', 1, true);


--
-- TOC entry 6025 (class 0 OID 0)
-- Dependencies: 247
-- Name: fund_allocations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fund_allocations_id_seq', 1, false);


--
-- TOC entry 6026 (class 0 OID 0)
-- Dependencies: 225
-- Name: fund_clusters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fund_clusters_id_seq', 21, true);


--
-- TOC entry 6027 (class 0 OID 0)
-- Dependencies: 302
-- Name: fund_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fund_codes_id_seq', 179, true);


--
-- TOC entry 6028 (class 0 OID 0)
-- Dependencies: 223
-- Name: fund_sources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fund_sources_id_seq', 7, true);


--
-- TOC entry 6029 (class 0 OID 0)
-- Dependencies: 286
-- Name: igp_programs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.igp_programs_id_seq', 22, true);


--
-- TOC entry 6030 (class 0 OID 0)
-- Dependencies: 288
-- Name: igp_transaction_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.igp_transaction_seq', 8, true);


--
-- TOC entry 6031 (class 0 OID 0)
-- Dependencies: 289
-- Name: igp_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.igp_transactions_id_seq', 4, true);


--
-- TOC entry 6032 (class 0 OID 0)
-- Dependencies: 231
-- Name: mfo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mfo_id_seq', 10, true);


--
-- TOC entry 6033 (class 0 OID 0)
-- Dependencies: 259
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 7, true);


--
-- TOC entry 6034 (class 0 OID 0)
-- Dependencies: 237
-- Name: object_expenditures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.object_expenditures_id_seq', 3, true);


--
-- TOC entry 6035 (class 0 OID 0)
-- Dependencies: 233
-- Name: pap_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pap_id_seq', 3, true);


--
-- TOC entry 6036 (class 0 OID 0)
-- Dependencies: 269
-- Name: preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.preferences_id_seq', 19, true);


--
-- TOC entry 6037 (class 0 OID 0)
-- Dependencies: 298
-- Name: raod_adjustments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.raod_adjustments_id_seq', 1, true);


--
-- TOC entry 6038 (class 0 OID 0)
-- Dependencies: 296
-- Name: raod_audit_trail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.raod_audit_trail_id_seq', 30, true);


--
-- TOC entry 6039 (class 0 OID 0)
-- Dependencies: 251
-- Name: raod_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.raod_entries_id_seq', 5, true);


--
-- TOC entry 6040 (class 0 OID 0)
-- Dependencies: 300
-- Name: raod_final_reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.raod_final_reviews_id_seq', 1, false);


--
-- TOC entry 6041 (class 0 OID 0)
-- Dependencies: 294
-- Name: rbud_audit_trail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rbud_audit_trail_id_seq', 9, true);


--
-- TOC entry 6042 (class 0 OID 0)
-- Dependencies: 249
-- Name: rbud_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rbud_entries_id_seq', 4, true);


--
-- TOC entry 6043 (class 0 OID 0)
-- Dependencies: 310
-- Name: rbud_fee_budget_reference_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rbud_fee_budget_reference_id_seq', 4, true);


--
-- TOC entry 6044 (class 0 OID 0)
-- Dependencies: 308
-- Name: rbud_fee_enrollment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rbud_fee_enrollment_id_seq', 2, true);


--
-- TOC entry 6045 (class 0 OID 0)
-- Dependencies: 306
-- Name: rbud_fee_monitoring_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rbud_fee_monitoring_id_seq', 8, true);


--
-- TOC entry 6046 (class 0 OID 0)
-- Dependencies: 283
-- Name: rbud_registry_no_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rbud_registry_no_seq', 1, false);


--
-- TOC entry 6047 (class 0 OID 0)
-- Dependencies: 265
-- Name: report_exports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.report_exports_id_seq', 1, false);


--
-- TOC entry 6048 (class 0 OID 0)
-- Dependencies: 229
-- Name: responsibility_centers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.responsibility_centers_id_seq', 5, true);


--
-- TOC entry 6049 (class 0 OID 0)
-- Dependencies: 267
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.settings_id_seq', 1, true);


--
-- TOC entry 6050 (class 0 OID 0)
-- Dependencies: 235
-- Name: uacs_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.uacs_codes_id_seq', 20, true);


--
-- TOC entry 6051 (class 0 OID 0)
-- Dependencies: 221
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- TOC entry 6052 (class 0 OID 0)
-- Dependencies: 279
-- Name: wfp_balance_details_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wfp_balance_details_id_seq', 1, false);


--
-- TOC entry 6053 (class 0 OID 0)
-- Dependencies: 253
-- Name: wfp_balances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wfp_balances_id_seq', 1, false);


--
-- TOC entry 6054 (class 0 OID 0)
-- Dependencies: 241
-- Name: wfp_sources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wfp_sources_id_seq', 25, true);


--
-- TOC entry 5497 (class 2606 OID 38368)
-- Name: allocation_activities allocation_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.allocation_activities
    ADD CONSTRAINT allocation_activities_pkey PRIMARY KEY (id);


--
-- TOC entry 5392 (class 2606 OID 37714)
-- Name: allotment_classes allotment_classes_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.allotment_classes
    ADD CONSTRAINT allotment_classes_code_key UNIQUE (code);


--
-- TOC entry 5394 (class 2606 OID 37712)
-- Name: allotment_classes allotment_classes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.allotment_classes
    ADD CONSTRAINT allotment_classes_pkey PRIMARY KEY (id);


--
-- TOC entry 5478 (class 2606 OID 38245)
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- TOC entry 5467 (class 2606 OID 38162)
-- Name: budget_adjustments budget_adjustments_maf_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_adjustments
    ADD CONSTRAINT budget_adjustments_maf_no_key UNIQUE (maf_no);


--
-- TOC entry 5469 (class 2606 OID 38160)
-- Name: budget_adjustments budget_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_adjustments
    ADD CONSTRAINT budget_adjustments_pkey PRIMARY KEY (id);


--
-- TOC entry 5404 (class 2606 OID 37778)
-- Name: budget_items budget_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_items
    ADD CONSTRAINT budget_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5513 (class 2606 OID 48751)
-- Name: budget_proposal_history budget_proposal_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_proposal_history
    ADD CONSTRAINT budget_proposal_history_pkey PRIMARY KEY (id);


--
-- TOC entry 5499 (class 2606 OID 48629)
-- Name: budget_proposals budget_proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_proposals
    ADD CONSTRAINT budget_proposals_pkey PRIMARY KEY (proposal_id);


--
-- TOC entry 5501 (class 2606 OID 48631)
-- Name: budget_proposals budget_proposals_proposal_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_proposals
    ADD CONSTRAINT budget_proposals_proposal_no_key UNIQUE (proposal_no);


--
-- TOC entry 5368 (class 2606 OID 37595)
-- Name: campuses campuses_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campuses
    ADD CONSTRAINT campuses_code_key UNIQUE (code);


--
-- TOC entry 5370 (class 2606 OID 37593)
-- Name: campuses campuses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campuses
    ADD CONSTRAINT campuses_pkey PRIMARY KEY (id);


--
-- TOC entry 5516 (class 2606 OID 49182)
-- Name: department_master department_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_master
    ADD CONSTRAINT department_master_pkey PRIMARY KEY (id);


--
-- TOC entry 5581 (class 2606 OID 49858)
-- Name: fee_master_particulars fee_master_particulars_code_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_master_particulars
    ADD CONSTRAINT fee_master_particulars_code_unique UNIQUE (code);


--
-- TOC entry 5583 (class 2606 OID 49860)
-- Name: fee_master_particulars fee_master_particulars_name_category_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_master_particulars
    ADD CONSTRAINT fee_master_particulars_name_category_unique UNIQUE (name, category);


--
-- TOC entry 5585 (class 2606 OID 49856)
-- Name: fee_master_particulars fee_master_particulars_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_master_particulars
    ADD CONSTRAINT fee_master_particulars_pkey PRIMARY KEY (id);


--
-- TOC entry 5471 (class 2606 OID 38209)
-- Name: fhe_deficiency fhe_deficiency_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fhe_deficiency
    ADD CONSTRAINT fhe_deficiency_pkey PRIMARY KEY (id);


--
-- TOC entry 5487 (class 2606 OID 38267)
-- Name: financial_reports financial_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_reports
    ADD CONSTRAINT financial_reports_pkey PRIMARY KEY (id);


--
-- TOC entry 5400 (class 2606 OID 37749)
-- Name: fiscal_years fiscal_years_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiscal_years
    ADD CONSTRAINT fiscal_years_pkey PRIMARY KEY (id);


--
-- TOC entry 5402 (class 2606 OID 37751)
-- Name: fiscal_years fiscal_years_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiscal_years
    ADD CONSTRAINT fiscal_years_year_key UNIQUE (year);


--
-- TOC entry 5410 (class 2606 OID 37858)
-- Name: fund_allocations fund_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fund_allocations
    ADD CONSTRAINT fund_allocations_pkey PRIMARY KEY (id);


--
-- TOC entry 5362 (class 2606 OID 37572)
-- Name: fund_clusters fund_clusters_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fund_clusters
    ADD CONSTRAINT fund_clusters_code_key UNIQUE (code);


--
-- TOC entry 5364 (class 2606 OID 37570)
-- Name: fund_clusters fund_clusters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fund_clusters
    ADD CONSTRAINT fund_clusters_pkey PRIMARY KEY (id);


--
-- TOC entry 5574 (class 2606 OID 49823)
-- Name: fund_codes fund_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fund_codes
    ADD CONSTRAINT fund_codes_pkey PRIMARY KEY (id);


--
-- TOC entry 5357 (class 2606 OID 37552)
-- Name: fund_sources fund_sources_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fund_sources
    ADD CONSTRAINT fund_sources_code_key UNIQUE (code);


--
-- TOC entry 5359 (class 2606 OID 37550)
-- Name: fund_sources fund_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fund_sources
    ADD CONSTRAINT fund_sources_pkey PRIMARY KEY (id);


--
-- TOC entry 5528 (class 2606 OID 49429)
-- Name: igp_programs igp_programs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_programs
    ADD CONSTRAINT igp_programs_pkey PRIMARY KEY (id);


--
-- TOC entry 5541 (class 2606 OID 49487)
-- Name: igp_transactions igp_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_transactions
    ADD CONSTRAINT igp_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 5543 (class 2606 OID 49489)
-- Name: igp_transactions igp_transactions_transaction_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_transactions
    ADD CONSTRAINT igp_transactions_transaction_no_key UNIQUE (transaction_no);


--
-- TOC entry 5376 (class 2606 OID 37635)
-- Name: mfo mfo_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mfo
    ADD CONSTRAINT mfo_code_key UNIQUE (code);


--
-- TOC entry 5378 (class 2606 OID 37633)
-- Name: mfo mfo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mfo
    ADD CONSTRAINT mfo_pkey PRIMARY KEY (id);


--
-- TOC entry 5476 (class 2606 OID 38227)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 5388 (class 2606 OID 37694)
-- Name: object_expenditures object_expenditures_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.object_expenditures
    ADD CONSTRAINT object_expenditures_code_key UNIQUE (code);


--
-- TOC entry 5390 (class 2606 OID 37692)
-- Name: object_expenditures object_expenditures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.object_expenditures
    ADD CONSTRAINT object_expenditures_pkey PRIMARY KEY (id);


--
-- TOC entry 5380 (class 2606 OID 37655)
-- Name: pap pap_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pap
    ADD CONSTRAINT pap_code_key UNIQUE (code);


--
-- TOC entry 5382 (class 2606 OID 37653)
-- Name: pap pap_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pap
    ADD CONSTRAINT pap_pkey PRIMARY KEY (id);


--
-- TOC entry 5493 (class 2606 OID 38347)
-- Name: preferences preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preferences
    ADD CONSTRAINT preferences_pkey PRIMARY KEY (id);


--
-- TOC entry 5495 (class 2606 OID 38349)
-- Name: preferences preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preferences
    ADD CONSTRAINT preferences_user_id_key UNIQUE (user_id);


--
-- TOC entry 5567 (class 2606 OID 49782)
-- Name: raod_adjustments raod_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raod_adjustments
    ADD CONSTRAINT raod_adjustments_pkey PRIMARY KEY (id);


--
-- TOC entry 5561 (class 2606 OID 49696)
-- Name: raod_audit_trail raod_audit_trail_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raod_audit_trail
    ADD CONSTRAINT raod_audit_trail_pkey PRIMARY KEY (id);


--
-- TOC entry 5452 (class 2606 OID 38014)
-- Name: raod_entries raod_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raod_entries
    ADD CONSTRAINT raod_entries_pkey PRIMARY KEY (id);


--
-- TOC entry 5454 (class 2606 OID 38016)
-- Name: raod_entries raod_entries_registry_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raod_entries
    ADD CONSTRAINT raod_entries_registry_no_key UNIQUE (registry_no);


--
-- TOC entry 5572 (class 2606 OID 49799)
-- Name: raod_final_reviews raod_final_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raod_final_reviews
    ADD CONSTRAINT raod_final_reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 5551 (class 2606 OID 49674)
-- Name: rbud_audit_trail rbud_audit_trail_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_audit_trail
    ADD CONSTRAINT rbud_audit_trail_pkey PRIMARY KEY (id);


--
-- TOC entry 5429 (class 2606 OID 37916)
-- Name: rbud_entries rbud_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_entries
    ADD CONSTRAINT rbud_entries_pkey PRIMARY KEY (id);


--
-- TOC entry 5431 (class 2606 OID 37918)
-- Name: rbud_entries rbud_entries_registry_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_entries
    ADD CONSTRAINT rbud_entries_registry_no_key UNIQUE (registry_no);


--
-- TOC entry 5347 (class 2606 OID 49953)
-- Name: rbud_fee_budget_reference rbud_fee_budget_reference_fee_category_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE public.rbud_fee_budget_reference
    ADD CONSTRAINT rbud_fee_budget_reference_fee_category_check CHECK ((fee_category = ANY (ARRAY['Non-Fiduciary Fees - Tuition Fees'::text, 'Fiduciary Fees - College'::text, 'Fiduciary Fees - JHS'::text, 'Fiduciary Fees - Other School Fees'::text]))) NOT VALID;


--
-- TOC entry 5599 (class 2606 OID 49944)
-- Name: rbud_fee_budget_reference rbud_fee_budget_reference_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_fee_budget_reference
    ADD CONSTRAINT rbud_fee_budget_reference_pkey PRIMARY KEY (id);


--
-- TOC entry 5601 (class 2606 OID 49946)
-- Name: rbud_fee_budget_reference rbud_fee_budget_reference_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_fee_budget_reference
    ADD CONSTRAINT rbud_fee_budget_reference_unique UNIQUE (fiscal_year, campus, fee_category, particulars);


--
-- TOC entry 5594 (class 2606 OID 49918)
-- Name: rbud_fee_enrollment rbud_fee_enrollment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_fee_enrollment
    ADD CONSTRAINT rbud_fee_enrollment_pkey PRIMARY KEY (id);


--
-- TOC entry 5596 (class 2606 OID 49920)
-- Name: rbud_fee_enrollment rbud_fee_enrollment_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_fee_enrollment
    ADD CONSTRAINT rbud_fee_enrollment_unique UNIQUE (fiscal_year, campus, billing_period);


--
-- TOC entry 5343 (class 2606 OID 49954)
-- Name: rbud_fee_monitoring rbud_fee_monitoring_fee_category_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE public.rbud_fee_monitoring
    ADD CONSTRAINT rbud_fee_monitoring_fee_category_check CHECK (((fee_category)::text = ANY ((ARRAY['Non-Fiduciary Fees - Tuition Fees'::character varying, 'Fiduciary Fees - College'::character varying, 'Fiduciary Fees - JHS'::character varying, 'Fiduciary Fees - Other School Fees'::character varying])::text[]))) NOT VALID;


--
-- TOC entry 5591 (class 2606 OID 49893)
-- Name: rbud_fee_monitoring rbud_fee_monitoring_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_fee_monitoring
    ADD CONSTRAINT rbud_fee_monitoring_pkey PRIMARY KEY (id);


--
-- TOC entry 5489 (class 2606 OID 38289)
-- Name: report_exports report_exports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_exports
    ADD CONSTRAINT report_exports_pkey PRIMARY KEY (id);


--
-- TOC entry 5372 (class 2606 OID 37615)
-- Name: responsibility_centers responsibility_centers_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.responsibility_centers
    ADD CONSTRAINT responsibility_centers_code_key UNIQUE (code);


--
-- TOC entry 5374 (class 2606 OID 37613)
-- Name: responsibility_centers responsibility_centers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.responsibility_centers
    ADD CONSTRAINT responsibility_centers_pkey PRIMARY KEY (id);


--
-- TOC entry 5491 (class 2606 OID 38321)
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- TOC entry 5384 (class 2606 OID 37674)
-- Name: uacs_codes uacs_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uacs_codes
    ADD CONSTRAINT uacs_codes_code_key UNIQUE (code);


--
-- TOC entry 5386 (class 2606 OID 37672)
-- Name: uacs_codes uacs_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uacs_codes
    ADD CONSTRAINT uacs_codes_pkey PRIMARY KEY (id);


--
-- TOC entry 5579 (class 2606 OID 49825)
-- Name: fund_codes uq_fund_codes_cluster_code; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fund_codes
    ADD CONSTRAINT uq_fund_codes_cluster_code UNIQUE (fund_cluster_id, code);


--
-- TOC entry 5351 (class 2606 OID 37532)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5353 (class 2606 OID 37528)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5355 (class 2606 OID 37530)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 5511 (class 2606 OID 48663)
-- Name: wfp_balance_details wfp_balance_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wfp_balance_details
    ADD CONSTRAINT wfp_balance_details_pkey PRIMARY KEY (id);


--
-- TOC entry 5465 (class 2606 OID 38113)
-- Name: wfp_balances wfp_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wfp_balances
    ADD CONSTRAINT wfp_balances_pkey PRIMARY KEY (id);


--
-- TOC entry 5396 (class 2606 OID 37734)
-- Name: wfp_sources wfp_sources_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wfp_sources
    ADD CONSTRAINT wfp_sources_code_key UNIQUE (code);


--
-- TOC entry 5398 (class 2606 OID 37732)
-- Name: wfp_sources wfp_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wfp_sources
    ADD CONSTRAINT wfp_sources_pkey PRIMARY KEY (id);


--
-- TOC entry 5479 (class 1259 OID 49649)
-- Name: idx_audit_log_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_action ON public.audit_log USING btree (action);


--
-- TOC entry 5480 (class 1259 OID 49652)
-- Name: idx_audit_log_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_created_at ON public.audit_log USING btree (created_at DESC);


--
-- TOC entry 5481 (class 1259 OID 49648)
-- Name: idx_audit_log_module; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_module ON public.audit_log USING btree (module);


--
-- TOC entry 5482 (class 1259 OID 49651)
-- Name: idx_audit_log_record; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_record ON public.audit_log USING btree (table_name, record_id);


--
-- TOC entry 5483 (class 1259 OID 49650)
-- Name: idx_audit_log_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_user_id ON public.audit_log USING btree (user_id);


--
-- TOC entry 5484 (class 1259 OID 38404)
-- Name: idx_audit_table; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_table ON public.audit_log USING btree (table_name);


--
-- TOC entry 5485 (class 1259 OID 38403)
-- Name: idx_audit_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_user ON public.audit_log USING btree (user_id);


--
-- TOC entry 5405 (class 1259 OID 38380)
-- Name: idx_budget_items_campus; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_budget_items_campus ON public.budget_items USING btree (campus_id);


--
-- TOC entry 5406 (class 1259 OID 38378)
-- Name: idx_budget_items_fund_cluster; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_budget_items_fund_cluster ON public.budget_items USING btree (fund_cluster_id);


--
-- TOC entry 5407 (class 1259 OID 38379)
-- Name: idx_budget_items_fund_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_budget_items_fund_source ON public.budget_items USING btree (fund_source_id);


--
-- TOC entry 5408 (class 1259 OID 38377)
-- Name: idx_budget_items_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_budget_items_year ON public.budget_items USING btree (fiscal_year);


--
-- TOC entry 5514 (class 1259 OID 48752)
-- Name: idx_budget_proposal_history_proposal; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_budget_proposal_history_proposal ON public.budget_proposal_history USING btree (proposal_id, created_at DESC);


--
-- TOC entry 5502 (class 1259 OID 48635)
-- Name: idx_budget_proposals_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_budget_proposals_created_at ON public.budget_proposals USING btree (created_at DESC);


--
-- TOC entry 5503 (class 1259 OID 48634)
-- Name: idx_budget_proposals_department; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_budget_proposals_department ON public.budget_proposals USING btree (department_unit);


--
-- TOC entry 5504 (class 1259 OID 48632)
-- Name: idx_budget_proposals_fiscal_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_budget_proposals_fiscal_year ON public.budget_proposals USING btree (fiscal_year);


--
-- TOC entry 5505 (class 1259 OID 48633)
-- Name: idx_budget_proposals_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_budget_proposals_status ON public.budget_proposals USING btree (status);


--
-- TOC entry 5517 (class 1259 OID 49186)
-- Name: idx_department_master_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_department_master_active ON public.department_master USING btree (is_active);


--
-- TOC entry 5518 (class 1259 OID 49405)
-- Name: idx_department_master_campus_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_department_master_campus_id ON public.department_master USING btree (campus_id);


--
-- TOC entry 5519 (class 1259 OID 49185)
-- Name: idx_department_master_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_department_master_name ON public.department_master USING btree (name);


--
-- TOC entry 5586 (class 1259 OID 49861)
-- Name: idx_fee_master_particulars_category_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fee_master_particulars_category_status ON public.fee_master_particulars USING btree (category, status, name);


--
-- TOC entry 5411 (class 1259 OID 38383)
-- Name: idx_fund_allocations_fund_cluster; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fund_allocations_fund_cluster ON public.fund_allocations USING btree (fund_cluster_id);


--
-- TOC entry 5412 (class 1259 OID 38382)
-- Name: idx_fund_allocations_fund_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fund_allocations_fund_source ON public.fund_allocations USING btree (fund_source_id);


--
-- TOC entry 5413 (class 1259 OID 38381)
-- Name: idx_fund_allocations_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fund_allocations_year ON public.fund_allocations USING btree (fiscal_year);


--
-- TOC entry 5365 (class 1259 OID 38375)
-- Name: idx_fund_clusters_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fund_clusters_code ON public.fund_clusters USING btree (code);


--
-- TOC entry 5366 (class 1259 OID 38376)
-- Name: idx_fund_clusters_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fund_clusters_source ON public.fund_clusters USING btree (fund_source_id);


--
-- TOC entry 5575 (class 1259 OID 49833)
-- Name: idx_fund_codes_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fund_codes_code ON public.fund_codes USING btree (code);


--
-- TOC entry 5576 (class 1259 OID 49831)
-- Name: idx_fund_codes_fund_cluster_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fund_codes_fund_cluster_id ON public.fund_codes USING btree (fund_cluster_id);


--
-- TOC entry 5577 (class 1259 OID 49832)
-- Name: idx_fund_codes_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fund_codes_is_active ON public.fund_codes USING btree (is_active);


--
-- TOC entry 5360 (class 1259 OID 38374)
-- Name: idx_fund_sources_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fund_sources_code ON public.fund_sources USING btree (code);


--
-- TOC entry 5521 (class 1259 OID 49512)
-- Name: idx_igp_programs_campus; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_igp_programs_campus ON public.igp_programs USING btree (campus_id);


--
-- TOC entry 5522 (class 1259 OID 49511)
-- Name: idx_igp_programs_fund; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_igp_programs_fund ON public.igp_programs USING btree (fund_source_id);


--
-- TOC entry 5523 (class 1259 OID 49639)
-- Name: idx_igp_programs_fund_cluster; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_igp_programs_fund_cluster ON public.igp_programs USING btree (fund_cluster_id);


--
-- TOC entry 5524 (class 1259 OID 49641)
-- Name: idx_igp_programs_fund_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_igp_programs_fund_year ON public.igp_programs USING btree (fund_source_id, fiscal_year);


--
-- TOC entry 5525 (class 1259 OID 49640)
-- Name: idx_igp_programs_wfp_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_igp_programs_wfp_source ON public.igp_programs USING btree (wfp_source_id);


--
-- TOC entry 5526 (class 1259 OID 49510)
-- Name: idx_igp_programs_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_igp_programs_year ON public.igp_programs USING btree (fiscal_year);


--
-- TOC entry 5529 (class 1259 OID 49514)
-- Name: idx_igp_transactions_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_igp_transactions_date ON public.igp_transactions USING btree (transaction_date);


--
-- TOC entry 5530 (class 1259 OID 49515)
-- Name: idx_igp_transactions_fund; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_igp_transactions_fund ON public.igp_transactions USING btree (fund_source_id);


--
-- TOC entry 5531 (class 1259 OID 49643)
-- Name: idx_igp_transactions_fund_cluster; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_igp_transactions_fund_cluster ON public.igp_transactions USING btree (fund_cluster_id);


--
-- TOC entry 5532 (class 1259 OID 49645)
-- Name: idx_igp_transactions_pap; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_igp_transactions_pap ON public.igp_transactions USING btree (pap_id);


--
-- TOC entry 5533 (class 1259 OID 49516)
-- Name: idx_igp_transactions_program; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_igp_transactions_program ON public.igp_transactions USING btree (igp_program_id);


--
-- TOC entry 5534 (class 1259 OID 49644)
-- Name: idx_igp_transactions_program_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_igp_transactions_program_date ON public.igp_transactions USING btree (igp_program_id, transaction_date);


--
-- TOC entry 5535 (class 1259 OID 49642)
-- Name: idx_igp_transactions_registry_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_igp_transactions_registry_no ON public.igp_transactions USING btree (registry_no);


--
-- TOC entry 5536 (class 1259 OID 49517)
-- Name: idx_igp_transactions_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_igp_transactions_type ON public.igp_transactions USING btree (transaction_type);


--
-- TOC entry 5537 (class 1259 OID 49646)
-- Name: idx_igp_transactions_uacs; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_igp_transactions_uacs ON public.igp_transactions USING btree (uacs_code_id);


--
-- TOC entry 5538 (class 1259 OID 49647)
-- Name: idx_igp_transactions_wfp_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_igp_transactions_wfp_source ON public.igp_transactions USING btree (wfp_source_id);


--
-- TOC entry 5539 (class 1259 OID 49513)
-- Name: idx_igp_transactions_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_igp_transactions_year ON public.igp_transactions USING btree (fiscal_year);


--
-- TOC entry 5472 (class 1259 OID 38486)
-- Name: idx_notifications_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_created ON public.notifications USING btree (created_at);


--
-- TOC entry 5473 (class 1259 OID 38402)
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (is_read);


--
-- TOC entry 5474 (class 1259 OID 38401)
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);


--
-- TOC entry 5562 (class 1259 OID 49805)
-- Name: idx_raod_adjustments_adjustment_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_adjustments_adjustment_no ON public.raod_adjustments USING btree (adjustment_no);


--
-- TOC entry 5563 (class 1259 OID 49785)
-- Name: idx_raod_adjustments_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_adjustments_created_at ON public.raod_adjustments USING btree (created_at);


--
-- TOC entry 5564 (class 1259 OID 49783)
-- Name: idx_raod_adjustments_entry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_adjustments_entry ON public.raod_adjustments USING btree (raod_entry_id);


--
-- TOC entry 5565 (class 1259 OID 49784)
-- Name: idx_raod_adjustments_registry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_adjustments_registry ON public.raod_adjustments USING btree (registry_no);


--
-- TOC entry 5552 (class 1259 OID 49709)
-- Name: idx_raod_audit_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_audit_created ON public.raod_audit_trail USING btree (created_at DESC);


--
-- TOC entry 5553 (class 1259 OID 49707)
-- Name: idx_raod_audit_entry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_audit_entry ON public.raod_audit_trail USING btree (raod_entry_id);


--
-- TOC entry 5554 (class 1259 OID 49710)
-- Name: idx_raod_audit_registry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_audit_registry ON public.raod_audit_trail USING btree (registry_no);


--
-- TOC entry 5555 (class 1259 OID 49804)
-- Name: idx_raod_audit_trail_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_audit_trail_action ON public.raod_audit_trail USING btree (action);


--
-- TOC entry 5556 (class 1259 OID 49762)
-- Name: idx_raod_audit_trail_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_audit_trail_created_at ON public.raod_audit_trail USING btree (created_at);


--
-- TOC entry 5557 (class 1259 OID 49763)
-- Name: idx_raod_audit_trail_entry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_audit_trail_entry ON public.raod_audit_trail USING btree (raod_entry_id);


--
-- TOC entry 5558 (class 1259 OID 49764)
-- Name: idx_raod_audit_trail_registry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_audit_trail_registry ON public.raod_audit_trail USING btree (registry_no);


--
-- TOC entry 5559 (class 1259 OID 49708)
-- Name: idx_raod_audit_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_audit_user ON public.raod_audit_trail USING btree (performed_by_id);


--
-- TOC entry 5432 (class 1259 OID 49711)
-- Name: idx_raod_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_created_by ON public.raod_entries USING btree (created_by);


--
-- TOC entry 5433 (class 1259 OID 38392)
-- Name: idx_raod_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_date ON public.raod_entries USING btree (entry_date);


--
-- TOC entry 5434 (class 1259 OID 48687)
-- Name: idx_raod_entries_fiscal_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_entries_fiscal_year ON public.raod_entries USING btree (fiscal_year);


--
-- TOC entry 5435 (class 1259 OID 49713)
-- Name: idx_raod_entries_iar_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_entries_iar_no ON public.raod_entries USING btree (iar_no);


--
-- TOC entry 5436 (class 1259 OID 49715)
-- Name: idx_raod_entries_ics_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_entries_ics_no ON public.raod_entries USING btree (ics_no);


--
-- TOC entry 5437 (class 1259 OID 48686)
-- Name: idx_raod_entries_old_uacs_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_entries_old_uacs_code ON public.raod_entries USING btree (old_uacs_code_id);


--
-- TOC entry 5438 (class 1259 OID 48683)
-- Name: idx_raod_entries_ors_serial_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_entries_ors_serial_no ON public.raod_entries USING btree (ors_serial_no);


--
-- TOC entry 5439 (class 1259 OID 49714)
-- Name: idx_raod_entries_par_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_entries_par_no ON public.raod_entries USING btree (par_no);


--
-- TOC entry 5440 (class 1259 OID 48684)
-- Name: idx_raod_entries_po_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_entries_po_no ON public.raod_entries USING btree (po_no);


--
-- TOC entry 5441 (class 1259 OID 48682)
-- Name: idx_raod_entries_registry_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_entries_registry_no ON public.raod_entries USING btree (registry_no);


--
-- TOC entry 5442 (class 1259 OID 49716)
-- Name: idx_raod_entries_ris_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_entries_ris_no ON public.raod_entries USING btree (ris_no);


--
-- TOC entry 5443 (class 1259 OID 48685)
-- Name: idx_raod_entries_status_of_po; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_entries_status_of_po ON public.raod_entries USING btree (status_of_po);


--
-- TOC entry 5568 (class 1259 OID 49800)
-- Name: idx_raod_final_reviews_entry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_final_reviews_entry ON public.raod_final_reviews USING btree (raod_entry_id);


--
-- TOC entry 5569 (class 1259 OID 49801)
-- Name: idx_raod_final_reviews_registry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_final_reviews_registry ON public.raod_final_reviews USING btree (registry_no);


--
-- TOC entry 5570 (class 1259 OID 49802)
-- Name: idx_raod_final_reviews_reviewed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_final_reviews_reviewed_at ON public.raod_final_reviews USING btree (reviewed_at);


--
-- TOC entry 5444 (class 1259 OID 38393)
-- Name: idx_raod_fund_cluster; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_fund_cluster ON public.raod_entries USING btree (fund_cluster_id);


--
-- TOC entry 5445 (class 1259 OID 38394)
-- Name: idx_raod_fund_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_fund_source ON public.raod_entries USING btree (fund_source_id);


--
-- TOC entry 5446 (class 1259 OID 38396)
-- Name: idx_raod_ors; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_ors ON public.raod_entries USING btree (ors_serial_no);


--
-- TOC entry 5447 (class 1259 OID 38395)
-- Name: idx_raod_registry_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_registry_no ON public.raod_entries USING btree (registry_no);


--
-- TOC entry 5448 (class 1259 OID 38397)
-- Name: idx_raod_uacs; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_uacs ON public.raod_entries USING btree (uacs_code_id);


--
-- TOC entry 5449 (class 1259 OID 49712)
-- Name: idx_raod_updated_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_updated_by ON public.raod_entries USING btree (updated_by);


--
-- TOC entry 5450 (class 1259 OID 38391)
-- Name: idx_raod_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raod_year ON public.raod_entries USING btree (fiscal_year);


--
-- TOC entry 5544 (class 1259 OID 49679)
-- Name: idx_rbud_audit_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rbud_audit_action ON public.rbud_audit_trail USING btree (action);


--
-- TOC entry 5545 (class 1259 OID 49677)
-- Name: idx_rbud_audit_actor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rbud_audit_actor ON public.rbud_audit_trail USING btree (performed_by_id);


--
-- TOC entry 5546 (class 1259 OID 49678)
-- Name: idx_rbud_audit_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rbud_audit_created_at ON public.rbud_audit_trail USING btree (created_at DESC);


--
-- TOC entry 5547 (class 1259 OID 49675)
-- Name: idx_rbud_audit_entry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rbud_audit_entry ON public.rbud_audit_trail USING btree (rbud_entry_id);


--
-- TOC entry 5548 (class 1259 OID 49676)
-- Name: idx_rbud_audit_registry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rbud_audit_registry ON public.rbud_audit_trail USING btree (registry_no);


--
-- TOC entry 5549 (class 1259 OID 49955)
-- Name: idx_rbud_audit_registry_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rbud_audit_registry_no ON public.rbud_audit_trail USING btree (registry_no);


--
-- TOC entry 5414 (class 1259 OID 38389)
-- Name: idx_rbud_burs; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rbud_burs ON public.rbud_entries USING btree (burs_serial_no);


--
-- TOC entry 5415 (class 1259 OID 38385)
-- Name: idx_rbud_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rbud_date ON public.rbud_entries USING btree (entry_date);


--
-- TOC entry 5416 (class 1259 OID 49680)
-- Name: idx_rbud_entries_created_by_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rbud_entries_created_by_name ON public.rbud_entries USING btree (created_by_name);


--
-- TOC entry 5417 (class 1259 OID 48681)
-- Name: idx_rbud_entries_fiscal_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rbud_entries_fiscal_year ON public.rbud_entries USING btree (fiscal_year);


--
-- TOC entry 5418 (class 1259 OID 49657)
-- Name: idx_rbud_entries_fund_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rbud_entries_fund_code ON public.rbud_entries USING btree (fund_code);


--
-- TOC entry 5419 (class 1259 OID 48679)
-- Name: idx_rbud_entries_po_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rbud_entries_po_no ON public.rbud_entries USING btree (po_no);


--
-- TOC entry 5420 (class 1259 OID 48678)
-- Name: idx_rbud_entries_registry_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rbud_entries_registry_no ON public.rbud_entries USING btree (registry_no);


--
-- TOC entry 5421 (class 1259 OID 48680)
-- Name: idx_rbud_entries_status_of_po; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rbud_entries_status_of_po ON public.rbud_entries USING btree (status_of_po);


--
-- TOC entry 5422 (class 1259 OID 49681)
-- Name: idx_rbud_entries_updated_by_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rbud_entries_updated_by_name ON public.rbud_entries USING btree (updated_by_name);


--
-- TOC entry 5597 (class 1259 OID 49948)
-- Name: idx_rbud_fee_budget_reference_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rbud_fee_budget_reference_year ON public.rbud_fee_budget_reference USING btree (fiscal_year, campus, fee_category);


--
-- TOC entry 5592 (class 1259 OID 49947)
-- Name: idx_rbud_fee_enrollment_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rbud_fee_enrollment_year ON public.rbud_fee_enrollment USING btree (fiscal_year, campus);


--
-- TOC entry 5587 (class 1259 OID 49896)
-- Name: idx_rbud_fee_monitoring_campus; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rbud_fee_monitoring_campus ON public.rbud_fee_monitoring USING btree (campus);


--
-- TOC entry 5588 (class 1259 OID 49895)
-- Name: idx_rbud_fee_monitoring_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rbud_fee_monitoring_category ON public.rbud_fee_monitoring USING btree (fee_category);


--
-- TOC entry 5589 (class 1259 OID 49894)
-- Name: idx_rbud_fee_monitoring_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rbud_fee_monitoring_year ON public.rbud_fee_monitoring USING btree (fiscal_year);


--
-- TOC entry 5423 (class 1259 OID 38386)
-- Name: idx_rbud_fund_cluster; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rbud_fund_cluster ON public.rbud_entries USING btree (fund_cluster_id);


--
-- TOC entry 5424 (class 1259 OID 38387)
-- Name: idx_rbud_fund_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rbud_fund_source ON public.rbud_entries USING btree (fund_source_id);


--
-- TOC entry 5425 (class 1259 OID 38388)
-- Name: idx_rbud_registry_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rbud_registry_no ON public.rbud_entries USING btree (registry_no);


--
-- TOC entry 5426 (class 1259 OID 38390)
-- Name: idx_rbud_uacs; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rbud_uacs ON public.rbud_entries USING btree (uacs_code_id);


--
-- TOC entry 5427 (class 1259 OID 38384)
-- Name: idx_rbud_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rbud_year ON public.rbud_entries USING btree (fiscal_year);


--
-- TOC entry 5348 (class 1259 OID 38405)
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- TOC entry 5349 (class 1259 OID 38406)
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_status ON public.users USING btree (status);


--
-- TOC entry 5506 (class 1259 OID 48669)
-- Name: idx_wfp_balance_details_balance_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wfp_balance_details_balance_id ON public.wfp_balance_details USING btree (wfp_balance_id);


--
-- TOC entry 5507 (class 1259 OID 48670)
-- Name: idx_wfp_balance_details_component_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wfp_balance_details_component_name ON public.wfp_balance_details USING btree (component_name);


--
-- TOC entry 5508 (class 1259 OID 48672)
-- Name: idx_wfp_balance_details_period_label; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wfp_balance_details_period_label ON public.wfp_balance_details USING btree (period_label);


--
-- TOC entry 5509 (class 1259 OID 48671)
-- Name: idx_wfp_balance_details_year_label; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wfp_balance_details_year_label ON public.wfp_balance_details USING btree (year_label);


--
-- TOC entry 5456 (class 1259 OID 48673)
-- Name: idx_wfp_balances_fiscal_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wfp_balances_fiscal_year ON public.wfp_balances USING btree (fiscal_year);


--
-- TOC entry 5457 (class 1259 OID 48674)
-- Name: idx_wfp_balances_fund_cluster; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wfp_balances_fund_cluster ON public.wfp_balances USING btree (fund_cluster_id);


--
-- TOC entry 5458 (class 1259 OID 48675)
-- Name: idx_wfp_balances_fund_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wfp_balances_fund_source ON public.wfp_balances USING btree (fund_source_id);


--
-- TOC entry 5459 (class 1259 OID 48676)
-- Name: idx_wfp_balances_rc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wfp_balances_rc ON public.wfp_balances USING btree (responsibility_center_id);


--
-- TOC entry 5460 (class 1259 OID 48677)
-- Name: idx_wfp_balances_wfp_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wfp_balances_wfp_source ON public.wfp_balances USING btree (wfp_source_id);


--
-- TOC entry 5461 (class 1259 OID 38399)
-- Name: idx_wfp_fund_cluster; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wfp_fund_cluster ON public.wfp_balances USING btree (fund_cluster_id);


--
-- TOC entry 5462 (class 1259 OID 38400)
-- Name: idx_wfp_fund_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wfp_fund_source ON public.wfp_balances USING btree (fund_source_id);


--
-- TOC entry 5463 (class 1259 OID 38398)
-- Name: idx_wfp_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wfp_year ON public.wfp_balances USING btree (fiscal_year);


--
-- TOC entry 5520 (class 1259 OID 49404)
-- Name: uq_department_master_campus_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_department_master_campus_code ON public.department_master USING btree (campus_id, code);


--
-- TOC entry 5455 (class 1259 OID 49718)
-- Name: ux_raod_entries_burs_serial_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_raod_entries_burs_serial_no ON public.raod_entries USING btree (burs_serial_no) WHERE (burs_serial_no IS NOT NULL);


--
-- TOC entry 5719 (class 2620 OID 48639)
-- Name: budget_proposals trg_budget_proposals_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_budget_proposals_updated_at BEFORE UPDATE ON public.budget_proposals FOR EACH ROW EXECUTE FUNCTION public.update_budget_proposal_timestamp();


--
-- TOC entry 5720 (class 2620 OID 48637)
-- Name: budget_proposals trg_generate_budget_proposal_no; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_generate_budget_proposal_no BEFORE INSERT ON public.budget_proposals FOR EACH ROW EXECUTE FUNCTION public.generate_budget_proposal_no();


--
-- TOC entry 5721 (class 2620 OID 48689)
-- Name: wfp_balance_details trg_update_wfp_balance_details_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_wfp_balance_details_timestamp BEFORE UPDATE ON public.wfp_balance_details FOR EACH ROW EXECUTE FUNCTION public.update_wfp_balance_details_timestamp();


--
-- TOC entry 5710 (class 2620 OID 38417)
-- Name: allotment_classes trigger_update_allotment_classes; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_allotment_classes BEFORE UPDATE ON public.allotment_classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5712 (class 2620 OID 38419)
-- Name: budget_items trigger_update_budget_items; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_budget_items BEFORE UPDATE ON public.budget_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5704 (class 2620 OID 38411)
-- Name: campuses trigger_update_campuses; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_campuses BEFORE UPDATE ON public.campuses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5713 (class 2620 OID 38420)
-- Name: fund_allocations trigger_update_fund_allocations; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_fund_allocations BEFORE UPDATE ON public.fund_allocations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5703 (class 2620 OID 38410)
-- Name: fund_clusters trigger_update_fund_clusters; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_fund_clusters BEFORE UPDATE ON public.fund_clusters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5702 (class 2620 OID 38409)
-- Name: fund_sources trigger_update_fund_sources; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_fund_sources BEFORE UPDATE ON public.fund_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5722 (class 2620 OID 49518)
-- Name: igp_programs trigger_update_igp_programs; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_igp_programs BEFORE UPDATE ON public.igp_programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5723 (class 2620 OID 49519)
-- Name: igp_transactions trigger_update_igp_transactions; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_igp_transactions BEFORE UPDATE ON public.igp_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5706 (class 2620 OID 38413)
-- Name: mfo trigger_update_mfo; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_mfo BEFORE UPDATE ON public.mfo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5709 (class 2620 OID 38416)
-- Name: object_expenditures trigger_update_object_expenditures; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_object_expenditures BEFORE UPDATE ON public.object_expenditures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5707 (class 2620 OID 38414)
-- Name: pap trigger_update_pap; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_pap BEFORE UPDATE ON public.pap FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5718 (class 2620 OID 38425)
-- Name: preferences trigger_update_preferences; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_preferences BEFORE UPDATE ON public.preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5715 (class 2620 OID 38422)
-- Name: raod_entries trigger_update_raod; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_raod BEFORE UPDATE ON public.raod_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5714 (class 2620 OID 38421)
-- Name: rbud_entries trigger_update_rbud; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_rbud BEFORE UPDATE ON public.rbud_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5705 (class 2620 OID 38412)
-- Name: responsibility_centers trigger_update_responsibility_centers; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_responsibility_centers BEFORE UPDATE ON public.responsibility_centers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5717 (class 2620 OID 38424)
-- Name: settings trigger_update_settings; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_settings BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5708 (class 2620 OID 38415)
-- Name: uacs_codes trigger_update_uacs_codes; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_uacs_codes BEFORE UPDATE ON public.uacs_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5701 (class 2620 OID 38408)
-- Name: users trigger_update_users; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5716 (class 2620 OID 38423)
-- Name: wfp_balances trigger_update_wfp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_wfp BEFORE UPDATE ON public.wfp_balances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5711 (class 2620 OID 38418)
-- Name: wfp_sources trigger_update_wfp_sources; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_wfp_sources BEFORE UPDATE ON public.wfp_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5663 (class 2606 OID 38369)
-- Name: allocation_activities allocation_activities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.allocation_activities
    ADD CONSTRAINT allocation_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5657 (class 2606 OID 38246)
-- Name: audit_log audit_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5652 (class 2606 OID 38178)
-- Name: budget_adjustments budget_adjustments_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_adjustments
    ADD CONSTRAINT budget_adjustments_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5653 (class 2606 OID 38163)
-- Name: budget_adjustments budget_adjustments_fund_cluster_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_adjustments
    ADD CONSTRAINT budget_adjustments_fund_cluster_id_fkey FOREIGN KEY (fund_cluster_id) REFERENCES public.fund_clusters(id) ON DELETE SET NULL;


--
-- TOC entry 5654 (class 2606 OID 38168)
-- Name: budget_adjustments budget_adjustments_fund_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_adjustments
    ADD CONSTRAINT budget_adjustments_fund_source_id_fkey FOREIGN KEY (fund_source_id) REFERENCES public.fund_sources(id) ON DELETE SET NULL;


--
-- TOC entry 5655 (class 2606 OID 38173)
-- Name: budget_adjustments budget_adjustments_prepared_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_adjustments
    ADD CONSTRAINT budget_adjustments_prepared_by_fkey FOREIGN KEY (prepared_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5603 (class 2606 OID 37819)
-- Name: budget_items budget_items_allotment_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_items
    ADD CONSTRAINT budget_items_allotment_class_id_fkey FOREIGN KEY (allotment_class_id) REFERENCES public.allotment_classes(id) ON DELETE SET NULL;


--
-- TOC entry 5604 (class 2606 OID 48753)
-- Name: budget_items budget_items_budget_proposal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_items
    ADD CONSTRAINT budget_items_budget_proposal_id_fkey FOREIGN KEY (budget_proposal_id) REFERENCES public.budget_proposals(proposal_id) ON DELETE SET NULL;


--
-- TOC entry 5605 (class 2606 OID 37789)
-- Name: budget_items budget_items_campus_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_items
    ADD CONSTRAINT budget_items_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES public.campuses(id) ON DELETE SET NULL;


--
-- TOC entry 5606 (class 2606 OID 37829)
-- Name: budget_items budget_items_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_items
    ADD CONSTRAINT budget_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5607 (class 2606 OID 37779)
-- Name: budget_items budget_items_fund_cluster_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_items
    ADD CONSTRAINT budget_items_fund_cluster_id_fkey FOREIGN KEY (fund_cluster_id) REFERENCES public.fund_clusters(id) ON DELETE SET NULL;


--
-- TOC entry 5608 (class 2606 OID 37784)
-- Name: budget_items budget_items_fund_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_items
    ADD CONSTRAINT budget_items_fund_source_id_fkey FOREIGN KEY (fund_source_id) REFERENCES public.fund_sources(id) ON DELETE SET NULL;


--
-- TOC entry 5609 (class 2606 OID 37799)
-- Name: budget_items budget_items_mfo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_items
    ADD CONSTRAINT budget_items_mfo_id_fkey FOREIGN KEY (mfo_id) REFERENCES public.mfo(id) ON DELETE SET NULL;


--
-- TOC entry 5610 (class 2606 OID 37814)
-- Name: budget_items budget_items_object_expenditure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_items
    ADD CONSTRAINT budget_items_object_expenditure_id_fkey FOREIGN KEY (object_expenditure_id) REFERENCES public.object_expenditures(id) ON DELETE SET NULL;


--
-- TOC entry 5611 (class 2606 OID 37804)
-- Name: budget_items budget_items_pap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_items
    ADD CONSTRAINT budget_items_pap_id_fkey FOREIGN KEY (pap_id) REFERENCES public.pap(id) ON DELETE SET NULL;


--
-- TOC entry 5612 (class 2606 OID 37794)
-- Name: budget_items budget_items_responsibility_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_items
    ADD CONSTRAINT budget_items_responsibility_center_id_fkey FOREIGN KEY (responsibility_center_id) REFERENCES public.responsibility_centers(id) ON DELETE SET NULL;


--
-- TOC entry 5613 (class 2606 OID 37809)
-- Name: budget_items budget_items_uacs_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_items
    ADD CONSTRAINT budget_items_uacs_code_id_fkey FOREIGN KEY (uacs_code_id) REFERENCES public.uacs_codes(id) ON DELETE SET NULL;


--
-- TOC entry 5614 (class 2606 OID 37834)
-- Name: budget_items budget_items_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_items
    ADD CONSTRAINT budget_items_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5615 (class 2606 OID 37824)
-- Name: budget_items budget_items_wfp_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_items
    ADD CONSTRAINT budget_items_wfp_source_id_fkey FOREIGN KEY (wfp_source_id) REFERENCES public.wfp_sources(id) ON DELETE SET NULL;


--
-- TOC entry 5664 (class 2606 OID 48937)
-- Name: budget_proposals budget_proposals_mfo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_proposals
    ADD CONSTRAINT budget_proposals_mfo_id_fkey FOREIGN KEY (mfo_id) REFERENCES public.mfo(id) ON DELETE SET NULL;


--
-- TOC entry 5665 (class 2606 OID 48942)
-- Name: budget_proposals budget_proposals_object_expenditure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_proposals
    ADD CONSTRAINT budget_proposals_object_expenditure_id_fkey FOREIGN KEY (object_expenditure_id) REFERENCES public.object_expenditures(id) ON DELETE SET NULL;


--
-- TOC entry 5675 (class 2606 OID 49399)
-- Name: department_master department_master_campus_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_master
    ADD CONSTRAINT department_master_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES public.campuses(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5658 (class 2606 OID 38268)
-- Name: financial_reports financial_reports_fund_cluster_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_reports
    ADD CONSTRAINT financial_reports_fund_cluster_id_fkey FOREIGN KEY (fund_cluster_id) REFERENCES public.fund_clusters(id) ON DELETE SET NULL;


--
-- TOC entry 5659 (class 2606 OID 38273)
-- Name: financial_reports financial_reports_generated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_reports
    ADD CONSTRAINT financial_reports_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5666 (class 2606 OID 48925)
-- Name: budget_proposals fk_budget_proposals_allotment_class; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_proposals
    ADD CONSTRAINT fk_budget_proposals_allotment_class FOREIGN KEY (allotment_class_id) REFERENCES public.allotment_classes(id);


--
-- TOC entry 5667 (class 2606 OID 48900)
-- Name: budget_proposals fk_budget_proposals_campus; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_proposals
    ADD CONSTRAINT fk_budget_proposals_campus FOREIGN KEY (campus_id) REFERENCES public.campuses(id);


--
-- TOC entry 5668 (class 2606 OID 48890)
-- Name: budget_proposals fk_budget_proposals_fund_cluster; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_proposals
    ADD CONSTRAINT fk_budget_proposals_fund_cluster FOREIGN KEY (fund_cluster_id) REFERENCES public.fund_clusters(id);


--
-- TOC entry 5669 (class 2606 OID 48895)
-- Name: budget_proposals fk_budget_proposals_fund_source; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_proposals
    ADD CONSTRAINT fk_budget_proposals_fund_source FOREIGN KEY (fund_source_id) REFERENCES public.fund_sources(id);


--
-- TOC entry 5670 (class 2606 OID 48915)
-- Name: budget_proposals fk_budget_proposals_pap; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_proposals
    ADD CONSTRAINT fk_budget_proposals_pap FOREIGN KEY (pap_id) REFERENCES public.pap(id);


--
-- TOC entry 5671 (class 2606 OID 48905)
-- Name: budget_proposals fk_budget_proposals_responsibility_center; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_proposals
    ADD CONSTRAINT fk_budget_proposals_responsibility_center FOREIGN KEY (responsibility_center_id) REFERENCES public.responsibility_centers(id);


--
-- TOC entry 5672 (class 2606 OID 48920)
-- Name: budget_proposals fk_budget_proposals_uacs_code; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_proposals
    ADD CONSTRAINT fk_budget_proposals_uacs_code FOREIGN KEY (uacs_code_id) REFERENCES public.uacs_codes(id);


--
-- TOC entry 5673 (class 2606 OID 48910)
-- Name: budget_proposals fk_budget_proposals_wfp_source; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_proposals
    ADD CONSTRAINT fk_budget_proposals_wfp_source FOREIGN KEY (wfp_source_id) REFERENCES public.wfp_sources(id);


--
-- TOC entry 5700 (class 2606 OID 49826)
-- Name: fund_codes fk_fund_codes_fund_cluster; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fund_codes
    ADD CONSTRAINT fk_fund_codes_fund_cluster FOREIGN KEY (fund_cluster_id) REFERENCES public.fund_clusters(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5683 (class 2606 OID 49538)
-- Name: igp_transactions fk_igp_transactions_program; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_transactions
    ADD CONSTRAINT fk_igp_transactions_program FOREIGN KEY (program_id) REFERENCES public.igp_programs(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5634 (class 2606 OID 48641)
-- Name: raod_entries fk_raod_entries_old_uacs_code; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raod_entries
    ADD CONSTRAINT fk_raod_entries_old_uacs_code FOREIGN KEY (old_uacs_code_id) REFERENCES public.uacs_codes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5674 (class 2606 OID 48664)
-- Name: wfp_balance_details fk_wfp_balance_details_balance; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wfp_balance_details
    ADD CONSTRAINT fk_wfp_balance_details_balance FOREIGN KEY (wfp_balance_id) REFERENCES public.wfp_balances(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5616 (class 2606 OID 37869)
-- Name: fund_allocations fund_allocations_campus_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fund_allocations
    ADD CONSTRAINT fund_allocations_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES public.campuses(id) ON DELETE SET NULL;


--
-- TOC entry 5617 (class 2606 OID 37864)
-- Name: fund_allocations fund_allocations_fund_cluster_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fund_allocations
    ADD CONSTRAINT fund_allocations_fund_cluster_id_fkey FOREIGN KEY (fund_cluster_id) REFERENCES public.fund_clusters(id) ON DELETE SET NULL;


--
-- TOC entry 5618 (class 2606 OID 37859)
-- Name: fund_allocations fund_allocations_fund_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fund_allocations
    ADD CONSTRAINT fund_allocations_fund_source_id_fkey FOREIGN KEY (fund_source_id) REFERENCES public.fund_sources(id) ON DELETE SET NULL;


--
-- TOC entry 5619 (class 2606 OID 37874)
-- Name: fund_allocations fund_allocations_responsibility_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fund_allocations
    ADD CONSTRAINT fund_allocations_responsibility_center_id_fkey FOREIGN KEY (responsibility_center_id) REFERENCES public.responsibility_centers(id) ON DELETE SET NULL;


--
-- TOC entry 5620 (class 2606 OID 37879)
-- Name: fund_allocations fund_allocations_wfp_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fund_allocations
    ADD CONSTRAINT fund_allocations_wfp_source_id_fkey FOREIGN KEY (wfp_source_id) REFERENCES public.wfp_sources(id) ON DELETE SET NULL;


--
-- TOC entry 5602 (class 2606 OID 37573)
-- Name: fund_clusters fund_clusters_fund_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fund_clusters
    ADD CONSTRAINT fund_clusters_fund_source_id_fkey FOREIGN KEY (fund_source_id) REFERENCES public.fund_sources(id) ON DELETE SET NULL;


--
-- TOC entry 5676 (class 2606 OID 49435)
-- Name: igp_programs igp_programs_campus_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_programs
    ADD CONSTRAINT igp_programs_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES public.campuses(id) ON DELETE SET NULL;


--
-- TOC entry 5677 (class 2606 OID 49445)
-- Name: igp_programs igp_programs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_programs
    ADD CONSTRAINT igp_programs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5678 (class 2606 OID 49579)
-- Name: igp_programs igp_programs_fund_cluster_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_programs
    ADD CONSTRAINT igp_programs_fund_cluster_id_fkey FOREIGN KEY (fund_cluster_id) REFERENCES public.fund_clusters(id) ON DELETE SET NULL;


--
-- TOC entry 5679 (class 2606 OID 49430)
-- Name: igp_programs igp_programs_fund_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_programs
    ADD CONSTRAINT igp_programs_fund_source_id_fkey FOREIGN KEY (fund_source_id) REFERENCES public.fund_sources(id) ON DELETE RESTRICT;


--
-- TOC entry 5680 (class 2606 OID 49440)
-- Name: igp_programs igp_programs_responsibility_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_programs
    ADD CONSTRAINT igp_programs_responsibility_center_id_fkey FOREIGN KEY (responsibility_center_id) REFERENCES public.responsibility_centers(id) ON DELETE SET NULL;


--
-- TOC entry 5681 (class 2606 OID 49450)
-- Name: igp_programs igp_programs_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_programs
    ADD CONSTRAINT igp_programs_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5682 (class 2606 OID 49584)
-- Name: igp_programs igp_programs_wfp_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_programs
    ADD CONSTRAINT igp_programs_wfp_source_id_fkey FOREIGN KEY (wfp_source_id) REFERENCES public.wfp_sources(id) ON DELETE SET NULL;


--
-- TOC entry 5684 (class 2606 OID 49614)
-- Name: igp_transactions igp_transactions_allotment_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_transactions
    ADD CONSTRAINT igp_transactions_allotment_class_id_fkey FOREIGN KEY (allotment_class_id) REFERENCES public.allotment_classes(id) ON DELETE SET NULL;


--
-- TOC entry 5685 (class 2606 OID 49594)
-- Name: igp_transactions igp_transactions_campus_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_transactions
    ADD CONSTRAINT igp_transactions_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES public.campuses(id) ON DELETE SET NULL;


--
-- TOC entry 5686 (class 2606 OID 49500)
-- Name: igp_transactions igp_transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_transactions
    ADD CONSTRAINT igp_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5687 (class 2606 OID 49589)
-- Name: igp_transactions igp_transactions_fund_cluster_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_transactions
    ADD CONSTRAINT igp_transactions_fund_cluster_id_fkey FOREIGN KEY (fund_cluster_id) REFERENCES public.fund_clusters(id) ON DELETE SET NULL;


--
-- TOC entry 5688 (class 2606 OID 49490)
-- Name: igp_transactions igp_transactions_fund_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_transactions
    ADD CONSTRAINT igp_transactions_fund_source_id_fkey FOREIGN KEY (fund_source_id) REFERENCES public.fund_sources(id) ON DELETE RESTRICT;


--
-- TOC entry 5689 (class 2606 OID 49495)
-- Name: igp_transactions igp_transactions_igp_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_transactions
    ADD CONSTRAINT igp_transactions_igp_program_id_fkey FOREIGN KEY (igp_program_id) REFERENCES public.igp_programs(id) ON DELETE RESTRICT;


--
-- TOC entry 5690 (class 2606 OID 49624)
-- Name: igp_transactions igp_transactions_mfo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_transactions
    ADD CONSTRAINT igp_transactions_mfo_id_fkey FOREIGN KEY (mfo_id) REFERENCES public.mfo(id) ON DELETE SET NULL;


--
-- TOC entry 5691 (class 2606 OID 49619)
-- Name: igp_transactions igp_transactions_object_expenditure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_transactions
    ADD CONSTRAINT igp_transactions_object_expenditure_id_fkey FOREIGN KEY (object_expenditure_id) REFERENCES public.object_expenditures(id) ON DELETE SET NULL;


--
-- TOC entry 5692 (class 2606 OID 49629)
-- Name: igp_transactions igp_transactions_old_uacs_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_transactions
    ADD CONSTRAINT igp_transactions_old_uacs_code_id_fkey FOREIGN KEY (old_uacs_code_id) REFERENCES public.uacs_codes(id) ON DELETE SET NULL;


--
-- TOC entry 5693 (class 2606 OID 49604)
-- Name: igp_transactions igp_transactions_pap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_transactions
    ADD CONSTRAINT igp_transactions_pap_id_fkey FOREIGN KEY (pap_id) REFERENCES public.pap(id) ON DELETE SET NULL;


--
-- TOC entry 5694 (class 2606 OID 49599)
-- Name: igp_transactions igp_transactions_responsibility_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_transactions
    ADD CONSTRAINT igp_transactions_responsibility_center_id_fkey FOREIGN KEY (responsibility_center_id) REFERENCES public.responsibility_centers(id) ON DELETE SET NULL;


--
-- TOC entry 5695 (class 2606 OID 49609)
-- Name: igp_transactions igp_transactions_uacs_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_transactions
    ADD CONSTRAINT igp_transactions_uacs_code_id_fkey FOREIGN KEY (uacs_code_id) REFERENCES public.uacs_codes(id) ON DELETE SET NULL;


--
-- TOC entry 5696 (class 2606 OID 49505)
-- Name: igp_transactions igp_transactions_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_transactions
    ADD CONSTRAINT igp_transactions_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5697 (class 2606 OID 49634)
-- Name: igp_transactions igp_transactions_wfp_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igp_transactions
    ADD CONSTRAINT igp_transactions_wfp_source_id_fkey FOREIGN KEY (wfp_source_id) REFERENCES public.wfp_sources(id) ON DELETE SET NULL;


--
-- TOC entry 5656 (class 2606 OID 38228)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5662 (class 2606 OID 38350)
-- Name: preferences preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preferences
    ADD CONSTRAINT preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5698 (class 2606 OID 49702)
-- Name: raod_audit_trail raod_audit_trail_performed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raod_audit_trail
    ADD CONSTRAINT raod_audit_trail_performed_by_id_fkey FOREIGN KEY (performed_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5699 (class 2606 OID 49697)
-- Name: raod_audit_trail raod_audit_trail_raod_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raod_audit_trail
    ADD CONSTRAINT raod_audit_trail_raod_entry_id_fkey FOREIGN KEY (raod_entry_id) REFERENCES public.raod_entries(id) ON DELETE SET NULL;


--
-- TOC entry 5635 (class 2606 OID 38047)
-- Name: raod_entries raod_entries_allotment_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raod_entries
    ADD CONSTRAINT raod_entries_allotment_class_id_fkey FOREIGN KEY (allotment_class_id) REFERENCES public.allotment_classes(id) ON DELETE SET NULL;


--
-- TOC entry 5636 (class 2606 OID 38027)
-- Name: raod_entries raod_entries_campus_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raod_entries
    ADD CONSTRAINT raod_entries_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES public.campuses(id) ON DELETE SET NULL;


--
-- TOC entry 5637 (class 2606 OID 38067)
-- Name: raod_entries raod_entries_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raod_entries
    ADD CONSTRAINT raod_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5638 (class 2606 OID 38017)
-- Name: raod_entries raod_entries_fund_cluster_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raod_entries
    ADD CONSTRAINT raod_entries_fund_cluster_id_fkey FOREIGN KEY (fund_cluster_id) REFERENCES public.fund_clusters(id) ON DELETE SET NULL;


--
-- TOC entry 5639 (class 2606 OID 38022)
-- Name: raod_entries raod_entries_fund_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raod_entries
    ADD CONSTRAINT raod_entries_fund_source_id_fkey FOREIGN KEY (fund_source_id) REFERENCES public.fund_sources(id) ON DELETE SET NULL;


--
-- TOC entry 5640 (class 2606 OID 38057)
-- Name: raod_entries raod_entries_mfo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raod_entries
    ADD CONSTRAINT raod_entries_mfo_id_fkey FOREIGN KEY (mfo_id) REFERENCES public.mfo(id) ON DELETE SET NULL;


--
-- TOC entry 5641 (class 2606 OID 38052)
-- Name: raod_entries raod_entries_object_expenditure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raod_entries
    ADD CONSTRAINT raod_entries_object_expenditure_id_fkey FOREIGN KEY (object_expenditure_id) REFERENCES public.object_expenditures(id) ON DELETE SET NULL;


--
-- TOC entry 5642 (class 2606 OID 38037)
-- Name: raod_entries raod_entries_pap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raod_entries
    ADD CONSTRAINT raod_entries_pap_id_fkey FOREIGN KEY (pap_id) REFERENCES public.pap(id) ON DELETE SET NULL;


--
-- TOC entry 5643 (class 2606 OID 38032)
-- Name: raod_entries raod_entries_responsibility_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raod_entries
    ADD CONSTRAINT raod_entries_responsibility_center_id_fkey FOREIGN KEY (responsibility_center_id) REFERENCES public.responsibility_centers(id) ON DELETE SET NULL;


--
-- TOC entry 5644 (class 2606 OID 38042)
-- Name: raod_entries raod_entries_uacs_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raod_entries
    ADD CONSTRAINT raod_entries_uacs_code_id_fkey FOREIGN KEY (uacs_code_id) REFERENCES public.uacs_codes(id) ON DELETE SET NULL;


--
-- TOC entry 5645 (class 2606 OID 38072)
-- Name: raod_entries raod_entries_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raod_entries
    ADD CONSTRAINT raod_entries_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5646 (class 2606 OID 38062)
-- Name: raod_entries raod_entries_wfp_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raod_entries
    ADD CONSTRAINT raod_entries_wfp_source_id_fkey FOREIGN KEY (wfp_source_id) REFERENCES public.wfp_sources(id) ON DELETE SET NULL;


--
-- TOC entry 5621 (class 2606 OID 37949)
-- Name: rbud_entries rbud_entries_allotment_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_entries
    ADD CONSTRAINT rbud_entries_allotment_class_id_fkey FOREIGN KEY (allotment_class_id) REFERENCES public.allotment_classes(id) ON DELETE SET NULL;


--
-- TOC entry 5622 (class 2606 OID 37929)
-- Name: rbud_entries rbud_entries_campus_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_entries
    ADD CONSTRAINT rbud_entries_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES public.campuses(id) ON DELETE SET NULL;


--
-- TOC entry 5623 (class 2606 OID 37974)
-- Name: rbud_entries rbud_entries_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_entries
    ADD CONSTRAINT rbud_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5624 (class 2606 OID 37919)
-- Name: rbud_entries rbud_entries_fund_cluster_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_entries
    ADD CONSTRAINT rbud_entries_fund_cluster_id_fkey FOREIGN KEY (fund_cluster_id) REFERENCES public.fund_clusters(id) ON DELETE SET NULL;


--
-- TOC entry 5625 (class 2606 OID 37924)
-- Name: rbud_entries rbud_entries_fund_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_entries
    ADD CONSTRAINT rbud_entries_fund_source_id_fkey FOREIGN KEY (fund_source_id) REFERENCES public.fund_sources(id) ON DELETE SET NULL;


--
-- TOC entry 5626 (class 2606 OID 37959)
-- Name: rbud_entries rbud_entries_mfo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_entries
    ADD CONSTRAINT rbud_entries_mfo_id_fkey FOREIGN KEY (mfo_id) REFERENCES public.mfo(id) ON DELETE SET NULL;


--
-- TOC entry 5627 (class 2606 OID 37954)
-- Name: rbud_entries rbud_entries_object_expenditure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_entries
    ADD CONSTRAINT rbud_entries_object_expenditure_id_fkey FOREIGN KEY (object_expenditure_id) REFERENCES public.object_expenditures(id) ON DELETE SET NULL;


--
-- TOC entry 5628 (class 2606 OID 37964)
-- Name: rbud_entries rbud_entries_old_uacs_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_entries
    ADD CONSTRAINT rbud_entries_old_uacs_code_id_fkey FOREIGN KEY (old_uacs_code_id) REFERENCES public.uacs_codes(id) ON DELETE SET NULL;


--
-- TOC entry 5629 (class 2606 OID 37939)
-- Name: rbud_entries rbud_entries_pap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_entries
    ADD CONSTRAINT rbud_entries_pap_id_fkey FOREIGN KEY (pap_id) REFERENCES public.pap(id) ON DELETE SET NULL;


--
-- TOC entry 5630 (class 2606 OID 37934)
-- Name: rbud_entries rbud_entries_responsibility_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_entries
    ADD CONSTRAINT rbud_entries_responsibility_center_id_fkey FOREIGN KEY (responsibility_center_id) REFERENCES public.responsibility_centers(id) ON DELETE SET NULL;


--
-- TOC entry 5631 (class 2606 OID 37944)
-- Name: rbud_entries rbud_entries_uacs_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_entries
    ADD CONSTRAINT rbud_entries_uacs_code_id_fkey FOREIGN KEY (uacs_code_id) REFERENCES public.uacs_codes(id) ON DELETE SET NULL;


--
-- TOC entry 5632 (class 2606 OID 37979)
-- Name: rbud_entries rbud_entries_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_entries
    ADD CONSTRAINT rbud_entries_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5633 (class 2606 OID 37969)
-- Name: rbud_entries rbud_entries_wfp_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbud_entries
    ADD CONSTRAINT rbud_entries_wfp_source_id_fkey FOREIGN KEY (wfp_source_id) REFERENCES public.wfp_sources(id) ON DELETE SET NULL;


--
-- TOC entry 5660 (class 2606 OID 38290)
-- Name: report_exports report_exports_fund_cluster_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_exports
    ADD CONSTRAINT report_exports_fund_cluster_id_fkey FOREIGN KEY (fund_cluster_id) REFERENCES public.fund_clusters(id) ON DELETE SET NULL;


--
-- TOC entry 5661 (class 2606 OID 38295)
-- Name: report_exports report_exports_generated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_exports
    ADD CONSTRAINT report_exports_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5647 (class 2606 OID 38124)
-- Name: wfp_balances wfp_balances_campus_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wfp_balances
    ADD CONSTRAINT wfp_balances_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES public.campuses(id) ON DELETE SET NULL;


--
-- TOC entry 5648 (class 2606 OID 38114)
-- Name: wfp_balances wfp_balances_fund_cluster_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wfp_balances
    ADD CONSTRAINT wfp_balances_fund_cluster_id_fkey FOREIGN KEY (fund_cluster_id) REFERENCES public.fund_clusters(id) ON DELETE SET NULL;


--
-- TOC entry 5649 (class 2606 OID 38119)
-- Name: wfp_balances wfp_balances_fund_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wfp_balances
    ADD CONSTRAINT wfp_balances_fund_source_id_fkey FOREIGN KEY (fund_source_id) REFERENCES public.fund_sources(id) ON DELETE SET NULL;


--
-- TOC entry 5650 (class 2606 OID 38129)
-- Name: wfp_balances wfp_balances_responsibility_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wfp_balances
    ADD CONSTRAINT wfp_balances_responsibility_center_id_fkey FOREIGN KEY (responsibility_center_id) REFERENCES public.responsibility_centers(id) ON DELETE SET NULL;


--
-- TOC entry 5651 (class 2606 OID 38134)
-- Name: wfp_balances wfp_balances_wfp_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wfp_balances
    ADD CONSTRAINT wfp_balances_wfp_source_id_fkey FOREIGN KEY (wfp_source_id) REFERENCES public.wfp_sources(id) ON DELETE SET NULL;


-- Completed on 2026-10-26 13:33:20

--
-- PostgreSQL database dump complete
--

\unrestrict ridO0Qd48LozlVdkCw1NSml0NexoCEZovUdhB9FXDJ8g0w5Dz5snnxYVfsbOv1v

