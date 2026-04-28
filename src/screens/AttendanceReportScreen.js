import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    FlatList,
    Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AttendanceReportScreen({ route }) {
    const { member } = route.params || {};
    const [attendance, setAttendance] = useState([]);
    const [filteredAttendance, setFilteredAttendance] = useState([]);
    const [commands, setCommands] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [selectedCommand, setSelectedCommand] = useState('All Commands');
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [showCommandPicker, setShowCommandPicker] = useState(false);

    const role = member?.role;
    const isITAdmin = role === 'IT Admin';
    const isGolfSerial = role === 'Golf Serial';
    const isAdmin = role === 'Admin';
    const isSecretary = role === 'Secretary';
    const canViewAll = isITAdmin || isGolfSerial || isAdmin;
    const canViewOwnCommand = isSecretary;

    useEffect(() => {
        loadCommands();
        loadAttendance();
    }, []);

    const loadCommands = async () => {
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

    const loadAttendance = async () => {
        setLoading(true);
        try {
            let url = `https://impactdigitalacademy.com.ng/ftssu/api/get_attendance_report.php`;

            // Add query parameters if filters are applied
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (selectedCommand !== 'All Commands') params.append('command', selectedCommand);
            if (!canViewAll && canViewOwnCommand) params.append('command', member.command);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setAttendance(data.attendance || []);
                setFilteredAttendance(data.attendance || []);
            }
        } catch (error) {
            console.error('Error loading attendance:', error);
            Alert.alert('Error', 'Failed to load attendance records');
        }
        setLoading(false);
    };

    const applyFilters = () => {
        setShowFilterModal(false);
        loadAttendance();
    };

    const clearFilters = () => {
        setStartDate(null);
        setEndDate(null);
        setSelectedCommand('All Commands');
        setShowFilterModal(false);
        loadAttendance();
    };

    const exportToCSV = async () => {
        if (filteredAttendance.length === 0) {
            Alert.alert('No Data', 'No attendance records to export');
            return;
        }

        // Create CSV content
        const headers = ['Date', 'Member Name', 'ID Number', 'Command', 'Service', 'Method', 'Time'];
        const rows = filteredAttendance.map(item => [
            item.service_date,
            `${item.first_name} ${item.last_name}`,
            item.id_number,
            item.command,
            item.service_name,
            item.attendance_method === 'self_scan' ? 'Self Check-in' : 'Manual Entry',
            new Date(item.attendance_time).toLocaleTimeString(),
        ]);

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');

        // Share the CSV file
        try {
            await Share.share({
                title: 'Attendance Report',
                message: csvContent,
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to share report');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-NG', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-NG', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderAttendanceItem = ({ item }) => (
        <View style={styles.attendanceCard}>
            <View style={styles.attendanceHeader}>
                <Text style={styles.memberName}>{item.first_name} {item.last_name}</Text>
                <Text style={styles.idNumber}>{item.id_number}</Text>
            </View>
            <View style={styles.attendanceDetails}>
                <Text style={styles.detailText}>📅 {formatDate(item.attendance_time)}</Text>
                <Text style={styles.detailText}>⏰ {formatTime(item.attendance_time)}</Text>
                <Text style={styles.detailText}>📋 {item.service_name}</Text>
                <Text style={styles.detailText}>🏢 {item.command}</Text>
                <Text style={styles.detailText}>
                    📝 Method: {item.attendance_method === 'self_scan' ? 'Self Check-in' : 'Manual Entry'}
                </Text>
            </View>
            <View style={styles.presentBadge}>
                <Text style={styles.presentText}>✓ Present</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header with Filter Button */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>📊 Attendance Report</Text>
                <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
                    <Ionicons name="filter" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Filter Summary */}
            {(startDate || endDate || selectedCommand !== 'All Commands') && (
                <View style={styles.filterSummary}>
                    <Text style={styles.filterSummaryText}>
                        Filters:
                        {startDate && ` From ${startDate}`}
                        {endDate && ` To ${endDate}`}
                        {selectedCommand !== 'All Commands' && ` Command: ${selectedCommand}`}
                    </Text>
                    <TouchableOpacity onPress={clearFilters}>
                        <Ionicons name="close-circle" size={20} color="#cc0000" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Export Button */}
            {filteredAttendance.length > 0 && (
                <TouchableOpacity style={styles.exportButton} onPress={exportToCSV}>
                    <Ionicons name="download-outline" size={20} color="#fff" />
                    <Text style={styles.exportButtonText}>Export to CSV</Text>
                </TouchableOpacity>
            )}

            {/* Attendance List */}
            <ScrollView style={styles.content}>
                {loading ? (
                    <ActivityIndicator size="large" color="#cc0000" style={styles.loader} />
                ) : filteredAttendance.length > 0 ? (
                    <FlatList
                        data={filteredAttendance}
                        renderItem={renderAttendanceItem}
                        keyExtractor={(item) => item.id.toString()}
                        scrollEnabled={false}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No attendance records found</Text>
                        <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
                    </View>
                )}
            </ScrollView>

            {/* Filter Modal */}
            <Modal
                visible={showFilterModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Filter Attendance</Text>

                        {/* Date Range */}
                        <Text style={styles.inputLabel}>Start Date</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
                            <Text style={styles.dateButtonText}>
                                {startDate || 'Select Start Date'}
                            </Text>
                        </TouchableOpacity>

                        <Text style={styles.inputLabel}>End Date</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
                            <Text style={styles.dateButtonText}>
                                {endDate || 'Select End Date'}
                            </Text>
                        </TouchableOpacity>

                        {/* Command Filter - Only for users who can view all */}
                        {(canViewAll || canViewOwnCommand) && (
                            <>
                                <Text style={styles.inputLabel}>Command</Text>
                                <TouchableOpacity
                                    style={styles.commandDropdown}
                                    onPress={() => setShowCommandPicker(!showCommandPicker)}
                                >
                                    <Text style={styles.commandDropdownText}>
                                        {selectedCommand}
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
                                                    onPress={() => {
                                                        setSelectedCommand(item);
                                                        setShowCommandPicker(false);
                                                    }}
                                                >
                                                    <Text style={styles.commandItemText}>{item}</Text>
                                                </TouchableOpacity>
                                            )}
                                        />
                                    </View>
                                )}
                            </>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                                <Text style={styles.clearButtonText}>Clear All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                                <Text style={styles.applyButtonText}>Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Date Pickers */}
            {showStartPicker && (
                <DateTimePicker
                    value={startDate ? new Date(startDate) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowStartPicker(false);
                        if (selectedDate) {
                            setStartDate(selectedDate.toISOString().split('T')[0]);
                        }
                    }}
                />
            )}

            {showEndPicker && (
                <DateTimePicker
                    value={endDate ? new Date(endDate) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowEndPicker(false);
                        if (selectedDate) {
                            setEndDate(selectedDate.toISOString().split('T')[0]);
                        }
                    }}
                />
            )}
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    filterButton: {
        padding: 8,
    },
    filterSummary: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 8,
        elevation: 2,
    },
    filterSummaryText: {
        fontSize: 12,
        color: '#666',
        flex: 1,
    },
    exportButton: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 16,
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    exportButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    loader: {
        marginTop: 40,
    },
    attendanceCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
    },
    attendanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    memberName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    idNumber: {
        fontSize: 12,
        color: '#666',
    },
    attendanceDetails: {
        gap: 4,
    },
    detailText: {
        fontSize: 13,
        color: '#555',
    },
    presentBadge: {
        backgroundColor: '#4CAF5020',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-end',
        marginTop: 8,
    },
    presentText: {
        color: '#4CAF50',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 12,
        color: '#999',
        marginTop: 8,
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
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#cc0000',
        textAlign: 'center',
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 12,
    },
    dateButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff',
        marginBottom: 12,
    },
    dateButtonText: {
        fontSize: 14,
        color: '#333',
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
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    clearButton: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    clearButtonText: {
        color: '#666',
        fontWeight: 'bold',
    },
    applyButton: {
        flex: 1,
        backgroundColor: '#cc0000',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    applyButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});