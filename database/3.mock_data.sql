-- Mock Data for Invoice Generation Application (FMCG / Beverage Distribution Focused)

-- 2. Insert Client Details (Local Retailers)
INSERT INTO ClientDetails (
    ClientName, Username, EmailID, Mobile, AddressLine1, GSTIN, BankHolderName, AccountNumber, IFSCCode
) VALUES 
('Saravana Stores', 'saravana_retail', 'contact@saravana.com', '9911223344', 'South Masi Street, Madurai', '33CCCCC2222C3Z7', 'Saravana Retail', '100200300', 'SBIN0001234'),
('Annapoorna Supermarket', 'annapoorna', 'billing@annapoorna.in', '9944556677', 'Anna Nagar, Madurai', '33DDDDD3333D4Z8', 'Annapoorna Foods', '400500600', 'ICIC0005555'),
('Local Kirana Shop', 'kirana_shop', NULL, '9888777666', 'Sellur, Madurai', NULL, NULL, NULL, NULL);

-- 3. Insert Products (Beverage Inventory)
INSERT INTO Products (
    ProductName, ProductType, InCase, Pieces, HSN, SellingPrice, MRP, DiscPercentage, DiscAmount
) VALUES 
('Pepsi Water Bottle 200ml', 'Beverage', 24, 120, '2202', 10.00, 12.00, 0.0, 0.00),
('Pepsi Water Bottle 1 Litre', 'Beverage', 12, 60, '2202', 40.00, 45.00, 2.0, 0.80),
('Pepsi Water Bottle 2 Litre', 'Beverage', 9, 45, '2202', 85.00, 95.00, 5.0, 4.25);

-- 4. Insert Billing Transactions (Sample Deliveries)
INSERT INTO BillingTransaction (
    ProductID, ClientID, BillNo, Box, Pieces, 
    Rate, DisPerc, DiscAmount, TaxableAmount, GSTAmount, 
    CGSTAmount, SGSTAmount, TotalAmount, IsInvoiceGenerated, IsWithGST, PaymentMethod
) VALUES 
(1, 1, 'INV/2026/001', 5, 120, 10.00, 0.0, 0.0, 1200.0, 144.0, 72.0, 72.0, 1344.0, TRUE, TRUE, 'CASH'),
(2, 2, 'INV/2026/002', 5, 60, 40.00, 2.0, 48.0, 2352.0, 282.24, 141.12, 141.12, 2634.24, TRUE, TRUE, 'GPAY'),
(3, 3, 'INV/2026/003', 5, 45, 85.00, 5.0, 191.25, 3633.75, 0.0, 0.0, 0.0, 3633.75, TRUE, FALSE, 'CREDIT');

-- 5. Insert Inventory Details (Stock Tracking)
INSERT INTO InventoryDetails (
    ProductID, MovementType, QuantityMoved, PreviousStock, NewStock, ReferenceNo, Notes, CreatedBy
) VALUES 
-- Initial stock intake
(1, 'restock', 240, 0, 240, 'BATCH-001', 'Initial supply from PepsiCo', 1),
(2, 'restock', 120, 0, 120, 'BATCH-001', 'Initial supply from PepsiCo', 1),
(3, 'restock', 90, 0, 90, 'BATCH-001', 'Initial supply from PepsiCo', 1),

-- Sales deductions
(1, 'sale', 120, 240, 120, 'INV/2026/001', 'Delivery to Saravana Stores', 1),
(2, 'sale', 60, 120, 60, 'INV/2026/002', 'Delivery to Annapoorna', 1),
(3, 'sale', 45, 90, 45, 'INV/2026/003', 'Delivery to Local Shop', 1);


-- 6. Reset Bill Series for MK Agency
--UPDATE BillSeries SET StartingNumber = 1, CurrentCount = 4 WHERE UserID = 1;
