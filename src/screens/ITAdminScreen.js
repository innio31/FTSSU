import React, { useState, useEffect } from 'react';

import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';

export default function ITAdminScreen({ route }) {
    const { member } = route.params || {};
    const [activeTab, setActiveTab] = useState('members');
    const [members, setMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [services, setServices] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [serviceModalVisible, setServiceModalVisible] = useState(false);
    const [memberModalVisible, setMemberModalVisible] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCommand, setSelectedCommand] = useState('All');
    const [commands, setCommands] = useState(['All']);
    const [showCommandDropdown, setShowCommandDropdown] = useState(false);
    const [newService, setNewService] = useState({
        service_name: '',
        service_date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '11:00',
    });
    const [newMember, setNewMember] = useState({
        id_number: '',
        first_name: '',
        last_name: '',
        designation: 'Brother',
        command: '',
        role: 'Member',
        gender: 'Male',
        phone_number: '',
        email: '',
        date_of_birth: '',
        date_joined: new Date().toISOString().split('T')[0],
    });
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
    const [targetCommand, setTargetCommand] = useState('All');
    const [isPinned, setIsPinned] = useState(false);
    const [showTargetDropdown, setShowTargetDropdown] = useState(false);

    // List of all possible commands for dropdown
    const allCommands = [
        'UPPER ROOM', 'GOSHEN', 'YOUTH', 'OPERATION', 'HONOUR', 'G & G',
        'SPECIAL DUTY 1', 'SPECIAL DUTY 2', 'SPECIAL DUTY 3', 'SPECIAL DUTY 4', 'SPECIAL DUTY 5',
        'Command 1', 'Command 2', 'Command 3', 'Command 4', 'Command 5', 'Command 6', 'Command 7',
        'Command 8', 'Command 9', 'Command 10', 'Command 11', 'Command 12', 'Command 13', 'Command 14',
        'Command 15', 'Command 16', 'Command 17', 'Command 18', 'Command 19', 'Command 20', 'Command 21',
        'Command 22', 'VETERAN', 'KHMS', 'COVENANT DAY', 'RECRUITMENT & TRAINING', 'SID', 'PATROL',
        'IID', 'FORENSIC', 'FRENCH', 'VISION 1', 'VISION 2', 'VISION 3', 'SECURITY MEDICAL', 'SALES MONITORING'
    ];

    // Load data
    useEffect(() => {
        loadMembers();
        loadServices();
        loadAnnouncements();
    }, []);

    // Filter members when search or command changes
    useEffect(() => {
        filterMembers();
    }, [searchQuery, selectedCommand, members]);

    const loadMembers = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${api.apiBaseUrl}/get_members.php`);
            const data = await response.json();
            if (data.success) {
                setMembers(data.members);
                setFilteredMembers(data.members);
                // Extract unique commands for filter
                const uniqueCommands = ['All', ...new Set(data.members.map(m => m.command).filter(Boolean))];
                setCommands(uniqueCommands);
            }
        } catch (error) {
            console.error('Error loading members:', error);
            Alert.alert('Error', 'Failed to load members');
        }
        setLoading(false);
    };

    const loadServices = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${api.apiBaseUrl}/get_services.php`);
            const data = await response.json();
            if (data.success) {
                setServices(data.services);
            }
        } catch (error) {
            console.error('Error loading services:', error);
            Alert.alert('Error', 'Failed to load services');
        }
        setLoading(false);
    };

    const loadAnnouncements = async () => {
        try {
            const response = await fetch(`${api.apiBaseUrl}/get_announcements.php`);
            const data = await response.json();
            if (data.success && data.announcements) {
                setAnnouncements(data.announcements);
            }
        } catch (error) {
            console.error('Error loading announcements:', error);
        }
    };

    const filterMembers = () => {
        let filtered = [...members];

        // Filter by command
        if (selectedCommand !== 'All') {
            filtered = filtered.filter(m => m.command === selectedCommand);
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(m =>
                m.first_name?.toLowerCase().includes(query) ||
                m.last_name?.toLowerCase().includes(query) ||
                m.id_number?.toLowerCase().includes(query) ||
                m.phone_number?.includes(query)
            );
        }

        setFilteredMembers(filtered);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadMembers();
        await loadServices();
        await loadAnnouncements();
        setRefreshing(false);
    };

    const saveServices = async (updatedServices) => {
        try {
            await AsyncStorage.setItem('@ftssu_services', JSON.stringify(updatedServices));
            setServices(updatedServices);
        } catch (error) {
            console.error('Error saving services:', error);
        }
    };

    // Member CRUD Operations
    const addMember = async () => {
        if (!newMember.id_number || !newMember.first_name || !newMember.last_name || !newMember.command) {
            Alert.alert('Error', 'Please fill all required fields (ID Number, First Name, Last Name, Command)');
            return;
        }

        setLoading(true);
        try {
            console.log('Sending member data:', newMember);

            const response = await fetch(`${api.apiBaseUrl}/add_member.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMember),
            });

            const text = await response.text();
            console.log('Raw response:', text);

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('JSON parse error:', e);
                Alert.alert('Error', 'Server returned invalid response: ' + text.substring(0, 100));
                setLoading(false);
                return;
            }

            if (data.success) {
                Alert.alert('Success', 'Member added successfully');
                setMemberModalVisible(false);
                setNewMember({
                    id_number: '',
                    first_name: '',
                    last_name: '',
                    designation: 'Brother',
                    command: '',
                    role: 'Member',
                    gender: 'Male',
                    phone_number: '',
                    email: '',
                    date_of_birth: '',
                    date_joined: new Date().toISOString().split('T')[0],
                });
                loadMembers();
            } else {
                Alert.alert('Error', data.error || 'Failed to add member');
            }
        } catch (error) {
            console.error('Network error:', error);
            Alert.alert('Error', 'Network error: ' + error.message);
        }
        setLoading(false);
    };

    const updateMember = async () => {
        if (!selectedMember) {
            Alert.alert('Error', 'No member selected');
            return;
        }

        if (!selectedMember.id_number || !selectedMember.first_name || !selectedMember.last_name || !selectedMember.command) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${api.apiBaseUrl}/update_member.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedMember),
            });
            const data = await response.json();
            if (data.success) {
                Alert.alert('Success', 'Member updated successfully');
                setMemberModalVisible(false);
                setSelectedMember(null);
                loadMembers();
            } else {
                Alert.alert('Error', data.error || 'Failed to update member');
            }
        } catch (error) {
            Alert.alert('Error', 'Network error. Please check your connection.');
        }
        setLoading(false);
    };

    const deleteMember = (member) => {
        Alert.alert(
            'Delete Member',
            `Delete ${member.first_name} ${member.last_name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await fetch(`${api.apiBaseUrl}/delete_member.php`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: member.id }),
                            });
                            const data = await response.json();
                            if (data.success) {
                                Alert.alert('Success', 'Member deleted');
                                loadMembers();
                            } else {
                                Alert.alert('Error', data.error || 'Failed to delete member');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Network error. Please check your connection.');
                        }
                    }
                }
            ]
        );
    };

    // Service CRUD Operations
    const createService = () => {
        setNewService({
            service_name: '',
            service_date: new Date().toISOString().split('T')[0],
            start_time: '09:00',
            end_time: '11:00',
        });
        setServiceModalVisible(true);
    };

    const saveNewService = async () => {
        if (!newService.service_name) {
            Alert.alert('Error', 'Please enter service name');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${api.apiBaseUrl}/add_service.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_name: newService.service_name,
                    service_date: newService.service_date,
                    start_time: newService.start_time,
                    end_time: newService.end_time,
                    created_by: `${member?.first_name} ${member?.last_name}`
                }),
            });
            const data = await response.json();
            if (data.success) {
                Alert.alert('Success', 'Service created with QR code');
                setServiceModalVisible(false);
                loadServices(); // Refresh the list
                setNewService({
                    service_name: '',
                    service_date: new Date().toISOString().split('T')[0],
                    start_time: '09:00',
                    end_time: '11:00',
                });
            } else {
                Alert.alert('Error', data.error || 'Failed to create service');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to create service');
        }
        setLoading(false);
    };

    const toggleServiceStatus = (service) => {
        Alert.alert(
            service.is_active ? 'Close Service' : 'Reopen Service',
            `Are you sure you want to ${service.is_active ? 'close' : 'reopen'} "${service.service_name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const response = await fetch(`${api.apiBaseUrl}/update_service.php`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    id: service.id,
                                    service_name: service.service_name,
                                    service_date: service.service_date,
                                    start_time: service.start_time,
                                    end_time: service.end_time,
                                    is_active: service.is_active ? 0 : 1
                                }),
                            });
                            const data = await response.json();
                            if (data.success) {
                                loadServices();
                                Alert.alert('Success', `Service ${service.is_active ? 'closed' : 'reopened'}`);
                            } else {
                                Alert.alert('Error', data.error || 'Failed to update');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to update service');
                        }
                        setLoading(false);
                    }
                }
            ]
        );
    };

    const deleteService = (service) => {
        Alert.alert(
            'Delete Service',
            `Delete "${service.service_name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const response = await fetch(`${api.apiBaseUrl}/delete_service.php`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: service.id }),
                            });
                            const data = await response.json();
                            if (data.success) {
                                Alert.alert('Success', 'Service deleted');
                                loadServices();
                            } else {
                                Alert.alert('Error', data.error || 'Failed to delete');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete service');
                        }
                        setLoading(false);
                    }
                }
            ]
        );
    };

    const editService = (service) => {
        setSelectedService(service);
        setNewService({
            service_name: service.service_name,
            service_date: service.service_date,
            start_time: service.start_time,
            end_time: service.end_time,
        });
        setServiceModalVisible(true);
    };

    const updateService = async () => {
        if (!newService.service_name) {
            Alert.alert('Error', 'Please enter service name');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${api.apiBaseUrl}/update_service.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedService.id,
                    service_name: newService.service_name,
                    service_date: newService.service_date,
                    start_time: newService.start_time,
                    end_time: newService.end_time,
                    is_active: selectedService.is_active ? 1 : 0
                }),
            });
            const data = await response.json();
            if (data.success) {
                Alert.alert('Success', 'Service updated');
                setServiceModalVisible(false);
                setSelectedService(null);
                loadServices();
            } else {
                Alert.alert('Error', data.error || 'Failed to update service');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update service');
        }
        setLoading(false);
    };

    // Announcement CRUD Operations
    const postAnnouncement = async () => {
        if (!newAnnouncement.title || !newAnnouncement.content) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${api.apiBaseUrl}/add_announcement.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newAnnouncement.title,
                    content: newAnnouncement.content,
                    author: `${member?.first_name} ${member?.last_name}`,
                    author_role: member?.role,
                    target_command: targetCommand === 'All' ? null : targetCommand,
                    is_pinned: isPinned ? 1 : 0,
                }),
            });
            const data = await response.json();
            if (data.success) {
                Alert.alert('Success', 'Announcement posted');
                setNewAnnouncement({ title: '', content: '' });
                setTargetCommand('All');
                setIsPinned(false);
                loadAnnouncements();
            } else {
                Alert.alert('Error', data.error || 'Failed to post announcement');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to post announcement');
        }
        setLoading(false);
    };

    const deleteAnnouncement = async (announcement) => {
        Alert.alert(
            'Delete Announcement',
            `Delete "${announcement.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const response = await fetch(`${api.apiBaseUrl}/delete_announcement.php`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: announcement.id }),
                            });
                            const data = await response.json();
                            if (data.success) {
                                Alert.alert('Success', 'Announcement deleted');
                                loadAnnouncements();
                            } else {
                                Alert.alert('Error', data.error || 'Failed to delete');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete announcement');
                        }
                        setLoading(false);
                    }
                }
            ]
        );
    };

    const togglePinAnnouncement = async (announcement) => {
        setLoading(true);
        try {
            const response = await fetch(`${api.apiBaseUrl}/pin_announcement.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: announcement.id,
                    is_pinned: announcement.is_pinned ? 0 : 1
                }),
            });
            const data = await response.json();
            if (data.success) {
                loadAnnouncements();
            } else {
                Alert.alert('Error', data.error || 'Failed to update');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update announcement');
        }
        setLoading(false);
    };

    // Render Member Item
    const renderMemberItem = ({ item }) => (
        <View style={styles.memberCard}>
            <View style={styles.memberAvatar}>
                {item.profile_picture ? (
                    <Image
                        source={{ uri: item.profile_picture }}
                        style={styles.avatarImage}
                        onError={() => console.log('Failed to load image:', item.profile_picture)}
                    />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                            {item.first_name?.[0]}{item.last_name?.[0]}
                        </Text>
                    </View>
                )}
            </View>
            <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.first_name} {item.last_name}</Text>
                <Text style={styles.memberId}>ID: {item.id_number}</Text>
                <Text style={styles.memberRole}>Role: {item.role}</Text>
                <Text style={styles.memberCommand}>Command: {item.command}</Text>
                <Text style={styles.memberPhone}>📞 {item.phone_number || 'No phone'}</Text>
            </View>
            <View style={styles.memberActions}>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                        setSelectedMember(item);
                        setMemberModalVisible(true);
                    }}
                >
                    <Ionicons name="create-outline" size={20} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteMember(item)}
                >
                    <Ionicons name="trash-outline" size={20} color="#f44336" />
                </TouchableOpacity>
            </View>
        </View>
    );

    // Render Service Item
    const renderServiceItem = ({ item }) => (
        <View style={styles.serviceCard}>
            <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{item.service_name}</Text>
                <Text style={styles.serviceDate}>📅 Date: {item.service_date}</Text>
                <Text style={styles.serviceTime}>⏰ Time: {item.start_time} - {item.end_time}</Text>
                <View style={[styles.serviceStatus, item.is_active ? styles.activeStatus : styles.inactiveStatus]}>
                    <Text style={[styles.statusText, item.is_active ? styles.activeText : styles.inactiveText]}>
                        {item.is_active ? '● Active' : '○ Closed'}
                    </Text>
                </View>
            </View>
            <View style={styles.serviceActions}>
                {item.is_active && (
                    <TouchableOpacity style={styles.qrButton} onPress={() => {
                        setSelectedService(item);
                        setModalVisible(true);
                    }}>
                        <Ionicons name="qr-code-outline" size={24} color="#cc0000" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.editServiceButton} onPress={() => editService(item)}>
                    <Ionicons name="create-outline" size={20} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.toggleServiceButton} onPress={() => toggleServiceStatus(item)}>
                    <Text style={item.is_active ? styles.closeButtonText : styles.reopenButtonText}>
                        {item.is_active ? 'Close' : 'Reopen'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteServiceButton} onPress={() => deleteService(item)}>
                    <Ionicons name="trash-outline" size={20} color="#f44336" />
                </TouchableOpacity>
            </View>
        </View>
    );

    // Render Announcement Item
    const renderAnnouncementItem = ({ item }) => (
        <View style={[styles.announcementCard, item.is_pinned === 1 && styles.pinnedCard]}>
            <View style={styles.announcementHeader}>
                <Text style={styles.announcementTitle}>{item.title}</Text>
                <View style={styles.announcementActions}>
                    <TouchableOpacity onPress={() => togglePinAnnouncement(item)}>
                        <Ionicons
                            name={item.is_pinned === 1 ? "pin" : "pin-outline"}
                            size={20}
                            color="#FF9800"
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteAnnouncement(item)}>
                        <Ionicons name="trash-outline" size={20} color="#f44336" />
                    </TouchableOpacity>
                </View>
            </View>
            <Text style={styles.announcementContent}>{item.content}</Text>
            <Text style={styles.announcementTarget}>
                Target: {item.target_command || 'All Commands'}
            </Text>
            <View style={styles.announcementFooter}>
                <Text style={styles.announcementAuthor}>By: {item.author} ({item.author_role})</Text>
                <Text style={styles.announcementDate}>
                    {new Date(item.created_at).toLocaleDateString()}
                </Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Tab Bar */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'members' && styles.activeTab]}
                    onPress={() => setActiveTab('members')}
                >
                    <Ionicons name="people" size={20} color={activeTab === 'members' ? '#cc0000' : '#666'} />
                    <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>Members</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'services' && styles.activeTab]}
                    onPress={() => setActiveTab('services')}
                >
                    <Ionicons name="calendar" size={20} color={activeTab === 'services' ? '#cc0000' : '#666'} />
                    <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>Services</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'announcements' && styles.activeTab]}
                    onPress={() => setActiveTab('announcements')}
                >
                    <Ionicons name="megaphone" size={20} color={activeTab === 'announcements' ? '#cc0000' : '#666'} />
                    <Text style={[styles.tabText, activeTab === 'announcements' && styles.activeTabText]}>Announcements</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#cc0000']} />
                }
            >
                {activeTab === 'members' && (
                    <View>
                        {/* Search and Filter Bar */}
                        <View style={styles.searchBar}>
                            <Ionicons name="search" size={20} color="#999" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by name, ID, or phone..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery !== '' && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={20} color="#999" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
                            {commands.map((cmd) => (
                                <TouchableOpacity
                                    key={cmd}
                                    style={[styles.filterChip, selectedCommand === cmd && styles.filterChipActive]}
                                    onPress={() => setSelectedCommand(cmd)}
                                >
                                    <Text style={[styles.filterChipText, selectedCommand === cmd && styles.filterChipTextActive]}>
                                        {cmd}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity style={styles.addButton} onPress={() => {
                            setSelectedMember(null);
                            setNewMember({
                                id_number: '',
                                first_name: '',
                                last_name: '',
                                designation: 'Brother',
                                command: '',
                                role: 'Member',
                                gender: 'Male',
                                phone_number: '',
                                email: '',
                                date_of_birth: '',
                                date_joined: new Date().toISOString().split('T')[0],
                            });
                            setMemberModalVisible(true);
                        }}>
                            <Ionicons name="add-circle" size={24} color="#fff" />
                            <Text style={styles.addButtonText}>Add New Member</Text>
                        </TouchableOpacity>

                        {loading ? (
                            <ActivityIndicator size="large" color="#cc0000" style={styles.loader} />
                        ) : filteredMembers.length > 0 ? (
                            <FlatList
                                data={filteredMembers}
                                renderItem={renderMemberItem}
                                keyExtractor={(item) => item.id.toString()}
                                scrollEnabled={false}
                            />
                        ) : (
                            <Text style={styles.emptyText}>No members found</Text>
                        )}
                    </View>
                )}

                {activeTab === 'services' && (
                    <View>
                        <TouchableOpacity style={styles.addButton} onPress={createService}>
                            <Ionicons name="add-circle" size={24} color="#fff" />
                            <Text style={styles.addButtonText}>Create New Service</Text>
                        </TouchableOpacity>
                        <FlatList
                            data={services}
                            renderItem={renderServiceItem}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                        />
                    </View>
                )}

                {activeTab === 'announcements' && (
                    <View>
                        <View style={styles.announcementForm}>
                            <TextInput
                                style={styles.announcementInput}
                                placeholder="Announcement Title"
                                value={newAnnouncement.title}
                                onChangeText={(text) => setNewAnnouncement({ ...newAnnouncement, title: text })}
                            />
                            <TextInput
                                style={[styles.announcementInput, styles.announcementContentInput]}
                                placeholder="Announcement Content"
                                multiline
                                numberOfLines={4}
                                value={newAnnouncement.content}
                                onChangeText={(text) => setNewAnnouncement({ ...newAnnouncement, content: text })}
                            />

                            <Text style={styles.inputLabel}>Target Command</Text>
                            <TouchableOpacity
                                style={styles.dropdownButton}
                                onPress={() => setShowTargetDropdown(!showTargetDropdown)}
                            >
                                <Text style={styles.dropdownButtonText}>
                                    {targetCommand}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#666" />
                            </TouchableOpacity>

                            {showTargetDropdown && (
                                <View style={styles.dropdownList}>
                                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
                                        <TouchableOpacity
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setTargetCommand('All');
                                                setShowTargetDropdown(false);
                                            }}
                                        >
                                            <Text style={styles.dropdownItemText}>All Commands</Text>
                                        </TouchableOpacity>
                                        {allCommands.map((cmd) => (
                                            <TouchableOpacity
                                                key={cmd}
                                                style={styles.dropdownItem}
                                                onPress={() => {
                                                    setTargetCommand(cmd);
                                                    setShowTargetDropdown(false);
                                                }}
                                            >
                                                <Text style={styles.dropdownItemText}>{cmd}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            <View style={styles.pinCheckbox}>
                                <TouchableOpacity
                                    style={styles.checkbox}
                                    onPress={() => setIsPinned(!isPinned)}
                                >
                                    {isPinned && <Ionicons name="checkmark" size={16} color="#cc0000" />}
                                </TouchableOpacity>
                                <Text style={styles.checkboxLabel}>Pin this announcement (appears at top)</Text>
                            </View>

                            <TouchableOpacity style={styles.postButton} onPress={postAnnouncement}>
                                <Text style={styles.postButtonText}>Post Announcement</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.recentTitle}>Recent Announcements</Text>
                        <FlatList
                            data={announcements}
                            renderItem={renderAnnouncementItem}
                            keyExtractor={(item) => item.id.toString()}
                            scrollEnabled={false}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>No announcements yet</Text>
                            }
                        />
                    </View>
                )}
            </ScrollView>

            {/* QR Code Modal */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Service QR Code</Text>
                        {selectedService && (
                            <>
                                <Text style={styles.serviceNameModal}>{selectedService.service_name}</Text>
                                <View style={styles.qrContainer}>
                                    <QRCode
                                        value={JSON.stringify({
                                            service_id: selectedService.id,
                                            service_name: selectedService.service_name,
                                            service_date: selectedService.service_date,
                                        })}
                                        size={200}
                                        color="#cc0000"
                                        backgroundColor="white"
                                    />
                                </View>
                                <Text style={styles.qrInstructions}>
                                    Members can scan this QR code to mark attendance
                                </Text>
                                <TouchableOpacity style={styles.closeModalButton} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.closeModalButtonText}>Close</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Service Form Modal */}
            <Modal
                visible={serviceModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setServiceModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {selectedService ? 'Edit Service' : 'Create New Service'}
                        </Text>

                        <Text style={styles.inputLabel}>Service Name *</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="e.g., Sunday Service"
                            value={newService.service_name}
                            onChangeText={(text) => setNewService({ ...newService, service_name: text })}
                        />

                        <Text style={styles.inputLabel}>Date</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="YYYY-MM-DD"
                            value={newService.service_date}
                            onChangeText={(text) => setNewService({ ...newService, service_date: text })}
                        />

                        <Text style={styles.inputLabel}>Start Time</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="HH:MM (24hr format)"
                            value={newService.start_time}
                            onChangeText={(text) => setNewService({ ...newService, start_time: text })}
                        />

                        <Text style={styles.inputLabel}>End Time</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="HH:MM (24hr format)"
                            value={newService.end_time}
                            onChangeText={(text) => setNewService({ ...newService, end_time: text })}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelModalButton} onPress={() => {
                                setServiceModalVisible(false);
                                setSelectedService(null);
                            }}>
                                <Text style={styles.cancelModalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveModalButton} onPress={selectedService ? updateService : saveNewService}>
                                <Text style={styles.saveModalButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Member Form Modal */}
            <Modal
                visible={memberModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => {
                    setMemberModalVisible(false);
                    setSelectedMember(null);
                    setShowCommandDropdown(false);
                }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContentLarge}>
                        <ScrollView
                            showsVerticalScrollIndicator={true}
                            contentContainerStyle={styles.modalScrollContent}
                        >
                            <Text style={styles.modalTitle}>
                                {selectedMember ? 'Edit Member' : 'Add New Member'}
                            </Text>

                            <Text style={styles.inputLabel}>ID Number *</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="FTSSU001"
                                value={selectedMember ? selectedMember.id_number : newMember.id_number}
                                onChangeText={(text) => {
                                    if (selectedMember) {
                                        setSelectedMember({ ...selectedMember, id_number: text });
                                    } else {
                                        setNewMember({ ...newMember, id_number: text });
                                    }
                                }}
                            />

                            <Text style={styles.inputLabel}>First Name *</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="First name"
                                value={selectedMember ? selectedMember.first_name : newMember.first_name}
                                onChangeText={(text) => {
                                    if (selectedMember) {
                                        setSelectedMember({ ...selectedMember, first_name: text });
                                    } else {
                                        setNewMember({ ...newMember, first_name: text });
                                    }
                                }}
                            />

                            <Text style={styles.inputLabel}>Last Name *</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Last name"
                                value={selectedMember ? selectedMember.last_name : newMember.last_name}
                                onChangeText={(text) => {
                                    if (selectedMember) {
                                        setSelectedMember({ ...selectedMember, last_name: text });
                                    } else {
                                        setNewMember({ ...newMember, last_name: text });
                                    }
                                }}
                            />

                            <Text style={styles.inputLabel}>Designation</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                                {['Brother', 'Sister', 'Deacon', 'Deaconess', 'Pastor'].map((opt) => (
                                    <TouchableOpacity
                                        key={opt}
                                        style={[styles.pickerOption, (selectedMember ? selectedMember.designation : newMember.designation) === opt && styles.pickerOptionActive]}
                                        onPress={() => {
                                            if (selectedMember) {
                                                setSelectedMember({ ...selectedMember, designation: opt });
                                            } else {
                                                setNewMember({ ...newMember, designation: opt });
                                            }
                                        }}
                                    >
                                        <Text style={styles.pickerOptionText}>{opt}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.inputLabel}>Command *</Text>
                            <TouchableOpacity
                                style={styles.dropdownButton}
                                onPress={() => setShowCommandDropdown(!showCommandDropdown)}
                            >
                                <Text style={styles.dropdownButtonText}>
                                    {selectedMember ? selectedMember.command || 'Select Command' : newMember.command || 'Select Command'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#666" />
                            </TouchableOpacity>

                            {showCommandDropdown && (
                                <View style={styles.dropdownList}>
                                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
                                        {allCommands.map((cmd) => (
                                            <TouchableOpacity
                                                key={cmd}
                                                style={styles.dropdownItem}
                                                onPress={() => {
                                                    if (selectedMember) {
                                                        setSelectedMember({ ...selectedMember, command: cmd });
                                                    } else {
                                                        setNewMember({ ...newMember, command: cmd });
                                                    }
                                                    setShowCommandDropdown(false);
                                                }}
                                            >
                                                <Text style={styles.dropdownItemText}>{cmd}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            <Text style={styles.inputLabel}>Role</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                                {['Member', 'Secretary', 'Commander I', 'Commander II', 'Senior Commander I', 'Senior Commander II', 'IT Admin', 'Acct Admin', 'Admin', 'Golf Charlie', 'Alpha Golf Charlie', 'Golf Serial', 'Alpha Golf Serial'].map((opt) => (
                                    <TouchableOpacity
                                        key={opt}
                                        style={[styles.pickerOption, (selectedMember ? selectedMember.role : newMember.role) === opt && styles.pickerOptionActive]}
                                        onPress={() => {
                                            if (selectedMember) {
                                                setSelectedMember({ ...selectedMember, role: opt });
                                            } else {
                                                setNewMember({ ...newMember, role: opt });
                                            }
                                        }}
                                    >
                                        <Text style={styles.pickerOptionText}>{opt}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.inputLabel}>Gender</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                                {['Male', 'Female'].map((opt) => (
                                    <TouchableOpacity
                                        key={opt}
                                        style={[styles.pickerOption, (selectedMember ? selectedMember.gender : newMember.gender) === opt && styles.pickerOptionActive]}
                                        onPress={() => {
                                            if (selectedMember) {
                                                setSelectedMember({ ...selectedMember, gender: opt });
                                            } else {
                                                setNewMember({ ...newMember, gender: opt });
                                            }
                                        }}
                                    >
                                        <Text style={styles.pickerOptionText}>{opt}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.inputLabel}>Phone Number</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="08012345678"
                                keyboardType="phone-pad"
                                value={selectedMember ? selectedMember.phone_number : newMember.phone_number}
                                onChangeText={(text) => {
                                    if (selectedMember) {
                                        setSelectedMember({ ...selectedMember, phone_number: text });
                                    } else {
                                        setNewMember({ ...newMember, phone_number: text });
                                    }
                                }}
                            />

                            <Text style={styles.inputLabel}>Email</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="email@example.com"
                                keyboardType="email-address"
                                value={selectedMember ? selectedMember.email : newMember.email}
                                onChangeText={(text) => {
                                    if (selectedMember) {
                                        setSelectedMember({ ...selectedMember, email: text });
                                    } else {
                                        setNewMember({ ...newMember, email: text });
                                    }
                                }}
                            />

                            <Text style={styles.inputLabel}>Date of Birth</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="YYYY-MM-DD"
                                value={selectedMember ? selectedMember.date_of_birth : newMember.date_of_birth}
                                onChangeText={(text) => {
                                    if (selectedMember) {
                                        setSelectedMember({ ...selectedMember, date_of_birth: text });
                                    } else {
                                        setNewMember({ ...newMember, date_of_birth: text });
                                    }
                                }}
                            />

                            <Text style={styles.inputLabel}>Date Joined</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="YYYY-MM-DD"
                                value={selectedMember ? selectedMember.date_joined : newMember.date_joined}
                                onChangeText={(text) => {
                                    if (selectedMember) {
                                        setSelectedMember({ ...selectedMember, date_joined: text });
                                    } else {
                                        setNewMember({ ...newMember, date_joined: text });
                                    }
                                }}
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={styles.cancelModalButton} onPress={() => {
                                    setMemberModalVisible(false);
                                    setSelectedMember(null);
                                    setShowCommandDropdown(false);
                                }}>
                                    <Text style={styles.cancelModalButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveModalButton} onPress={selectedMember ? updateMember : addMember}>
                                    <Text style={styles.saveModalButtonText}>{selectedMember ? 'Update' : 'Add'}</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
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
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 8,
        fontSize: 14,
    },
    filterBar: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: '#cc0000',
    },
    filterChipText: {
        fontSize: 12,
        color: '#666',
    },
    filterChipTextActive: {
        color: '#fff',
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
    loader: {
        marginTop: 40,
    },
    memberCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        elevation: 2,
    },
    memberAvatar: {
        marginRight: 12,
    },
    avatarImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#cc0000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    memberId: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    memberRole: {
        fontSize: 12,
        color: '#cc0000',
        marginTop: 2,
    },
    memberCommand: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    memberPhone: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    memberActions: {
        justifyContent: 'center',
        gap: 12,
    },
    editButton: {
        padding: 8,
    },
    deleteButton: {
        padding: 8,
    },
    serviceCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
    },
    serviceInfo: {
        marginBottom: 12,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    serviceDate: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    serviceTime: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    serviceStatus: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    activeStatus: {
        backgroundColor: '#4CAF5020',
    },
    inactiveStatus: {
        backgroundColor: '#f4433620',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    activeText: {
        color: '#4CAF50',
    },
    inactiveText: {
        color: '#f44336',
    },
    serviceActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    qrButton: {
        padding: 4,
    },
    editServiceButton: {
        padding: 4,
    },
    toggleServiceButton: {
        padding: 4,
    },
    deleteServiceButton: {
        padding: 4,
    },
    closeButtonText: {
        color: '#f44336',
        fontSize: 12,
        fontWeight: 'bold',
    },
    reopenButtonText: {
        color: '#4CAF50',
        fontSize: 12,
        fontWeight: 'bold',
    },
    announcementForm: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    announcementInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontSize: 14,
    },
    announcementContentInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    pinCheckbox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#cc0000',
        borderRadius: 4,
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxLabel: {
        fontSize: 12,
        color: '#666',
    },
    postButton: {
        backgroundColor: '#cc0000',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    postButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    recentTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    announcementCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
    },
    pinnedCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#FF9800',
    },
    announcementHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    announcementTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    announcementActions: {
        flexDirection: 'row',
        gap: 12,
    },
    announcementContent: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        lineHeight: 20,
    },
    announcementTarget: {
        fontSize: 11,
        color: '#2196F3',
        marginBottom: 8,
    },
    announcementFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    announcementAuthor: {
        fontSize: 10,
        color: '#999',
    },
    announcementDate: {
        fontSize: 10,
        color: '#999',
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
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        width: '85%',
    },
    modalContentLarge: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '90%',
        maxHeight: '85%',
    },
    modalScrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#cc0000',
        marginBottom: 16,
        textAlign: 'center',
    },
    serviceNameModal: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    qrContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
    },
    qrInstructions: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    closeModalButton: {
        backgroundColor: '#cc0000',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
    },
    closeModalButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        width: '100%',
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
        alignSelf: 'flex-start',
    },
    pickerScroll: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    pickerOption: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginRight: 8,
        marginBottom: 8,
    },
    pickerOptionActive: {
        backgroundColor: '#cc0000',
    },
    pickerOptionText: {
        fontSize: 12,
        color: '#666',
    },
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    dropdownButtonText: {
        fontSize: 14,
        color: '#333',
    },
    dropdownList: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        marginBottom: 12,
        maxHeight: 200,
    },
    dropdownScroll: {
        maxHeight: 200,
    },
    dropdownItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    dropdownItemText: {
        fontSize: 14,
        color: '#333',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
        width: '100%',
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