import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import AlertsScreen from './screens/AlertsScreen';
import SettingsScreen from './screens/SettingsScreen';
import { AlertProvider } from './context/AlertContext';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <AlertProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: true,
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Alerts') {
                iconName = focused ? 'bell-ring' : 'bell-outline';
              } else if (route.name === 'Settings') {
                iconName = focused ? 'cog' : 'cog-outline';
              }

              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#667eea',
            tabBarInactiveTintColor: '#999',
            tabBarStyle: {
              backgroundColor: '#fff',
              borderTopColor: '#e0e0e0',
              paddingBottom: 5,
              paddingTop: 5
            },
            headerStyle: {
              backgroundColor: '#667eea'
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold'
            }
          })}
        >
          <Tab.Screen
            name="Alerts"
            component={AlertsScreen}
            options={{
              title: '📢 Alertas',
              tabBarLabel: 'Alertas'
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: '⚙️ Configurações',
              tabBarLabel: 'Configurações'
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </AlertProvider>
  );
}
