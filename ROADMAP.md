# ROZI KHAN DROPSHIPPING PLATFORM

## MASTER BACKEND ROADMAP

---

# PROJECT OVERVIEW

Project Name: Rozi Khan

Project Type: Enterprise Dropshipping Platform

Reference Platform: Avasam

Backend Stack:

* FastAPI
* PostgreSQL
* SQLAlchemy
* Alembic
* Redis
* Celery

Frontend Stack:

* React
* TypeScript

Infrastructure:

* AWS
* S3
* EC2
* RDS
* CloudFront

---

# PROJECT GOAL

Build a complete dropshipping ecosystem similar to Avasam.

The platform should connect:

Supplier → Retailer → Customer

The system must support:

* Supplier Management
* Retailer Management
* Product Management
* Inventory Synchronization
* Order Routing
* Shipping Automation
* Subscription Billing
* Analytics
* Marketplace Integrations

This is NOT a traditional ecommerce platform.

This is a Dropshipping Operating System.

---

# USER TYPES

## Super Admin

Responsibilities:

* Manage suppliers
* Manage retailers
* Approve accounts
* Manage subscriptions
* Manage commissions
* View analytics

---

## Supplier

Responsibilities:

* Upload products
* Manage inventory
* Update pricing
* Process orders
* Manage shipments

---

## Retailer

Responsibilities:

* Browse supplier catalog
* Import products
* Sell products
* Track orders
* Manage subscriptions

---

## Customer

Responsibilities:

* Browse products
* Place orders
* Track orders
* Submit reviews

---

# DEVELOPMENT RULES

Every milestone must include:

* Business Logic
* Database Design
* SQLAlchemy Models
* Pydantic Schemas
* Repository Layer
* Service Layer
* API Layer
* Validation Rules
* Error Handling
* Unit Tests
* API Documentation

AI must never build future milestones.

AI must build only the requested milestone.

Every milestone must be production ready.

---

# MILESTONE 1

## AUTHENTICATION & AUTHORIZATION

Status: Existing

Modules:

* Registration
* Login
* JWT Authentication
* OTP Verification
* Password Reset
* Role Based Access Control
* User Profile

Core Tables:

* users
* roles
* permissions

Expected APIs:

/auth/register
/auth/login
/auth/logout
/auth/refresh
/auth/verify-otp
/auth/forgot-password
/auth/reset-password
/auth/profile

Completion Criteria:

User authentication system fully secured and reusable across all modules.

---

# MILESTONE 2

## SUPPLIER MANAGEMENT

Purpose:

Allow suppliers to onboard and manage inventory.

Modules:

* Supplier Registration
* Supplier Verification
* Document Upload
* Supplier Profile
* Supplier Dashboard
* Supplier Settings

Core Tables:

* suppliers
* supplier_documents
* supplier_settings

Expected APIs:

/supplier/register
/supplier/profile
/supplier/dashboard
/supplier/documents
/supplier/settings

Completion Criteria:

Supplier can fully manage their business account.

---

# MILESTONE 3

## RETAILER MANAGEMENT

Purpose:

Allow retailers to purchase subscriptions and import products.

Modules:

* Retailer Registration
* Retailer Profile
* Retailer Dashboard
* Retailer Settings
* Retailer Subscription Status

Core Tables:

* retailers
* retailer_settings
* retailer_subscriptions

Expected APIs:

/retailer/register
/retailer/profile
/retailer/dashboard
/retailer/settings

Completion Criteria:

Retailer can manage account and access supplier catalog.

---

# MILESTONE 4

## PRODUCT MANAGEMENT

Purpose:

Create enterprise product catalog.

Modules:

* Products
* Categories
* Brands
* Images
* Attributes
* Product Variants
* SKU Management

Core Tables:

* products
* categories
* brands
* product_images
* product_variants

Expected APIs:

/products
/categories
/brands
/product-variants

Completion Criteria:

Products support variants and enterprise catalog management.

---

# MILESTONE 5

## PRODUCT IMPORT SYSTEM

Purpose:

Allow retailers to import supplier products.

Flow:

Supplier Product
↓
Retailer Import
↓
Retailer Product

Core Tables:

* product_imports
* retailer_products

Expected APIs:

/imports
/imports/product

Completion Criteria:

Retailers can import products from supplier catalog.

---

# MILESTONE 6

## INVENTORY MANAGEMENT

