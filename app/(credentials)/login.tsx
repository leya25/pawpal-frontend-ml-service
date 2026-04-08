import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView, //component to help adjust the form's position if the keyboard covers it
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { API_BASE_URL } from "../../constants/api";

//type in which user response should be sent back from the backend after a successful login
type LoginResponse = {
  id: number;
  email: string;
};

type LoginForm = {
  email: string;
  password: string;
};

const validateEmailAddress = (input: string) => {
  const trimmedValue = input.trim(); //removing unnecessary spaces from the input
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue);
};

//validating if the form inputs are correct before sending them to the backend
const buildLoginError = (form: LoginForm) => {
  if (!form.email.trim()) return "Kindly fill in your email address.";
  if (!validateEmailAddress(form.email))
    return "Kindly enter a valid email address.";
  if (form.password.length < 6)
    return "A miniumum of 6 characters is required.";
  return "";
};

//sending HTTP request to the backend login route
async function loginUser(form: LoginForm): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: form.email.trim(),
      password: form.password,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to login.");
  }

  return response.json();
}

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
  });
  const [invalidMessage, setInvalidMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailLooksValid = useMemo(
    () => validateEmailAddress(form.email),
    [form.email],
  );

  //boolean to check if Login Button can be activated depending on specific conditions
  const formCanSubmit =
    emailLooksValid && form.password.length >= 6 && !isSubmitting;

  //helper function to update the form
  const updateField = (field: keyof LoginForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (invalidMessage) {
      setInvalidMessage("");
    }
  };

  //runs when the user submits the login form by pressing the login button
  const handleLoginButton = async () => {
    Keyboard.dismiss();
    setInvalidMessage("");

    const validationMessage = buildLoginError(form);
    if (validationMessage) {
      setInvalidMessage(validationMessage);
      return;
    }

    try {
      setIsSubmitting(true);

      const user = await loginUser(form);
      router.replace({
        pathname: "/account", //if login is successful, directly takes user to the account page
        params: {
          userId: String(user.id),
          userEmail: user.email,
        },
      });
    } catch (error: any) {
      const message =
        error?.message ||
        "Network error. Make sure your phone and laptop are on the same Wi-Fi.";

      setInvalidMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <Text style={styles.title}>LOG IN</Text>
        <Text style={styles.subtitle}>welcome back to PawPal</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={form.email}
          onChangeText={(value) => updateField("email", value)}
          placeholder="e.g. example@gmail.com"
          placeholderTextColor="rgba(255,231,164,0.7)"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
        />

        {!!form.email && !emailLooksValid && (
          <Text style={styles.helperText}>
            Kindly enter a valid email address.
          </Text>
        )}

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={form.password}
          onChangeText={(value) => updateField("password", value)}
          placeholder="at least 6 characters"
          placeholderTextColor="rgba(255,231,164,0.7)"
          style={styles.input}
          secureTextEntry
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={handleLoginButton}
        />

        {!!invalidMessage && (
          <Text style={styles.errorText}>{invalidMessage}</Text>
        )}

        <Pressable
          onPress={handleLoginButton}
          disabled={!formCanSubmit}
          style={[
            styles.submitButton,
            !formCanSubmit && styles.submitButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.submitButtonText,
              !formCanSubmit && styles.submitButtonTextDisabled,
            ]}
          >
            {isSubmitting ? "Logging In..." : "Log In"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(pet)/choose-pet")}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>
            New here? Create an account
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7C948",
    paddingTop: 70,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 14,
  },
  backArrow: {
    color: "rgba(17,17,17,0.8)",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
    bottom: 30,
  },
  title: {
    bottom: 30,
    color: "#593a21ff",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  subtitle: {
    bottom: 25,
    color: "#593a21ff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  card: {
    bottom: 15,
    backgroundColor: "#593a21a0",
    borderRadius: 5,
    padding: 16,
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: "900",
    color: "#F7C948",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#ffe7a4b4",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 5,
    borderColor: "#593a21a0",
    fontWeight: "800",
    color: "#111",
  },
  helperText: {
    marginTop: 6,
    color: "#2b0f06",
    fontWeight: "800",
    fontSize: 12,
  },
  errorText: {
    marginTop: 10,
    color: "#2b0f06",
    fontWeight: "900",
    backgroundColor: "rgba(255,255,255,0.35)",
    padding: 10,
    borderRadius: 10,
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: "#593a21ff",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#5b422e99",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "900",
    letterSpacing: 1,
  },
  submitButtonTextDisabled: {
    color: "rgba(255,255,255,0.8)",
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#F7C948",
    fontWeight: "900",
    letterSpacing: 0.5,
    textDecorationLine: "underline",
  },
});
