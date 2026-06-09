# SYSTEM FOUNDATION REVIEW & PRODUCT CORE ARCHITECTURE

**Project:** Rozi Khan (Dropshipping OS)
**Phase:** Pre-Milestone 4 (System Contract Design)
**Role:** Principal Software Architect
**Version:** 2.0 (CTO Approved Architecture)

---

## 1. Current System Architecture Analysis
While Suppliers and Retailers are securely decoupled with proper Auth/RBAC, previous assumptions regarding the catalog were too simplistic for an enterprise-grade marketplace. The system must account for multi-supplier scaling, split shipments, dead-letter queuing for failures, and strict attribute-based access control to prevent system abuse at scale.

---

## 2. Core Missing Layer: Multi-Layer Product Model
A "Product" is not a single entity. To support future marketplace expansion (multiple suppliers selling the same item, price competition), we enforce a strict 3-Layer Architecture:

1. **Master Product (Global Catalog):** Static base definition (e.g., "Apple iPhone 14"). Owned by the system or primary supplier.
2. **Product Offer (Supplier-Owned):** The specific B2B contract from a supplier. Defines their specific wholesale price, handling time, and links to their inventory.
3. **Retailer Listing (Retailer-Owned):** The projection pushed to Shopify. Contains retail price overrides, custom SEO titles, and the active `sync_status`.

---

## 3. Cross-Domain Data Flow & Snapshot System
Relying purely on a live Foreign Key for Retailer imports is dangerous (price spikes or supplier deletions would instantly break live stores).

**The Retailer Snapshot System:**
When a Retailer imports a Product Offer, the `retailer_products` table stores:
*   `offer_id`: Reference to the Supplier's Offer.
*   `snapshot_data`: Immutable JSON cache of the title/specs at the time of import.
*   `retail_price_override`: The retailer's custom price.
*   `last_synced_at` & `sync_status`: Tracking the webhook state.

If the supplier drastically changes the product structure, the Retailer's snapshot remains stable while the system triggers a `ProductStructureChanged` event, requiring the Retailer to manually approve the new sync.

---

## 4. Inventory Domain (Strict Separation)
**Inventory does NOT live inside the Product.** 
To support multi-warehouse scaling and supplier-level stock sync, Inventory is a completely separate domain entity.
*   **Structure:** `inventory_ledgers` belong to a `Supplier` + `Warehouse` + `Variant SKU`.
*   The Product Offer simply queries the Inventory Domain to aggregate "Available Stock".

---

## 5. Event Infrastructure Contract
We require a guaranteed, fault-tolerant event bus for cross-domain actions.

*   **Bus Type:** Internal Redis Pub/Sub (for ephemeral/fast sync) + DB Outbox Pattern (for guaranteed delivery to external systems).
*   **Delivery Guarantee:** At-least-once delivery.
*   **Retry Strategy:** Exponential backoff (e.g., 2s, 4s, 8s, 16s, 32s).
*   **Failure Handling:** Dead Letter Queue (DLQ). If syncing inventory to Shopify fails 5 times, the event is moved to the DLQ and the `RetailerSyncFailed` event is fired.

**Bidirectional Event Flow:**
*   *Supplier → Retailer:* `ProductOfferPriceChanged`, `SupplierSuspended`, `InventoryDepleted`.
*   *Retailer → Supplier/System:* `RetailerPriceOverrideChanged`, `RetailerListingDisabled`, `RetailerSyncFailed`.

---

## 6. Full Product Lifecycle States
A simplistic Active/Archived state machine fails in real SaaS environments. The `ProductOffer` utilizes a full state machine:
`DRAFT` → `PENDING_APPROVAL` (Awaiting Admin KYC) → `ACTIVE` → `PAUSED` (Supplier vacation mode) → `OUT_OF_STOCK` (System auto-toggle) → `DISABLED` (Admin flagged) → `ARCHIVED`.

---

## 7. Attribute-Based Access Control (ABAC)
RBAC (Supplier vs. Retailer) is insufficient. We enforce ABAC:
*   **Ownership:** `Supplier` can only edit `ProductOffer` if `offer.supplier_id == current_user.id`.
*   **Regional Rules:** `Retailer` can only view `ProductOffer` if `offer.shipping_regions` intersects with `retailer.target_market`.
*   **Stock Rules:** Retailers cannot import offers where `inventory_status == DEPLETED`.

---

## 8. Advanced Subscription Enforcement Rules
Subscriptions must control system load, not just catalog access. `RetailerSubscription` rules enforce:
*   **API Rate Limits:** Free tier = 100 req/min; Enterprise = 1000 req/min.
*   **Active Listings:** Free tier = Max 50 active `retailer_products`.
*   **Sync Frequency:** Free tier = Syncs every 4 hours; Enterprise = Real-time webhook sync.
*   **Feature Gating:** Attempting to exceed import limits returns `HTTP 402 Payment Required`.

---

## 9. System Risks & Final Mitigation
*   **Race Conditions:** Mitigated by moving Inventory to a dedicated ledger using `SELECT FOR UPDATE` during order allocation.
*   **Data Inconsistency:** Mitigated by the Retailer Snapshot system. Live changes to Master Data never break the Retailer's storefront unexpectedly.
*   **Scaling Bottlenecks:** Mitigated by shifting external syncing exclusively to Celery workers with proper DLQ monitoring, keeping the FastAPI request cycle strictly under 100ms.
