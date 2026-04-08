import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { API_BASE_URL } from "../../constants/api";

type PetType = "dog" | "cat" | "rabbit" | "bird";
type PetGender = "male" | "female" | "";

//defining the fields of the sign-up form
type PetProfileForm = {
  name: string;
  breed: string;
  gender: PetGender;
  age: string;
  weight: string;
};

const isRecognizedPetType = (value: string): value is PetType => {
  return (
    value === "dog" || value === "cat" || value === "rabbit" || value === "bird"
  );
};

//normalize the input from route params and default to dog if needed
const normalizePetType = (value?: string): PetType => {
  const normalized = (value ?? "dog").toString().toLowerCase();
  return isRecognizedPetType(normalized) ? normalized : "dog";
};

const parsePositiveNumberParam = (value?: string) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const parseTrueFlag = (value?: string) => {
  return (value ?? "").toString() === "true";
};

//validates form inputs
const getPetProfileError = (
  form: PetProfileForm,
  ownerId: number | null,
): string => {
  if (!ownerId) return "Missing user account. Please sign up again.";
  if (!form.name.trim()) return "Please enter your pet’s name.";
  if (!form.breed.trim()) return "Please enter your pet’s breed.";
  if (!form.gender) return "Please choose your pet’s gender.";
  if (!form.age.trim()) return "Please enter your pet’s age.";
  if (!form.weight.trim()) return "Please enter your pet’s weight.";

  const ageValue = Number(form.age);
  if (!Number.isFinite(ageValue) || ageValue < 0) {
    return "Please enter a valid age.";
  }

  const weightValue = Number(form.weight);
  if (!Number.isFinite(weightValue) || weightValue < 0) {
    return "Please enter a valid weight.";
  }

  return "";
};

