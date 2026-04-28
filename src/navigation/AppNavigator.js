import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import CartScreen from '../screens/CartScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import CompleteProfileScreen from '../screens/CompleteProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Products') {
                        iconName = focused ? 'storefront' : 'storefront-outline';
                    } else if (route.name === 'Cart') {
                        iconName = focused ? 'cart' : 'cart-outline';
                    } else if (route.name === 'Orders') {
                        iconName = focused ? 'list' : 'list-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#cc0000',
                tabBarInactiveTintColor: '#666',
                headerStyle: {
                    backgroundColor: '#cc0000',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            })}
        >
            <Tab.Screen name="Products" component={HomeScreen} />
            <Tab.Screen name="Cart" component={CartScreen} />
            <Tab.Screen name="Orders" component={OrdersScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

export default function AppNavigator({ isLoggedIn, onLogin, member }) {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!isLoggedIn ? (
                    <>
                        <Stack.Screen name="Login">
                            {(props) => <LoginScreen {...props} onLogin={onLogin} />}
                        </Stack.Screen>
                        <Stack.Screen name="CompleteProfile">
                            {(props) => <CompleteProfileScreen {...props} onLogin={onLogin} member={member} />}
                        </Stack.Screen>
                    </>
                ) : (
                    <Stack.Screen name="MainApp" component={MainTabs} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}