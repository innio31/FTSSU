import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
    Modal,
    TextInput,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LogBox } from 'react-native';

// Ignore nested VirtualizedList warning (it's safe because we control the layout)
LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

export default function AttendanceScreen({ route }) {
    const { member } = route.params || {};
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [activeServices, setActiveServices] = useState([]);
    const [membersList, setMembersList] = useState([]);
    const [commands, setCommands] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showManualModal, setShowManualModal] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedCommand, setSelectedCommand] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCommandPicker, setShowCommandPicker] = useState(false);
    const [recording, setRecording] = useState(false);

    const role = member?.role;
    const isSCIorSCII = role === 'Senior Commander I' || role === 'Senior Commander II';
    const isSecretary = role === 'Secretary';
    const isITAdmin = role === 'IT Admin';
    const isGolfSerial = role === 'Golf Serial';
    const isAdmin = role === 'Admin';
    const canTakeAttendance = isSCIorSCII || isSecretary || isITAdmin || isGolfSerial || isAdmin;
    const canSeeAllMembers = isITAdmin || isGolfSerial || isAdmin;

    useEffect(() => {
        loadAttendanceHistory();
        if (canTakeAttendance) {
            loadActiveServices();
            if (canSeeAllMembers) {
                loadAllCommands();
                loadMembersByCommand('All Commands');
            } else {
                loadMembersByCommand(member.command);
            }
        }
    }, []);

    const loadAttendanceHistory = async () => {
        setLoading(true);
        try {
            const response = await fetch(`https://impactdigitalacademy.com.ng/ftssu/api/get_attendance_history.php?member_id=${member.id}`);
            const data = await response.json();
            if (data.success) {
                setAttendanceHistory(data.attendance || []);
            }
        } catch (error) {
            console.error('Error loading attendance:', error);
        }
        setLoading(false);
    };

    const loadActiveServices = async () => {
        try {
            const response = await fetch(`https://impactdigitalacademy.com.ng/ftssu/api/get_active_services.php`);
            const data = await response.json();
            if (data.success) {
                setActiveServices(data.services || []);
            }
        } catch (error) {
            console.error('Error loading services:', error);
        }
    };

    const loadAllCommands = async () => {
        try {
            const response = await fetch(`https://impactdigitalacademy.com.ng/ftssu/api/get_all_commands.php`);
            const data = await response.json();
            if (data.success) {
                setCommands(['All Commands', ...(data.commands || [])]);
            }
        } catch (error) {
            console.error('Error loading commands:', error);
        }
    };

    const loadMembersByCommand = async (command) => {
        try {
            let url;
            if (command === 'All Commands') {
                url = `https://impactdigitalacademy.com.ng/ftssu/api/get_all_members.php`;
            } else {
                url = `https://impactdigitalacademy.com.ng/ftssu/api/get_members_by_command.php?command=${encodeURIComponent(command)}`;
            }

            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setMembersList(data.members || []);
            }
        } catch (error) {
            console.error('Error loading members:', error);
            Alert.alert('Error', 'Failed to load members');
        }
    };

    const handleCommandSelect = async (command) => {
        setSelectedCommand(command);
        setSelectedMember(null);
        setShowCommandPicker(false);
        await loadMembersByCommand(command);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAttendanceHistory();
        if (canTakeAttendance) {
            await loadActiveServices();
        }
        setRefreshing(false);
    };

    const takeManualAttendance = useCallback(async () => {
        console.log('=== RECORD ATTENDANCE BUTTON CLICKED ===');
        console.log('selectedService:', selectedService);
        console.log('selectedMember:', selectedMember);

        if (!selectedService) {
            Alert.alert('Error', 'Please select a service');
            return;
        }
        if (!selectedMember) {
            Alert.alert('Error', 'Please select a member');
            return;
        }

        if (recording) {
            console.log('Already recording, ignoring click');
            return;
        }

        setRecording(true);

        const payload = {
            member_id: selectedMember.id,
            service_id: selectedService.id,
            attendance_method: 'manual_entry',
            taken_by: member.id
        };

        console.log('Sending payload:', JSON.stringify(payload));

        try {
            const response = await fetch(`https://impactdigitalacademy.com.ng/ftssu/api/record_attendance.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload),
            });

            console.log('Response status:', response.status);
            const text = await response.text();
            console.log('Raw response:', text);

            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error('JSON parse error:', e);
                Alert.alert('Error', 'Server returned invalid response: ' + text.substring(0, 100));
                setRecording(false);
                return;
            }

            if (result.success) {
                Alert.alert('Success', `Attendance recorded for ${selectedMember.first_name} ${selectedMember.last_name}`);
                setShowManualModal(false);
                setSelectedService(null);
                setSelectedCommand(null);
                setSelectedMember(null);
                setSearchQuery('');
                setShowCommandPicker(false);
                await loadAttendanceHistory();
            } else {
                Alert.alert('Error', result.error || 'Failed to record attendance');
            }
        } catch (error) {
            console.error('Network error:', error);
            Alert.alert('Error', 'Network error: ' + error.message);
        } finally {
            setRecording(false);
        }
    }, [selectedService, selectedMember, member, recording]);

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

    const filteredMembers = membersList.filter(m =>
        m.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderHistoryItem = ({ item }) => (
        <View style={styles.historyCard}>
            <View style={styles.historyInfo}>
                <Text style={styles.historyService}>{item.service_name}</Text>
                <Text style={styles.historyDate}>
                    {formatDate(item.attendance_time)}
                </Text>
                <Text style={styles.historyMethod}>
                    Method: {item.attendance_method === 'self_scan' ? 'Self Check-in' : 'Manual Entry'}
                </Text>
            </View>
            <View style={styles.presentBadge}>
                <Text style={styles.presentText}>✓ Present</Text>
            </View>
        </View>
    );

    const renderServiceItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.serviceOption,
                selectedService?.id === item.id && styles.serviceOptionActive
            ]}
            onPress={() => {
                console.log('Service selected:', item);
                setSelectedService(item);
            }}
        >
            <Text style={[
                styles.serviceOptionText,
                selectedService?.id === item.id && styles.serviceOptionTextActive
            ]}>
                {item.service_name}
            </Text>
        </TouchableOpacity>
    );

    const renderMemberItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.memberOption,
                selectedMember?.id === item.id && styles.memberOptionActive
            ]}
            onPress={() => {
                console.log('Member selected:', item.first_name, item.last_name);
                setSelectedMember(item);
            }}
        >
            <View style={styles.memberInfo}>
                <Text style={[
                    styles.memberName,
                    selectedMember?.id === item.id && styles.memberNameActive
                ]}>
                    {item.first_name} {item.last_name}
                </Text>
                <Text style={styles.memberId}>ID: {item.id_number}</Text>
                <Text style={styles.memberCommandText}>{item.command}</Text>
            </View>
            {selectedMember?.id === item.id && (
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            )}
        </TouchableOpacity>
    );

    const isFormReady = selectedService && selectedMember && !recording;

    console.log('Form ready:', isFormReady, 'Service:', !!selectedService, 'Member:', !!selectedMember);

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#cc0000']} />
                }
            >
                {/* Manual Attendance Button */}
                {canTakeAttendance && (
                    <View style={styles.manualSection}>
                        <Text style={styles.sectionTitle}>📝 Take Attendance</Text>
                        <Text style={styles.manualInfo}>
                            {canSeeAllMembers
                                ? "Record attendance for any member in any command"
                                : `Record attendance for members in ${member?.command} command`}
                        </Text>
                        <TouchableOpacity
                            style={styles.manualButton}
                            onPress={() => {
                                console.log('Opening manual attendance modal');
                                setShowManualModal(true);
                            }}
                        >
                            <Ionicons name="people" size={24} color="#fff" />
                            <Text style={styles.manualButtonText}>Take Manual Attendance</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Active Services List */}
                {canTakeAttendance && activeServices.length > 0 && (
                    <View style={styles.servicesSection}>
                        <Text style={styles.sectionTitle}>📅 Active Services</Text>
                        {activeServices.map((service) => (
                            <View key={service.id} style={styles.serviceCard}>
                                <Text style={styles.serviceName}>{service.service_name}</Text>
                                <Text style={styles.serviceDate}>
                                    {service.service_date} at {service.start_time}
                                </Text>
                                <View style={[styles.statusBadge, styles.activeBadge]}>
                                    <Text style={styles.statusText}>Active</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Attendance History */}
                <View style={styles.historySection}>
                    <Text style={styles.sectionTitle}>📋 My Attendance History</Text>
                    {loading ? (
                        <ActivityIndicator size="large" color="#cc0000" style={styles.loader} />
                    ) : attendanceHistory.length > 0 ? (
                        <FlatList
                            data={attendanceHistory}
                            renderItem={renderHistoryItem}
                            keyExtractor={(item) => item.id.toString()}
                            scrollEnabled={false}
                            removeClippedSubviews={false}
                        />
                    ) : (
                        <Text style={styles.noHistoryText}>No attendance records found</Text>
                    )}
                </View>
            </ScrollView>

            {/* Manual Attendance Modal */}
            <Modal
                visible={showManualModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => {
                    setShowManualModal(false);
                    setSelectedService(null);
                    setSelectedCommand(null);
                    setSelectedMember(null);
                    setSearchQuery('');
                    setShowCommandPicker(false);
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Take Manual Attendance</Text>

                        {/* Selected Status Display */}
                        <View style={styles.selectedStatus}>
                            <Text style={styles.selectedStatusText}>
                                Selected: {selectedService ? '✓ Service' : '✗ Service'} | {selectedMember ? '✓ Member' : '✗ Member'}
                            </Text>
                        </View>

                        {/* Scrollable content area */}
                        <ScrollView
                            style={styles.modalScrollView}
                            showsVerticalScrollIndicator={true}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Select Service */}
                            <Text style={styles.inputLabel}>Select Service *</Text>
                            {activeServices.length === 0 ? (
                                <Text style={styles.noServicesText}>No active services available</Text>
                            ) : (
                                <FlatList
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    data={activeServices}
                                    renderItem={renderServiceItem}
                                    keyExtractor={(item) => item.id.toString()}
                                    style={styles.servicePicker}
                                    contentContainerStyle={styles.servicePickerContent}
                                    scrollEnabled={true}
                                    removeClippedSubviews={false}
                                />
                            )}

                            {/* Select Command - Only for IT Admin, Golf Serial, Admin */}
                            {canSeeAllMembers && (
                                <>
                                    <Text style={styles.inputLabel}>Select Command *</Text>
                                    <TouchableOpacity
                                        style={styles.commandDropdown}
                                        onPress={() => setShowCommandPicker(!showCommandPicker)}
                                    >
                                        <Text style={styles.commandDropdownText}>
                                            {selectedCommand || 'Select Command'}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color="#666" />
                                    </TouchableOpacity>

                                    {showCommandPicker && (
                                        <View style={styles.commandPickerContainer}>
                                            <FlatList
                                                data={commands}
                                                keyExtractor={(item) => item}
                                                renderItem={({ item }) => (
                                                    <TouchableOpacity
                                                        style={styles.commandItem}
                                                        onPress={() => handleCommandSelect(item)}
                                                    >
                                                        <Text style={styles.commandItemText}>{item}</Text>
                                                    </TouchableOpacity>
                                                )}
                                                removeClippedSubviews={false}
                                            />
                                        </View>
                                    )}
                                </>
                            )}

                            {/* Search Member */}
                            <Text style={styles.inputLabel}>Search Member</Text>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by name or ID..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />

                            {/* Members List */}
                            <Text style={styles.inputLabel}>Select Member *</Text>
                            <View style={styles.membersListContainer}>
                                <FlatList
                                    data={filteredMembers}
                                    keyExtractor={(item) => item.id.toString()}
                                    renderItem={renderMemberItem}
                                    style={styles.membersFlatList}
                                    showsVerticalScrollIndicator={true}
                                    removeClippedSubviews={false}
                                    ListEmptyComponent={() => (
                                        <Text style={styles.noMembersText}>
                                            {canSeeAllMembers && !selectedCommand
                                                ? 'Select a command to view members'
                                                : filteredMembers.length === 0 && searchQuery
                                                    ? 'No members match your search'
                                                    : 'No members available'}
                                        </Text>
                                    )}
                                />
                            </View>
                        </ScrollView>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelModalButton}
                                onPress={() => {
                                    setShowManualModal(false);
                                    setSelectedService(null);
                                    setSelectedCommand(null);
                                    setSelectedMember(null);
                                    setSearchQuery('');
                                    setShowCommandPicker(false);
                                }}
                            >
                                <Text style={styles.cancelModalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveModalButton, !isFormReady && styles.disabledButton]}
                                onPress={takeManualAttendance}
                                disabled={!isFormReady}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.saveModalButtonText}>
                                    {recording ? 'Recording...' : 'Record Attendance'}
                                </Text>
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
    scrollView: {
        flex: 1,
    },
    manualSection: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 20,
        borderRadius: 12,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    manualInfo: {
        fontSize: 13,
        color: '#666',
        marginBottom: 16,
    },
    manualButton: {
        backgroundColor: '#cc0000',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 8,
        gap: 8,
    },
    manualButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    servicesSection: {
        backgroundColor: '#fff',
        margin: 16,
        marginTop: 0,
        padding: 16,
        borderRadius: 12,
        elevation: 2,
    },
    serviceCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    serviceName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    serviceDate: {
        fontSize: 12,
        color: '#666',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    activeBadge: {
        backgroundColor: '#4CAF5020',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    historySection: {
        backgroundColor: '#fff',
        margin: 16,
        marginTop: 0,
        padding: 16,
        borderRadius: 12,
        elevation: 2,
        marginBottom: 30,
    },
    loader: {
        padding: 20,
    },
    historyCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    historyInfo: {
        flex: 1,
    },
    historyService: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    historyDate: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    historyMethod: {
        fontSize: 10,
        color: '#999',
        marginTop: 2,
    },
    presentBadge: {
        backgroundColor: '#4CAF5020',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    presentText: {
        color: '#4CAF50',
        fontSize: 12,
        fontWeight: 'bold',
    },
    noHistoryText: {
        textAlign: 'center',
        color: '#999',
        padding: 20,
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
        padding: 20,
        width: '90%',
        maxHeight: '85%',
    },
    modalScrollView: {
        maxHeight: '70%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#cc0000',
        textAlign: 'center',
        marginBottom: 20,
    },
    selectedStatus: {
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
    },
    selectedStatusText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 12,
    },
    servicePicker: {
        flexGrow: 0,
        marginBottom: 8,
    },
    servicePickerContent: {
        paddingVertical: 4,
    },
    serviceOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginRight: 8,
    },
    serviceOptionActive: {
        backgroundColor: '#cc0000',
    },
    serviceOptionText: {
        fontSize: 14,
        color: '#666',
    },
    serviceOptionTextActive: {
        color: '#fff',
    },
    commandDropdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    commandDropdownText: {
        fontSize: 14,
        color: '#333',
    },
    commandPickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        marginBottom: 12,
        maxHeight: 200,
    },
    commandItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    commandItemText: {
        fontSize: 14,
        color: '#333',
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        marginBottom: 12,
    },
    membersListContainer: {
        maxHeight: 250,
        marginBottom: 12,
    },
    membersFlatList: {
        flexGrow: 0,
    },
    memberOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    memberOptionActive: {
        backgroundColor: '#f0f0f0',
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    memberNameActive: {
        color: '#cc0000',
    },
    memberId: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    memberCommandText: {
        fontSize: 11,
        color: '#666',
        marginTop: 2,
    },
    noMembersText: {
        textAlign: 'center',
        color: '#999',
        padding: 20,
    },
    noServicesText: {
        textAlign: 'center',
        color: '#999',
        padding: 10,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
        marginBottom: 10,
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
    disabledButton: {
        backgroundColor: '#999',
        opacity: 0.6,
    },
    saveModalButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});