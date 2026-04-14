-- FIRST TIME SETUP SCRIPT
-- RUN THIS ONLY ONCE TO INITIALIZE THE ADMINISTRATIVE USER

-- 1. Insert essential system roles
-- Most applications require these roles to exist to function correctly
INSERT INTO UserRoles (RoleID, RoleName) VALUES 
    (1, 'superadmin'), 
    (2, 'admin')
ON CONFLICT (RoleID) DO NOTHING;

-- 2. Ensure the administrative user exists with default credentials
-- This record is required for the application to function correctly.
INSERT INTO UserLoginDetails (
    UserID,
    Username, Password, EmailID, RoleID, Mobile, GSTIN, 
    BankAccountName, AccountNo, IFSC, AddressLine1, Pincode, IsLoginScreenEnabled, Optional1
) VALUES 
(1, 'admin', '1234', 'mkagency@example.com', 2, '9840012345', '33AAAAA0000A1Z5', 
 'MK Agency', '919010012345678', 'UTIB0001234', '45, Main Bazaar, Madurai', '625001', TRUE, 'MK Agency')
ON CONFLICT (UserID) DO UPDATE SET Optional1 = 'MK Agency';

-- 3. Insert Bill Number Series Configuration
-- This defines how your invoice numbers will be generated (e.g., MK/2026/001)
INSERT INTO BillSeries (
    UserID, Prefix, Delimiter, StartingNumber, CurrentCount
) VALUES 
(1, 'MK', '/', '2026', 0)
ON CONFLICT (UserID) DO UPDATE SET StartingNumber = '2026';

-- 1. Insert Client Details (Local Retailers)
INSERT INTO ClientDetails (
    ClientName, Username, EmailID, Mobile, AddressLine1, GSTIN, BankHolderName, AccountNumber, IFSCCode
) VALUES 
('Saravana Stores', 'saravana_retail', 'contact@saravana.com', '9911223344', 'South Masi Street, Madurai', '33CCCCC2222C3Z7', 'Saravana Retail', '100200300', 'SBIN0001234'),
('Annapoorna Supermarket', 'annapoorna', 'billing@annapoorna.in', '9944556677', 'Anna Nagar, Madurai', '33DDDDD3333D4Z8', 'Annapoorna Foods', '400500600', 'ICIC0005555'),
('Local Kirana Shop', 'kirana_shop', NULL, '9888777666', 'Sellur, Madurai', NULL, NULL, NULL, NULL);

-- 2. Insert Products (Beverage Inventory)
-- Pieces = Units per box; InCase = Internal Case/Pack logic
INSERT INTO Products (
    ProductName, ProductType, InCase, Pieces, HSN, PurchaseOrder, SellingPrice, MRP, IsActive
) VALUES 
('Pepsi 200ml Bottle', 'Beverage', 1, 24, '2202', '10.00', 25.00, 26.00, TRUE),
('7UP 500ml Pet', 'Beverage', 1, 12, '2202', '70.00', 58.00, 60.00, TRUE),
('Mountain Dew 1L', 'Beverage', 1, 12, '2202', '120.00', 55.00, 60.00, TRUE);
