-- Mock Data for Invoice Generation Application

-- 1. Insert User Login Details (Business Profiles)
-- Password 'password123' (Hashed or plaintext for mock purposes)
INSERT INTO UserLoginDetails (
    Username, Password, EmailID, RoleID, Mobile, GSTIN, 
    BankAccountName, AccountNo, IFSC, AddressLine1, Pincode, IsLoginScreenEnabled
) VALUES 
('super_admin', 'admin_pass_789', 'admin@skyline-invoicer.com', 1, '9876543210', '27AAAAA0000A1Z5', 
 'Skyline Solutions', '50200012345678', 'HDFC0001234', '123 Business Park, Mumbai', '400001', TRUE),
('john_billing', 'billing_pass_456', 'john@skyline-invoicer.com', 2, '9876543211', '27BBBBB1111B2Z6', 
 'Skyline Solutions', '50200012345678', 'HDFC0001234', '123 Business Park, Mumbai', '400001', TRUE);

-- 2. Insert Client Details
INSERT INTO ClientDetails (
    ClientName, Username, EmailID, Mobile, AddressLine1, GSTIN, BankHolderName, AccountNumber, IFSCCode
) VALUES 
('Acme Corporation', 'acme_corp', 'billing@acme.com', '9988776655', 'Industrial Estate, Phase II, Pune', '27CCCCC2222C3Z7', 'Acme Corp PVT LTD', '1234567890', 'ICIC0005555'),
('Global Tech Solutions', 'global_tech', 'accounts@global.tech', '9988776644', 'Tech Park, Bangalore', '29DDDDD3333D4Z8', 'Global Tech Solutions', '0987654321', 'SBIN0004444'),
('Starlight Retail', 'starlight_retail', 'owner@starlight.in', '9988776633', 'MG Road, Delhi', NULL, 'Star Retail', '5566778899', 'HDFC0009999');

-- 3. Insert Products
INSERT INTO Products (
    ProductName, ProductType, InCase, Pieces, HSN, SellingPrice, MRP, DiscPercentage, DiscAmount
) VALUES 
('Wireless Optical Mouse', 'Electronics', 24, 1, '8471', 450.00, 799.00, 10.0, 45.00),
('LED Backlit Monitor 24"', 'Electronics', 5, 1, '8528', 8500.00, 12000.00, 5.0, 425.00),
('Mechanical Keyboard K8', 'Electronics', 10, 1, '8471', 2200.00, 3500.00, 0.0, 0.00),
('USB-C Fast Charger 65W', 'Accessories', 50, 1, '8504', 1250.00, 1999.00, 15.0, 187.50),
('HDMI Cable 1.5m', 'Accessories', 100, 1, '8544', 180.00, 499.00, 20.0, 36.00);

-- 4. Insert Billing Transactions (Sample Bills)
INSERT INTO BillingTransaction (
    TransactionID, ProductID, ClientID, BillNo, Box, Pieces, 
    Rate, DisPerc, DiscAmount, TaxableAmount, GSTAmount, 
    CGSTAmount, SGSTAmount, TotalAmount, IsInvoiceGenerated, IsWithGST
) VALUES 
('TXN-1001', 1, 1, 'INV/2026/001', 2, 48, 450.00, 10.0, 2160.0, 19440.0, 3499.2, 1749.6, 1749.6, 22939.2, TRUE, TRUE),
('TXN-1002', 2, 2, 'INV/2026/002', 1, 5, 8500.00, 5.0, 2125.0, 40375.0, 7267.5, 3633.75, 3633.75, 47642.5, TRUE, TRUE),
('TXN-1003', 5, 3, 'INV/2026/003', 0, 10, 180.00, 0.0, 0.0, 1800.0, 0.0, 0.0, 0.0, 1800.0, TRUE, FALSE);

-- 5. Insert Inventory Details (Stock Movement Log)
INSERT INTO InventoryDetails (
    ProductID, MovementType, QuantityMoved, PreviousStock, NewStock, ReferenceNo, Notes, CreatedBy
) VALUES 
-- Initial restock for all products
(1, 'restock',  50,  0,  50, 'PO-2026-001', 'Initial stock load — Wireless Optical Mouse',    1),
(2, 'restock',  20,  0,  20, 'PO-2026-001', 'Initial stock load — LED Backlit Monitor 24"',   1),
(3, 'restock',  30,  0,  30, 'PO-2026-001', 'Initial stock load — Mechanical Keyboard K8',    1),
(4, 'restock',  80,  0,  80, 'PO-2026-001', 'Initial stock load — USB-C Fast Charger 65W',    1),
(5, 'restock', 100,  0, 100, 'PO-2026-001', 'Initial stock load — HDMI Cable 1.5m',           1),

-- Sales deductions linked to billing transactions
(1, 'sale',     48, 50,   2, 'INV/2026/001', 'Sold to Acme Corporation',                      2),
(2, 'sale',      5, 20,  15, 'INV/2026/002', 'Sold to Global Tech Solutions',                 2),
(5, 'sale',     10, 100, 90, 'INV/2026/003', 'Sold to Starlight Retail (no GST)',             2),

-- Additional restocks after sales
(1, 'restock',  24,  2,  26, 'PO-2026-002', 'Restock after low stock alert',                  1),
(3, 'restock',  10, 30,  40, 'PO-2026-002', 'Extra units received from supplier',             1),

-- Adjustment entries
(4, 'adjustment', 5, 80, 75, NULL, 'Damaged units removed during QC inspection',              1),

-- Return entry
(2, 'return',    1, 15,  16, 'INV/2026/002', 'One defective monitor returned by Global Tech', 2);

-- 6. Insert Bill Number Series
INSERT INTO BillSeries (UserID, Prefix, Delimiter, StartingNumber, CurrentCount) VALUES 
(1, 'INV', '/', 100, 5),
(2, 'BILL', '-', 1, 12);

