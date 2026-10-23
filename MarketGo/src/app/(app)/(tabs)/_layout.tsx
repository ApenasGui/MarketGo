import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useCart } from '@/context/CartContext';
import { colors } from '@/theme';
import type { IconName } from '@/utils/icons';
function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return (
      <Ionicons
        name={name}
        size={size}
        color={typeof color === 'number' ? colors.primary : (color ?? undefined)}
      />
    );
  };
}
export default function TabsLayout() {
  const { count } = useCart();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Lojas', tabBarIcon: tabIcon('storefront') }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Carrinho',
          tabBarIcon: tabIcon('cart'),
          tabBarBadge: count > 0 ? count : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary },
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: 'Pedidos', tabBarIcon: tabIcon('receipt') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Perfil', tabBarIcon: tabIcon('person') }}
      />
    </Tabs>
  );
}
