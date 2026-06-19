import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { router, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useMe } from "@/src/api/auth";
import { UnauthorizedError } from "@/src/api/client";
import { hamburgFonts } from "@/assets/fonts/sharedStyles";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Any authenticated query (other than "me" itself) that gets a 401
      // means the token is gone — go straight to login.
      // The "me" query's 401 is handled by the AuthGate effect below.
      if (error instanceof UnauthorizedError && query.queryKey[0] !== "me") {
        router.replace("/(auth)/login");
      }
    },
  }),
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts(hamburgFonts);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <QueryClientProvider client={queryClient}>
          <AuthGate />
        </QueryClientProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

function AuthGate() {
  const { data: user, isLoading } = useMe();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    // Now we know auth state — safe to drop the splash screen
    SplashScreen.hideAsync();

    const inAuth = segments[0] === "(auth)";

    if (!user && !inAuth) {
      router.replace("/(auth)/login");
    } else if (user && inAuth) {
      router.replace("/(tabs)");
    }
  }, [isLoading, user, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
