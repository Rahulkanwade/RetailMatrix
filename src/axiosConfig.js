// src/axiosConfig.js
import axios from "axios";
import { API_BASE } from "./config";

const instance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export default instance;
