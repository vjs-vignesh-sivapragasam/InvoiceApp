-- SQL Script to Truncate All Tables
-- WARNING: This will delete ALL data in the database.

-- Truncate all tables and reset identity sequences
-- CASCADE ensures that foreign key dependencies are handled
TRUNCATE TABLE 
    InventoryDetails, 
    BillSeries,
    BillingTransaction, 
    Products, 
    ClientDetails, 
    UserLoginDetails, 
    UserRoles 
RESTART IDENTITY CASCADE;

-- Re-insert essential system data
-- Most applications require these roles to exist to function correctly
INSERT INTO UserRoles (RoleName) VALUES 
    ('superadmin'), 
    ('admin');

-- Verification: You should see 0 rows in main tables and 2 rows in UserRoles
SELECT 'Truncation Complete' as status;
