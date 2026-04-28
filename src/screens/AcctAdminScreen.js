import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Modal,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Share } from 'react-native';

export default function AcctAdminScreen({ route }) {
    const { member } = route.params || {};
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [activeTab, setActiveTab] = useState('orders');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [productModalVisible, setProductModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [selectedOrderData, setSelectedOrderData] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Filter states
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [generatingReport, setGeneratingReport] = useState(false);

    const [newProduct, setNewProduct] = useState({
        name: '',
        price: '',
        description: '',
        has_custom_price: false,
    });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        if (activeTab === 'orders') {
            await loadAllOrders();
        } else {
            await loadProducts();
        }
        setLoading(false);
    };

    const loadAllOrders = async () => {
        try {
            const response = await fetch(`${api.apiBaseUrl}/get_all_orders.php`);
            const data = await response.json();
            if (data.success) {
                setOrders(data.orders);
            } else {
                setOrders([]);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            setOrders([]);
        }
    };

    const filterOrdersByDate = () => {
        if (!startDate && !endDate) {
            loadAllOrders();
            return;
        }

        setLoading(true);
        let url = `${api.apiBaseUrl}/get_all_orders.php`;
        const params = [];
        if (startDate) params.push(`start_date=${startDate.toISOString().split('T')[0]}`);
        if (endDate) params.push(`end_date=${endDate.toISOString().split('T')[0]}`);
        if (params.length) url += `?${params.join('&')}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setOrders(data.orders);
                } else {
                    Alert.alert('Error', 'Failed to filter orders');
                }
            })
            .catch(error => console.error('Error:', error))
            .finally(() => setLoading(false));
    };

    const clearFilters = () => {
        setStartDate(null);
        setEndDate(null);
        loadAllOrders();
    };

    const generateSalesReport = async () => {
        setGeneratingReport(true);
        try {
            let url = `${api.apiBaseUrl}/get_sales_report.php`;
            const params = [];
            if (startDate) params.push(`start_date=${startDate.toISOString().split('T')[0]}`);
            if (endDate) params.push(`end_date=${endDate.toISOString().split('T')[0]}`);
            if (params.length) url += `?${params.join('&')}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setReportData(data);
                setShowReportModal(true);
            } else {
                Alert.alert('Error', 'Failed to generate report');
            }
        } catch (error) {
            console.error('Error:', error);
            Alert.alert('Error', 'Failed to generate report');
        }
        setGeneratingReport(false);
    };

    const shareReport = async () => {
        if (!reportData) return;

        const reportText = `
📊 FTSSU SALES REPORT
${startDate ? `From: ${startDate.toISOString().split('T')[0]}` : ''} ${endDate ? `To: ${endDate.toISOString().split('T')[0]}` : 'All Time'}
${'='.repeat(40)}

💰 REVENUE SUMMARY:
• Total Revenue: ₦${reportData.total_revenue?.toLocaleString() || 0}
• Total Orders: ${reportData.total_orders || 0}
• Completed Orders: ${reportData.completed_orders || 0}
• Pending Orders: ${reportData.pending_orders || 0}

📦 TOP PRODUCTS:
${reportData.top_products?.map(p => `• ${p.product_name}: ${p.total_quantity} sold (₦${parseFloat(p.total_sales).toLocaleString()})`).join('\n') || 'No data'}

📈 DAILY BREAKDOWN:
${reportData.daily_breakdown?.map(d => `• ${d.date}: ${d.order_count} orders (₦${parseFloat(d.total).toLocaleString()})`).join('\n') || 'No data'}

Generated on: ${new Date().toLocaleString()}
FTSSU - Faith Tabernacle Security Service Unit
        `;

        await Share.share({
            message: reportText,
            title: 'FTSSU Sales Report',
        });
    };

    const loadProducts = async () => {
        const result = await api.getProducts();
        if (result.success) {
            setProducts(result.products);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
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

    const updateOrderStatus = async (orderId, status, deliveredByName = null) => {
        setUpdatingStatus(true);
        try {
            const body = { order_id: orderId, status: status };
            if (deliveredByName) {
                body.delivered_by = deliveredByName;
            }

            const response = await fetch(`${api.apiBaseUrl}/update_order_status.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await response.json();

            if (data.success) {
                Alert.alert('Success', `Order status updated to ${getStatusText(status)}`);
                loadAllOrders();
                setModalVisible(false);
            } else {
                Alert.alert('Error', 'Failed to update order status');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update order status');
        }
        setUpdatingStatus(false);
    };

    const confirmPayment = (orderId) => {
        Alert.alert(
            'Confirm Payment',
            'Has the customer made the payment?',
            [
                { text: 'No', style: 'cancel' },
                { text: 'Yes, Payment Confirmed', onPress: () => updateOrderStatus(orderId, 'payment_confirmed') }
            ]
        );
    };

    const confirmDelivery = (orderId) => {
        Alert.alert(
            'Confirm Delivery',
            'Has the goods been delivered to the customer?',
            [
                { text: 'Not yet', style: 'cancel' },
                {
                    text: 'Yes, Delivered',
                    onPress: () => {
                        Alert.prompt(
                            'Delivered By',
                            'Enter the name of the person who delivered the goods:',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Confirm',
                                    onPress: (deliveredBy) => {
                                        if (deliveredBy && deliveredBy.trim()) {
                                            updateOrderStatus(orderId, 'goods_delivered', deliveredBy.trim());
                                        } else {
                                            Alert.alert('Error', 'Please enter the deliverer\'s name');
                                        }
                                    }
                                }
                            ]
                        );
                    }
                }
            ]
        );
    };

    const addProduct = async () => {
        if (!newProduct.name || !newProduct.price) {
            Alert.alert('Error', 'Please fill product name and price');
            return;
        }

        try {
            const response = await fetch(`${api.apiBaseUrl}/add_product.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProduct),
            });
            const data = await response.json();
            if (data.success) {
                Alert.alert('Success', 'Product added successfully');
                setProductModalVisible(false);
                setNewProduct({ name: '', price: '', description: '', has_custom_price: false });
                loadProducts();
            } else {
                Alert.alert('Error', 'Failed to add product');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to add product');
        }
    };

    const updateProduct = async () => {
        if (!editingProduct) return;

        try {
            const response = await fetch(`${api.apiBaseUrl}/update_product.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingProduct),
            });
            const data = await response.json();
            if (data.success) {
                Alert.alert('Success', 'Product updated successfully');
                setProductModalVisible(false);
                setEditingProduct(null);
                loadProducts();
            } else {
                Alert.alert('Error', 'Failed to update product');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update product');
        }
    };

    const deleteProduct = async (productId) => {
        Alert.alert(
            'Delete Product',
            'Are you sure you want to delete this product?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await fetch(`${api.apiBaseUrl}/delete_product.php`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: productId }),
                            });
                            const data = await response.json();
                            if (data.success) {
                                Alert.alert('Success', 'Product deleted');
                                loadProducts();
                            } else {
                                Alert.alert('Error', 'Failed to delete product');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete product');
                        }
                    }
                }
            ]
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#FF9800';
            case 'payment_confirmed': return '#2196F3';
            case 'goods_delivered': return '#4CAF50';
            case 'cancelled': return '#f44336';
            default: return '#999';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Pending Payment';
            case 'payment_confirmed': return 'Payment Confirmed';
            case 'goods_delivered': return 'Goods Delivered ✓';
            case 'cancelled': return 'Cancelled';
            default: return status;
        }
    };

    const formatPrice = (price) => `₦${parseFloat(price).toLocaleString()}`;

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
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
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
                    onPress={() => setActiveTab('orders')}
                >
                    <Ionicons name="list" size={20} color={activeTab === 'orders' ? '#cc0000' : '#666'} />
                    <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>All Orders</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'products' && styles.activeTab]}
                    onPress={() => setActiveTab('products')}
                >
                    <Ionicons name="cube" size={20} color={activeTab === 'products' ? '#cc0000' : '#666'} />
                    <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>Products</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#cc0000']} />
                }
            >
                {loading ? (
                    <ActivityIndicator size="large" color="#cc0000" style={styles.loader} />
                ) : activeTab === 'orders' ? (
                    <>
                        {/* Filter Section */}
                        <View style={styles.filterCard}>
                            <Text style={styles.filterTitle}>📅 Date Filter</Text>
                            <View style={styles.dateRow}>
                                <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
                                    <Text style={styles.dateButtonText}>
                                        {startDate ? startDate.toISOString().split('T')[0] : 'Start Date'}
                                    </Text>
                                </TouchableOpacity>
                                <Text style={styles.dateSeparator}>to</Text>
                                <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
                                    <Text style={styles.dateButtonText}>
                                        {endDate ? endDate.toISOString().split('T')[0] : 'End Date'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {showStartPicker && (
                                <DateTimePicker
                                    value={startDate || new Date()}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setShowStartPicker(false);
                                        if (selectedDate) setStartDate(selectedDate);
                                    }}
                                />
                            )}

                            {showEndPicker && (
                                <DateTimePicker
                                    value={endDate || new Date()}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setShowEndPicker(false);
                                        if (selectedDate) setEndDate(selectedDate);
                                    }}
                                />
                            )}

                            <View style={styles.filterButtons}>
                                <TouchableOpacity style={styles.applyFilterButton} onPress={filterOrdersByDate}>
                                    <Text style={styles.applyFilterButtonText}>Apply Filter</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.clearFilterButton} onPress={clearFilters}>
                                    <Text style={styles.clearFilterButtonText}>Clear</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.reportButton} onPress={generateSalesReport}>
                                    <Ionicons name="bar-chart" size={20} color="#fff" />
                                    <Text style={styles.reportButtonText}>Report</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Orders List */}
                        {orders.length > 0 ? (
                            orders.map((order, index) => (
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

                                    {order.status === 'goods_delivered' && (
                                        <View style={styles.deliveryBadge}>
                                            <Text style={styles.deliveryBadgeText}>🚚 Goods Delivered</Text>
                                        </View>
                                    )}

                                    <View style={styles.orderDetails}>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Date:</Text>
                                            <Text style={styles.detailValue}>{formatDate(order.date || order.created_at)}</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Customer:</Text>
                                            <Text style={styles.detailValue}>{order.customer_name || 'N/A'}</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Phone:</Text>
                                            <Text style={styles.detailValue}>{order.customer_phone || 'N/A'}</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Amount:</Text>
                                            <Text style={styles.amountValue}>{formatPrice(order.total_amount)}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.viewDetailsButton}>
                                        <Text style={styles.viewDetailsText}>Tap to manage order →</Text>
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No orders found</Text>
                        )}
                    </>
                ) : (
                    <View>
                        <TouchableOpacity style={styles.addButton} onPress={() => {
                            setEditingProduct(null);
                            setNewProduct({ name: '', price: '', description: '', has_custom_price: false });
                            setProductModalVisible(true);
                        }}>
                            <Ionicons name="add-circle" size={24} color="#fff" />
                            <Text style={styles.addButtonText}>Add New Product</Text>
                        </TouchableOpacity>

                        {products.map((product) => (
                            <View key={product.id} style={styles.productCard}>
                                <View style={styles.productInfo}>
                                    <Text style={styles.productName}>{product.name}</Text>
                                    <Text style={styles.productPrice}>₦{parseFloat(product.price).toLocaleString()}</Text>
                                    {product.has_custom_price && (
                                        <Text style={styles.customBadge}>Custom Amount</Text>
                                    )}
                                    {product.description ? (
                                        <Text style={styles.productDesc}>{product.description}</Text>
                                    ) : null}
                                </View>
                                <View style={styles.productActions}>
                                    <TouchableOpacity
                                        style={styles.editProductButton}
                                        onPress={() => {
                                            setEditingProduct(product);
                                            setProductModalVisible(true);
                                        }}
                                    >
                                        <Ionicons name="create-outline" size={20} color="#2196F3" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.deleteProductButton}
                                        onPress={() => deleteProduct(product.id)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#f44336" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
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
                                <View style={styles.infoSection}>
                                    <Text style={styles.sectionLabel}>Order Number</Text>
                                    <Text style={styles.sectionValue}>{selectedOrderData.order.order_number}</Text>

                                    <Text style={styles.sectionLabel}>Status</Text>
                                    <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(selectedOrderData.order.status) + '20' }]}>
                                        <Text style={[styles.modalStatusText, { color: getStatusColor(selectedOrderData.order.status) }]}>
                                            {getStatusText(selectedOrderData.order.status)}
                                        </Text>
                                    </View>

                                    {selectedOrderData.order.status === 'goods_delivered' && (
                                        <>
                                            <Text style={styles.sectionLabel}>Delivered On</Text>
                                            <Text style={styles.sectionValue}>{formatDate(selectedOrderData.order.delivered_at)}</Text>
                                            <Text style={styles.sectionLabel}>Delivered By</Text>
                                            <Text style={styles.sectionValue}>{selectedOrderData.order.delivered_by}</Text>
                                        </>
                                    )}

                                    <Text style={styles.sectionLabel}>Order Date</Text>
                                    <Text style={styles.sectionValue}>{formatDate(selectedOrderData.order.created_at)}</Text>

                                    <Text style={styles.sectionLabel}>Customer Name</Text>
                                    <Text style={styles.sectionValue}>{selectedOrderData.order.customer_name}</Text>

                                    <Text style={styles.sectionLabel}>Phone Number</Text>
                                    <Text style={styles.sectionValue}>{selectedOrderData.order.customer_phone}</Text>

                                    <Text style={styles.sectionLabel}>Command</Text>
                                    <Text style={styles.sectionValue}>{selectedOrderData.order.customer_command}</Text>
                                </View>

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
                                        <Text style={styles.noItemsText}>No items found</Text>
                                    )}
                                </View>

                                <View style={styles.totalSection}>
                                    <Text style={styles.totalLabel}>GRAND TOTAL</Text>
                                    <Text style={styles.totalAmount}>{formatPrice(selectedOrderData.order.total_amount)}</Text>
                                </View>

                                {selectedOrderData.order.status === 'pending' && (
                                    <TouchableOpacity
                                        style={styles.confirmPaymentButton}
                                        onPress={() => confirmPayment(selectedOrderData.order.id)}
                                        disabled={updatingStatus}
                                    >
                                        <Text style={styles.confirmPaymentButtonText}>Confirm Payment</Text>
                                    </TouchableOpacity>
                                )}

                                {selectedOrderData.order.status === 'payment_confirmed' && (
                                    <TouchableOpacity
                                        style={styles.confirmDeliveryButton}
                                        onPress={() => confirmDelivery(selectedOrderData.order.id)}
                                        disabled={updatingStatus}
                                    >
                                        <Text style={styles.confirmDeliveryButtonText}>Confirm Delivery</Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        ) : (
                            <View style={styles.detailsLoading}>
                                <Text style={styles.errorText}>Failed to load order details</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Sales Report Modal */}
            <Modal
                visible={showReportModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowReportModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.reportModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Sales Report</Text>
                            <TouchableOpacity onPress={() => setShowReportModal(false)}>
                                <Text style={styles.closeModalText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {generatingReport ? (
                            <ActivityIndicator size="large" color="#cc0000" style={styles.reportLoader} />
                        ) : reportData ? (
                            <ScrollView>
                                <View style={styles.reportSection}>
                                    <Text style={styles.reportSubtitle}>Revenue Summary</Text>
                                    <View style={styles.reportRow}>
                                        <Text style={styles.reportLabel}>Total Revenue:</Text>
                                        <Text style={styles.reportValue}>₦{reportData.total_revenue?.toLocaleString() || 0}</Text>
                                    </View>
                                    <View style={styles.reportRow}>
                                        <Text style={styles.reportLabel}>Total Orders:</Text>
                                        <Text style={styles.reportValue}>{reportData.total_orders || 0}</Text>
                                    </View>
                                    <View style={styles.reportRow}>
                                        <Text style={styles.reportLabel}>Completed:</Text>
                                        <Text style={styles.reportValue}>{reportData.completed_orders || 0}</Text>
                                    </View>
                                    <View style={styles.reportRow}>
                                        <Text style={styles.reportLabel}>Pending:</Text>
                                        <Text style={styles.reportValue}>{reportData.pending_orders || 0}</Text>
                                    </View>
                                </View>

                                <View style={styles.reportSection}>
                                    <Text style={styles.reportSubtitle}>Top Products</Text>
                                    {reportData.top_products?.map((product, idx) => (
                                        <View key={idx} style={styles.reportRow}>
                                            <Text style={styles.reportLabel}>{product.product_name}:</Text>
                                            <Text style={styles.reportValue}>
                                                {product.total_quantity} sold (₦{parseFloat(product.total_sales).toLocaleString()})
                                            </Text>
                                        </View>
                                    )) || <Text>No data</Text>}
                                </View>

                                <TouchableOpacity style={styles.shareButton} onPress={shareReport}>
                                    <Ionicons name="share-social" size={20} color="#fff" />
                                    <Text style={styles.shareButtonText}>Share Report</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        ) : null}
                    </View>
                </View>
            </Modal>

            {/* Product Modal */}
            <Modal
                visible={productModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setProductModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editingProduct ? 'Edit Product' : 'Add New Product'}
                        </Text>

                        <Text style={styles.inputLabel}>Product Name *</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Enter product name"
                            value={editingProduct ? editingProduct.name : newProduct.name}
                            onChangeText={(text) => {
                                if (editingProduct) {
                                    setEditingProduct({ ...editingProduct, name: text });
                                } else {
                                    setNewProduct({ ...newProduct, name: text });
                                }
                            }}
                        />

                        <Text style={styles.inputLabel}>Price (₦) *</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Enter price"
                            keyboardType="numeric"
                            value={editingProduct ? editingProduct.price?.toString() : newProduct.price}
                            onChangeText={(text) => {
                                if (editingProduct) {
                                    setEditingProduct({ ...editingProduct, price: text });
                                } else {
                                    setNewProduct({ ...newProduct, price: text });
                                }
                            }}
                        />

                        <Text style={styles.inputLabel}>Description</Text>
                        <TextInput
                            style={[styles.modalInput, styles.textArea]}
                            placeholder="Enter description (optional)"
                            multiline
                            numberOfLines={3}
                            value={editingProduct ? editingProduct.description : newProduct.description}
                            onChangeText={(text) => {
                                if (editingProduct) {
                                    setEditingProduct({ ...editingProduct, description: text });
                                } else {
                                    setNewProduct({ ...newProduct, description: text });
                                }
                            }}
                        />

                        <TouchableOpacity
                            style={styles.checkboxContainer}
                            onPress={() => {
                                if (editingProduct) {
                                    setEditingProduct({ ...editingProduct, has_custom_price: !editingProduct.has_custom_price });
                                } else {
                                    setNewProduct({ ...newProduct, has_custom_price: !newProduct.has_custom_price });
                                }
                            }}
                        >
                            <View style={[styles.checkbox, (editingProduct ? editingProduct.has_custom_price : newProduct.has_custom_price) && styles.checkboxChecked]}>
                                {(editingProduct ? editingProduct.has_custom_price : newProduct.has_custom_price) && (
                                    <Ionicons name="checkmark" size={16} color="#fff" />
                                )}
                            </View>
                            <Text style={styles.checkboxLabel}>Custom Price (Love Seed type)</Text>
                        </TouchableOpacity>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelModalButton} onPress={() => {
                                setProductModalVisible(false);
                                setEditingProduct(null);
                            }}>
                                <Text style={styles.cancelModalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveModalButton} onPress={editingProduct ? updateProduct : addProduct}>
                                <Text style={styles.saveModalButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
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
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#cc0000',
    },
    tabText: {
        fontSize: 12,
        color: '#666',
    },
    activeTabText: {
        color: '#cc0000',
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    loader: {
        marginTop: 40,
    },
    filterCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        elevation: 2,
    },
    filterTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    dateButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        alignItems: 'center',
    },
    dateButtonText: {
        fontSize: 12,
        color: '#333',
    },
    dateSeparator: {
        marginHorizontal: 10,
        color: '#666',
    },
    filterButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    applyFilterButton: {
        flex: 1,
        backgroundColor: '#cc0000',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    applyFilterButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    clearFilterButton: {
        flex: 1,
        backgroundColor: '#666',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    clearFilterButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    reportButton: {
        flexDirection: 'row',
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    reportButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    addButton: {
        backgroundColor: '#cc0000',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
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
    deliveryBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 12,
        alignSelf: 'flex-start',
    },
    deliveryBadgeText: {
        color: '#fff',
        fontSize: 11,
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
    productCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2,
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    productPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#cc0000',
        marginTop: 4,
    },
    productDesc: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    customBadge: {
        backgroundColor: '#fff0f0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 10,
        color: '#cc0000',
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    productActions: {
        flexDirection: 'row',
        gap: 12,
    },
    editProductButton: {
        padding: 8,
    },
    deleteProductButton: {
        padding: 8,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        padding: 40,
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
    reportModalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        width: '90%',
        maxHeight: '80%',
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
    confirmPaymentButton: {
        backgroundColor: '#4CAF50',
        margin: 16,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    confirmPaymentButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    confirmDeliveryButton: {
        backgroundColor: '#2196F3',
        margin: 16,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    confirmDeliveryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    reportSection: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    reportSubtitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#cc0000',
        marginBottom: 12,
    },
    reportRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    reportLabel: {
        fontSize: 13,
        color: '#666',
    },
    reportValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#333',
    },
    reportLoader: {
        padding: 40,
    },
    shareButton: {
        backgroundColor: '#25D366',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 16,
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    shareButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        marginBottom: 12,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#cc0000',
        borderRadius: 4,
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#cc0000',
    },
    checkboxLabel: {
        fontSize: 14,
        color: '#333',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    cancelModalButton: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelModalButtonText: {
        color: '#666',
        fontWeight: 'bold',
    },
    saveModalButton: {
        flex: 1,
        backgroundColor: '#cc0000',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveModalButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});