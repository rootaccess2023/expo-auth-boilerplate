import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";

import { createJobApplication } from "@/lib/api/job-applications";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function AddModal() {
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [location, setLocation] = useState("");
  const [source, setSource] = useState("LinkedIn");
  const [stage, setStage] = useState("Prospect");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setJobTitle("");
    setCompany("");
    setJobUrl("");
    setLocation("");
    setSource("LinkedIn");
    setStage("Prospect");
    setNotes("");
  };

  const handleSave = async () => {
    if (!jobTitle.trim() || !company.trim()) {
      Alert.alert("Missing fields", "Job title and company are required.");
      return;
    }

    try {
      setLoading(true);

      await createJobApplication({
        company,
        job_title: jobTitle,
        job_url: jobUrl,
        location,
        source,
        stage,
        notes,
      });

      resetForm();
      router.back();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.form}>
        <Field label="Job Title">
          <TextInput
            value={jobTitle}
            onChangeText={setJobTitle}
            placeholder="Software Engineer"
            style={styles.input}
          />
        </Field>

        <Field label="Company">
          <TextInput
            value={company}
            onChangeText={setCompany}
            placeholder="Google"
            style={styles.input}
          />
        </Field>

        <Field label="Job URL">
          <TextInput
            value={jobUrl}
            onChangeText={setJobUrl}
            placeholder="https://..."
            autoCapitalize="none"
            keyboardType="url"
            style={styles.input}
          />
        </Field>

        <Field label="Location">
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Remote"
            style={styles.input}
          />
        </Field>

        <Field label="Source">
          <TextInput
            value={source}
            onChangeText={setSource}
            placeholder="LinkedIn"
            style={styles.input}
          />
        </Field>

        <Field label="Stage">
          <TextInput
            value={stage}
            onChangeText={setStage}
            placeholder="Prospect"
            style={styles.input}
          />
        </Field>

        <Field label="Notes">
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes here..."
            multiline
            textAlignVertical="top"
            style={[styles.input, styles.textArea]}
          />
        </Field>

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <ThemedText style={styles.buttonText}>Save</ThemedText>
          )}
        </Pressable>
      </ThemedView>
    </ScrollView>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <ThemedView style={styles.field}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    minHeight: 120,
  },
  button: {
    marginTop: 8,
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
