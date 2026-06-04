# Rozi Khan Backend API — Python FastAPI + PostgreSQL

Welcome to the migrated, high-performance backend application for the **Rozi Khan dropshipping platform**. Originally developed in Node.js, Express, and MongoDB, this backend has been completely ported to **Python FastAPI** and **PostgreSQL (via SQLAlchemy ORM)** while preserving 100% API compatibility with the React/Vite frontend.

---

## Migration Changes Performed

This section details all architectural, database, dependency, and deployment updates made during the migration.

### 1. Database Schema Translation (MongoDB ➔ PostgreSQL)

MongoDB collections were converted into normalized PostgreSQL relational tables with explicit primary keys, foreign keys, constraints, and indexes. 

| MongoDB Collection | PostgreSQL Table | Conversion Details & Schema Changes |
| :--- | :--- | :--- |
| **users** | `users` | Fields mapped directly. `isEmailVerified` converted to `is_email_verified`. `id` remains a `VARCHAR(36)` to preserve original MongoDB hex IDs. |
| **emailotps** | `email_otps` | Mapped directly. An index was added on `email` to accelerate OTP verification query lookups. |
| **products** | `products` | Price, ratings, and count fields converted to `NUMERIC` and `INTEGER`. `createdBy` converted to foreign key reference `created_by`. |
| *Embedded Array* | `product_images` | **Normalized**: Created a separate table referencing `products(id)` with a `ON DELETE CASCADE` foreign key. |
| *Embedded subdocs* | `product_reviews` | **Normalized**: Converted reviews into a relational table referencing `products` and `users` with an explicit `UNIQUE(product_id, user_id)` constraint (one review per user per product). |
| **orders** | `orders` | Flat-mapped shipping and billing address subdocuments directly into columns (`shipping_fullname`, `shipping_address`, etc.). Prices set as `NUMERIC(10, 2)`. |
| *Embedded subdocs* | `order_items` | **Normalized**: Order items extracted into a separate table referencing `orders(id)` with an optional product link. |
| *Embedded subdocs* | `order_status_histories`| **Normalized**: Extracted status history arrays into a distinct log table referencing `orders(id)`. |

### 2. Codebase Porting (Node.js ➔ Python)

All controller files, route modules, middlewares, and helper utilities were translated into standard FastAPI and SQLAlchemy layers.

| Node.js / Express File | Python / FastAPI Equivalent Module | Migration Notes & Logic Preservation |
| :--- | :--- | :--- |
| `server.js` | `app/main.py` | Assembles routers, serves the `uploads/` static directory, and mounts Dynamic CORS origins. |
| `config/db.js` | `app/database.py` & `config.py` | Migrated from Mongoose Connection to SQLAlchemy declarative engine and sessionmaker. |
| `models/` | `app/models/` | Ported Mongoose schemas to SQLAlchemy model classes (`user.py`, `product.py`, `order.py`, etc.). |
| `middleware/authMiddleware.js`| `app/middleware/auth.py` | Converted JWT authorization and role verification to FastAPI `Depends` injection dependencies. |
| `controllers/authController.js`| `app/services/auth.py` & `app/routers/auth.py` | Extracted core logic to reusable service layer. Kept exact payload shapes (`success`, `user` objects). |
| `controllers/productController.js`| `app/services/product.py` & `app/routers/products.py` | Ported search keyword `$regex` to SQL `ILIKE`, and `$limit` / `$skip` to SQL `limit` and `offset`. |
| `controllers/orderController.js`| `app/services/order.py` & `app/routers/orders.py` | Relational joins used instead of in-memory maps, yielding massive query performance improvements. |
| `controllers/paymentController.js`| `app/services/payment.py` & `app/routers/payment.py` | Preserved Razorpay lazy-initialization block and secure HMAC-SHA256 verification. |
| `routes/uploadRoutes.js` | `app/routers/upload.py` | Ported disk storage using Python standard writing, with 5MB validation. |

