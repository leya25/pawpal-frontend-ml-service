import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { API_BASE_URL, analyzeImage } from "../../constants/api";

type PetType = "dog" | "cat" | "rabbit" | "bird";
type ImageSourceMode = "gallery" | "camera"; //allows user to pick image from either gallery or camera only

//defines what each advice object may contain
type AdvicePayload = {
  summary?: string;
  urgency?: string;
  safeHomeCare?: string[];
  goToVetIf?: string[];
  historyId?: number | string;
};

//instructs to get the "image only" media type option from Expo Image Picker, while supporting different Expo versions
const IMAGE_MEDIA_TYPE: any =
  (ImagePicker as any).MediaType?.Images ??
  (ImagePicker as any).MediaTypeOptions?.Images;

const isValidPetType = (value: string): value is PetType => {
  return (
    value === "dog" || value === "cat" || value === "rabbit" || value === "bird"
  );
};

//cleans up the incoming pet value and sets 'dog' as the default value incase of an invalid pet type
const normalizePetType = (value?: string): PetType => {
  const normalized = (value ?? "dog").toString().toLowerCase();
  return isValidPetType(normalized) ? normalized : "dog";
};

//takes the user inputted image, resizes it and converts to JPEG
async function normalizeImageToJpeg(uri: string) {
  const processed = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    {
      compress: 0.8,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return processed.uri;
}

async function requestInitialAdvice(options: {
  label: string;
  userEmail: string;
  userId: string;
  petId: string;
  petName: string;
  petType: PetType;
}): Promise<AdvicePayload> {
  const url = `${API_BASE_URL}/api/advice`;

  console.log("=== ADVICE REQUEST START ===");
  console.log("Advice URL:", url);
  console.log("Advice payload:", {
    label: options.label,
    userEmail: options.userEmail,
    userId: options.userId,
    petId: options.petId,
    petName: options.petName,
    petType: options.petType,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      label: options.label,
      userEmail: options.userEmail,
      userId: options.userId,
      petId: options.petId,
      petName: options.petName,
      petType: options.petType,
    }),
  });

  console.log("Advice response status:", response.status);
  console.log("Advice response ok?:", response.ok);

  const responseText = await response.text();
  console.log("Advice raw response:", responseText);

  try {
    const parsed = JSON.parse(responseText);
    console.log("Advice parsed response:", parsed);
    console.log("=== ADVICE REQUEST END ===");
    return parsed;
  } catch {
    console.log("Advice response was not valid JSON");
    throw new Error(
      `Advice API did not return JSON. Status=${response.status}. Body=${responseText.slice(0, 200)}`,
    );
  }
}

