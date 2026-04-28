import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ route, navigation }) {
    const { member: propMember } = route.params || {};
    const [member, setMember] = useState(propMember);
    const [profilePicture, setProfilePicture] = useState(propMember?.profile_picture || null);
    const [phoneNumber, setPhoneNumber] = useState(propMember?.phone_number || '');
    const [email, setEmail] = useState(propMember?.email || '');
    const [dateOfBirth, setDateOfBirth] = useState(propMember?.date_of_birth ? new Date(propMember.date_of_birth) : null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showChangePassword, setShowChangePassword] = useState(false);

    useEffect(() => {
        loadMemberData();
    }, []);

    const loadMemberData = async () => {
        setLoading(true);
        try {
            const memberId = await AsyncStorage.getItem('@ftssu_member_id');
            if (memberId) {
                const response = await fetch(`https://impactdigitalacademy.com.ng/ftssu/api/get_member.php?id=${memberId}`);
                const data = await response.json();
                if (data.success) {
                    setMember(data.member);
                    setProfilePicture(data.member.profile_picture);
                    setPhoneNumber(data.member.phone_number || '');
                    setEmail(data.member.email || '');
                    setDateOfBirth(data.member.date_of_birth ? new Date(data.member.date_of_birth) : null);
                }
            }
        } catch (error) {
            console.error('Error loading member:', error);
        }
        setLoading(false);
    };

    const formatDate = (date) => {
        if (!date) return 'Not set';
        return new Date(date).toLocaleDateString('en-NG');
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permission needed', 'Please grant camera roll permissions in your device settings');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            const imageUri = result.assets[0].uri;
            setProfilePicture(imageUri);
            await uploadImage(imageUri);
        }
    };

    const takePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permission needed', 'Please grant camera permissions in your device settings');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            const imageUri = result.assets[0].uri;
            setProfilePicture(imageUri);
            await uploadImage(imageUri);
        }
    };

    const uploadImage = async (imageUri) => {
        setLoading(true);

        const formData = new FormData();

        // Get the filename from URI
        const filename = imageUri.split('/').pop();

        // Append the image file directly without compression
        formData.append('profile_picture', {
            uri: imageUri,
            type: 'image/jpeg',
            name: filename || 'profile.jpg',
        });

        formData.append('member_id', member.id.toString());
        formData.append('phone_number', phoneNumber);
        formData.append('email', email);
        if (dateOfBirth) {
            formData.append('date_of_birth', dateOfBirth.toISOString().split('T')[0]);
        }

        try {
            const response = await fetch('https://impactdigitalacademy.com.ng/ftssu/api/update_member.php', {
                method: 'POST',
                body: formData,
            });

            const text = await response.text();
            console.log('Raw response:', text);

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('JSON parse error:', e);
                Alert.alert('Error', 'Server returned: ' + text.substring(0, 100));
                setLoading(false);
                return;
            }

            if (data.success) {
                const updatedMember = { ...member, ...data.member };
                await AsyncStorage.setItem('@ftssu_member', JSON.stringify(updatedMember));
                setMember(updatedMember);
                setProfilePicture(data.member.profile_picture);
                Alert.alert('Success', 'Profile picture updated successfully');
            } else {
                Alert.alert('Error', data.error || 'Failed to update profile picture');
            }
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Error', 'Network error: ' + error.message);
        }
        setLoading(false);
    };

    const saveProfile = async () => {
        setLoading(true);

        const formData = new FormData();
        formData.append('member_id', member.id.toString());
        formData.append('phone_number', phoneNumber);
        formData.append('email', email);
        if (dateOfBirth) {
            formData.append('date_of_birth', dateOfBirth.toISOString().split('T')[0]);
        }

        try {
            const response = await fetch('https://impactdigitalacademy.com.ng/ftssu/api/update_member.php', {
                method: 'POST',
                body: formData,
            });

            const text = await response.text();
            console.log('Update response:', text);

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('JSON parse error:', e);
                Alert.alert('Error', 'Server returned: ' + text.substring(0, 100));
                setLoading(false);
                return;
            }

            if (data.success) {
                const updatedMember = { ...member, ...data.member };
                await AsyncStorage.setItem('@ftssu_member', JSON.stringify(updatedMember));
                setMember(updatedMember);
                Alert.alert('Success', 'Profile updated successfully');
                setEditing(false);
            } else {
                Alert.alert('Error', data.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Network error:', error);
            Alert.alert('Error', 'Network error: ' + error.message);
        }
        setLoading(false);
    };

    const changePassword = async () => {
        if (!newPassword || newPassword.length < 4) {
            Alert.alert('Error', 'Password must be at least 4 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('https://impactdigitalacademy.com.ng/ftssu/api/update_member.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: member.id,
                    password: newPassword
                }),
            });
            const data = await response.json();
            if (data.success) {
                Alert.alert('Success', 'Password changed successfully');
                setShowChangePassword(false);
                setNewPassword('');
                setConfirmPassword('');
            } else {
                Alert.alert('Error', data.error || 'Failed to change password');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to change password');
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.removeItem('@ftssu_member');
                        await AsyncStorage.removeItem('@ftssu_member_id');
                        await AsyncStorage.removeItem('@ftssu_member_role');
                        await AsyncStorage.removeItem('@ftssu_member_command');
                        await AsyncStorage.removeItem('@ftssu_last_activity');
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        });
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#cc0000" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.profileImageContainer}>
                    {profilePicture ? (
                        <Image source={{ uri: profilePicture }} style={styles.profileImage} />
                    ) : (
                        <View style={styles.profileImagePlaceholder}>
                            <Text style={styles.profileImageText}>
                                {member?.first_name?.[0]}{member?.last_name?.[0]}
                            </Text>
                        </View>
                    )}
                    <TouchableOpacity style={styles.editPhotoButton} onPress={() => {
                        Alert.alert('Update Photo', 'Choose option', [
                            { text: 'Take Photo', onPress: takePhoto },
                            { text: 'Choose from Gallery', onPress: pickImage },
                            { text: 'Cancel', style: 'cancel' }
                        ]);
                    }}>
                        <Ionicons name="camera" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.userName}>{member?.first_name} {member?.last_name}</Text>
                <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{member?.role}</Text>
                </View>
                <Text style={styles.idNumber}>ID: {member?.id_number}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Personal Information</Text>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Designation:</Text>
                    <Text style={styles.infoValue}>{member?.designation || 'Not set'}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Gender:</Text>
                    <Text style={styles.infoValue}>{member?.gender || 'Not set'}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Command:</Text>
                    <Text style={styles.infoValue}>{member?.command || 'Not set'}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Date of Birth:</Text>
                    {editing ? (
                        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                            <Text style={styles.editDateText}>
                                {dateOfBirth ? dateOfBirth.toLocaleDateString() : 'Select Date'}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={styles.infoValue}>{formatDate(member?.date_of_birth)}</Text>
                    )}
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Joined Unit:</Text>
                    <Text style={styles.infoValue}>{formatDate(member?.date_joined)}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact Information</Text>

                {editing ? (
                    <>
                        <Text style={styles.inputLabel}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="08012345678"
                            keyboardType="phone-pad"
                            maxLength={11}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                        />

                        <Text style={styles.inputLabel}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="youremail@example.com"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                        />

                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Phone Number:</Text>
                            <Text style={styles.infoValue}>{phoneNumber || 'Not set'}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Email:</Text>
                            <Text style={styles.infoValue}>{email || 'Not set'}</Text>
                        </View>

                        <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
                            <Ionicons name="create-outline" size={20} color="#cc0000" />
                            <Text style={styles.editButtonText}>Edit Contact Info</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Security</Text>

                {showChangePassword ? (
                    <>
                        <Text style={styles.inputLabel}>New Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="New password (min 4 characters)"
                            secureTextEntry
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />

                        <Text style={styles.inputLabel}>Confirm Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm new password"
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setShowChangePassword(false);
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={changePassword}>
                                <Text style={styles.saveButtonText}>Update Password</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setShowChangePassword(true)}
                    >
                        <Ionicons name="key-outline" size={20} color="#cc0000" />
                        <Text style={styles.editButtonText}>Change Password</Text>
                    </TouchableOpacity>
                )}
            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={dateOfBirth || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                            setDateOfBirth(selectedDate);
                            saveProfile();
                        }
                    }}
                />
            )}

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#fff" />
                <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.versionText}>FTSSU App v1.0.0</Text>
            </View>
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
    header: {
        backgroundColor: '#cc0000',
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    profileImageContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#fff',
    },
    profileImagePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    profileImageText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
    },
    editPhotoButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#cc0000',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    roleBadge: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 20,
        marginBottom: 8,
    },
    roleText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    idNumber: {
        color: '#ffcccc',
        fontSize: 14,
    },
    section: {
        backgroundColor: '#fff',
        margin: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    editDateText: {
        fontSize: 14,
        color: '#cc0000',
        fontWeight: '500',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        gap: 8,
    },
    editButtonText: {
        color: '#cc0000',
        fontSize: 14,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#cc0000',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: 'bold',
    },
    logoutButton: {
        backgroundColor: '#f44336',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 16,
        marginTop: 0,
        padding: 14,
        borderRadius: 12,
        gap: 8,
    },
    logoutButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    footer: {
        alignItems: 'center',
        padding: 20,
    },
    versionText: {
        fontSize: 12,
        color: '#999',
    },
});