//send POST request to backend to create a pet profile
async function createPetProfile(
  ownerId: number,
  petType: PetType,
  form: PetProfileForm,
) {
  const payload = {
    type: petType,
    name: form.name.trim(),
    breed: form.breed.trim(),
    gender: form.gender,
    age: Number(form.age),
    weight: Number(form.weight),
  };

  const response = await fetch(`${API_BASE_URL}/api/pets?userId=${ownerId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Could not save pet. Try again.");
  }

  return response.json();
}

export default function PetSignupScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    pet?: string;
    userEmail?: string;
    userId?: string;
    fromAccount?: string;
  }>();

  const selectedPetType = useMemo(
    () => normalizePetType(params.pet),
    [params.pet],
  );
  const ownerId = useMemo(
    () => parsePositiveNumberParam(params.userId),
    [params.userId],
  );

  const ownerEmail = (params.userEmail ?? "").toString().trim();
  const openedFromAccount = useMemo(
    //check if screen was opened from the Account page
    () => parseTrueFlag(params.fromAccount),
    [params.fromAccount],
  );

  const [form, setForm] = useState<PetProfileForm>({
    name: "",
    breed: "",
    gender: "",
    age: "",
    weight: "",
  });
  const [screenError, setScreenError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  //checking if form is valid for submission
  const canSubmit =
    !!ownerId &&
    !!form.name.trim() &&
    !!form.breed.trim() &&
    !!form.gender &&
    !!form.age.trim() &&
    !!form.weight.trim() &&
    !isSaving;

  const updateFormField = (field: keyof PetProfileForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (screenError) {
      setScreenError("");
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const continueAfterSave = () => {
    setShowSuccessModal(false);

    if (openedFromAccount) {
      router.replace({
        pathname: "/account",
        params: {
          userId: String(ownerId),
          userEmail: ownerEmail,
        },
      });
      return;
    }

    router.replace({
      pathname: "/account",
      params: {
        pet: selectedPetType,
        petName: form.name.trim(),
        userId: String(ownerId),
        userEmail: ownerEmail,
      },
    });
  };

  const handleCreatePetProfile = async () => {
    Keyboard.dismiss();
    setScreenError("");

    const validationMessage = getPetProfileError(form, ownerId);
    if (validationMessage) {
      setScreenError(validationMessage);
      return;
    }

    try {
      setIsSaving(true);

      await createPetProfile(ownerId as number, selectedPetType, form);
      setShowSuccessModal(true);
    } catch (error: any) {
      setScreenError(
        error?.message || "Network error. Check Wi-Fi and try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {form.name.trim()
                ? `${form.name.trim()}’s officially registered within PawPal!`
                : "Officially registered within PawPal!"}
            </Text>

            <Text style={styles.modalBody}>
              {openedFromAccount
                ? "Your new pet has been added to your account."
                : "Lets now get to the paw-ttom of their health issue"}
            </Text>

            <Pressable
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={continueAfterSave}
            >
              <Text style={styles.modalButtonTextPrimary}>
                {openedFromAccount ? "Back to account" : "Let’s go →"}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={closeSuccessModal}
            >
              <Text style={styles.modalButtonTextSecondary}>Not yet</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <Text style={styles.title}>
          {openedFromAccount ? "ADD PET" : "SIGN-UP"}
        </Text>
        <Text style={styles.subtitle}>
          Create your {selectedPetType.toUpperCase()}'s profile
        </Text>
      </View>

      <View style={styles.card}>
        {!!screenError && <Text style={styles.errorText}>{screenError}</Text>}

        <ProfileField
          label="Name"
          value={form.name}
          onChangeText={(value) => updateFormField("name", value)}
          placeholder="e.g. Lilo"
        />

        <ProfileField
          label="Breed"
          value={form.breed}
          onChangeText={(value) => updateFormField("breed", value)}
          placeholder="e.g. Beagle"
        />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderRow}>
          <Pressable
            onPress={() => updateFormField("gender", "male")}
            style={[
              styles.genderButton,
              form.gender === "male" && styles.genderButtonSelected,
            ]}
          >
            <Text
              style={[
                styles.genderButtonText,
                form.gender === "male" && styles.genderButtonTextSelected,
              ]}
            >
              Male
            </Text>
          </Pressable>

          <Pressable
            onPress={() => updateFormField("gender", "female")}
            style={[
              styles.genderButton,
              form.gender === "female" && styles.genderButtonSelected,
            ]}
          >
            <Text
              style={[
                styles.genderButtonText,
                form.gender === "female" && styles.genderButtonTextSelected,
              ]}
            >
              Female
            </Text>
          </Pressable>
        </View>

        <ProfileField
          label="Age"
          value={form.age}
          onChangeText={(value) => updateFormField("age", value)}
          placeholder="e.g. 5"
          keyboardType="numeric"
        />

        <ProfileField
          label="Weight"
          value={form.weight}
          onChangeText={(value) => updateFormField("weight", value)}
          placeholder="e.g. 12"
          keyboardType="numeric"
        />

        <Pressable
          onPress={handleCreatePetProfile}
          disabled={!canSubmit}
          style={[
            styles.submitButton,
            !canSubmit && styles.submitButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.submitButtonText,
              !canSubmit && styles.submitButtonTextDisabled,
            ]}
          >
            {isSaving
              ? "Saving..."
              : openedFromAccount
                ? "Add Pet"
                : "Create Profile"}
          </Text>
        </Pressable>

        {!ownerId && (
          <Text style={styles.hintText}>
            Missing account ID. Please go back and reopen Add Pet from your
            account page.
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function ProfileField(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        style={styles.input}
        keyboardType={props.keyboardType ?? "default"}
        returnKeyType="done"
        blurOnSubmit
        onSubmitEditing={Keyboard.dismiss}
      />
    </>
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

  errorText: {
    backgroundColor: "rgba(255,255,255,0.35)",
    color: "#2b0f06",
    fontWeight: "900",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },

  hintText: {
    marginTop: 10,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "800",
    textAlign: "center",
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

  genderRow: {
    flexDirection: "row",
    gap: 10,
  },

  genderButton: {
    flex: 1,
    borderRadius: 5,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#593a21b3",
    backgroundColor: "rgba(255,255,255,0.9)",
  },

  genderButtonSelected: {
    backgroundColor: "#593a21ff",
    borderColor: "#593a21ff",
  },

  genderButtonText: {
    fontWeight: "900",
    color: "rgba(17,17,17,0.75)",
  },

  genderButtonTextSelected: {
    color: "#fff",
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.81)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#69B7FF",
    borderRadius: 7,
    padding: 18,
    top: 50,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: "#044a1cff",
    marginBottom: 10,
    textAlign: "center",
    lineHeight: 24,
  },

  modalBody: {
    fontSize: 13,
    fontWeight: "700",
    color: "#044a1cff",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 18,
  },

  modalButton: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  modalButtonPrimary: {
    backgroundColor: "#044a1cff",
  },

  modalButtonSecondary: {
    backgroundColor: "rgba(89,58,33,0.18)",
    borderWidth: 2,
    borderColor: "#044a1cff",
  },

  modalButtonTextPrimary: {
    color: "#69B7FF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  modalButtonTextSecondary: {
    color: "#044a1cff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
