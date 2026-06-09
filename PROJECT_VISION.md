# PROJECT VISION
## Rozi Khan Dropshipping Platform

**Document Version:** 1.0
**Author:** Senior Product Manager & SaaS Architect
**Status:** Approved for Implementation

---

## 1. Project Overview
**Rozi Khan** is a comprehensive, enterprise-grade B2B Dropshipping Operating System designed to bridge the gap between wholesale suppliers and e-commerce retailers. Taking inspiration from industry leaders like Avasam, Rozi Khan goes beyond a simple e-commerce storefront to provide a fully automated, multi-tenant ecosystem. It manages the entire dropshipping lifecycle—from product sourcing and real-time inventory synchronization to automated order routing, marketplace integrations, and fulfillment logistics.

## 2. Business Goals
* **Automate the Dropshipping Lifecycle:** Reduce manual intervention in order processing and inventory management to zero.
* **Establish a Verified Supplier Network:** Build a curated marketplace of high-quality, reliable suppliers.
* **Empower Retailers:** Provide e-commerce sellers with a risk-free, inventory-less model to scale their businesses globally.
* **Create a Scalable SaaS Revenue Stream:** Generate recurring revenue through tiered subscriptions and transaction-based commission models.

## 3. Problem Statement
The current dropshipping ecosystem is heavily fragmented:
* **For Retailers:** Sourcing reliable products, maintaining accurate inventory across multiple channels, and manually fulfilling orders leads to overselling, delayed shipments, and poor customer experience.
* **For Suppliers:** Acquiring new retail partners and managing disparate, low-volume orders across multiple platforms is inefficient and costly.
* **The Gap:** There is a lack of centralized, robust infrastructure that seamlessly synchronizes catalog data, inventory, and order fulfillment between independent suppliers and independent retailers.

## 4. Target Audience
* **Suppliers / Wholesalers / Manufacturers:** Businesses looking to expand their distribution channels without direct-to-consumer marketing overhead.
* **E-commerce Retailers / Dropshippers:** Entrepreneurs and established brands seeking to expand their product catalogs without the financial risk of holding inventory.

## 5. User Types
1. **Super Admin:** Platform owners managing the ecosystem, overseeing users, resolving disputes, and analyzing platform-wide revenue.
2. **Supplier:** Vendors who upload product catalogs, define wholesale pricing, manage stock levels, and fulfill routed orders.
3. **Retailer (Seller):** Merchants who browse the platform, import products to their storefronts (Shopify, WooCommerce, etc.), set retail margins, and generate sales.
4. **Customer (End-User):** The ultimate buyer who purchases from the Retailer's store. (Implicit user; interacts primarily with the Retailer's storefront).

## 6. Core Features
* **Multi-Tenant Architecture:** Secure, isolated dashboards for Admin, Suppliers, and Retailers.
* **Automated Product & Catalog Sync:** One-click product imports with variant support and pricing markup tools.
* **Real-Time Inventory Engine:** Advanced stock synchronization (Available, Reserved, Incoming) utilizing Redis caching.
* **Intelligent Order Routing:** Automated flow from Customer ➔ Retailer ➔ Platform ➔ Supplier.
* **Marketplace Integrations:** Seamless connections with Shopify, WooCommerce, Amazon, and eBay.
* **Shipping & Logistics Management:** Integration with major carriers (Shiprocket, Delhivery, DHL) for label generation and tracking.
* **Automated Subscription & Billing:** Tiered SaaS plans and automated commission/payout distribution.

## 7. Revenue Model
* **Subscription Tiers (Retailers):** Monthly/Annual SaaS fees based on feature access, import limits, and marketplace integrations (e.g., Starter, Professional, Enterprise).
* **Commission / Transaction Fees:** A percentage fee levied on the wholesale cost of every successful order routed through the platform.
* **Supplier Listing Fees (Optional Future Phase):** Premium placement or verified badge fees for suppliers.

