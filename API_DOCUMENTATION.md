# API DOCUMENTATION
## Rozi Khan Dropshipping Platform
**Version:** 1.0.0
**Base URL:** `https://api.rozikhan.com/v1`

---

## Table of Contents
1. [Authentication APIs](#1-authentication-apis)
2. [User APIs](#2-user-apis)
3. [Supplier APIs](#3-supplier-apis)
4. [Retailer APIs](#4-retailer-apis)
5. [Product APIs](#5-product-apis)
6. [Variant APIs](#6-variant-apis)
7. [Inventory APIs](#7-inventory-apis)
8. [Order APIs](#8-order-apis)
9. [Shipping APIs](#9-shipping-apis)
10. [Payment APIs](#10-payment-apis)
11. [Analytics APIs](#11-analytics-apis)
12. [Marketplace APIs](#12-marketplace-apis)
13. [Subscription APIs](#13-subscription-apis)
14. [Notification APIs](#14-notification-apis)

---

## Global Standard
* **Data Format:** All requests and responses are `application/json` unless specified (e.g., file uploads).
* **Auth Scheme:** `Authorization: Bearer <JWT_ACCESS_TOKEN>`
* **Pagination:** Standard `?page=1&limit=20` query parameters on `GET` lists.

---

## 1. Authentication APIs

### 1.1 Login (Generate Token)
* **Method:** `POST`
* **Endpoint:** `/auth/login`
* **Permissions:** Public
* **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }
  ```
* **Validation Rules:** `email` must be valid format, `password` min 8 chars.
* **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbG...",
    "refresh_token": "eyJhbG...",
    "token_type": "bearer",
    "user": { "id": "uuid", "role": "RETAILER" }
  }
  ```
* **Error Codes:**
  * `401 Unauthorized`: Invalid credentials.
  * `422 Unprocessable Entity`: Validation error.

---

## 2. User APIs

### 2.1 Get Current User
* **Method:** `GET`
* **Endpoint:** `/users/me`
* **Permissions:** Authenticated (Any Role)
* **Response (200 OK):**
  ```json
  {
    "id": "uuid",
    "email": "user@example.com",
    "role": "RETAILER",
    "is_email_verified": true
  }
  ```
* **Error Codes:**
  * `401 Unauthorized`: Token missing or expired.

---

## 3. Supplier APIs

### 3.1 Register Supplier Profile
* **Method:** `POST`
* **Endpoint:** `/suppliers/profile`
* **Permissions:** Authenticated (`SUPPLIER`)
* **Request Body:**
  ```json
  {
    "company_name": "Acme Wholesale",
    "tax_id": "GSTIN123456",
    "warehouse_address": "123 Industrial Park, City"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "id": "uuid",
    "company_name": "Acme Wholesale",
    "verification_status": "PENDING"
  }
  ```

---

## 4. Retailer APIs

### 4.1 Update Store Settings
* **Method:** `PUT`
* **Endpoint:** `/retailers/settings`
* **Permissions:** Authenticated (`RETAILER`)
* **Request Body:**
  ```json
  {
    "store_name": "My Dropship Store",
    "default_markup_percentage": 25.0
  }
  ```
* **Response (200 OK):** Updated retailer profile object.

---

## 5. Product APIs

### 5.1 Create Product (Supplier)
* **Method:** `POST`
* **Endpoint:** `/products`
* **Permissions:** Authenticated (`SUPPLIER`)
* **Request Body:**
  ```json
  {
    "title": "Bluetooth Headphones",
    "description": "High quality wireless audio...",
    "base_wholesale_price": 45.00,
    "suggested_retail_price": 89.99
  }
  ```
* **Validation Rules:** Prices must be > 0. `title` max 255 chars.
* **Response (201 Created):** Returns product ID and details.

### 5.2 List Marketplace Products (Retailer)
* **Method:** `GET`
* **Endpoint:** `/products/marketplace?page=1&limit=20&search=bluetooth`
* **Permissions:** Authenticated (`RETAILER`)
* **Response (200 OK):**
  ```json
  {
    "data": [ { "id": "uuid", "title": "Bluetooth Headphones", "price": 45.00 } ],
    "meta": { "total": 150, "page": 1, "pages": 8 }
  }
  ```

---

## 6. Variant APIs

### 6.1 Add Variant to Product
* **Method:** `POST`
* **Endpoint:** `/products/{product_id}/variants`
* **Permissions:** Authenticated (`SUPPLIER`)
* **Request Body:**
  ```json
  {
    "sku": "BT-HDPH-BLK",
    "variant_name": "Black",
    "price_override": null
  }
  ```
* **Error Codes:**
  * `403 Forbidden`: User does not own the product.
  * `409 Conflict`: SKU already exists globally.

---

## 7. Inventory APIs

### 7.1 Update Inventory Stock
* **Method:** `PATCH`
* **Endpoint:** `/inventory/{variant_id}`
* **Permissions:** Authenticated (`SUPPLIER`)
* **Request Body:**
  ```json
  {
    "available_stock": 500,
    "reason": "Restock from manufacturer"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "variant_id": "uuid",
    "available_stock": 500,
    "reserved_stock": 10
  }
  ```
* **Note:** Triggers async Celery task to push stock updates to all Retailers who imported this variant.

---

## 8. Order APIs

### 8.1 Place Order (Retailer routed to Supplier)
* **Method:** `POST`
* **Endpoint:** `/orders`
* **Permissions:** Authenticated (`RETAILER`)
* **Request Body:**
  ```json
  {
    "items": [
      { "variant_id": "uuid", "quantity": 2 }
    ],
    "shipping_address": {
      "name": "John Doe",
      "address": "123 Main St",
      "city": "New York",
      "zip": "10001",
      "country": "US"
    }
  }
  ```
* **Validation Rules:** Stock must be >= requested quantity. Wallet/Payment source must have sufficient funds.
* **Error Codes:**
  * `400 Bad Request`: Insufficient stock.

### 8.2 Update Order Status
* **Method:** `PATCH`
* **Endpoint:** `/orders/{order_id}/status`
* **Permissions:** Authenticated (`SUPPLIER` or `ADMIN`)
* **Request Body:** `{ "status": "SHIPPED" }`

---

## 9. Shipping APIs

### 9.1 Generate Shipping Label
* **Method:** `POST`
* **Endpoint:** `/shipping/{order_id}/label`
* **Permissions:** Authenticated (`SUPPLIER`)
* **Response (200 OK):**
  ```json
  {
    "courier": "Delhivery",
    "awb_number": "DLV123456789",
    "label_url": "https://cdn.rozikhan.com/labels/uuid.pdf"
  }
  ```

---

## 10. Payment APIs

### 10.1 Initialize Payment (Wallet Top-Up)
* **Method:** `POST`
* **Endpoint:** `/payments/initialize`
* **Permissions:** Authenticated (`RETAILER`)
* **Request Body:** `{ "amount": 1000.00 }`
* **Response (200 OK):** Returns Razorpay `order_id` to be used in frontend checkout.

---

## 11. Analytics APIs

### 11.1 Get Dashboard Stats
* **Method:** `GET`
* **Endpoint:** `/analytics/dashboard`
* **Permissions:** Authenticated (Role-specific response)
* **Response (200 OK):**
  ```json
  {
    "total_revenue": 15000.50,
    "active_orders": 24,
    "top_selling_products": [...]
  }
  ```

---

## 12. Marketplace APIs

### 12.1 Connect Shopify Store
* **Method:** `POST`
* **Endpoint:** `/marketplace/shopify/connect`
* **Permissions:** Authenticated (`RETAILER`)
* **Request Body:** `{ "shop_url": "mystore.myshopify.com", "access_token": "shpat_..." }`

### 12.2 Push Product to Store
* **Method:** `POST`
* **Endpoint:** `/marketplace/push/{variant_id}`
* **Permissions:** Authenticated (`RETAILER`)
* **Response (202 Accepted):** Async job queued.

---

## 13. Subscription APIs

### 13.1 Subscribe to Plan
* **Method:** `POST`
* **Endpoint:** `/subscriptions/subscribe`
* **Permissions:** Authenticated (`RETAILER`)
* **Request Body:** `{ "plan_id": "uuid" }`

---

## 14. Notification APIs

### 14.1 Get Notifications
* **Method:** `GET`
* **Endpoint:** `/notifications`
* **Permissions:** Authenticated
* **Response (200 OK):** Array of notification objects.
