-- Mock Data for Invoice Generation Application (FMCG / Beverage Distribution Focused)

-- -- 1. Insert Client Details (Local Retailers)
-- INSERT INTO ClientDetails (
--     ClientName, Username, EmailID, Mobile, AddressLine1, GSTIN, BankHolderName, AccountNumber, IFSCCode
-- ) VALUES 
-- ('Saravana Stores', 'saravana_retail', 'contact@saravana.com', '9911223344', 'South Masi Street, Madurai', '33CCCCC2222C3Z7', 'Saravana Retail', '100200300', 'SBIN0001234'),
-- ('Annapoorna Supermarket', 'annapoorna', 'billing@annapoorna.in', '9944556677', 'Anna Nagar, Madurai', '33DDDDD3333D4Z8', 'Annapoorna Foods', '400500600', 'ICIC0005555'),
-- ('Local Kirana Shop', 'kirana_shop', NULL, '9888777666', 'Sellur, Madurai', NULL, NULL, NULL, NULL);

-- -- 2. Insert Products (Beverage Inventory)
-- -- Pieces = Units per box; InCase = Internal Case/Pack logic
-- INSERT INTO Products (
--     ProductName, ProductType, InCase, Pieces, HSN, PurchaseOrder, SellingPrice, MRP, IsActive
-- ) VALUES 
-- ('Pepsi 200ml Bottle', 'Beverage', 1, 24, '2202', '10.00', 25.00, 26.00, TRUE),
-- ('7UP 500ml Pet', 'Beverage', 1, 12, '2202', '70.00', 58.00, 60.00, TRUE),
-- ('Mountain Dew 1L', 'Beverage', 1, 12, '2202', '120.00', 55.00, 60.00, TRUE);

-- 3. Insert Inventory Details (Initial Stock Logs - SOURCE OF TRUTH)
-- INSERT INTO InventoryDetails (
--     ProductID, MovementType, QuantityMoved, PreviousStock, NewStock, ReferenceNo, Notes, CreatedBy
-- ) VALUES 
-- -- Initial restock for all products
-- (1, 'restock', 100, 0, 0, 'OPENING', 'Initial shop opening stock', 1),
-- (2, 'restock', 100, 0, 0, 'OPENING', 'Initial shop opening stock', 1),
-- (3, 'restock', 100, 0, 0, 'OPENING', 'Initial shop opening stock', 1);

-- -- 4. Insert Billing Transactions (Sample Sales)
-- INSERT INTO BillingTransaction (
--     ProductID, ClientID, BillNo, Box, Pieces, 
--     Rate, DisPerc, DiscAmount, TaxableAmount, GSTAmount, 
--     CGSTAmount, SGSTAmount, TotalAmount, IsInvoiceGenerated, IsWithGST, PaymentMethod, BillDate
-- ) VALUES 
-- (1, 1, 'MK/2026/01', 5, 120, 10.00, 0.0, 0.0, 1200.0, 144.0, 72.0, 72.0, 1344.0, TRUE, TRUE, 'CASH', CURRENT_DATE),
-- (2, 2, 'MK/2026/02', 1, 12, 35.00, 0.0, 0.0, 420.0, 50.4, 25.2, 25.2, 470.4, TRUE, TRUE, 'GPAY', CURRENT_DATE);

-- 5. Deduct stock for the above sales to keep NewStock accurate
-- INSERT INTO InventoryDetails (
--     ProductID, MovementType, QuantityMoved, PreviousStock, NewStock, ReferenceNo, Notes, CreatedBy
-- ) VALUES 
-- (1, 'sale', 120, 0, 100, 'MK/2026/01', 'Sale to Saravana Stores', 1),
-- (2, 'sale', 12, 0, 100, 'MK/2026/02', 'Sale to Annapoorna', 1);

-- 6. Update BillSeries count to reflect mock usage
--UPDATE BillSeries SET CurrentCount = 2 WHERE UserID = 1;
