import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AnnouncementsScreen({ route }) {
    const { member } = route.params || {};
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${api.apiBaseUrl}/get_announcements.php`);
            const data = await response.json();
            if (data.success && data.announcements) {
                setAnnouncements(data.announcements);
            } else {
                // Fallback to local storage if API fails
                const saved = await AsyncStorage.getItem('@ftssu_announcements');
                if (saved) {
                    setAnnouncements(JSON.parse(saved));
                }
            }
        } catch (error) {
            console.error('Error loading announcements:', error);
            // Fallback to local storage
            const saved = await AsyncStorage.getItem('@ftssu_announcements');
            if (saved) {
                setAnnouncements(JSON.parse(saved));
            }
        }
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAnnouncements();
        setRefreshing(false);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Recently';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        return `${diffDays} days ago`;
    };

    const getRoleColor = (role) => {
        const colors = {
            'Admin': '#cc0000',
            'IT Admin': '#2196F3',
            'Acct Admin': '#4CAF50',
            'Senior Commander I': '#FF9800',
            'Senior Commander II': '#FF9800',
            'Commander I': '#9C27B0',
            'Commander II': '#9C27B0',
            'Secretary': '#00BCD4',
        };
        return colors[role] || '#666';
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#cc0000" />
                <Text style={styles.loadingText}>Loading announcements...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#cc0000']} />
            }
        >
            {/* Welcome Header */}
            {member && (
                <View style={styles.welcomeCard}>
                    <View style={styles.welcomeContent}>
                        <Text style={styles.welcomeText}>Welcome back,</Text>
                        <Text style={styles.userName}>
                            {member.designation} {member.first_name} {member.last_name}
                        </Text>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>{member.role}</Text>
                        </View>
                        <Text style={styles.commandText}>Command: {member.command}</Text>
                    </View>
                </View>
            )}

            {/* Announcements */}
            <View style={styles.announcementsHeader}>
                <Text style={styles.announcementsTitle}>📢 Announcements</Text>
                <Text style={styles.announcementsSubtitle}>Stay updated with the latest news</Text>
            </View>

            {announcements.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No announcements available</Text>
                </View>
            ) : (
                announcements.map((announcement) => (
                    <View key={announcement.id} style={[
                        styles.announcementCard,
                        announcement.is_pinned == 1 && styles.pinnedCard
                    ]}>
                        {announcement.is_pinned == 1 && (
                            <View style={styles.pinnedBadge}>
                                <Text style={styles.pinnedText}>📌 PINNED</Text>
                            </View>
                        )}
                        <Text style={styles.announcementTitle}>{announcement.title}</Text>
                        <Text style={styles.announcementContent}>{announcement.content}</Text>
                        <View style={styles.announcementFooter}>
                            <View style={[styles.authorBadge, { backgroundColor: getRoleColor(announcement.author_role) + '20' }]}>
                                <Text style={[styles.authorText, { color: getRoleColor(announcement.author_role) }]}>
                                    {announcement.author} ({announcement.author_role})
                                </Text>
                            </View>
                            <Text style={styles.dateText}>{formatDate(announcement.created_at)}</Text>
                        </View>
                    </View>
                ))
            )}


        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#999',
        fontSize: 14,
    },
    welcomeCard: {
        backgroundColor: '#cc0000',
        margin: 16,
        marginBottom: 8,
        padding: 20,
        borderRadius: 16,
        elevation: 3,
    },
    welcomeContent: {
        alignItems: 'center',
    },
    welcomeText: {
        fontSize: 14,
        color: '#ffcccc',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 4,

    },
    roleBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        marginTop: 8,
    },
    roleText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    commandText: {
        color: '#ffcccc',
        fontSize: 12,
        marginTop: 8,
    },
    announcementsHeader: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    announcementsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    announcementsSubtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    announcementCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 16,
        borderRadius: 12,
        elevation: 2,
    },
    pinnedCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#cc0000',
    },
    pinnedBadge: {
        marginBottom: 8,
    },
    pinnedText: {
        fontSize: 10,
        color: '#cc0000',
        fontWeight: 'bold',
    },
    announcementTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    announcementContent: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 12,
    },
    announcementFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    authorBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    authorText: {
        fontSize: 10,
        fontWeight: '600',
    },
    dateText: {
        fontSize: 10,
        color: '#999',
    },
    testLogoutButton: {
        backgroundColor: '#f44336',
        padding: 10,
        margin: 20,
        borderRadius: 8,
    },
    testLogoutButtonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
    },
});