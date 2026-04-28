import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';

export default function StoreScreen() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [customAmount, setCustomAmount] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const { addToCart } = useCart();

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        const result = await api.getProducts();
        if (result.success) {
            setProducts(result.products);
        }
        setLoading(false);
    };

    const formatPrice = (price) => `₦${price.toLocaleString()}`;

    const handleAddToCart = () => {
        if (!selectedProduct) return;

        if (selectedProduct.has_custom_price) {
            const amount = parseInt(customAmount);
            if (!amount || amount <= 0) {
                Alert.alert('Error', 'Please enter a valid amount');
                return;
            }
            addToCart(selectedProduct, amount, amount);
            Alert.alert('Success', `Added ₦${amount.toLocaleString()} as ${selectedProduct.name}`);
        } else {
            addToCart(selectedProduct, quantity);
            Alert.alert('Success', `Added ${quantity} × ${selectedProduct.name}`);
        }

        setModalVisible(false);
        setQuantity(1);
        setCustomAmount('');
        setSelectedProduct(null);
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#cc0000" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>🛍️ ORDER FORM</Text>
                    <Text style={styles.headerSubtitle}>Select items to order</Text>
                </View>

                <View style={styles.productsGrid}>
                    {products.map((product) => (
                        <TouchableOpacity
                            key={product.id}
                            style={styles.productCard}
                            onPress={() => {
                                setSelectedProduct(product);
                                setModalVisible(true);
                            }}
                        >
                            <Text style={styles.productName}>{product.name}</Text>
                            {!product.has_custom_price ? (
                                <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
                            ) : (
                                <Text style={styles.customPriceBadge}>💝 Give what's in your heart</Text>
                            )}
                            <View style={styles.addButton}>
                                <Text style={styles.addButtonText}>Add to Cart +</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add to Cart</Text>
                        {selectedProduct && (
                            <>
                                <Text style={styles.modalProductName}>{selectedProduct.name}</Text>
                                {!selectedProduct.has_custom_price ? (
                                    <>
                                        <Text style={styles.modalPrice}>{formatPrice(selectedProduct.price)} each</Text>
                                        <View style={styles.quantityContainer}>
                                            <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.qtyButton}>
                                                <Text style={styles.qtyButtonText}>-</Text>
                                            </TouchableOpacity>
                                            <Text style={styles.quantityText}>{quantity}</Text>
                                            <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={styles.qtyButton}>
                                                <Text style={styles.qtyButtonText}>+</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={styles.totalText}>Total: {formatPrice(selectedProduct.price * quantity)}</Text>
                                    </>
                                ) : (
                                    <TextInput
                                        style={styles.customAmountInput}
                                        placeholder="Enter amount"
                                        keyboardType="numeric"
                                        value={customAmount}
                                        onChangeText={setCustomAmount}
                                    />
                                )}
                                <View style={styles.modalButtons}>
                                    <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.addButtonModal} onPress={handleAddToCart}>
                                        <Text style={styles.addButtonModalText}>Add to Cart</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { backgroundColor: '#cc0000', padding: 20, alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 12, color: '#ffcccc', marginTop: 4 },
    productsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, justifyContent: 'space-between' },
    productCard: { backgroundColor: '#fff', width: '48%', padding: 16, borderRadius: 12, marginBottom: 12, alignItems: 'center', elevation: 2 },
    productName: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
    productPrice: { fontSize: 16, fontWeight: 'bold', color: '#cc0000', marginVertical: 8 },
    customPriceBadge: { fontSize: 11, color: '#cc0000', marginVertical: 8, fontStyle: 'italic' },
    addButton: { backgroundColor: '#cc0000', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, width: '100%', alignItems: 'center' },
    addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '85%' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 16, color: '#cc0000' },
    modalProductName: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
    modalPrice: { fontSize: 16, color: '#cc0000', textAlign: 'center', marginBottom: 16 },
    quantityContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 16 },
    qtyButton: { width: 44, height: 44, backgroundColor: '#cc0000', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    qtyButtonText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    quantityText: { fontSize: 20, fontWeight: 'bold', marginHorizontal: 20, minWidth: 40, textAlign: 'center' },
    totalText: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#cc0000' },
    customAmountInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginVertical: 16 },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    cancelButton: { flex: 1, backgroundColor: '#f0f0f0', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    cancelButtonText: { color: '#666', fontWeight: 'bold' },
    addButtonModal: { flex: 1, backgroundColor: '#cc0000', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    addButtonModalText: { color: '#fff', fontWeight: 'bold' },
});