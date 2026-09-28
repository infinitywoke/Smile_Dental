-- Phase 5: Database-level Financial Aggregation
-- Prevents O(N) memory scans in the application layer by computing global patient balances on the database side.

CREATE OR REPLACE VIEW patient_financial_balances AS
SELECT 
    p.id AS patient_id,
    p.name AS patient_name,
    COALESCE(plans_agg.total_estimated, 0) AS total_estimated,
    COALESCE(pays_agg.total_paid, 0) AS total_paid,
    COALESCE(plans_agg.total_estimated, 0) - COALESCE(pays_agg.total_paid, 0) AS balance,
    p.tenant_id
FROM patients p
LEFT JOIN (
    SELECT 
        tp.patient_id, 
        SUM(ti.estimated_cost) as total_estimated
    FROM treatment_plans tp
    JOIN treatment_items ti ON ti.treatment_plan_id = tp.id
    WHERE ti.status != 'CANCELLED'
    GROUP BY tp.patient_id
) plans_agg ON plans_agg.patient_id = p.id
LEFT JOIN (
    SELECT 
        patient_id, 
        SUM(amount) as total_paid
    FROM payments
    GROUP BY patient_id
) pays_agg ON pays_agg.patient_id = p.id;

-- Grant access to authenticated users
GRANT SELECT ON patient_financial_balances TO authenticated;

-- Ensure RLS is applied through a tenant wrapper since Views don't directly inherit underlying RLS in all query shapes
-- Actually, Postgres Views run with the permissions of the view owner by default (security definer). 
-- To enforce RLS of the underlying tables, we should use a security invoker view.
ALTER VIEW patient_financial_balances SET (security_invoker = true);