Purpose:

Build inventory synchronization engine.

Modules:

* Available Stock
* Reserved Stock
* Returned Stock
* Damaged Stock
* Inventory Logs

Core Tables:

* inventory
* inventory_logs
* stock_movements

Expected APIs:

/inventory
/inventory/update
/inventory/history

Completion Criteria:

Inventory updates reflected across all connected products.

---

# MILESTONE 7

## ORDER MANAGEMENT

Purpose:

Manage complete order lifecycle.

Modules:

* Order Creation
* Order Items
* Status Tracking
* Order History

Core Tables:

* orders
* order_items
* order_status_history

Expected APIs:

/orders
/orders/{id}
/orders/status

Completion Criteria:

Orders fully manageable across platform.

---

# MILESTONE 8

## ORDER ROUTING

Purpose:

Automatically assign retailer orders to suppliers.

Flow:

Customer
↓
Retailer
↓
Supplier

Core Tables:

* supplier_orders
* order_assignments

Expected APIs:

/orders/assign
/orders/accept
/orders/reject

Completion Criteria:

Supplier receives and manages assigned orders.

---

# MILESTONE 9

## SHIPPING MANAGEMENT

Purpose:

Manage fulfillment and tracking.

Modules:

* Shipment Creation
* Tracking
* Courier Integration
* Returns

Core Tables:

* shipments
* couriers
* tracking_events

Expected APIs:

/shipments
/shipments/{id}
/tracking

Completion Criteria:

Orders can be shipped and tracked.

---

# MILESTONE 10

## PAYMENT MANAGEMENT

Purpose:

Manage transactions and refunds.

Modules:

* Payments
* Refunds
* Transactions
* Supplier Payouts

Core Tables:

* payments
* refunds
* transactions

Expected APIs:

/payments
/refunds
/transactions

Completion Criteria:

Complete payment lifecycle supported.

---

# MILESTONE 11

## SUBSCRIPTION MANAGEMENT

Purpose:

Monetize platform access.

Modules:

* Plans
* Subscriptions
* Billing
* Renewals

Core Tables:

* plans
* subscriptions
* subscription_payments

Expected APIs:

/plans
/subscriptions

Completion Criteria:

Retailers can subscribe and renew plans.

---

# MILESTONE 12

## COMMISSION MANAGEMENT

Purpose:

Track platform earnings.

Core Tables:

* commissions
* commission_rules

Expected APIs:

/commissions

Completion Criteria:

Platform commissions automatically calculated.

---

# MILESTONE 13

## NOTIFICATION SYSTEM

Purpose:

Send platform events.

Channels:

* Email
* SMS
* WhatsApp
* In-App

Core Tables:

* notifications
* notification_logs

Expected APIs:

/notifications

Completion Criteria:

Users receive event notifications.

---

# MILESTONE 14

## ANALYTICS SYSTEM

Purpose:

Provide business insights.

Modules:

* Revenue Analytics
* Order Analytics
* Supplier Analytics
* Retailer Analytics

Core Tables:

* analytics_events
* reports

Expected APIs:

/analytics

Completion Criteria:

Platform metrics available through dashboards.

---

# MILESTONE 15

## MARKETPLACE INTEGRATIONS

Purpose:

Connect external selling channels.

Platforms:

* Shopify
* WooCommerce
* Amazon
* eBay

Core Tables:

* marketplace_connections
* marketplace_products

Expected APIs:

/marketplaces
/shopify
/woocommerce

Completion Criteria:

Products and orders synchronize externally.

---

# MILESTONE 16

## ADMIN SYSTEM

Purpose:

Manage entire platform.

Modules:

* Supplier Approval
* Retailer Management
* Subscription Management
* Commission Management
* System Settings

Expected APIs:

/admin

Completion Criteria:

Admin can operate the entire platform.

---

# AI IMPLEMENTATION INSTRUCTIONS

Whenever a milestone is requested:

1. Analyze this roadmap.
2. Build only the requested milestone.
3. Design database first.
4. Design models second.
5. Design schemas third.
6. Design services fourth.
7. Design APIs fifth.
8. Design tests sixth.
9. Design documentation seventh.
10. Follow FastAPI best practices.
11. Follow PostgreSQL best practices.
12. Follow SOLID principles.
13. Follow clean architecture.
14. Generate production-ready code only.
15. Do not implement future milestones.
