import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OwnerDashboardScreen from '../screens/owner/OwnerDashboardScreen';
import MyPropertiesScreen from '../screens/owner/MyPropertiesScreen';
import EditPropertyScreen from '../screens/owner/EditPropertyScreen';
import PropertyCalendarScreen from '../screens/owner/PropertyCalendarScreen';
import OwnerStatsScreen from '../screens/owner/OwnerStatsScreen';
import { colors } from '@/utils/theme';

export type OwnerStackParamList = {
    OwnerDashboard: undefined;
    MyProperties: undefined;
    EditProperty: { propertyId?: string };
    PropertyCalendar: { propertyId: string };
    OwnerStats: undefined;
};

const Stack = createNativeStackNavigator<OwnerStackParamList>();

export function OwnerStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.primary,
                },
                headerTintColor: colors.primaryForeground,
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Stack.Screen
                name="OwnerDashboard"
                component={OwnerDashboardScreen}
                options={{ title: 'Painel do Proprietário' }}
            />
            <Stack.Screen
                name="MyProperties"
                component={MyPropertiesScreen}
                options={{ title: 'Meus Anúncios' }}
            />
            <Stack.Screen
                name="EditProperty"
                component={EditPropertyScreen}
                options={({ route }) => ({
                    title: route.params?.propertyId ? 'Editar Anúncio' : 'Novo Anúncio'
                })}
            />
            <Stack.Screen
                name="PropertyCalendar"
                component={PropertyCalendarScreen}
                options={{ title: 'Disponibilidade' }}
            />
            <Stack.Screen
                name="OwnerStats"
                component={OwnerStatsScreen}
                options={{ title: 'Estatísticas' }}
            />
        </Stack.Navigator>
    );
}
