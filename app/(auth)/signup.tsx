import { signup } from "@/lib/api/client";
import { useAuth } from "@/lib/context/AuthContext";
import { Link, RelativePathString } from "expo-router";
import { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const { signIn } = useAuth();

  const handleSignup = async (): Promise<void> => {
    try {
      const data = await signup(email, password, passwordConfirmation);
      await signIn(data.token, data.user);
    } catch (e: unknown) {
      const message =
        typeof e === "object" && e !== null && "error" in e
          ? String((e as { error: unknown }).error)
          : "Unknown error";
      Alert.alert("Signup failed", message);
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
      <TextInput
        placeholder="Confirm Password"
        value={passwordConfirmation}
        onChangeText={setPasswordConfirmation}
        secureTextEntry
        style={styles.input}
      />
      <Button title="Sign Up" onPress={handleSignup} />
      <Link href={"/login" as RelativePathString} style={styles.link}>
        <Text>Already have an account? Log in</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 6 },
  link: { marginTop: 8, alignSelf: "center" },
});
