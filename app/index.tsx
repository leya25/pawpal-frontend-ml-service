import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

// base size you probably designed against
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

const scaleW = (size: number) => (width / BASE_WIDTH) * size;
const scaleH = (size: number) => (height / BASE_HEIGHT) * size;
const scale = (size: number) => Math.min(scaleW(size), scaleH(size));

export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Paw{"\n"}Pal</Text>
          <Text style={styles.tagline}>
            your pet’s best buddy {"\n"}in your pocket
          </Text>

          <Pressable
            style={styles.button}
            onPress={() => router.push("/choose-pet")}
          >
            <Text style={styles.buttonText}>START</Text>
          </Pressable>
        </View>

        <Image
          pointerEvents="none"
          source={require("../assets/images/dog.png")}
          style={styles.dog}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F7C948",
  },
  container: {
    flex: 1,
    backgroundColor: "#F7C948",
  },

  content: {
    position: "absolute",
    left: scaleW(24),
    bottom: scaleH(260),
    width: "75%",
    zIndex: 2,
  },

  title: {
    fontSize: scale(44),
    fontWeight: "900",
    letterSpacing: 2,
    color: "#593a21ff",
    textTransform: "uppercase",
    bottom: scaleH(170),
    lineHeight: scale(44),
  },

  tagline: {
    marginTop: scaleH(6),
    fontSize: scale(14),
    letterSpacing: 1,
    color: "#111",
    opacity: 0.85,
    bottom: scaleH(170),
    lineHeight: scale(18),
  },

  button: {
    marginTop: scaleH(18),
    alignSelf: "flex-start",
    backgroundColor: "#593a21ff",
    paddingVertical: scaleH(14),
    paddingHorizontal: scaleW(20),
    top: scaleH(-170),
    left: scaleW(-2),
    borderRadius: scale(4),
  },

  buttonText: {
    fontSize: scale(16),
    fontWeight: "900",
    letterSpacing: 2,
    color: "#F7C948",
  },

  dog: {
    position: "absolute",
    left: scaleW(-60),
    bottom: scaleH(-140),
    width: scaleW(495),
    height: scaleH(990),
  },
});
