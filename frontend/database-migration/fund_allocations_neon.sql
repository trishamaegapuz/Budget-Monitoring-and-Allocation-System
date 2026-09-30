INSERT INTO public.fund_allocations (
    id,
    fiscal_year,
    fund_source_id,
    fund_cluster_id,
    campus_id,
    responsibility_center_id,
    wfp_source_id,
    allocation_amount,
    utilized_amount,
    disbursed_amount,
    created_at,
    updated_at
) VALUES
(
    1,
    2026,
    1,
    1,
    5,
    NULL,
    1,
    500000.00,
    0.00,
    0.00,
    '2026-08-24 16:07:04.290174',
    '2026-08-24 16:07:04.290174'
),
(
    2,
    2026,
    2,
    2,
    5,
    3,
    10,
    200000.00,
    0.00,
    0.00,
    '2026-08-28 06:29:03.524267',
    '2026-08-28 06:29:03.524267'
);

SELECT pg_catalog.setval(
    pg_get_serial_sequence('public.fund_allocations', 'id'),
    2,
    true
);
