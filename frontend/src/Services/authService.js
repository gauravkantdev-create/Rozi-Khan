import API from "./api";

export const sendRegisterOtp = (email) => {
  return API.post("/auth/send-otp", { email });
};

