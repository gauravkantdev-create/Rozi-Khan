import API from "./api";

export const getRazorpayKey = () => API.get("/payment/key");

export const createRazorpayOrder = (amount) =>
  API.post("/payment/create-order", { amount });

export const verifyPayment = (paymentData) =>
  API.post("/payment/verify", paymentData);
