import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import type { DimensionValue } from "react-native";
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

const scaleW = (size: number) => (width / BASE_WIDTH) * size;
const scaleH = (size: number) => (height / BASE_HEIGHT) * size;
const scale = (size: number) => Math.min(scaleW(size), scaleH(size));

type PetType = "dog" | "cat" | "rabbit" | "bird";

type PetDetails = {
  type: PetType;
  title: string;
  imageSource: any;
  imageSize: {
    width: DimensionValue;
    height: number;
  };
  imageOffsetY?: number;
};

const PET_OPTIONS: PetDetails[] = [
  {
    type: "dog",
    title: "DOG",
    imageSource: require("../../assets/images/dog-choose.png"),
    imageSize: { width: "200%", height: scaleH(200) },
  },
  {
    type: "cat",
    title: "CAT",
    imageSource: require("../../assets/images/cat-choose.png"),
    imageSize: { width: "190%", height: scaleH(190) },
    imageOffsetY: scaleH(10),
  },
  {
    type: "rabbit",
    title: "RABBIT",
    imageSource: require("../../assets/images/rabbit-choose.png"),
    imageSize: { width: "60%", height: scaleH(180) },
  },
  {
    type: "bird",
    title: "BIRD",
    imageSource: require("../../assets/images/bird-choose.png"),
    imageSize: { width: "40%", height: scaleH(160) },
    imageOffsetY: scaleH(10),
  },
];

const parseBooleanParam = (value?: string) => {
  return (value ?? "").toString() === "true";
};

