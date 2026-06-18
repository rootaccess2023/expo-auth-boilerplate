import { IconArrowLeft } from "@tabler/icons-react-native";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
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
import { ApplicationStatus, useCreateApplication } from "@/src/api/job-application";
import { color, Hamburg } from "@/assets/fonts/sharedStyles";

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "saved",        label: "Saved" },
  { value: "applied",      label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
];

export default function NewApplicationScreen() {
  const insets = useSafeAreaInsets();
  const { mutateAsync, isPending } = useCreateApplication();

  const [company, setCompany]   = useState("");
  const [role, setRole]         = useState("");
  const [status, setStatus]     = useState<ApplicationStatus>("saved");
  const [errors, setErrors]     = useState<{ company?: string; role?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!company.trim()) next.company = "Company name is required";
    if (!role.trim())    next.role    = "Role title is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      await mutateAsync({
        company_name: company.trim(),
        role_title:   role.trim(),
        status,
      });
      router.back();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
          <IconArrowLeft size={24} color="#FFFFFF" strokeWidth={1.75} />
        </Pressable>
        <Text style={styles.headerTitle}>New Application</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={styles.label}>Company</Text>
          <TextInput
            style={[styles.input, errors.company ? styles.inputError : null]}
            placeholder="e.g. Stripe"
            placeholderTextColor="#999"
            value={company}
            onChangeText={(t) => {
              setCompany(t);
              if (errors.company) setErrors((e) => ({ ...e, company: undefined }));
            }}
            autoCapitalize="words"
            returnKeyType="next"
          />
          {errors.company ? <Text style={styles.errorText}>{errors.company}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Role title</Text>
          <TextInput
            style={[styles.input, errors.role ? styles.inputError : null]}
            placeholder="e.g. Senior Product Designer"
            placeholderTextColor="#999"
            value={role}
            onChangeText={(t) => {
              setRole(t);
              if (errors.role) setErrors((e) => ({ ...e, role: undefined }));
            }}
            autoCapitalize="words"
            returnKeyType="done"
          />
          {errors.role ? <Text style={styles.errorText}>{errors.role}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.segmented}>
            {STATUS_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[
                  styles.segment,
                  status === opt.value && styles.segmentActive,
                ]}
                onPress={() => setStatus(opt.value)}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    status === opt.value && styles.segmentLabelActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          style={[styles.saveButton, isPending && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isPending}
        >
          <Text style={styles.saveButtonText}>
            {isPending ? "Saving…" : "Save"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    backgroundColor: color.PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontFamily: Hamburg.BOLD,
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  form: {
    padding: 20,
    gap: 24,
  },
  field: {
    gap: 8,
  },
  label: {
    fontFamily: Hamburg.MEDIUM,
    fontSize: 14,
    color: "#1a1a2e",
  },
  input: {
    height: 50,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
    paddingHorizontal: 16,
    fontFamily: Hamburg.REGULAR,
    fontSize: 15,
    color: "#1a1a2e",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 12,
    color: "#EF4444",
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: "#EFEFEF",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentLabel: {
    fontFamily: Hamburg.MEDIUM,
    fontSize: 13,
    color: "#888888",
  },
  segmentLabelActive: {
    color: color.PRIMARY,
  },
  saveButton: {
    height: 54,
    backgroundColor: color.PRIMARY,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: Hamburg.BOLD,
    fontSize: 16,
    color: "#FFFFFF",
  },
});
