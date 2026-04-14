-- SQL Script to Truncate All Tables
-- WARNING: This will delete ALL data in the database.

-- Truncate all tables and reset identity sequences
-- CASCADE ensures that foreign key dependencies are handled
TRUNCATE TABLE 
    InventoryDetails, 
    BillingTransaction,
    BillSeries,
    Products, 
    ClientDetails, 
    UserLoginDetails, 
    UserRoles 
RESTART IDENTITY CASCADE;

-- Verification
SELECT 'All tables truncated and IDs reset.' as Status;
