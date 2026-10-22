const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = async (endpoint, options = {}) => {
    const token = localStorage.getItem("token");

    const config = {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token && {
                Authorization: `Bearer ${token}`
            }),
            ...options.headers
        }
    };

    const response = await fetch(
        `${API_URL}${endpoint}`,
        config
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error ||
            data.mensaje ||
            "Error en la petición"
        );
    }

    return data;
};

export default api;