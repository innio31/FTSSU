import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export default function LoginModal({ visible, onClose, onLoginSuccess }) {
    const [idNumber, setIdNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!idNumber || idNumber.trim() === '') {
            Alert.alert('Error', 'Please enter your ID Card Number');
            return;
        }
        if (!password || password.trim() === '') {
            Alert.alert('Error', 'Please enter your password');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${api.apiBaseUrl}/verify_member.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_number: idNumber.trim().toUpperCase(),
                    password: password.trim()
                }),
            });

            const data = await response.json();

            if (data.success && data.member) {
                const memberData = data.member;

                await AsyncStorage.setItem('@ftssu_member', JSON.stringify(memberData));
                await AsyncStorage.setItem('@ftssu_member_id', memberData.id.toString());
                await AsyncStorage.setItem('@ftssu_member_role', memberData.role);
                await AsyncStorage.setItem('@ftssu_member_command', memberData.command);
                await AsyncStorage.setItem('@ftssu_last_activity', Date.now().toString());

                onLoginSuccess(memberData);
            } else {
                Alert.alert('Login Failed', data.message || 'Invalid ID Number or Password');
            }
        } catch (error) {
            console.error('Login error:', error);
            Alert.alert('Error', 'Failed to verify. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoPlaceholder}>
                            <Text style={styles.logoText}>FTSSU</Text>
                        </View>
                        <Text style={styles.appName}>Faith Tabernacle Security Service Unit</Text>
                    </View>

                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Enter your credentials to continue</Text>

                    <Text style={styles.inputLabel}>ID Card Number</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., FTSSU001"
                        placeholderTextColor="#999"
                        value={idNumber}
                        onChangeText={setIdNumber}
                        autoCapitalize="characters"
                        autoCorrect={false}
                    />

                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Enter your password"
                            placeholderTextColor="#999"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Text style={styles.eyeButtonText}>
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>Login →</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onClose} style={styles.skipButton}>
                        <Text style={styles.skipButtonText}>Skip for now</Text>
                    </TouchableOpacity>

                    <Text style={styles.hintText}>
                        Default password is your last name (lowercase)
                    </Text>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '85%',
        maxWidth: 400,
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logoPlaceholder: {
        width: 80,
        height: 80,
        backgroundColor: '#cc0000',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    logoText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    appName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
        alignSelf: 'flex-start',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        width: '100%',
        marginBottom: 16,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        backgroundColor: '#fff',
        width: '100%',
        marginBottom: 16,
    },
    passwordInput: {
        flex: 1,
        padding: 12,
        fontSize: 16,
    },
    eyeButton: {
        padding: 12,
    },
    eyeButtonText: {
        fontSize: 18,
    },
    loginButton: {
        backgroundColor: '#cc0000',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
        marginBottom: 12,
    },
    loginButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    skipButton: {
        paddingVertical: 8,
    },
    skipButtonText: {
        color: '#999',
        fontSize: 12,
    },
    hintText: {
        fontSize: 10,
        color: '#999',
        marginTop: 12,
        textAlign: 'center',
    },
});