import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';

export default function SplashScreen({ onFinish }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            if (onFinish) onFinish();
        }, 2000);
        return () => clearTimeout(timer);
    }, [onFinish]);

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <View style={styles.logoPlaceholder}>
                    <Text style={styles.logoText}>FTSSU</Text>
                </View>
                <Text style={styles.logoDescription}>
                    Faith Tabernacle Security Service Unit
                </Text>
            </View>
            <ActivityIndicator size="large" color="#cc0000" style={styles.loader} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoPlaceholder: {
        width: 120,
        height: 120,
        backgroundColor: '#cc0000',
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    logoText: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
    logoDescription: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 20,
    },
    loader: {
        marginTop: 20,
    },
});