export default function ChoosePetPage() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    skipMemberModal?: string;
    fromAccount?: string;
    userId?: string;
    userEmail?: string;
  }>();

  const userID = (params.userId ?? "").toString().trim();
  const userEmail = (params.userEmail ?? "").toString().trim();

  const shouldSkipMemberPrompt = useMemo(
    () => parseBooleanParam(params.skipMemberModal),
    [params.skipMemberModal],
  );

  const cameFromAccount = useMemo(
    () => parseBooleanParam(params.fromAccount),
    [params.fromAccount],
  );

  const [activePetType, setActivePetType] = useState<PetType | null>(null);
  const [memberPromptVisible, setMemberPromptVisible] = useState(false);

  useEffect(() => {
    setMemberPromptVisible(!shouldSkipMemberPrompt);
  }, [shouldSkipMemberPrompt]);

  const openLoginScreen = () => {
    setMemberPromptVisible(false);
    router.push("/login");
  };

  const continueAsNewUser = () => {
    setMemberPromptVisible(false);
  };

  const handlePetSelection = (petType: PetType) => {
    setActivePetType(petType);

    if (cameFromAccount) {
      router.push({
        pathname: "/pet-signup",
        params: {
          pet: petType,
          userId: userID,
          userEmail: userEmail,
          fromAccount: "true",
        },
      });
      return;
    }

    router.push({
      pathname: "/signup",
      params: {
        pet: petType,
      },
    });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Modal
        visible={memberPromptVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Welcome back?</Text>
            <Text style={styles.modalText}>
              Do you already have a pet profile in the app?
            </Text>

            <Pressable
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={openLoginScreen}
            >
              <Text
                style={[styles.modalButtonText, styles.modalButtonTextPrimary]}
              >
                Yes! I have a profile
              </Text>
            </Pressable>

            <Pressable
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={continueAsNewUser}
            >
              <Text
                style={[
                  styles.modalButtonText,
                  styles.modalButtonTextSecondary,
                ]}
              >
                No, I’m new
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View pointerEvents="none" style={styles.backgroundDecor}>
        <View style={styles.mountainBack} />
        <View style={styles.mountainFront} />
      </View>

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <Text style={styles.title}>CHOOSE YOUR PET</Text>
        <Text style={styles.subtitle}>tap a pet to select</Text>
      </View>

      <View style={styles.petGrid}>
        {PET_OPTIONS.map((option) => {
          const isActive = activePetType === option.type;

          return (
            <Pressable
              key={option.type}
              onPress={() => handlePetSelection(option.type)}
              style={[styles.petCard, isActive && styles.petCardSelected]}
              hitSlop={12}
              disabled={memberPromptVisible}
            >
              <Image
                source={option.imageSource}
                resizeMode="contain"
                style={[
                  styles.petImage,
                  {
                    width: option.imageSize.width,
                    height: option.imageSize.height,
                    marginTop: option.imageOffsetY ?? 0,
                  },
                ]}
              />

              <Text
                style={[styles.petLabel, isActive && styles.petLabelSelected]}
              >
                {option.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={styles.selectionText}>
          {activePetType
            ? `Selected: ${activePetType.toUpperCase()}`
            : "Selected: —"}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#69B7FF",
  },

  backgroundDecor: {
    ...StyleSheet.absoluteFillObject,
  },

  mountainBack: {
    position: "absolute",
    left: scaleW(-40),
    right: scaleW(30),
    bottom: scaleH(-10),
    height: "60%",
    backgroundColor: "#43B56A",
    borderTopLeftRadius: scale(260),
    borderTopRightRadius: scale(260),
    transform: [{ rotate: "-2deg" }],
  },

  mountainFront: {
    position: "absolute",
    left: scaleW(80),
    right: scaleW(-60),
    bottom: scaleH(-60),
    height: "52%",
    backgroundColor: "#2F9E57",
    borderTopLeftRadius: scale(300),
    borderTopRightRadius: scale(300),
    transform: [{ rotate: "2deg" }],
  },

  header: {
    paddingTop: scaleH(28),
    paddingHorizontal: scaleW(24),
  },

  backArrow: {
    color: "rgba(17,17,17,0.8)",
    fontSize: scale(16),
    fontWeight: "700",
    marginTop: scaleH(-50),
  },

  title: {
    color: "#0e5a2aff",
    fontSize: scale(26),
    fontWeight: "900",
    letterSpacing: 2,
  },

  subtitle: {
    marginTop: scaleH(6),
    color: "#106830ff",
    fontSize: scale(12),
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  petGrid: {
    flex: 1,
    paddingHorizontal: scaleW(24),
    paddingTop: scaleH(-100),
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: scale(12),
  },

  petCard: {
    width: "48%",
    height: scaleH(220),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: scale(24),
  },

  petCardSelected: {
    borderWidth: 4,
    borderColor: "#0e5a2a",
    backgroundColor: "rgba(255,255,255,0.15)",
    height: scaleH(220),
  },

  petImage: {
    alignSelf: "center",
  },

  petLabel: {
    marginTop: scaleH(6),
    fontSize: scale(12),
    fontWeight: "900",
    letterSpacing: 1,
    color: "rgba(17,17,17,0.7)",
  },

  petLabelSelected: {
    color: "#0e5a2a",
  },

  footer: {
    paddingHorizontal: scaleW(24),
    paddingBottom: scaleH(20),
    alignItems: "center",
  },

  selectionText: {
    color: "#111",
    fontSize: scale(14),
    fontWeight: "900",
    letterSpacing: 1,
    backgroundColor: "rgba(255,255,255,0.35)",
    paddingHorizontal: scaleW(14),
    paddingVertical: scaleH(10),
    borderRadius: scale(18),
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.67)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scaleW(24),
  },

  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#F7C948",
    borderRadius: 5,
    padding: scale(18),
  },

  modalTitle: {
    fontSize: scale(18),
    fontWeight: "900",
    letterSpacing: 0.5,
    color: "#593a21ff",
    marginBottom: scaleH(8),
    textAlign: "center",
  },

  modalText: {
    fontSize: scale(13),
    fontWeight: "700",
    color: "rgba(17,17,17,0.75)",
    textAlign: "center",
    marginBottom: scaleH(14),
    lineHeight: scale(18),
  },

  modalButton: {
    borderRadius: scale(16),
    paddingVertical: scaleH(12),
    paddingHorizontal: scaleW(14),
    alignItems: "center",
    justifyContent: "center",
    marginTop: scaleH(10),
  },

  modalButtonPrimary: {
    backgroundColor: "#593a21ff",
  },

  modalButtonSecondary: {
    backgroundColor: "#593a2138",
    borderWidth: 2,
    borderColor: "#F7C948",
  },

  modalButtonText: {
    fontSize: scale(13),
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  modalButtonTextPrimary: {
    color: "#F7C948",
  },

  modalButtonTextSecondary: {
    color: "#593a21ff",
  },
});
