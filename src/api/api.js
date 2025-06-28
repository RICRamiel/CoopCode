import axios from "axios";
import BASE_URL from "../config/config";

const api = axios.create({
    baseURL: BASE_URL,
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => Promise.reject(error));


api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (error.response.status === 500 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                console.log(refreshToken)
                const response = await axios.post(
                    BASE_URL + 'auth/refresh',
                    {"value": refreshToken}
                );
                console.log(response)
                const newAccessToken = response.data.accessToken;
                const newRefreshToken = response.data.refreshToken;
                localStorage.setItem('accessToken', newAccessToken);
                localStorage.setItem('refreshToken', newRefreshToken);
                // Повторяем оригинальный запрос
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return axios(originalRequest);
            } catch (refreshError) {
                // Обработка ошибки обновления токена
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem("isAuth")
                window.location = '/login'; // Редирект на логин
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api
