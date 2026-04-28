import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Linking,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CartScreen() {
    const navigation = useNavigation();
    const { cartItems, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
    const [userProfile, setUserProfile] = useState({ name: '', phone: '', command: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        const name = await AsyncStorage.getItem('@user_name');
        const phone = await AsyncStorage.getItem('@user_phone');
        const command = await AsyncStorage.getItem('@user_command');
        setUserProfile({ name: name || '', phone: phone || '', command: command || '' });
    };

    const formatPrice = (price) => `₦${price.toLocaleString()}`;

    const getItemTotal = (item) => {
        if (item.has_custom_price) {
            return item.customAmount || 0;
        }
        return item.price * item.quantity;
    };

    const getOrderItemsArray = () => {
        return cartItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            customAmount: item.customAmount,
            has_custom_price: item.has_custom_price,
        }));
    };

    const handleCheckout = async () => {
        if (cartItems.length === 0) {
            Alert.alert('Cart Empty', 'Please add items to your cart first');
            return;
        }

        if (!userProfile.name || !userProfile.phone || !userProfile.command) {
            Alert.alert(
                'Profile Incomplete',
                'Please complete your profile first (Name, Phone, and Command are required)',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Go to Profile', onPress: () => navigation.navigate('Profile') }
                ]
            );
            return;
        }

        setSaving(true);

        // Prepare order data
        const orderData = {
            customer_name: userProfile.name,
            customer_phone: userProfile.phone,
            customer_command: userProfile.command,
            total_amount: getTotalPrice(),
            items: getOrderItemsArray(),
        };

        // Save to database
        const result = await api.saveOrder(orderData);

        setSaving(false);

        if (result.success) {
            // Create WhatsApp message with order number
            const message = `Hello%20Faith%20Tabernacle%20Security%20Accounts%2C%0A%0A✅%20ORDER%20CONFIRMATION%0AOrder%20Number%3A%20${result.order_number}%0A%0A📋%20ORDER%20DETAILS%3A%0A${getOrderItemsText()}%0A%0A💰%20TOTAL%20AMOUNT%3A%20${formatPrice(getTotalPrice())}%0A%0A👤%20CUSTOMER%20INFORMATION%3A%0AName%3A%20${encodeURIComponent(userProfile.name)}%0APhone%3A%20${userProfile.phone}%0ACommand%3A%20${encodeURIComponent(userProfile.command)}%0A%0A📷%20Payment%20Proof%3A%20(Attach%20screenshot)%0A%0AThank%20you!`;

            const whatsappUrl = `https://wa.me/2348037280183?text=${message}`;

            Alert.alert(
                'Order Saved!',
                `Order #${result.order_number} has been recorded. Send payment proof via WhatsApp to complete.`,
                [
                    {
                        text: 'Send on WhatsApp',
                        onPress: async () => {
                            await Linking.openURL(whatsappUrl);
                            clearCart();
                        }
                    },
                    { text: 'Later', style: 'cancel' }
                ]
            );
        } else {
            Alert.alert('Error', 'Failed to save order. Please try again.');
        }
    };

    const getOrderItemsText = () => {
        return cartItems.map(item => {
            if (item.has_custom_price) {
                return `• ${item.name}: ₦${item.customAmount?.toLocaleString()}`;
            }
            return `• ${item.name}: ${item.quantity} × ₦${item.price.toLocaleString()} = ₦${(item.price * item.quantity).toLocaleString()}`;
        }).join('%0A');
    };

    const renderCartItem = ({ item }) => (
        <View style={styles.cartItem}>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                {!item.has_custom_price ? (
                    <Text style={styles.itemPrice}>{formatPrice(item.price)} each</Text>
                ) : (
                    <Text style={styles.itemPrice}>Seed Amount</Text>
                )}
                <Text style={styles.itemTotal}>Total: {formatPrice(getItemTotal(item))}</Text>
            </View>

            {!item.has_custom_price ? (
                <View style={styles.quantityControls}>
                    <TouchableOpacity
                        onPress={() => updateQuantity(item.id, item.quantity - 1)}
                        style={styles.qtyButton}
                    >
                        <Text style={styles.qtyButtonText}>-</Text>
                    </TouchableOpacity>

                    <Text style={styles.quantityText}>{item.quantity}</Text>

                    <TouchableOpacity
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                        style={styles.qtyButton}
                    >
                        <Text style={styles.qtyButtonText}>+</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <Text style={styles.customAmount}>{formatPrice(item.customAmount)}</Text>
            )}

            <TouchableOpacity
                onPress={() => removeFromCart(item.id)}
                style={styles.deleteButton}
            >
                <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
        </View>
    );

    if (cartItems.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🛒</Text>
                <Text style={styles.emptyText}>Your cart is empty</Text>
                <Text style={styles.emptySubtext}>Add items from the Products tab</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={cartItems}
                renderItem={renderCartItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
            />

            <View style={styles.footer}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>GRAND TOTAL</Text>
                    <Text style={styles.totalAmount}>{formatPrice(getTotalPrice())}</Text>
                </View>

                <TouchableOpacity
                    style={styles.checkoutButton}
                    onPress={handleCheckout}
                    disabled={saving}
                >
                    <Text style={styles.checkoutButtonText}>
                        {saving ? 'Saving Order...' : '💳 PROCEED TO PAYMENT →'}
                    </Text>
                </TouchableOpacity>

                {cartItems.length > 0 && (
                    <TouchableOpacity onPress={clearCart} style={styles.clearButton}>
                        <Text style={styles.clearButtonText}>Clear Cart</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
    },
    listContainer: {
        padding: 12,
    },
    cartItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 2,
    },
    itemInfo: {
        flex: 2,
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    itemPrice: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    itemTotal: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#cc0000',
        marginTop: 4,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    qtyButton: {
        width: 32,
        height: 32,
        backgroundColor: '#cc0000',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    quantityText: {
        fontSize: 14,
        fontWeight: 'bold',
        minWidth: 25,
        textAlign: 'center',
    },
    customAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#cc0000',
    },
    deleteButton: {
        padding: 8,
    },
    deleteButtonText: {
        fontSize: 20,
    },
    footer: {
        backgroundColor: '#fff',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    totalAmount: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#cc0000',
    },
    checkoutButton: {
        backgroundColor: '#25D366',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    checkoutButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    clearButton: {
        marginTop: 12,
        alignItems: 'center',
    },
    clearButtonText: {
        color: '#999',
        fontSize: 12,
    },
});