import axios from "axios";
const BE_URL = import.meta.env.VITE_API_URL || "https://api.example.com";
console.log("Backend URL:", BE_URL);
const axiosInstance = axios.create({
    baseURL: BE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json"
    }
});
export default axiosInstance;