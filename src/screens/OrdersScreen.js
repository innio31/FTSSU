import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { api } from '../services/api';

export default function OrdersScreen() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [selectedOrderData, setSelectedOrderData] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const handleTrackOrder = async () => {
        if (!phoneNumber || phoneNumber.length !== 11) {
            Alert.alert('Error', 'Please enter a valid 11-digit phone number');
            return;
        }

        setLoading(true);
        const result = await api.getOrders(phoneNumber);
        setLoading(false);
        setSearched(true);

        if (result.success) {
            setOrders(result.orders);
        } else {
            Alert.alert('Error', 'Failed to fetch orders');
            setOrders([]);
        }
    };

    const viewOrderDetails = async (orderNumber) => {
        setDetailsLoading(true);
        setModalVisible(true);

        const result = await api.getOrderDetails(orderNumber);
        setDetailsLoading(false);

        if (result.success) {
            setSelectedOrderData(result);
        } else {
            Alert.alert('Error', 'Failed to load order details');
            setModalVisible(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#FF9800';
            case 'paid': return '#2196F3';
            case 'completed': return '#4CAF50';
            case 'cancelled': return '#f44336';
            default: return '#999';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Pending';
            case 'paid': return 'Paid';
            case 'completed': return 'Completed';
            case 'cancelled': return 'Cancelled';
            default: return status;
        }
    };

    const formatPrice = (price) => `₦${parseFloat(price).toLocaleString()}`;

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-NG', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <View style={styles.container}>
            <ScrollView>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>📋 TRACK ORDERS</Text>
                    <Text style={styles.headerSubtitle}>Enter your phone number to view orders</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., 08012345678"
                        keyboardType="phone-pad"
                        maxLength={11}
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                    />
                    <TouchableOpacity style={styles.trackButton} onPress={handleTrackOrder}>
                        <Text style={styles.trackButtonText}>Track Orders</Text>
                    </TouchableOpacity>
                </View>

                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#cc0000" />
                        <Text style={styles.loadingText}>Fetching your orders...</Text>
                    </View>
                )}

                {searched && !loading && orders.length === 0 && (
                    <View style={styles.noOrdersCard}>
                        <Text style={styles.noOrdersEmoji}>📭</Text>
                        <Text style={styles.noOrdersTitle}>No orders found</Text>
                        <Text style={styles.noOrdersText}>
                            No orders found for this phone number. Place an order to see it here.
                        </Text>
                    </View>
                )}

                {orders.map((order, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.orderCard}
                        onPress={() => viewOrderDetails(order.order_number)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.orderHeader}>
                            <Text style={styles.orderNumber}>{order.order_number}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                                    {getStatusText(order.status)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.orderDetails}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Date:</Text>
                                <Text style={styles.detailValue}>{formatDate(order.date)}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Amount:</Text>
                                <Text style={styles.amountValue}>{formatPrice(order.total_amount)}</Text>
                            </View>
                        </View>

                        <View style={styles.viewDetailsButton}>
                            <Text style={styles.viewDetailsText}>Tap to view items →</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Order Details Modal */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Order Details</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeModalText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {detailsLoading ? (
                            <View style={styles.detailsLoading}>
                                <ActivityIndicator size="large" color="#cc0000" />
                                <Text style={styles.detailsLoadingText}>Loading order details...</Text>
                            </View>
                        ) : selectedOrderData && selectedOrderData.success && selectedOrderData.order ? (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Order Info */}
                                <View style={styles.infoSection}>
                                    <Text style={styles.sectionLabel}>Order Number</Text>
                                    <Text style={styles.sectionValue}>{selectedOrderData.order.order_number}</Text>

                                    <Text style={styles.sectionLabel}>Status</Text>
                                    <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(selectedOrderData.order.status) + '20' }]}>
                                        <Text style={[styles.modalStatusText, { color: getStatusColor(selectedOrderData.order.status) }]}>
                                            {getStatusText(selectedOrderData.order.status)}
                                        </Text>
                                    </View>

                                    <Text style={styles.sectionLabel}>Date</Text>
                                    <Text style={styles.sectionValue}>{formatDate(selectedOrderData.order.created_at)}</Text>

                                    <Text style={styles.sectionLabel}>Customer Name</Text>
                                    <Text style={styles.sectionValue}>{selectedOrderData.order.customer_name}</Text>

                                    <Text style={styles.sectionLabel}>Phone Number</Text>
                                    <Text style={styles.sectionValue}>{selectedOrderData.order.customer_phone}</Text>

                                    <Text style={styles.sectionLabel}>Command</Text>
                                    <Text style={styles.sectionValue}>{selectedOrderData.order.customer_command}</Text>
                                </View>

                                {/* Order Items */}
                                <View style={styles.itemsSection}>
                                    <Text style={styles.itemsTitle}>Order Items</Text>
                                    {selectedOrderData.items && selectedOrderData.items.length > 0 ? (
                                        selectedOrderData.items.map((item, idx) => (
                                            <View key={idx} style={styles.orderItem}>
                                                <View style={styles.itemHeader}>
                                                    <Text style={styles.itemName}>{item.product_name}</Text>
                                                    <Text style={styles.itemQuantity}>×{item.quantity}</Text>
                                                </View>
                                                <View style={styles.itemPriceRow}>
                                                    <Text style={styles.itemPriceLabel}>Unit Price:</Text>
                                                    <Text style={styles.itemPrice}>{formatPrice(item.unit_price)}</Text>
                                                </View>
                                                <View style={styles.itemTotalRow}>
                                                    <Text style={styles.itemTotalLabel}>Total:</Text>
                                                    <Text style={styles.itemTotal}>{formatPrice(item.total_price)}</Text>
                                                </View>
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={styles.noItemsText}>No items found for this order</Text>
                                    )}
                                </View>

                                {/* Total */}
                                <View style={styles.totalSection}>
                                    <Text style={styles.totalLabel}>GRAND TOTAL</Text>
                                    <Text style={styles.totalAmount}>{formatPrice(selectedOrderData.order.total_amount)}</Text>
                                </View>
                            </ScrollView>
                        ) : (
                            <View style={styles.detailsLoading}>
                                <Text style={styles.errorText}>Failed to load order details</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#cc0000',
        padding: 20,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#ffcccc',
        marginTop: 4,
    },
    card: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 20,
        borderRadius: 12,
        elevation: 2,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
    },
    trackButton: {
        backgroundColor: '#cc0000',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    trackButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
    },
    noOrdersCard: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 30,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
    },
    noOrdersEmoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    noOrdersTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 8,
    },
    noOrdersText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    orderCard: {
        backgroundColor: '#fff',
        margin: 16,
        marginTop: 0,
        padding: 16,
        borderRadius: 12,
        elevation: 2,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    orderNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#cc0000',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    orderDetails: {
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailLabel: {
        fontSize: 13,
        color: '#666',
    },
    detailValue: {
        fontSize: 13,
        color: '#333',
    },
    amountValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#cc0000',
    },
    viewDetailsButton: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        alignItems: 'center',
    },
    viewDetailsText: {
        fontSize: 12,
        color: '#cc0000',
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        width: '90%',
        maxHeight: '85%',
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#cc0000',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    closeModalText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    detailsLoading: {
        padding: 40,
        alignItems: 'center',
    },
    detailsLoadingText: {
        marginTop: 12,
        color: '#666',
    },
    errorText: {
        color: '#cc0000',
        fontSize: 16,
    },
    infoSection: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        marginTop: 12,
        marginBottom: 4,
    },
    sectionValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    modalStatusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 4,
    },
    modalStatusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    itemsSection: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    itemsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#cc0000',
    },
    orderItem: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    itemQuantity: {
        fontSize: 12,
        color: '#666',
    },
    itemPriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    itemPriceLabel: {
        fontSize: 12,
        color: '#666',
    },
    itemPrice: {
        fontSize: 12,
        color: '#333',
    },
    itemTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 8,
        marginTop: 4,
    },
    itemTotalLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    itemTotal: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#cc0000',
    },
    noItemsText: {
        textAlign: 'center',
        color: '#999',
        padding: 20,
    },
    totalSection: {
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#cc0000',
    },
});