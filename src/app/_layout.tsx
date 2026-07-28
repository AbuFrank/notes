import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { VaultProvider } from '@/context/VaultContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <VaultProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerTitleStyle: { fontWeight: '600' } }}>
          <Stack.Screen name="index" options={{ title: 'Notes' }} />
          <Stack.Screen name="note/new" options={{ title: 'New Note' }} />
          <Stack.Screen name="note/[filename]" options={{ title: 'Note' }} />
          <Stack.Screen name="tags/index" options={{ title: 'Tags' }} />
          <Stack.Screen name="tags/[tag]" options={{ title: 'Tag' }} />
        </Stack>
      </VaultProvider>
    </GestureHandlerRootView>
  );
}
