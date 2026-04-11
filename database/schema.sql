-- PostgreSQL Schema for Invoice Generation Application

-- Table 1: User Roles
CREATE TABLE UserRoles (
    RoleID SERIAL PRIMARY KEY,
    RoleName VARCHAR(50) NOT NULL UNIQUE, -- superadmin, admin
    CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: User Login Details (Business Profile)
CREATE TABLE UserLoginDetails (
    UserID SERIAL PRIMARY KEY,
    Username VARCHAR(100) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    EmailID VARCHAR(150) NOT NULL UNIQUE,
    RoleID INTEGER REFERENCES UserRoles(RoleID),
    Mobile VARCHAR(20),
    Mobile2 VARCHAR(20),
    AddressLine1 TEXT,
    AddressLine2 TEXT,
    Pincode VARCHAR(10),
    Landmark VARCHAR(150),
    GSTIN VARCHAR(20),
    IsActive BOOLEAN DEFAULT TRUE,
    BankAccountName VARCHAR(150),
    AccountNo VARCHAR(50),
    IFSC VARCHAR(20),
    QRCode TEXT, -- URL or Base64
    BrandLogo TEXT, -- URL
    ProfilePicture TEXT, -- URL
    CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    IsLocked BOOLEAN DEFAULT FALSE,
    Optional1 TEXT,
    Optional2 TEXT,
    Optional3 TEXT
);

-- Table 3: Client Details
CREATE TABLE ClientDetails (
    ClientID SERIAL PRIMARY KEY,
    ClientName VARCHAR(150) NOT NULL,
    Username VARCHAR(100),
    EmailID VARCHAR(150),
    Mobile VARCHAR(20),
    AddressLine1 TEXT,
    AddressLine2 TEXT,
    GSTIN VARCHAR(20),
    Landmark VARCHAR(150),
    BankHolderName VARCHAR(150),
    AccountNumber VARCHAR(50),
    IFSCCode VARCHAR(20),
    Logo TEXT,
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Optional1 TEXT,
    Optional2 TEXT,
    Optional3 TEXT
);

-- Table 4: Products
CREATE TABLE Products (
    ProductID SERIAL PRIMARY KEY,
    ProductName VARCHAR(255) NOT NULL,
    ProductType VARCHAR(100),
    InCase INTEGER, -- BOX configuration
    Pieces INTEGER,
    HSN VARCHAR(20),
    PurchaseOrder VARCHAR(100),
    SellingPrice DECIMAL(15, 2),
    MRP DECIMAL(15, 2),
    DiscPercentage DECIMAL(5, 2) DEFAULT 0,
    DiscAmount DECIMAL(15, 2) DEFAULT 0,
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Optional1 TEXT,
    Optional2 TEXT,
    Optional3 TEXT
);

-- Table 5: Billing Transactions
CREATE TABLE BillingTransaction (
    BillingID SERIAL PRIMARY KEY,
    TransactionID VARCHAR(100) UNIQUE,
    ProductID INTEGER REFERENCES Products(ProductID),
    ClientID INTEGER REFERENCES ClientDetails(ClientID),
    BillDate DATE DEFAULT CURRENT_DATE,
    BillNo VARCHAR(50) UNIQUE,
    Box INTEGER,
    Pieces INTEGER,
    Rate DECIMAL(15, 2),
    DisPerc DECIMAL(5, 2),
    DiscAmount DECIMAL(15, 2),
    TaxableAmount DECIMAL(15, 2),
    GSTAmount DECIMAL(15, 2),
    CGSTAmount DECIMAL(15, 2),
    SGSTAmount DECIMAL(15, 2),
    TotalAmount DECIMAL(15, 2),
    IsInvoiceGenerated BOOLEAN DEFAULT FALSE,
    IsWithGST BOOLEAN DEFAULT TRUE,
    BillTime TIME DEFAULT CURRENT_TIME,
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 6: Inventory Details (Stock Movement Log)
CREATE TABLE InventoryDetails (
    InventoryID     SERIAL PRIMARY KEY,
    ProductID       INTEGER NOT NULL REFERENCES Products(ProductID) ON DELETE CASCADE,
    MovementType    VARCHAR(20) NOT NULL CHECK (MovementType IN ('restock','sale','adjustment','return')),
    QuantityMoved   INTEGER NOT NULL,                        -- always positive; direction from MovementType
    PreviousStock   INTEGER NOT NULL DEFAULT 0,
    NewStock        INTEGER NOT NULL DEFAULT 0,
    ReferenceNo     VARCHAR(100),                            -- BillNo / PO Ref / manual ref
    Notes           TEXT,
    CreatedBy       INTEGER REFERENCES UserLoginDetails(UserID),
    CreatedDate     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast per-product lookups
CREATE INDEX idx_inventorydetails_product ON InventoryDetails(ProductID);

-- Insert Default Roles
INSERT INTO UserRoles (RoleName) VALUES ('superadmin'), ('admin');

