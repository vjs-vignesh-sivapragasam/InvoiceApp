-- FIRST TIME SETUP SCRIPT
-- RUN THIS ONLY ONCE TO INITIALIZE THE ADMINISTRATIVE USER

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


-- 1. Ensure the administrative user exists with default credentials
-- This record is required for the application to function correctly.
INSERT INTO UserLoginDetails (
    UserID,
    Username, 
    EmailID, 
    Password, 
    RoleID, 
    IsLoginScreenEnabled,
    IsActive
) VALUES (
    1,
    'admin',
    'admin@invoiceapp.com',
    '1234',
    1,
    TRUE,
    TRUE
) ON CONFLICT (UserID) DO NOTHING;

-- 2. Ensure default bill series exists for admin
INSERT INTO BillSeries (UserID, Prefix, Delimiter, StartingNumber, CurrentCount)
VALUES (1, 'INV', '/', 1, 0)
ON CONFLICT (UserID) DO NOTHING;
