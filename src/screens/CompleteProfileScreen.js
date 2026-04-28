import React, { useState } from 'react';
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

export default function CompleteProfileScreen({ route, navigation }) {
    const { member } = route.params;
    const [profilePicture, setProfilePicture] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState(member?.phone_number || '');
    const [email, setEmail] = useState(member?.email || '');
    const [dateOfBirth, setDateOfBirth] = useState(member?.date_of_birth ? new Date(member.date_of_birth) : new Date(1990, 0, 1));
    const [dateJoined, setDateJoined] = useState(member?.date_joined ? new Date(member.date_joined) : new Date());
    const [showDatePicker, setShowDatePicker] = useState(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera roll permissions');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setProfilePicture(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera permissions');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setProfilePicture(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!profilePicture) {
            Alert.alert('Error', 'Please upload a profile picture');
            return;
        }
        if (!phoneNumber || phoneNumber.length !== 11) {
            Alert.alert('Error', 'Please enter a valid 11-digit phone number');
            return;
        }

        setLoading(true);

        const updatedMember = {
            ...member,
            profile_picture: profilePicture,
            phone_number: phoneNumber,
            email: email,
            date_of_birth: dateOfBirth.toISOString().split('T')[0],
            date_joined: dateJoined.toISOString().split('T')[0]
        };

        await AsyncStorage.setItem('@ftssu_member', JSON.stringify(updatedMember));

        Alert.alert('Success', 'Profile completed successfully!');
        navigation.replace('Main');
        setLoading(false);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Complete Your Profile</Text>
                <Text style={styles.headerSubtitle}>Welcome {member.first_name} {member.last_name}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Profile Picture *</Text>
                <View style={styles.photoContainer}>
                    {profilePicture ? (
                        <Image source={{ uri: profilePicture }} style={styles.profileImage} />
                    ) : (
                        <View style={styles.photoPlaceholder}>
                            <Text style={styles.photoPlaceholderText}>📸</Text>
                        </View>
                    )}
                    <View style={styles.photoButtons}>
                        <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                            <Text style={styles.photoButtonText}>Camera</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                            <Text style={styles.photoButtonText}>Gallery</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="08012345678"
                    keyboardType="phone-pad"
                    maxLength={11}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                />

                <Text style={styles.label}>Email (Optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="youremail@example.com"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                />

                <Text style={styles.label}>Date of Birth *</Text>
                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker('dob')}
                >
                    <Text style={styles.dateButtonText}>
                        {dateOfBirth.toLocaleDateString()}
                    </Text>
                </TouchableOpacity>

                <Text style={styles.label}>Date Joined Unit *</Text>
                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker('joined')}
                >
                    <Text style={styles.dateButtonText}>
                        {dateJoined.toLocaleDateString()}
                    </Text>
                </TouchableOpacity>

                {showDatePicker && (
                    <DateTimePicker
                        value={showDatePicker === 'dob' ? dateOfBirth : dateJoined}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(null);
                            if (selectedDate) {
                                if (showDatePicker === 'dob') {
                                    setDateOfBirth(selectedDate);
                                } else {
                                    setDateJoined(selectedDate);
                                }
                            }
                        }}
                    />
                )}

                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Save Profile</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#cc0000',
        padding: 20,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#ffcccc',
        marginTop: 4,
    },
    card: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 20,
        borderRadius: 12,
        elevation: 2,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    photoContainer: {
        alignItems: 'center',
        marginBottom: 8,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 12,
    },
    photoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    photoPlaceholderText: {
        fontSize: 40,
    },
    photoButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    photoButton: {
        backgroundColor: '#cc0000',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
        marginHorizontal: 4,
    },
    photoButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },
    dateButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff',
    },
    dateButtonText: {
        fontSize: 16,
        color: '#333',
    },
    submitButton: {
        backgroundColor: '#cc0000',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 16,
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});