import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE, // ✅ use environment variable
  withCredentials: true,                   // include cookies if needed
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;
