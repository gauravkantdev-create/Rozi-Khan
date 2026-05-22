import API from "./api";

export const getProducts = (params = {}) => API.get("/products", { params });

export const getProductById = (id) => API.get(`/products/${id}`);

export const createProductReview = (id, payload) => API.post(`/products/${id}/reviews`, payload);
