import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Dashboard from "./Pages/Dashboard";
import Products from "./Pages/Products";
import ProductDetail from "./Pages/ProductDetail";
import Cart from "./Pages/Cart";
import Checkout from "./Pages/Checkout";
import MyOrders from "./Pages/MyOrders";
import OrderDetail from "./Pages/OrderDetail";
import OrderSuccess from "./Pages/OrderSuccess";

import Navbar from "./Components/Navbar";

import ProtectedRoute from "./Components/routes/ProtectedRoute";
import PublicOnlyRoute from "./Components/routes/PublicOnlyRoute";
import AdminRoute from "./Components/routes/AdminRoute";

import useThemeMode from "./hooks/useThemeMode";

function App() {

  const { isDark } = useThemeMode();

  return (
    <BrowserRouter>

      <div
        className={`min-h-screen font-sans transition-colors duration-500 ${
          isDark
            ? "bg-[#050505] text-white"
            : "bg-[#f6f7fb] text-slate-950"
        }`}
      >

        {/* ========================================== */}
        {/* Navbar */}
        {/* ========================================== */}

        <Navbar />

        {/* ========================================== */}
        {/* Routes */}
        {/* ========================================== */}

        <Routes>

          {/* ========================================== */}
          {/* Public Routes */}
          {/* ========================================== */}

          <Route path="/" element={<Home />} />

          <Route path="/products" element={<Products />} />

          <Route
            path="/products/:id"
            element={<ProductDetail />}
          />

          <Route
            path="/cart"
            element={<Cart />}
          />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/order-success"
            element={
              <ProtectedRoute>
                <OrderSuccess />
              </ProtectedRoute>
            }
          />

          {/* ========================================== */}
          {/* Auth Routes */}
          {/* ========================================== */}

          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />

          {/* ========================================== */}
          {/* Protected Routes */}
          {/* ========================================== */}

          <Route
            path="/dashboard"
            element={
              <AdminRoute>
                <Dashboard />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <Dashboard />
              </AdminRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            }
          />

        </Routes>

      </div>

    </BrowserRouter>
  );
}

export default App;