### 3. Dependencies Introduced & Removed

#### 🟢 Added (Python Requirements):
- **fastapi & uvicorn**: Web framework and ASGI dev server.
- **sqlalchemy & psycopg2-binary**: SQL Object Relational Mapper and PostgreSQL client.
- **pydantic[email]**: High-performance request body validation and email parsing.
- **PyJWT**: Secure JSON Web Token encoding and decoding.
- **passlib[bcrypt]**: Cryptographic password hashing (fully compatible with Node's `bcryptjs`).
- **resend & razorpay**: Official SDK packages for emails and payments.
- **pymongo**: Required by ETL migration script.
- **python-multipart**: Parses multipart form files (uploads).
- **gunicorn**: Production WSGI/ASGI application server.

#### 🔴 Removed (Node.js npm packages):
- `express`, `cors`, `helmet`, `morgan`, `cookie-parser`
- `mongoose`
- `bcryptjs`, `jsonwebtoken`
- `multer`, `multer-storage-cloudinary`
- `nodemon`

### 4. Database Migration Steps

Existing MongoDB Atlas data can be migrated to PostgreSQL in seconds:

1. Setup environment variables (`MONGO_URI` and `DATABASE_URL`):
   ```bash
   export MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/test?retryWrites=true&w=majority"
   export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rozikhan"
   ```
2. Run the automated data migration script:
   ```bash
   python migrations/002_mongo_to_postgres.py
   ```
The script will safely map columns, split arrays into proper relational tables, preserve exact document `_id` values, establish database relationships, and report results.

### 5. Key Architectural Assumptions
- **ID compatibility**: Primary keys are kept as `VARCHAR(36)`. We generate 24-character hexadecimal MongoDB-compatible ObjectIds for any new records using standard Python time and random bytes (see `app/utils/helpers.py`). This guarantees the frontend does not break.
- **Datetime format**: MongoDB ISODate timestamps are translated directly into PostgreSQL TIMESTAMP columns. Pydantic handles automatic datetime serialization in standard ISO 8601 format.

---

## Getting Started

### Local Development Setup

1. **Clone & Navigate**:
   ```bash
   cd e:\RoziKhan\backend
   ```
2. **Virtual Environment**:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux / MacOS:
   source venv/bin/activate
   ```
3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Environment Variables**:
   Create a `.env` file from the template:
   ```bash
   cp .env.example .env
   ```
   Modify `.env` to include your PostgreSQL database credentials, JWT secret, Resend key, and Razorpay keys.
5. **Run Database Schema Setup**:
   SQLAlchemy automatically initializes all tables on startup. Alternatively, run the DDL schema file directly on your PostgreSQL database:
   ```bash
   psql -U postgres -d rozikhan -f migrations/001_initial_schema.sql
   ```
6. **Launch Dev Server**:
   ```bash
   uvicorn app.main:app --port 5000 --reload
   ```
   The backend will be available at `http://localhost:5000`. You can inspect the interactive OpenAPI documentation at `http://localhost:5000/docs`.

---

## VPS Deployment (123 Reg / Linux)

### 1. Project Directory Transfer
Upload the backend folder to `/var/www/rozikhan/backend` on your VPS.

### 2. Configure Systemd Service
1. Copy the systemd template to the system directory:
   ```bash
   sudo cp rozikhan.service /etc/systemd/system/rozikhan.service
   ```
2. Enable and start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable rozikhan
   sudo systemctl start rozikhan
   ```
3. Monitor status:
   ```bash
   sudo systemctl status rozikhan
   ```

### 3. Configure Nginx Reverse Proxy
1. Copy the Nginx template:
   ```bash
   sudo cp nginx_rozikhan.conf /etc/nginx/sites-available/rozikhan
   ```
2. Link the configuration file to enable it:
   ```bash
   sudo ln -s /etc/nginx/sites-available/rozikhan /etc/nginx/sites-enabled/
   ```
3. Validate Nginx syntax and reload:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```
