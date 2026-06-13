import API from "./api";

export const getProducts = (params = {}) => API.get("/products", { params });

export const getProductById = (id) => API.get(`/products/${id}`);

export const createProductReview = (id, payload) => API.post(`/products/${id}/reviews`, payload);

export const getCategories = () => API.get("/categories");

export const getSuppliers = () => API.get("/admin/suppliers-list");

export const createCategory = (data) => API.post("/admin/categories", data);

export const deleteCategory = (categoryName) => API.delete(`/admin/categories/${encodeURIComponent(categoryName)}`);

export const createSupplier = (data) => API.post("/admin/suppliers", data);

export const deleteSupplier = (supplierId) => API.delete(`/admin/suppliers/${supplierId}`);
