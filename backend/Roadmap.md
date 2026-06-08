# ROZI KHAN DROPSHIPPING PLATFORM

## AVASAM CLONE DEVELOPMENT JOURNAL



Role: Full Stack Developer

Frontend: React

Backend: FastAPI (Python)

Database: PostgreSQL

Project Goal: Build a complete Dropshipping Ecosystem similar to Avasam

---

# PROJECT OVERVIEW

## Client Information

Client Name: Rozi Khan

Platform Name: Rozi Khan Dropshipping Platform

Reference Platform: Avasam

Business Model:

Supplier → Retailer → Customer

The goal is not to build a simple ecommerce website.

The goal is to build a complete Dropshipping Operating System that automates:

* Product Management
* Inventory Management
* Order Routing
* Supplier Management
* Retailer Management
* Marketplace Integrations
* Shipping Automation
* Subscription Billing
* Analytics

---

# CURRENT PROJECT STATUS

## Backend

Completed:

* FastAPI Setup
* PostgreSQL Integration
* SQLAlchemy Models
* JWT Authentication
* OTP Verification
* Role Based Authentication
* Product APIs
* Review APIs
* Cart APIs
* Checkout APIs
* Order APIs
* Payment APIs
* Admin APIs
* Cloudinary Integration

Status: Completed

---

## Frontend

Completed:

* React Setup
* Authentication Pages
* Product Pages
* Cart Pages
* Checkout Pages
* Admin Dashboard
* Product Management
* Order Management

Status: Completed

---

## Payments

Completed:

* Razorpay Integration
* Payment Verification
* Order Payment Tracking

Status: Completed

---

# WHAT CURRENTLY EXISTS

Current System Type:

Basic Ecommerce + Dropshipping MVP

Current Users:

* Admin
* User
* Supplier
* Seller

Current Features:

* Authentication
* Products
* Cart
* Orders
* Reviews
* Payments
* Dashboard

---

# TARGET SYSTEM

Target Type:

Avasam Style Dropshipping Platform

Expected Users:

* Super Admin
* Supplier
* Retailer
* Customer

---

# COMPLETE SYSTEM ARCHITECTURE

Platform Modules:

1. Authentication System
2. User Management
3. Supplier Management
4. Retailer Management
5. Product Management
6. Product Variant Management
7. Inventory Management
8. Order Management
9. Shipping Management
10. Marketplace Integrations
11. Analytics System
12. Subscription System
13. Notification System
14. Commission System

---

# PHASE 1

SUPPLIER MANAGEMENT SYSTEM

Status: Pending

Goal:

Allow suppliers to register and manage products.

Features:

* Supplier Registration
* Supplier Verification
* Supplier Dashboard
* Product Upload
* Inventory Updates
* Pricing Updates
* Shipping Settings

Database Tables:

suppliers

supplier_documents

supplier_products

supplier_settings

supplier_payouts

Learning Goals:

* Multi Tenant Architecture
* Role Based Access
* Supplier Lifecycle

---

# PHASE 2

RETAILER MANAGEMENT SYSTEM

Status: Pending

Goal:

Allow retailers to import supplier products.

Features:

* Retailer Registration
* Retailer Dashboard
* Product Import
* Product Mapping
* Retailer Store

Database Tables:

retailers

retailer_products

retailer_settings

product_imports

Learning Goals:

* Product Replication
* Catalog Mapping
* Dropshipping Flow

---

# PHASE 3

PRODUCT VARIANT SYSTEM

Status: Pending

Goal:

Support variants.

Examples:

T-Shirt

Size:

* Small
* Medium
* Large

Color:

* Black
* White
* Blue

Tables:

product_variants

variant_types

variant_options

Learning Goals:

* Variant Architecture
* SKU Generation

---

# PHASE 4

ADVANCED INVENTORY ENGINE

Status: Pending

Goal:

Build inventory synchronization engine.

Inventory Types:

Available Stock

Reserved Stock

Incoming Stock

Returned Stock

Damaged Stock

Tables:

inventory_logs

stock_movements

warehouse_stock

Learning Goals:

* Inventory Modeling
* Stock Synchronization

---

# PHASE 5

REDIS FUNDAMENTALS

Status: Not Started

Purpose:

Caching

