-- FIRST TIME SETUP SCRIPT
-- RUN THIS ONLY ONCE TO INITIALIZE THE ADMINISTRATIVE USER

-- Re-insert essential system data
-- Most applications require these roles to exist to function correctly
INSERT INTO UserRoles (RoleName) VALUES 
    ('superadmin'), 
    ('admin');

-- 3. Ensure the administrative user exists with default credentials
-- This record is required for the application to function correctly.
INSERT INTO UserLoginDetails (
    Username, Password, EmailID, RoleID, Mobile, GSTIN, 
    BankAccountName, AccountNo, IFSC, AddressLine1, Pincode, IsLoginScreenEnabled, optional1
) VALUES 
('admin', '1234', 'mkagency@example.com', 2, '9840012345', '33AAAAA0000A1Z5', 
 'MK Agency', '919010012345678', 'UTIB0001234', '45, Main Bazaar, Madurai', '625001', TRUE, 'MK Agency')
ON CONFLICT (Username) DO UPDATE SET optional1 = 'MK Agency';


-- 6. Insert Bill Number Series
INSERT INTO BillSeries (UserID, Prefix, Delimiter, StartingNumber, CurrentCount) VALUES 
(1, 'MK', '/', 2026,1);