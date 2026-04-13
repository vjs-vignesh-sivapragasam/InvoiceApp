-- SQL Script to Drop All Tables
-- WARNING: This will PERMANENTLY DELETE all structures and data.

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS InventoryDetails;
DROP TABLE IF EXISTS BillSeries;
DROP TABLE IF EXISTS BillingTransaction;
DROP TABLE IF EXISTS Products;
DROP TABLE IF EXISTS ClientDetails;
DROP TABLE IF EXISTS UserLoginDetails;
DROP TABLE IF EXISTS UserRoles;

-- Verification
SELECT 'All tables dropped successfully' as status;
