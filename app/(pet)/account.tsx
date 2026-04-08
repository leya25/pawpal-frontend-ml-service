import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { API_BASE_URL } from "../../constants/api";

//describes what each pet object should look like (with optional fields)
type PetRecord = {
  id: number;
  name?: string;
  age?: number;
  breed?: string;
  gender?: string;
  type?: string;
  weight?: number;
};

//formats the values in the pet record
const formatPetType = (value?: string) => {
  if (!value) return "Pet";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const formatPetGender = (value?: string) => {
  if (!value) return "Not provided";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const formatPetWeight = (value?: number) => {
  if (value === undefined || value === null) return "Not provided";
  return `${value} kg`;
};

const formatPetAge = (value?: number) => {
  if (value === undefined || value === null) return "Not provided";
  return `${value} years`;
};

//sending HTTP request to the backend
async function fetchPetsByEmail(email: string): Promise<PetRecord[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/pets/email/${encodeURIComponent(email)}`,
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Could not load pets.");
  }

  const result = await response.json();
  return Array.isArray(result) ? result : [];
}

export default function AccountPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    userEmail?: string;
    userId?: string;
  }>();

  //clean up user credentials
  const userEmail = useMemo(
    () => (params.userEmail ?? "").toString().trim(),
    [params.userEmail],
  );
  const userId = useMemo(
    () => (params.userId ?? "").toString().trim(),
    [params.userId],
  );

  const [petDetails, setPetDetails] = useState<PetRecord[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);

  useEffect(() => {
    const loadpetDetails = async () => {
      if (!userEmail) {
        console.log("No userEmail found");
        setLoadingPets(false);
        return;
      }

      try {
        const pets = await fetchPetsByEmail(userEmail);
        setPetDetails(pets);
      } catch (error) {
        console.log("PETS ERROR:", error);
        setPetDetails([]);
      } finally {
        setLoadingPets(false);
      }
    };

    loadpetDetails();
  }, [userEmail]);

  //when user presses the button to scan a pet
  const PetScanner = (pet: PetRecord) => {
    router.push({
      pathname: "/scan-screen",
      params: {
        userId: userId,
        userEmail: userEmail,
        petId: String(pet.id),
        petName: (pet.name ?? "").toString(),
        pet: (pet.type ?? "dog").toString().toLowerCase(),
      },
    });
  };

  //when user presses the button the check history
  const openHistoryScreen = () => {
    router.push({
      pathname: "/history",
      params: {
        userEmail: userEmail,
        userId: userId,
      },
    });
  };

  //whne user presses the button to add a pet to their account
  const openAddPetFlow = () => {
    router.push({
      pathname: "/choose-pet",
      params: {
        userId: userId,
        userEmail: userEmail,
        skipMemberModal: "true",
        fromAccount: "true",
      },
    });
  };

  //when user presses the button to logout
  const handleLogout = () => {
    router.replace("/signup");
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>

          <Text style={styles.title}>Account</Text>
          <Text style={styles.subtitle}>My Pets</Text>
        </View>

        {loadingPets ? (
          <Text style={styles.emptyText}>Loading pets...</Text>
        ) : petDetails.length === 0 ? (
          <Text style={styles.emptyText}>No pet details found yet.</Text>
        ) : (
          petDetails.map((pet, index) => (
            <View key={pet.id ?? index} style={styles.card}>
              <Text style={styles.petName}>
                {pet.name?.trim() ? pet.name : "Unnamed Pet"}
              </Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type</Text>
                <Text style={styles.detailValue}>
                  {formatPetType(pet.type)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Age</Text>
                <Text style={styles.detailValue}>{formatPetAge(pet.age)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Breed</Text>
                <Text style={styles.detailValue}>
                  {pet.breed?.trim() ? pet.breed : "Not provided"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Gender</Text>
                <Text style={styles.detailValue}>
                  {formatPetGender(pet.gender)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Weight</Text>
                <Text style={styles.detailValue}>
                  {formatPetWeight(pet.weight)}
                </Text>
              </View>

              <Pressable
                onPress={() => PetScanner(pet)}
                style={styles.scanButton}
              >
                <Text style={styles.scanButtonText}>Scan This Pet</Text>
              </Pressable>
            </View>
          ))
        )}

        <Pressable onPress={openHistoryScreen} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>View Health History</Text>
        </Pressable>

        <Pressable onPress={openAddPetFlow} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Add Pet</Text>
        </Pressable>

        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#69B7FF",
  },
  scrollContent: {
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  backArrow: {
    color: "#044a1c",
    fontSize: 18,
    fontWeight: "900",
    marginTop: -40,
  },
  title: {
    color: "#044a1c",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    color: "#044a1c",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 20,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  emptyText: {
    color: "#044a1c",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#044a1cd1",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  petName: {
    color: "#69B7FF",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 12,
    textTransform: "capitalize",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 12,
  },
  detailLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    opacity: 0.9,
  },
  detailValue: {
    color: "#69B7FF",
    fontSize: 13,
    fontWeight: "800",
    flexShrink: 1,
    textAlign: "right",
    textTransform: "capitalize",
  },
  scanButton: {
    marginTop: 14,
    backgroundColor: "#69B7FF",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  scanButtonText: {
    color: "#044a1c",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  primaryButton: {
    marginTop: 10,
    backgroundColor: "#044a1c",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#69B7FF",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  secondaryButton: {
    marginTop: 12,
    backgroundColor: "rgba(4,74,28,0.75)",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  logoutButton: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  logoutButtonText: {
    color: "#044a1c",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