Queue Management

Inventory Sync

Sessions

Topics To Learn:

* Redis Basics
* Pub/Sub
* Cache Invalidation
* Queue Processing

Deliverables:

Redis Setup

Redis Integration

Inventory Cache

---

# PHASE 6

CELERY BACKGROUND TASKS

Status: Not Started

Purpose:

Background Processing

Tasks:

* Inventory Sync
* Email Queue
* Notification Queue
* Marketplace Sync

Learning Topics:

* Celery Basics
* Worker Architecture
* Task Scheduling

Deliverables:

Celery Worker

Task Monitoring

Retry Logic

---

# PHASE 7

ORDER ROUTING SYSTEM

Status: Pending

Goal:

Automate supplier fulfillment.

Flow:

Customer

↓

Retailer

↓

Platform

↓

Supplier

↓

Courier

↓

Customer

Order Statuses:

Pending

Paid

Accepted

Processing

Packed

Shipped

Delivered

Returned

Cancelled

---

# PHASE 8

SHIPPING MANAGEMENT

Status: Pending

Integrations:

* Shiprocket
* Delhivery
* DHL
* FedEx

Features:

* Label Generation
* Shipment Creation
* Tracking Updates

Tables:

shipments

tracking_events

couriers

---

# PHASE 9

MARKETPLACE INTEGRATIONS

Status: Pending

Platforms:

Shopify

WooCommerce

Amazon

eBay

Features:

Product Sync

Order Sync

Inventory Sync

Learning Topics:

REST APIs

OAuth

Webhook Systems

---

# PHASE 10

ANALYTICS ENGINE

Status: Pending

Dashboard Metrics:

Revenue

Orders

Profit

Conversion Rate

Top Products

Top Suppliers

Top Retailers

Learning Topics:

Aggregation Queries

Reporting Systems

Data Visualization

---

# PHASE 11

SUBSCRIPTION SYSTEM

Status: Pending

Plans:

Starter

Professional

Enterprise

Features:

Plan Limits

Usage Tracking

Renewals

Tables:

plans

subscriptions

subscription_transactions

---

# PHASE 12

COMMISSION ENGINE

Status: Pending

Purpose:

Platform Revenue

Example:

Supplier Price = 500

Retailer Price = 700

Customer Price = 900

Platform Fee = 50

Tables:

commissions

commission_rules

transactions

---

# PHASE 13

NOTIFICATION ENGINE

Status: Pending

Channels:

Email

SMS

WhatsApp

Push Notifications

Events:

Order Created

Order Shipped

Stock Low

Subscription Expiring

---

# PHASE 14

AWS DEPLOYMENT

Status: Future

Services To Learn:

EC2

RDS

S3

CloudFront

Route53

IAM

Target Architecture:

React Frontend

↓

Nginx

↓

FastAPI

↓

Redis

↓

Celery

↓

PostgreSQL

↓

AWS Infrastructure

---

# LEARNING ROADMAP

Week 1

FastAPI Advanced

* Dependency Injection
* Middleware
* Security
* Background Tasks

Week 2

PostgreSQL Advanced

* Joins
* Transactions
* Indexing
* Views

Week 3

Redis

* Caching
* Pub/Sub
* Queues

Week 4

Celery

* Workers
* Scheduling
* Retries

Week 5

Shipping APIs

* Shiprocket
* Delhivery

Week 6

Marketplace APIs

* Shopify
* WooCommerce

Week 7

AWS

* EC2
* RDS
* S3

---

# DAILY DEVELOPMENT LOG

Date:

Tasks Completed:

Issues Faced:

Solutions:

Git Commit:

Hours Worked:

Next Day Goal:

---

# PROJECT COMPLETION CHECKLIST

Authentication

[✓]

Products

[✓]

Cart

[✓]

Orders

[✓]

Payments

[✓]

Supplier System

[ ]

Retailer System

[ ]

Product Import

[ ]

Variants

[ ]

Inventory Sync

[ ]

Redis

[ ]

Celery

[ ]

Order Routing

[ ]

Shipping

[ ]

Analytics

[ ]

Subscriptions

[ ]

Commission Engine

[ ]

Marketplace Integration

[ ]

AWS Deployment

[ ]

Production Release

[ ]
