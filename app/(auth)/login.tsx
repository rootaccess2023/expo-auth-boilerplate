import { login } from "@/app/api/client";
import { useAuth } from "@/app/context/AuthContext";
import { Link, RelativePathString } from "expo-router";
import { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn } = useAuth();

  const handleLogin = async (): Promise<void> => {
    try {
      const data = await login(email, password);
      await signIn(data.token, data.user);
    } catch (e: unknown) {
      const message =
        typeof e === "object" && e !== null && "error" in e
          ? String((e as { error: unknown }).error)
          : "Unknown error";
      Alert.alert("Login failed", message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title="Login" onPress={handleLogin} />
      <Link href={"/signup" as RelativePathString} style={styles.link}>
        <Text>Don&apos;t have an account? Sign up</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 6 },
  link: { marginTop: 8, alignSelf: "center" },
});
