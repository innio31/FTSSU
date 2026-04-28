import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './HomeScreen';
import CartScreen from './CartScreen';
import OrdersScreen from './OrdersScreen';
import ProfileScreen from './ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainApp() {
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