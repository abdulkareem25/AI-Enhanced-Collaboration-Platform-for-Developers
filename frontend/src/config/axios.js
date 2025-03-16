import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

// ✅ Request Interceptor: Har request se pehle token set karo
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

axios.get('/api/users')
    .then(response => console.log(response.data))
    .catch(error => console.error("API error:", error));
    
export default axiosInstance;