export default function ScanScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    pet?: string;
    petId?: string;
    petName?: string;
    userId?: string;
    userEmail?: string;
  }>();

  const petType = useMemo(() => normalizePetType(params.pet), [params.pet]);

  //cleaning up route params
  const petId = (params.petId ?? "").toString().trim();
  const petName = (params.petName ?? "").toString().trim();
  const userId = (params.userId ?? "").toString().trim();
  const userEmail = (params.userEmail ?? "").toString().trim();

  const screenTitle = petName || petType.toUpperCase();

  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);
  const [imageSourceMode, setImageSourceMode] =
    useState<ImageSourceMode>("gallery");
  const [isSubmittingScan, setIsSubmittingScan] = useState(false);

  //if this is called, the selected photo is cleared, and UI shows instruction to take an image again
  const resetSelectedPhoto = () => {
    setSelectedPhotoUri(null);
  };

  //called if user decides to choose a photo from their gallery
  const choosePhotoFromLibrary = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        alert("Please allow photo access");
        return;
      }

      const selection = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: IMAGE_MEDIA_TYPE,
        quality: 1,
      });

      if (selection.canceled) return;

      const jpegUri = await normalizeImageToJpeg(selection.assets[0].uri);

      setImageSourceMode("gallery");
      setSelectedPhotoUri(jpegUri);
    } catch (error: any) {
      console.log("PICK ERROR:", error?.message ?? error);
      alert(`Pick failed: ${error?.message ?? error}`);
    }
  };

  //called if user chooses to click an image from the device camera
  const capturePhotoWithCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        alert("Please allow camera access");
        return;
      }

      const capture = await ImagePicker.launchCameraAsync({
        quality: 1,
      });

      if (capture.canceled) return;

      const jpegUri = await normalizeImageToJpeg(capture.assets[0].uri);

      setImageSourceMode("camera");
      setSelectedPhotoUri(jpegUri);
    } catch (error: any) {
      console.log("CAMERA ERROR:", error?.message ?? error);
      alert(`Camera failed: ${error?.message ?? error}`);
    }
  };

  //runs when the user presses the scan button
  const handleScanPress = async () => {
    try {
      console.log("=== SCAN START ===");
      console.log("API_BASE_URL:", API_BASE_URL);
      console.log("selectedPhotoUri:", selectedPhotoUri);
      console.log("userEmail:", userEmail);
      console.log("userId:", userId);
      console.log("petId:", petId);
      console.log("petName:", petName);
      console.log("petType:", petType);

      if (!selectedPhotoUri) {
        alert("Pick or take a photo first");
        return;
      }

      if (!userEmail) {
        alert("No user email found. Please log in again.");
        return;
      }

      if (!petId) {
        alert("No pet selected. Please go back and choose a pet again.");
        return;
      }

      setIsSubmittingScan(true);

      console.log("Calling analyzeImage...");
      const analysisResponse = await analyzeImage(selectedPhotoUri);
      console.log("analyzeImage response:", analysisResponse);

      console.log("Calling requestInitialAdvice...");
      const advice = await requestInitialAdvice({
        label: analysisResponse.label,
        userEmail,
        userId,
        petId,
        petName,
        petType,
      });
      console.log("Advice result:", advice);

      const pushParams = {
        pet: petType,
        petId,
        petName,
        userId,
        userEmail,
        label: (analysisResponse.label ?? "").toString(),
        historyId: String(advice.historyId ?? analysisResponse.historyId ?? ""),
        advice: JSON.stringify(advice),
      };

      console.log("Navigating to /scan-result with params:", pushParams);

      router.push({
        pathname: "/scan-result",
        params: pushParams,
      });

      console.log("=== SCAN END SUCCESS ===");
    } catch (error: any) {
      console.log("=== SCAN END FAILURE ===");
      console.log("SCAN ERROR full object:", error);
      console.log("SCAN ERROR message:", error?.message ?? error);
      console.log("SCAN ERROR stack:", error?.stack);
      alert(`Scan failed: ${error?.message ?? error}`);
    } finally {
      setIsSubmittingScan(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backButton}
          >
            <Text style={styles.backArrow}>←</Text>
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>SCAN</Text>
            <Text style={styles.headerSubtitle}>{screenTitle}</Text>
          </View>

          <Pressable
            onPress={() =>
              router.push({
                pathname: "/account",
                params: {
                  userEmail,
                  userId,
                },
              })
            }
            hitSlop={12}
            style={styles.accountButton}
          >
            <Text style={styles.accountButtonText}>👤</Text>
          </Pressable>
        </View>

        <View style={styles.previewWrap}>
          <View style={styles.previewCard}>
            <View style={styles.previewTopRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {imageSourceMode === "gallery" ? "Gallery" : "Camera"}
                </Text>
              </View>

              {selectedPhotoUri ? (
                <Pressable
                  onPress={resetSelectedPhoto}
                  style={styles.badgeButton}
                >
                  <Text style={styles.badgeButtonText}>Retake</Text>
                </Pressable>
              ) : (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>No photo yet</Text>
                </View>
              )}
            </View>

            {selectedPhotoUri ? (
              <View style={styles.photoWrap}>
                <Image
                  source={{ uri: selectedPhotoUri }}
                  style={styles.photo}
                  resizeMode="cover"
                />
                <View style={styles.overlayTip}>
                  <Text style={styles.overlayTipText}>
                    Keep the issue centered • good light
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.guideWrap}>
                <View style={styles.guideBox}>
                  <Text style={styles.guideText}>
                    Choose or click a clear photo of the problem area
                  </Text>
                  <Text style={styles.guideSub}>
                    Good lighting • close-up • not blurry
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.controls}>
          <View style={styles.leftControls}>
            <Pressable
              onPress={choosePhotoFromLibrary}
              style={styles.smallButton}
              disabled={isSubmittingScan}
            >
              <Text style={styles.smallButtonText}>Choose</Text>
            </Pressable>

            <Pressable
              onPress={capturePhotoWithCamera}
              style={styles.smallButton}
              disabled={isSubmittingScan}
            >
              <Text style={styles.smallButtonText}>Click</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={handleScanPress}
            style={[styles.scanButton, isSubmittingScan && { opacity: 0.6 }]}
            disabled={isSubmittingScan}
          >
            <Text style={styles.scanButtonText}>
              {isSubmittingScan ? "Scanning..." : "Scan"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#69B7FF",
  },
  scrollContent: {
    paddingTop: 70,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(4,74,28,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    bottom: 40,
  },
  backArrow: {
    color: "#044a1cff",
    fontSize: 16,
    fontWeight: "900",
  },
  headerText: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
    bottom: 30,
  },
  headerTitle: {
    color: "#044a1cff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    marginTop: 6,
    color: "#044a1cff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  accountButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(4,74,28,0.15)",
    alignItems: "center",
    justifyContent: "center",
    bottom: 40,
  },
  accountButtonText: {
    fontSize: 18,
  },
  previewWrap: {
    height: 420,
    marginBottom: 16,
  },
  previewCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#044a1cd1",
    padding: 14,
  },
  previewTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  badge: {
    backgroundColor: "rgba(4,74,28,0.95)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  badgeText: {
    color: "#69B7FF",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  badgeButton: {
    backgroundColor: "rgba(105,183,255,0.18)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  badgeButtonText: {
    color: "#69B7FF",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  guideWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  guideBox: {
    width: "90%",
    borderRadius: 10,
    padding: 16,
    backgroundColor: "#044a1cff",
  },
  guideText: {
    color: "#69B7FF",
    fontWeight: "900",
    textAlign: "center",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  guideSub: {
    marginTop: 8,
    color: "#69B7FF",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    opacity: 0.95,
  },
  photoWrap: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#044a1cff",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  overlayTip: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    backgroundColor: "rgba(4,74,28,0.92)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  overlayTipText: {
    color: "#69B7FF",
    fontWeight: "900",
    fontSize: 12,
    textAlign: "center",
  },
  controls: {
    marginTop: 4,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  leftControls: {
    flexDirection: "row",
    gap: 12,
  },
  smallButton: {
    width: 82,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#044a1cd1",
    alignItems: "center",
    justifyContent: "center",
  },
  smallButtonText: {
    color: "#69B7FF",
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
    fontSize: 12,
  },
  scanButton: {
    flex: 1,
    height: 58,
    borderRadius: 12,
    backgroundColor: "#044a1cff",
    alignItems: "center",
    justifyContent: "center",
  },
  scanButtonText: {
    color: "#69B7FF",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
