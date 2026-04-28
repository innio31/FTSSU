import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ route }) {
    const { member } = route.params || {};

    const features = [
        { icon: 'newspaper-outline', title: 'Announcements', color: '#cc0000', screen: 'Announcements' },
        { icon: 'cart-outline', title: 'Store', color: '#4CAF50', screen: 'Store' },
        { icon: 'calendar-outline', title: 'Attendance', color: '#2196F3', screen: 'Attendance' },
        { icon: 'list-outline', title: 'My Orders', color: '#FF9800', screen: 'Orders' },
    ];

    return (
        <ScrollView style={styles.container}>
            {/* Welcome Banner */}
            <View style={styles.welcomeBanner}>
                <Text style={styles.welcomeTitle}>Welcome,</Text>
                <Text style={styles.welcomeName}>
                    {member?.designation} {member?.first_name} {member?.last_name}
                </Text>
                <View style={styles.badgeContainer}>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{member?.role}</Text>
                    </View>
                    <Text style={styles.commandText}>{member?.command}</Text>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.featureGrid}>
                    {features.map((feature, index) => (
                        <TouchableOpacity key={index} style={styles.featureCard}>
                            <View style={[styles.iconCircle, { backgroundColor: feature.color + '15' }]}>
                                <Ionicons name={feature.icon} size={32} color={feature.color} />
                            </View>
                            <Text style={styles.featureTitle}>{feature.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Recent Activity */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <View style={styles.activityCard}>
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    <View style={styles.activityContent}>
                        <Text style={styles.activityText}>Check back for updates</Text>
                        <Text style={styles.activityDate}>Your activity will appear here</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    welcomeBanner: {
        backgroundColor: '#cc0000',
        padding: 24,
        paddingTop: 40,
        paddingBottom: 30,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    welcomeTitle: {
        fontSize: 14,
        color: '#ffcccc',
    },
    welcomeName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 4,
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 12,
    },
    roleBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    roleText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    commandText: {
        color: '#ffcccc',
        fontSize: 12,
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    featureGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    featureCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
        elevation: 2,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    activityCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        elevation: 2,
    },
    activityContent: {
        flex: 1,
    },
    activityText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    activityDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
});