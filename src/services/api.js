const API_BASE_URL = 'https://impactdigitalacademy.com.ng/ftssu/api';

export const api = {
    apiBaseUrl: API_BASE_URL,

    async getProducts() {
        try {
            const response = await fetch(`${API_BASE_URL}/get_products.php`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: error.message };
        }
    },

    async saveOrder(orderData) {
        try {
            const response = await fetch(`${API_BASE_URL}/save_order.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: error.message };
        }
    },

    async getOrders(phoneNumber) {
        try {
            const response = await fetch(`${API_BASE_URL}/get_orders.php?phone=${encodeURIComponent(phoneNumber)}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: error.message };
        }
    },

    async getOrderDetails(orderNumber) {
        try {
            const response = await fetch(`${API_BASE_URL}/get_order_details.php?order_number=${encodeURIComponent(orderNumber)}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: error.message };
        }
    },
};