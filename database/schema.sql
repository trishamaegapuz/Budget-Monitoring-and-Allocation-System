-- ============================================================
-- BMAS DATABASE SCHEMA
-- Budget Monitoring and Allocation System
-- ============================================================
-- Based on the actual ASIST budget monitoring structure
-- including RBUD and RAOD records.
--
-- Main System Modules:
-- 1. Dashboard
-- 2. Budget Allocation
-- 3. Fund Sources
-- 4. RBUD Registry
-- 5. RAOD Registry
-- 6. Financial Reports
-- 7. Reports & Export
-- 8. Master Data
-- 9. User Management
-- 10. Settings
-- ============================================================


-- ============================================================
-- 0. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- 1. USERS
-- ============================================================
-- Created early because many other tables reference users.
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,

    username VARCHAR(100) UNIQUE NOT NULL,

    password_hash VARCHAR(255) NOT NULL,

    email VARCHAR(150) UNIQUE,

    full_name VARCHAR(200) NOT NULL,

    role VARCHAR(50) NOT NULL DEFAULT 'User',

    department VARCHAR(200),

    position VARCHAR(150),

    status VARCHAR(30) NOT NULL DEFAULT 'Pending',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    last_login TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 2. MASTER / REFERENCE DATA
-- ============================================================

-- ------------------------------------------------------------
-- 2.1 Fund Sources
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS fund_sources (
    id SERIAL PRIMARY KEY,

    code VARCHAR(20) UNIQUE NOT NULL,

    name VARCHAR(150) NOT NULL,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ------------------------------------------------------------
-- 2.2 Fund Clusters
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS fund_clusters (
    id SERIAL PRIMARY KEY,

    fund_source_id INTEGER
        REFERENCES fund_sources(id)
        ON DELETE SET NULL,

    code VARCHAR(100) UNIQUE NOT NULL,

    name VARCHAR(200) NOT NULL,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ------------------------------------------------------------
-- 2.3 Campuses
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS campuses (
    id SERIAL PRIMARY KEY,

    code VARCHAR(50) UNIQUE NOT NULL,

    name VARCHAR(150) NOT NULL,

    abbreviation VARCHAR(30),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ------------------------------------------------------------
-- 2.4 Responsibility Centers
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS responsibility_centers (
    id SERIAL PRIMARY KEY,

    code VARCHAR(50) UNIQUE NOT NULL,

    name VARCHAR(200) NOT NULL,

    description TEXT,

    category VARCHAR(100),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ------------------------------------------------------------
-- 2.5 MFO
-- Major Final Output
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS mfo (
    id SERIAL PRIMARY KEY,

    code VARCHAR(50) UNIQUE NOT NULL,

    name VARCHAR(200) NOT NULL,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ------------------------------------------------------------
-- 2.6 PAP
-- Programs / Projects / Activities
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pap (
    id SERIAL PRIMARY KEY,

    code VARCHAR(100) UNIQUE NOT NULL,

    name VARCHAR(250) NOT NULL,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ------------------------------------------------------------
-- 2.7 UACS Codes
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS uacs_codes (
    id SERIAL PRIMARY KEY,

    code VARCHAR(50) UNIQUE NOT NULL,

    old_code VARCHAR(50),

    account_title VARCHAR(250),

    revised_description TEXT,

    account_description TEXT,

    category VARCHAR(100),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ------------------------------------------------------------
-- 2.8 Object of Expenditures
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS object_expenditures (
    id SERIAL PRIMARY KEY,

    code VARCHAR(50) UNIQUE NOT NULL,

    name VARCHAR(150) NOT NULL,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ------------------------------------------------------------
-- 2.9 Allotment Classes
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS allotment_classes (
    id SERIAL PRIMARY KEY,

    code VARCHAR(20) UNIQUE NOT NULL,

    name VARCHAR(100) NOT NULL,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ------------------------------------------------------------
-- 2.10 WFP Sources
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS wfp_sources (
    id SERIAL PRIMARY KEY,

    code VARCHAR(100) UNIQUE NOT NULL,

    name VARCHAR(250) NOT NULL,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 3. FISCAL YEARS
-- ============================================================

CREATE TABLE IF NOT EXISTS fiscal_years (
    id SERIAL PRIMARY KEY,

    year INTEGER UNIQUE NOT NULL,

    is_current BOOLEAN NOT NULL DEFAULT FALSE,

    is_closed BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 4. BUDGET ITEMS
-- ============================================================

CREATE TABLE IF NOT EXISTS budget_items (
    id SERIAL PRIMARY KEY,

    fiscal_year INTEGER NOT NULL,

    fund_cluster_id INTEGER
        REFERENCES fund_clusters(id)
        ON DELETE SET NULL,

    fund_source_id INTEGER
        REFERENCES fund_sources(id)
        ON DELETE SET NULL,

    campus_id INTEGER
        REFERENCES campuses(id)
        ON DELETE SET NULL,

    responsibility_center_id INTEGER
        REFERENCES responsibility_centers(id)
        ON DELETE SET NULL,

    mfo_id INTEGER
        REFERENCES mfo(id)
        ON DELETE SET NULL,

    pap_id INTEGER
        REFERENCES pap(id)
        ON DELETE SET NULL,

    uacs_code_id INTEGER
        REFERENCES uacs_codes(id)
        ON DELETE SET NULL,

    object_expenditure_id INTEGER
        REFERENCES object_expenditures(id)
        ON DELETE SET NULL,

    allotment_class_id INTEGER
        REFERENCES allotment_classes(id)
        ON DELETE SET NULL,

    wfp_source_id INTEGER
        REFERENCES wfp_sources(id)
        ON DELETE SET NULL,

    -- Excel reference fields
    fund_code VARCHAR(150),
    wfp_description TEXT,
    wfp_source_code VARCHAR(100),
    uacs_funding_source_code VARCHAR(100),

    approved_budget NUMERIC(18,2)
        NOT NULL DEFAULT 0,

    ps_amount NUMERIC(18,2)
        NOT NULL DEFAULT 0,

    mooe_amount NUMERIC(18,2)
        NOT NULL DEFAULT 0,

    co_amount NUMERIC(18,2)
        NOT NULL DEFAULT 0,

    quarter INTEGER
        CHECK (quarter BETWEEN 1 AND 4),

    month INTEGER
        CHECK (month BETWEEN 1 AND 12),

    status VARCHAR(30)
        NOT NULL DEFAULT 'Active',

    notes TEXT,

    created_by INTEGER
        REFERENCES users(id)
        ON DELETE SET NULL,

    updated_by INTEGER
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 5. FUND ALLOCATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS fund_allocations (
    id SERIAL PRIMARY KEY,

    fiscal_year INTEGER NOT NULL,

    fund_source_id INTEGER
        REFERENCES fund_sources(id)
        ON DELETE SET NULL,

    fund_cluster_id INTEGER
        REFERENCES fund_clusters(id)
        ON DELETE SET NULL,

    campus_id INTEGER
        REFERENCES campuses(id)
        ON DELETE SET NULL,

    responsibility_center_id INTEGER
        REFERENCES responsibility_centers(id)
        ON DELETE SET NULL,

    wfp_source_id INTEGER
        REFERENCES wfp_sources(id)
        ON DELETE SET NULL,

    allocation_amount NUMERIC(18,2)
        NOT NULL DEFAULT 0,

    utilized_amount NUMERIC(18,2)
        NOT NULL DEFAULT 0,

    disbursed_amount NUMERIC(18,2)
        NOT NULL DEFAULT 0,

    remaining_balance NUMERIC(18,2)
        GENERATED ALWAYS AS (
            allocation_amount - utilized_amount
        ) STORED,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 6. RBUD REGISTRY
-- Registry of Budget, Utilization and Disbursement
-- ============================================================

CREATE TABLE IF NOT EXISTS rbud_entries (
    id SERIAL PRIMARY KEY,
    registry_no VARCHAR(100) UNIQUE NOT NULL,
    entry_date DATE,
    fund_cluster_id INTEGER REFERENCES fund_clusters(id) ON DELETE SET NULL,
    fund_source_id INTEGER REFERENCES fund_sources(id) ON DELETE SET NULL,
    campus_id INTEGER REFERENCES campuses(id) ON DELETE SET NULL,
    burs_serial_no VARCHAR(100),
    serial_no_transferred VARCHAR(100),
    payee VARCHAR(250),
    particulars TEXT,
    responsibility_center_id INTEGER REFERENCES responsibility_centers(id) ON DELETE SET NULL,
    pap_id INTEGER REFERENCES pap(id) ON DELETE SET NULL,
    uacs_code_id INTEGER REFERENCES uacs_codes(id) ON DELETE SET NULL,
    ref_no VARCHAR(100),
    allotment_class_id INTEGER REFERENCES allotment_classes(id) ON DELETE SET NULL,
    uacs_funding_source_code VARCHAR(100),
    fiscal_year INTEGER NOT NULL,
    month INTEGER CHECK (month BETWEEN 1 AND 12),
    series VARCHAR(50),
    series2 VARCHAR(50),
    quarter INTEGER CHECK (quarter BETWEEN 1 AND 4),
    object_expenditure_id INTEGER REFERENCES object_expenditures(id) ON DELETE SET NULL,
    mfo_id INTEGER REFERENCES mfo(id) ON DELETE SET NULL,
    old_uacs_code_id INTEGER REFERENCES uacs_codes(id) ON DELETE SET NULL,
    account_title VARCHAR(250),
    utilization_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    ps_utilization NUMERIC(18,2) NOT NULL DEFAULT 0,
    mooe_utilization NUMERIC(18,2) NOT NULL DEFAULT 0,
    co_utilization NUMERIC(18,2) NOT NULL DEFAULT 0,
    wfp_source VARCHAR(250),
    wfp_source_code VARCHAR(100),
    dv_payroll_no VARCHAR(100),
    disbursement_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    running_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
    remarks TEXT,
    unpaid_utilization NUMERIC(18,2) NOT NULL DEFAULT 0,
    po_no VARCHAR(100),
    po_status VARCHAR(50),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 7. RAOD REGISTRY
-- Registry of Allotment, Obligation and Disbursement
-- ============================================================

CREATE TABLE IF NOT EXISTS raod_entries (
    id SERIAL PRIMARY KEY,
    registry_no VARCHAR(100) UNIQUE NOT NULL,
    entry_date DATE,
    fund_cluster_id INTEGER REFERENCES fund_clusters(id) ON DELETE SET NULL,
    fund_source_id INTEGER REFERENCES fund_sources(id) ON DELETE SET NULL,
    campus_id INTEGER REFERENCES campuses(id) ON DELETE SET NULL,
    ors_serial_no VARCHAR(100),
    serial_no_transferred VARCHAR(100),
    payee VARCHAR(250),
    particulars TEXT,
    responsibility_center_id INTEGER REFERENCES responsibility_centers(id) ON DELETE SET NULL,
    pap_id INTEGER REFERENCES pap(id) ON DELETE SET NULL,
    uacs_code_id INTEGER REFERENCES uacs_codes(id) ON DELETE SET NULL,
    ref_no VARCHAR(100),
    allotment_class_id INTEGER REFERENCES allotment_classes(id) ON DELETE SET NULL,
    uacs_funding_source_code VARCHAR(100),
    fiscal_year INTEGER NOT NULL,
    month INTEGER CHECK (month BETWEEN 1 AND 12),
    series VARCHAR(50),
    series2 VARCHAR(50),
    quarter INTEGER CHECK (quarter BETWEEN 1 AND 4),
    object_expenditure_id INTEGER REFERENCES object_expenditures(id) ON DELETE SET NULL,
    mfo_id INTEGER REFERENCES mfo(id) ON DELETE SET NULL,
    old_uacs_code_id INTEGER REFERENCES uacs_codes(id) ON DELETE SET NULL,
    account_title VARCHAR(250),
    obligation_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    ps_obligation NUMERIC(18,2) NOT NULL DEFAULT 0,
    mooe_obligation NUMERIC(18,2) NOT NULL DEFAULT 0,
    co_obligation NUMERIC(18,2) NOT NULL DEFAULT 0,
    wfp_source VARCHAR(250),
    wfp_source_code VARCHAR(100),
    dv_payroll_no VARCHAR(100),
    disbursement_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    running_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
    remarks TEXT,
    unpaid_obligation NUMERIC(18,2) NOT NULL DEFAULT 0,
    po_no VARCHAR(100),
    po_status VARCHAR(50),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 8. WFP / FUND BALANCES
-- ============================================================

CREATE TABLE IF NOT EXISTS wfp_balances (
    id SERIAL PRIMARY KEY,
    fiscal_year INTEGER NOT NULL,
    fund_cluster_id INTEGER REFERENCES fund_clusters(id) ON DELETE SET NULL,
    fund_source_id INTEGER REFERENCES fund_sources(id) ON DELETE SET NULL,
    campus_id INTEGER REFERENCES campuses(id) ON DELETE SET NULL,
    fund_code VARCHAR(150),
    responsibility_center_id INTEGER REFERENCES responsibility_centers(id) ON DELETE SET NULL,
    rc VARCHAR(100),
    wfp_source_id INTEGER REFERENCES wfp_sources(id) ON DELETE SET NULL,
    wfp_source VARCHAR(250),
    wfp_description TEXT,
    source_code VARCHAR(100),

    beginning_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
    approved_budget NUMERIC(18,2) NOT NULL DEFAULT 0,
    actual_2nd_sem_2024_2025 NUMERIC(18,2) NOT NULL DEFAULT 0,
    actual_1st_sem_2025_2026 NUMERIC(18,2) NOT NULL DEFAULT 0,
    actual_unifast NUMERIC(18,2) NOT NULL DEFAULT 0,

    beg_bal_year1 NUMERIC(18,2) NOT NULL DEFAULT 0,
    year1_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    utilization_year1 NUMERIC(18,2) NOT NULL DEFAULT 0,
    unutilized_year1 NUMERIC(18,2) NOT NULL DEFAULT 0,
    year2_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    utilization_year2 NUMERIC(18,2) NOT NULL DEFAULT 0,
    unutilized_year2 NUMERIC(18,2) NOT NULL DEFAULT 0,
    disbursement_year1 NUMERIC(18,2) NOT NULL DEFAULT 0,
    unpaid_utilization_year1 NUMERIC(18,2) NOT NULL DEFAULT 0,

    gaa NUMERIC(18,2) NOT NULL DEFAULT 0,
    adjustments NUMERIC(18,2) NOT NULL DEFAULT 0,
    adjusted_appropriation NUMERIC(18,2) NOT NULL DEFAULT 0,
    nca_received NUMERIC(18,2) NOT NULL DEFAULT 0,
    allotment_received NUMERIC(18,2) NOT NULL DEFAULT 0,
    obligation NUMERIC(18,2) NOT NULL DEFAULT 0,
    unobligated_appropriation NUMERIC(18,2) NOT NULL DEFAULT 0,
    unobligated_allotment NUMERIC(18,2) NOT NULL DEFAULT 0,
    disbursement NUMERIC(18,2) NOT NULL DEFAULT 0,
    unpaid_obligation NUMERIC(18,2) NOT NULL DEFAULT 0,

    utilization NUMERIC(18,2) NOT NULL DEFAULT 0,
    unutilized_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
    unpaid_utilization NUMERIC(18,2) NOT NULL DEFAULT 0,
    remarks TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 9. BUDGET ADJUSTMENTS / MAF
-- ============================================================

CREATE TABLE IF NOT EXISTS budget_adjustments (
    id SERIAL PRIMARY KEY,

    maf_no VARCHAR(100) UNIQUE NOT NULL,

    fiscal_year INTEGER NOT NULL,

    fund_cluster_id INTEGER
        REFERENCES fund_clusters(id)
        ON DELETE SET NULL,

    fund_source_id INTEGER
        REFERENCES fund_sources(id)
        ON DELETE SET NULL,

    department VARCHAR(200),

    prepared_by INTEGER
        REFERENCES users(id)
        ON DELETE SET NULL,

    adjustment_date DATE,

    source_program VARCHAR(250),

    source_rc VARCHAR(100),

    source_allotment_class VARCHAR(50),

    source_object_expenditure VARCHAR(150),

    source_amount NUMERIC(18,2)
        NOT NULL DEFAULT 0,

    deficient_program VARCHAR(250),

    deficient_rc VARCHAR(100),

    deficient_allotment_class VARCHAR(50),

    deficient_object_expenditure VARCHAR(150),

    deficient_amount NUMERIC(18,2)
        NOT NULL DEFAULT 0,

    status VARCHAR(30)
        NOT NULL DEFAULT 'Pending',

    remarks TEXT,

    approved_by INTEGER
        REFERENCES users(id)
        ON DELETE SET NULL,

    approved_date DATE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 10. FHE DEFICIENCY
-- ============================================================

CREATE TABLE IF NOT EXISTS fhe_deficiency (
    id SERIAL PRIMARY KEY,

    fiscal_year INTEGER NOT NULL,

    academic_year VARCHAR(50),

    enrolled_students INTEGER
        NOT NULL DEFAULT 0,

    qualified_students INTEGER
        NOT NULL DEFAULT 0,

    saro_no VARCHAR(100),

    saro_date DATE,

    nca_no VARCHAR(100),

    nca_date DATE,

    saro_amount NUMERIC(18,2)
        NOT NULL DEFAULT 0,

    nca_received NUMERIC(18,2)
        NOT NULL DEFAULT 0,

    actual_billing NUMERIC(18,2)
        NOT NULL DEFAULT 0,

    mdp VARCHAR(100),

    deficiency_amount NUMERIC(18,2)
        NOT NULL DEFAULT 0,

    remarks TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 11. NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,

    user_id INTEGER
        REFERENCES users(id)
        ON DELETE CASCADE,

    recipient_role VARCHAR(50),

    title VARCHAR(250) NOT NULL,

    message TEXT NOT NULL,

    type VARCHAR(30)
        NOT NULL DEFAULT 'Info',

    is_read BOOLEAN
        NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 12. AUDIT LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,

    user_id INTEGER
        REFERENCES users(id)
        ON DELETE SET NULL,

    action VARCHAR(100) NOT NULL,

    table_name VARCHAR(100),

    record_id INTEGER,

    old_data JSONB,

    new_data JSONB,

    ip_address VARCHAR(45),

    user_agent TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 13. FINANCIAL REPORTS
-- ============================================================

CREATE TABLE IF NOT EXISTS financial_reports (
    id SERIAL PRIMARY KEY,

    report_type VARCHAR(50) NOT NULL,

    report_name VARCHAR(200) NOT NULL,

    fiscal_year INTEGER NOT NULL,

    period_type VARCHAR(30),

    period_value VARCHAR(50),

    fund_cluster_id INTEGER
        REFERENCES fund_clusters(id)
        ON DELETE SET NULL,

    generated_by INTEGER
        REFERENCES users(id)
        ON DELETE SET NULL,

    file_format VARCHAR(20),

    file_path TEXT,

    status VARCHAR(30)
        NOT NULL DEFAULT 'Generated',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 14. REPORT EXPORT HISTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS report_exports (
    id SERIAL PRIMARY KEY,

    report_type VARCHAR(100) NOT NULL,

    fiscal_year INTEGER,

    fund_cluster_id INTEGER
        REFERENCES fund_clusters(id)
        ON DELETE SET NULL,

    format VARCHAR(20) NOT NULL,

    generated_by INTEGER
        REFERENCES users(id)
        ON DELETE SET NULL,

    file_name VARCHAR(250),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 15. SETTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,

    system_name VARCHAR(150)
        DEFAULT 'Budget Monitoring and Allocation System',

    system_acronym VARCHAR(30)
        DEFAULT 'BMAS',

    institution VARCHAR(250)
        DEFAULT 'Abra State Institute of Sciences and Technology',

    default_fiscal_year INTEGER
        DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,

    default_date_format VARCHAR(50)
        DEFAULT 'MM/DD/YYYY',

    default_timezone VARCHAR(100)
        DEFAULT 'Asia/Manila',

    currency_code VARCHAR(10)
        DEFAULT 'PHP',

    currency_symbol VARCHAR(10)
        DEFAULT '₱',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 16. USER PREFERENCES
-- ============================================================

CREATE TABLE IF NOT EXISTS preferences (
    id SERIAL PRIMARY KEY,

    user_id INTEGER UNIQUE
        REFERENCES users(id)
        ON DELETE CASCADE,

    items_per_page INTEGER
        NOT NULL DEFAULT 10,

    theme VARCHAR(30)
        NOT NULL DEFAULT 'Light',

    sidebar_position VARCHAR(30)
        NOT NULL DEFAULT 'Fixed',

    dashboard_overview BOOLEAN
        NOT NULL DEFAULT TRUE,

    auto_logout_minutes INTEGER
        NOT NULL DEFAULT 30,

    confirm_before_delete BOOLEAN
        NOT NULL DEFAULT TRUE,

    enable_animations BOOLEAN
        NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 17. ALLOCATION ACTIVITIES
-- ============================================================

CREATE TABLE IF NOT EXISTS allocation_activities (
    id SERIAL PRIMARY KEY,

    action_type VARCHAR(50) NOT NULL,

    description TEXT NOT NULL,

    details JSONB,

    user_id INTEGER
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 18. INDEXES
-- ============================================================

-- Fund Sources
CREATE INDEX IF NOT EXISTS idx_fund_sources_code
ON fund_sources(code);

-- Fund Clusters
CREATE INDEX IF NOT EXISTS idx_fund_clusters_code
ON fund_clusters(code);

CREATE INDEX IF NOT EXISTS idx_fund_clusters_source
ON fund_clusters(fund_source_id);

-- Budget
CREATE INDEX IF NOT EXISTS idx_budget_items_year
ON budget_items(fiscal_year);

CREATE INDEX IF NOT EXISTS idx_budget_items_fund_cluster
ON budget_items(fund_cluster_id);

CREATE INDEX IF NOT EXISTS idx_budget_items_fund_source
ON budget_items(fund_source_id);

CREATE INDEX IF NOT EXISTS idx_budget_items_campus
ON budget_items(campus_id);

-- Fund Allocations
CREATE INDEX IF NOT EXISTS idx_fund_allocations_year
ON fund_allocations(fiscal_year);

CREATE INDEX IF NOT EXISTS idx_fund_allocations_fund_source
ON fund_allocations(fund_source_id);

CREATE INDEX IF NOT EXISTS idx_fund_allocations_fund_cluster
ON fund_allocations(fund_cluster_id);

-- RBUD
CREATE INDEX IF NOT EXISTS idx_rbud_year
ON rbud_entries(fiscal_year);

CREATE INDEX IF NOT EXISTS idx_rbud_date
ON rbud_entries(entry_date);

CREATE INDEX IF NOT EXISTS idx_rbud_fund_cluster
ON rbud_entries(fund_cluster_id);

CREATE INDEX IF NOT EXISTS idx_rbud_fund_source
ON rbud_entries(fund_source_id);

CREATE INDEX IF NOT EXISTS idx_rbud_registry_no
ON rbud_entries(registry_no);

CREATE INDEX IF NOT EXISTS idx_rbud_burs
ON rbud_entries(burs_serial_no);

CREATE INDEX IF NOT EXISTS idx_rbud_uacs
ON rbud_entries(uacs_code_id);

-- RAOD
CREATE INDEX IF NOT EXISTS idx_raod_year
ON raod_entries(fiscal_year);

CREATE INDEX IF NOT EXISTS idx_raod_date
ON raod_entries(entry_date);

CREATE INDEX IF NOT EXISTS idx_raod_fund_cluster
ON raod_entries(fund_cluster_id);

CREATE INDEX IF NOT EXISTS idx_raod_fund_source
ON raod_entries(fund_source_id);

CREATE INDEX IF NOT EXISTS idx_raod_registry_no
ON raod_entries(registry_no);

CREATE INDEX IF NOT EXISTS idx_raod_ors
ON raod_entries(ors_serial_no);

CREATE INDEX IF NOT EXISTS idx_raod_uacs
ON raod_entries(uacs_code_id);

-- WFP
CREATE INDEX IF NOT EXISTS idx_wfp_year
ON wfp_balances(fiscal_year);

CREATE INDEX IF NOT EXISTS idx_wfp_fund_cluster
ON wfp_balances(fund_cluster_id);

CREATE INDEX IF NOT EXISTS idx_wfp_fund_source
ON wfp_balances(fund_source_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user
ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_read
ON notifications(is_read);

-- Audit
CREATE INDEX IF NOT EXISTS idx_audit_user
ON audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_table
ON audit_log(table_name);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role);

CREATE INDEX IF NOT EXISTS idx_users_status
ON users(status);



-- Excel-aligned WFP / registry indexes
CREATE INDEX IF NOT EXISTS idx_rbud_fund_code ON rbud_entries(fund_source_id);
CREATE INDEX IF NOT EXISTS idx_raod_fund_code ON raod_entries(fund_source_id);
CREATE INDEX IF NOT EXISTS idx_wfp_fiscal_year ON wfp_balances(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_wfp_fund_code ON wfp_balances(fund_code);
CREATE INDEX IF NOT EXISTS idx_wfp_rc ON wfp_balances(rc);

-- ============================================================
-- 19. UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 20. UPDATED_AT TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS trigger_update_users
ON users;

CREATE TRIGGER trigger_update_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trigger_update_fund_sources
ON fund_sources;

CREATE TRIGGER trigger_update_fund_sources
BEFORE UPDATE ON fund_sources
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trigger_update_fund_clusters
ON fund_clusters;

CREATE TRIGGER trigger_update_fund_clusters
BEFORE UPDATE ON fund_clusters
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trigger_update_campuses
ON campuses;

CREATE TRIGGER trigger_update_campuses
BEFORE UPDATE ON campuses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trigger_update_responsibility_centers
ON responsibility_centers;

CREATE TRIGGER trigger_update_responsibility_centers
BEFORE UPDATE ON responsibility_centers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trigger_update_mfo
ON mfo;

CREATE TRIGGER trigger_update_mfo
BEFORE UPDATE ON mfo
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trigger_update_pap
ON pap;

CREATE TRIGGER trigger_update_pap
BEFORE UPDATE ON pap
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trigger_update_uacs_codes
ON uacs_codes;

CREATE TRIGGER trigger_update_uacs_codes
BEFORE UPDATE ON uacs_codes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trigger_update_object_expenditures
ON object_expenditures;

CREATE TRIGGER trigger_update_object_expenditures
BEFORE UPDATE ON object_expenditures
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trigger_update_allotment_classes
ON allotment_classes;

CREATE TRIGGER trigger_update_allotment_classes
BEFORE UPDATE ON allotment_classes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trigger_update_wfp_sources
ON wfp_sources;

CREATE TRIGGER trigger_update_wfp_sources
BEFORE UPDATE ON wfp_sources
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trigger_update_budget_items
ON budget_items;

CREATE TRIGGER trigger_update_budget_items
BEFORE UPDATE ON budget_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trigger_update_fund_allocations
ON fund_allocations;

CREATE TRIGGER trigger_update_fund_allocations
BEFORE UPDATE ON fund_allocations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trigger_update_rbud
ON rbud_entries;

CREATE TRIGGER trigger_update_rbud
BEFORE UPDATE ON rbud_entries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trigger_update_raod
ON raod_entries;

CREATE TRIGGER trigger_update_raod
BEFORE UPDATE ON raod_entries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trigger_update_wfp
ON wfp_balances;

CREATE TRIGGER trigger_update_wfp
BEFORE UPDATE ON wfp_balances
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trigger_update_settings
ON settings;

CREATE TRIGGER trigger_update_settings
BEFORE UPDATE ON settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trigger_update_preferences
ON preferences;

CREATE TRIGGER trigger_update_preferences
BEFORE UPDATE ON preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 21. DASHBOARD VIEW - RBUD SUMMARY
-- ============================================================

CREATE OR REPLACE VIEW v_rbud_summary AS
SELECT
    r.fiscal_year,

    r.fund_cluster_id,

    fc.code AS fund_cluster_code,

    fc.name AS fund_cluster_name,

    COUNT(r.id) AS total_records,

    COALESCE(
        SUM(r.utilization_amount),
        0
    ) AS total_utilization,

    COALESCE(
        SUM(r.disbursement_amount),
        0
    ) AS total_disbursement,

    COALESCE(
        SUM(r.unpaid_utilization),
        0
    ) AS total_unpaid_utilization,

    COALESCE(
        SUM(r.running_balance),
        0
    ) AS total_balance

FROM rbud_entries r

LEFT JOIN fund_clusters fc
    ON r.fund_cluster_id = fc.id

GROUP BY
    r.fiscal_year,
    r.fund_cluster_id,
    fc.code,
    fc.name;


-- ============================================================
-- 22. DASHBOARD VIEW - RAOD SUMMARY
-- ============================================================

CREATE OR REPLACE VIEW v_raod_summary AS
SELECT
    r.fiscal_year,

    r.fund_cluster_id,

    fc.code AS fund_cluster_code,

    fc.name AS fund_cluster_name,

    COUNT(r.id) AS total_records,

    COALESCE(
        SUM(r.allotment_amount),
        0
    ) AS total_allotment,

    COALESCE(
        SUM(r.obligation_amount),
        0
    ) AS total_obligation,

    COALESCE(
        SUM(r.disbursement_amount),
        0
    ) AS total_disbursement,

    COALESCE(
        SUM(r.allotment_amount)
        - SUM(r.obligation_amount),
        0
    ) AS unobligated_balance,

    COALESCE(
        SUM(r.obligation_amount)
        - SUM(r.disbursement_amount),
        0
    ) AS undisbursed_balance

FROM raod_entries r

LEFT JOIN fund_clusters fc
    ON r.fund_cluster_id = fc.id

GROUP BY
    r.fiscal_year,
    r.fund_cluster_id,
    fc.code,
    fc.name;


-- ============================================================
-- 23. DASHBOARD VIEW - BUDGET SUMMARY
-- ============================================================

CREATE OR REPLACE VIEW v_budget_summary AS
SELECT
    fiscal_year,

    COUNT(id) AS total_budget_items,

    COALESCE(
        SUM(approved_budget),
        0
    ) AS total_approved_budget,

    COALESCE(
        SUM(ps_amount),
        0
    ) AS total_ps,

    COALESCE(
        SUM(mooe_amount),
        0
    ) AS total_mooe,

    COALESCE(
        SUM(co_amount),
        0
    ) AS total_co

FROM budget_items

GROUP BY fiscal_year;


-- ============================================================
-- 24. DEPARTMENT COMPATIBILITY VIEW
-- ============================================================
-- Allows the frontend to retrieve departments while the
-- actual master data is stored in responsibility_centers.
-- ============================================================

CREATE OR REPLACE VIEW departments AS
SELECT
    id,
    code,
    name,
    category,
    is_active

FROM responsibility_centers

WHERE is_active = TRUE;


-- ============================================================
-- 25. INITIAL SYSTEM SETTINGS
-- ============================================================

INSERT INTO settings (
    system_name,
    system_acronym,
    institution,
    default_fiscal_year,
    default_date_format,
    default_timezone,
    currency_code,
    currency_symbol
)
SELECT
    'Budget Monitoring and Allocation System',
    'BMAS',
    'Abra State Institute of Sciences and Technology',
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    'MM/DD/YYYY',
    'Asia/Manila',
    'PHP',
    '₱'
WHERE NOT EXISTS (
    SELECT 1
    FROM settings
);


-- ============================================================
-- 26. INITIAL FISCAL YEAR
-- ============================================================

INSERT INTO fiscal_years (
    year,
    is_current,
    is_closed
)
SELECT
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    TRUE,
    FALSE
WHERE NOT EXISTS (
    SELECT 1
    FROM fiscal_years
    WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
);


-- ============================================================
-- BMAS - BUDGET PROPOSALS
-- ============================================================

CREATE TABLE IF NOT EXISTS budget_proposals (
    proposal_id SERIAL PRIMARY KEY,

    proposal_no VARCHAR(50) UNIQUE,

    fiscal_year INTEGER NOT NULL,

    proposal_title VARCHAR(255) NOT NULL,

    department_unit VARCHAR(255) NOT NULL,

    fund_source VARCHAR(255),

    category VARCHAR(100),

    program_project_activity TEXT,

    requested_amount NUMERIC(18,2) NOT NULL DEFAULT 0,

    justification TEXT,

    expected_outputs TEXT,

    supporting_documents TEXT,

    status VARCHAR(30) NOT NULL DEFAULT 'Draft',

    submitted_at TIMESTAMP WITHOUT TIME ZONE,

    reviewed_at TIMESTAMP WITHOUT TIME ZONE,

    endorsed_at TIMESTAMP WITHOUT TIME ZONE,

    approved_at TIMESTAMP WITHOUT TIME ZONE,

    returned_at TIMESTAMP WITHOUT TIME ZONE,

    rejection_reason TEXT,

    remarks TEXT,

    created_by INTEGER,

    reviewed_by INTEGER,

    endorsed_by INTEGER,

    approved_by INTEGER,

    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT budget_proposals_status_check
        CHECK (
            status IN (
                'Draft',
                'Submitted',
                'Under Review',
                'For Revision',
                'Endorsed',
                'Approved',
                'Rejected'
            )
        ),

    CONSTRAINT budget_proposals_amount_check
        CHECK (requested_amount >= 0)
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_budget_proposals_fiscal_year
    ON budget_proposals(fiscal_year);

CREATE INDEX IF NOT EXISTS idx_budget_proposals_status
    ON budget_proposals(status);

CREATE INDEX IF NOT EXISTS idx_budget_proposals_department
    ON budget_proposals(department_unit);

CREATE INDEX IF NOT EXISTS idx_budget_proposals_created_at
    ON budget_proposals(created_at DESC);


-- ============================================================
-- AUTO PROPOSAL NUMBER
-- Example:
-- BP-2026-00001
-- ============================================================

CREATE OR REPLACE FUNCTION generate_budget_proposal_no()
RETURNS TRIGGER
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


DROP TRIGGER IF EXISTS trg_generate_budget_proposal_no
ON budget_proposals;


CREATE TRIGGER trg_generate_budget_proposal_no

BEFORE INSERT
ON budget_proposals

FOR EACH ROW

EXECUTE FUNCTION generate_budget_proposal_no();


-- ============================================================
-- UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION update_budget_proposal_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;

END;
$$;


DROP TRIGGER IF EXISTS trg_budget_proposals_updated_at
ON budget_proposals;


CREATE TRIGGER trg_budget_proposals_updated_at

BEFORE UPDATE
ON budget_proposals

FOR EACH ROW

EXECUTE FUNCTION update_budget_proposal_timestamp();

-- ============================================================
-- END OF BMAS DATABASE SCHEMA
-- ============================================================