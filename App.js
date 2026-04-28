import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { CartProvider } from './src/context/CartContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRoleTabs } from './src/utils/rolePermissions';
import LoginModal from './src/screens/LoginModal';
import AnnouncementsScreen from './src/screens/AnnouncementsScreen';
import StoreScreen from './src/screens/StoreScreen';
import CartScreen from './src/screens/CartScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ITAdminScreen from './src/screens/ITAdminScreen';
import AcctAdminScreen from './src/screens/AcctAdminScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import AttendanceReportScreen from './src/screens/AttendanceReportScreen';

const Tab = createBottomTabNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#cc0000',
  },
};

// Create a context for logout
export const LogoutContext = React.createContext();

function MainTabs({ member }) {
  const role = member?.role || 'Member';
  const tabs = getRoleTabs(role);

  const screenComponents = {
    'Home': AnnouncementsScreen,
    'Store': StoreScreen,
    'Cart': CartScreen,
    'Orders': OrdersScreen,
    'Profile': ProfileScreen,
    'IT Admin': ITAdminScreen,
    'Acct Admin': AcctAdminScreen,
    'Attendance': AttendanceScreen,
    'Attendance Report': AttendanceReportScreen,
  };

  const getIconName = (screenName, focused) => {
    const icons = {
      'Home': focused ? 'home' : 'home-outline',
      'Store': focused ? 'storefront' : 'storefront-outline',
      'Cart': focused ? 'cart' : 'cart-outline',
      'Orders': focused ? 'list' : 'list-outline',
      'Profile': focused ? 'person' : 'person-outline',
      'IT Admin': focused ? 'construct' : 'construct-outline',
      'Acct Admin': focused ? 'calculator' : 'calculator-outline',
      'Attendance': focused ? 'calendar' : 'calendar-outline',
    };
    return icons[screenName] || 'apps';
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = getIconName(route.name, focused);
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
      {tabs.map((tabName) => (
        <Tab.Screen
          key={tabName}
          name={tabName}
          component={screenComponents[tabName]}
          initialParams={{ member }}
        />
      ))}
    </Tab.Navigator>
  );
}

export default function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const savedMember = await AsyncStorage.getItem('@ftssu_member');
      if (savedMember) {
        const memberData = JSON.parse(savedMember);
        setMember(memberData);
        setShowLogin(false);
      } else {
        setShowLogin(true);
      }
    } catch (error) {
      console.error('Error checking login:', error);
      setShowLogin(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (memberData) => {
    setMember(memberData);
    setShowLogin(false);
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove([
      '@ftssu_member',
      '@ftssu_member_id',
      '@ftssu_member_role',
      '@ftssu_member_command',
      '@ftssu_last_activity'
    ]);
    setMember(null);
    setShowLogin(true);
  };

  if (loading) {
    return null;
  }

  return (
    <PaperProvider theme={theme}>
      <CartProvider>
        <LogoutContext.Provider value={{ handleLogout }}>
          <NavigationContainer>
            {showLogin ? (
              <LoginModal
                visible={showLogin}
                onClose={() => setShowLogin(false)}
                onLoginSuccess={handleLoginSuccess}
              />
            ) : (
              <MainTabs member={member} />
            )}
          </NavigationContainer>
        </LogoutContext.Provider>
      </CartProvider>
    </PaperProvider>
  );
}