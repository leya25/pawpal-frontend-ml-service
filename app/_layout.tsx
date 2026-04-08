import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(credentials)/login" />
        <Stack.Screen name="(credentials)/signup" />
        <Stack.Screen name="(pet)/pet-signup" />
        <Stack.Screen name="(pet)/choose-pet" />
        <Stack.Screen name="(scan)/scan-screen" />
        <Stack.Screen name="(scan)/scan-result" />
        <Stack.Screen name="(pet)/history" />
        <Stack.Screen name="(pet)/account" />
        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
            headerShown: true,
            title: "More Information",
          }}
        />
      </Stack>
    </>
  );
}
