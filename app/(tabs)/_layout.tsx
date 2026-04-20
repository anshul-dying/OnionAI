import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : 12;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.dark.tertiary,
        tabBarInactiveTintColor: '#909090',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1c1b1b',
          borderTopWidth: 0,
          height: 64 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 12,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontWeight: '500',
          fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif-medium',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name={focused ? 'chat' : 'chat-bubble-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="models"
        options={{
          title: 'Models',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name={focused ? 'layers' : 'layers'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name={focused ? 'history' : 'history'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name={focused ? 'settings' : 'settings'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Hide the default explore tab
        }}
      />
    </Tabs>
  );
}