## 8. Competitive Analysis
* **Avasam:** UK-focused, strong automated fulfillment, verified suppliers. (Primary benchmark).
* **Spocket:** US/EU focused, high-quality products, heavy focus on Shopify integration.
* **AliExpress/Oberlo model:** High shipping times, unpredictable quality control.
* **Rozi Khan Advantage:** Localized/Customized integrations for specific target markets, superior tech stack (FastAPI + React) allowing for massive scalability and lower latency.

## 9. Avasam Feature Breakdown (Our North Star)

To successfully compete with Avasam, Rozi Khan must replicate and improve upon:
* **Verified Supplier Network:** Strict onboarding and quality checks.
* **Source & Sell:** Intuitive interface for retailers to find products and push them to their stores.
* **Automated Order Processing:** Orders from a retailer's store automatically generate a fulfillment request to the supplier.
* **Multi-Channel Integration:** API-first approach to connect with various sales channels.
* **Post-Sale Support:** Centralized return and refund management.

## 10. Long-Term Vision
To become the "Stripe for Dropshipping"—the invisible, highly reliable backend infrastructure powering thousands of independent e-commerce businesses globally, utilizing AI for predictive inventory and automated market trend analysis.

## 11. MVP Scope
* **Users:** Admin, Supplier, Retailer authentication and dashboards.
* **Catalog:** Suppliers can upload products; Retailers can browse and "import" them conceptually.
* **Orders:** Manual or semi-automated order routing (Retailer places order on behalf of customer, Supplier fulfills).
* **Payments:** Basic Razorpay integration for wallet/direct payments.
* **Tech Foundation:** React frontend, FastAPI backend, PostgreSQL database.

## 12. Future Scope
* **Automated Sync:** Deep integrations with Shopify/WooCommerce via webhooks and OAuth.
* **Background Processing:** Celery + Redis for asynchronous inventory sync and batch order processing.
* **Advanced Logistics:** Real-time shipping rate calculation and automated AWB generation.
* **AI/Analytics:** Predictive demand forecasting, smart pricing algorithms, and advanced BI dashboards.
* **Mobile Apps:** Native iOS and Android apps for Retailers to track sales on the go.

## 13. Success Metrics
* **System Uptime:** 99.99% availability.
* **Sync Latency:** Inventory updates reflected across all nodes in under 2 seconds.
* **Platform Adoption:** Number of verified suppliers onboarded vs. active retailers.
* **Customer Support Tickets:** Reduction in order dispute rates over time.

## 14. KPIs (Key Performance Indicators)
* **GMV (Gross Merchandise Value):** Total value of merchandise sold through the platform.
* **MRR (Monthly Recurring Revenue):** Revenue from SaaS subscriptions.
* **Order Fulfillment Rate:** Percentage of orders successfully shipped within the promised SLA.
* **Churn Rate:** Percentage of retailers/suppliers canceling their subscriptions or going inactive.
* **CAC / LTV:** Customer Acquisition Cost vs. Lifetime Value for Retailers.

## 15. Product Roadmap

**Phase 1: Foundation & Supply Side**
* Robust User Authentication & RBAC.
* Supplier Management System (Onboarding, Product Upload, Inventory definition).
* Variant Management System.

**Phase 2: Demand Side & Routing**
* Retailer Management System (Store setup, Product importing/mapping).
* Order Routing Engine (Customer ➔ Retailer ➔ Supplier).
* Payment & Commission Engine.

**Phase 3: Scale & Automation**
* Redis Caching & Celery Background Tasks (Inventory sync, queues).
* Marketplace Integrations (Shopify, WooCommerce).
* Shipping & Logistics APIs (Shiprocket).

**Phase 4: Enterprise Features**
* Analytics & BI Engine.
* Subscription Management System.
* Advanced Notification Engine (Email, SMS, Webhooks).
* AWS Production Deployment Architecture.
