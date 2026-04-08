import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { API_BASE_URL } from "../../constants/api";

//defining the 4 valid pet types
type PetType = "dog" | "cat" | "rabbit" | "bird";

type SignupPayload = {
  email: string;
  password: string;
};

//type in which user response should be sent back from the backend after a successful signup
type SignupResponse = {
  id: number;
  email: string;
};

const isAllowedPetType = (value: string): value is PetType => {
  return (
    value === "dog" || value === "cat" || value === "rabbit" || value === "bird"
  );
};

//sets the default pet type to dog incase of invalid input
const normalizePetType = (value?: string): PetType => {
  const normalized = (value ?? "dog").toString().toLowerCase();
  return isAllowedPetType(normalized) ? normalized : "dog";
};

const isEmailFormatValid = (value: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
};

//validating if the form inputs are correct before sending them to the backend
const getSignupValidationMessage = (payload: SignupPayload) => {
  if (!payload.email.trim()) return "Kindly fill in your email address.";
  if (!isEmailFormatValid(payload.email))
    return "Kindly enter a valid email address.";
  if (payload.password.length < 6)
    return "A miniumum of 6 characters is required.";
  return "";
};

async function registerUser(payload: SignupPayload): Promise<SignupResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: payload.email.trim(),
      password: payload.password,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to Signup.");
  }

  return response.json();
}

export default function SignupPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ pet?: string }>();

  const chosenPet = useMemo(() => normalizePetType(params.pet), [params.pet]);

  const [credentials, setCredentials] = useState<SignupPayload>({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);

  const emailLooksValid = useMemo(
    () => isEmailFormatValid(credentials.email),
    [credentials.email],
  );

  //boolean to check if the 'Create Account' Button can be activated depending on specific conditions
  const canCreateAccount =
    emailLooksValid && credentials.password.length >= 6 && !creatingAccount;

  const updateCredential = (field: keyof SignupPayload, value: string) => {
    setCredentials((current) => ({
      ...current,
      [field]: value,
    }));

    if (errorMessage) {
      setErrorMessage("");
    }
  };

  //runs when the user submits the signup form by pressing the 'create account' button
  const handleSignupButton = async () => {
    Keyboard.dismiss();
    setErrorMessage("");

    const validationMessage = getSignupValidationMessage(credentials);
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    try {
      setCreatingAccount(true);
      const user = await registerUser(credentials);

      router.replace({
        pathname: "/(pet)/pet-signup",
        params: {
          pet: chosenPet,
          userId: String(user.id),
          userEmail: user.email,
        },
      });
    } catch (error: any) {
      const message =
        error?.message ||
        "Network error. Make sure your phone and laptop are on the same Wi-Fi.";

      setErrorMessage(message);
    } finally {
      setCreatingAccount(false);
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

        <Text style={styles.title}>SIGN UP</Text>
        <Text style={styles.subtitle}>create your account</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={credentials.email}
          onChangeText={(value) => updateCredential("email", value)}
          placeholder="e.g. leya@gmail.com"
          placeholderTextColor="rgba(255,231,164,0.7)"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
        />

        {!!credentials.email && !emailLooksValid && (
          <Text style={styles.helperText}>
            Kindly enter a valid email address.
          </Text>
        )}

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={credentials.password}
          onChangeText={(value) => updateCredential("password", value)}
          placeholder="at least 6 characters"
          placeholderTextColor="rgba(255,231,164,0.7)"
          style={styles.input}
          secureTextEntry
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={handleSignupButton}
        />

        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        <Pressable
          onPress={handleSignupButton}
          disabled={!canCreateAccount}
          style={[
            styles.submitButton,
            !canCreateAccount && styles.submitButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.submitButtonText,
              !canCreateAccount && styles.submitButtonTextDisabled,
            ]}
          >
            {creatingAccount ? "Creating..." : "Create Account"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/login")}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>
            Already have an account? Log in
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
