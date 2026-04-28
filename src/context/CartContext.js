import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        try {
            const saved = await AsyncStorage.getItem('@ftssu_cart');
            if (saved) setCartItems(JSON.parse(saved));
        } catch (error) {
            console.error('Error loading cart:', error);
        }
    };

    const saveCart = async (items) => {
        try {
            await AsyncStorage.setItem('@ftssu_cart', JSON.stringify(items));
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    };

    const addToCart = (product, quantity = 1, customAmount = null) => {
        setCartItems(prev => {
            const existing = prev.find(item => item.id === product.id);
            let newItems;

            if (existing) {
                newItems = prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + quantity, customAmount: customAmount || item.customAmount }
                        : item
                );
            } else {
                newItems = [...prev, { ...product, quantity, customAmount }];
            }

            saveCart(newItems);
            return newItems;
        });
    };

    const removeFromCart = (productId) => {
        setCartItems(prev => {
            const newItems = prev.filter(item => item.id !== productId);
            saveCart(newItems);
            return newItems;
        });
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCartItems(prev => {
            const newItems = prev.map(item =>
                item.id === productId ? { ...item, quantity: newQuantity } : item
            );
            saveCart(newItems);
            return newItems;
        });
    };

    const clearCart = () => {
        setCartItems([]);
        saveCart([]);
    };

    const getTotalPrice = () => {
        return cartItems.reduce((sum, item) => {
            if (item.has_custom_price) {
                return sum + (item.customAmount || 0);
            }
            return sum + (item.price * item.quantity);
        }, 0);
    };

    const getTotalItems = () => {
        return cartItems.reduce((sum, item) => sum + item.quantity, 0);
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            getTotalPrice,
            getTotalItems,
        }}>
            {children}
        </CartContext.Provider>
    );
};