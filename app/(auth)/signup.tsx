import { IconLock, IconMail } from "@tabler/icons-react-native";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSignup } from "@/src/api/auth";
import { color, Hamburg } from "@/assets/fonts/sharedStyles";

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const { mutateAsync, isPending } = useSignup();

  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError]                     = useState<string | null>(null);

  const handleSignup = async () => {
    setError(null);
    if (!email.trim() || !password || !passwordConfirm) {
      setError("All fields are required.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Passwords don't match.");
      return;
    }
    try {
      await mutateAsync({
        email:                 email.trim().toLowerCase(),
        password,
        password_confirmation: passwordConfirm,
      });
      // AuthGate detects the new user and replaces to /(tabs)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Branding */}
        <View style={[styles.hero, { paddingTop: insets.top + 48 }]}>
          <Text style={styles.appName}>NextRole</Text>
          <Text style={styles.tagline}>Your job search, organised.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Create account</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputWrap}>
            <IconMail size={18} color="#AAAAAA" strokeWidth={1.75} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#AAAAAA"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputWrap}>
            <IconLock size={18} color="#AAAAAA" strokeWidth={1.75} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#AAAAAA"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputWrap}>
            <IconLock size={18} color="#AAAAAA" strokeWidth={1.75} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor="#AAAAAA"
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignup}
            />
          </View>

          <Pressable
            style={[styles.button, isPending && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={isPending}
          >
            {isPending
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.buttonText}>Create account</Text>
            }
          </Pressable>

          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.switchText}>
              Already have an account?{" "}
              <Text style={styles.switchLink}>Sign in</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flexGrow: 1,
  },
  hero: {
    backgroundColor: color.PRIMARY,
    paddingHorizontal: 28,
    paddingBottom: 48,
    alignItems: "flex-start",
  },
  appName: {
    fontFamily: Hamburg.BOLD,
    fontSize: 36,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  tagline: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    marginTop: 6,
  },
  form: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 16,
  },
  formTitle: {
    fontFamily: Hamburg.BOLD,
    fontSize: 22,
    color: "#1a1a2e",
    marginBottom: 4,
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 14,
    color: "#DC2626",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
    paddingHorizontal: 14,
    gap: 10,
  },
  inputIcon: {
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontFamily: Hamburg.REGULAR,
    fontSize: 15,
    color: "#1a1a2e",
    paddingVertical: 0,
  },
  button: {
    height: 54,
    backgroundColor: color.PRIMARY,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: Hamburg.BOLD,
    fontSize: 16,
    color: "#FFFFFF",
  },
  switchText: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
  },
  switchLink: {
    fontFamily: Hamburg.MEDIUM,
    color: color.PRIMARY,
  },
});
