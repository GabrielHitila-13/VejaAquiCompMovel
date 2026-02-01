import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { AuthStack, AuthStackParamList } from './AuthStack';
import { BottomTabs, BottomTabsParamList } from './BottomTabs';
import { OwnerStack, OwnerStackParamList } from './OwnerStack';
import { AdminStack } from './AdminStack';

export type RootStackParamList = {
  Auth: undefined;
  MainApp: undefined;
  OwnerMode: undefined;
  AdminMode: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {user === null ? (
        <Stack.Screen
          name="Auth"
          component={AuthStack}
          options={{
            animationTypeForReplace: 'pop',
          }}
        />
      ) : (
        <>
          <Stack.Screen name="MainApp" component={BottomTabs} />
          <Stack.Screen name="OwnerMode" component={OwnerStack} />
          <Stack.Screen name="AdminMode" component={AdminStack} />
        </>
      )}
    </Stack.Navigator>
  );
}
