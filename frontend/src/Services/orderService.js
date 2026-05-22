import API from "./api";

export const createOrder = (payload) => API.post("/orders", payload);

export const getAllOrders = (params = {}) => API.get("/orders", { params });

export const getMyOrders = () => API.get("/orders/my-orders");

export const getOrderById = (id) => API.get(`/orders/${id}`);

export const updateOrderStatus = (id, payload) => API.patch(`/orders/${id}/status`, payload);

export const cancelOrder = (id, reason) => API.patch(`/orders/${id}/cancel`, { reason });
