import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { API_BASE_URL } from "../../constants/api";

//defines what each history item may have
type ScanHistory = {
  id?: number | string;
  petId?: number | string;
  petName?: string;
  petType?: string;
  label?: string;
  summary?: string;
  urgency?: string;
  createdAt?: string;
  timestamp?: string;
};

//takes the label from the backend and displays it to the user in the UI
const formatScanLabel = (value?: string) => {
  if (!value) return "Unidentified result";
  if (value === "normal_skin") return "Normal skin";
  if (value === "rash") return "Possible rash";
  if (value === "wound") return "Possible wound";
  if (value === "unclear") return "Unclear";
  return value;
};

//takes the urgency label from the backend and shows it to the user in readable UI text
const formatScanUrgency = (value?: string) => {
  if (!value) return "";
  if (value === "home_care") return "Can be closely monitored at home";
  if (value === "vet_soon") return "Vet visit is recommended";
  if (value === "urgent_now") return "Urgent vet attention is needed";
  if (value === "monitor") return "Monitor closely";
  return value;
};

const formatHistoryDate = (value?: string) => {
  if (!value) return "Date unavailable";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleString();
};

//function to fetch the user's scan history from the server
async function fetchUserHistory(email: string): Promise<ScanHistory[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/advice/history/${encodeURIComponent(email)}`,
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Unable to display history.");
  }

  const result = await response.json();
  return Array.isArray(result) ? result : [];
}

export default function HistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    userEmail?: string;
    userId?: string;
  }>();

  const userEmail = useMemo(
    () => (params.userEmail ?? "").toString().trim(),
    [params.userEmail],
  );

  const [historyEntries, setHistoryEntries] = useState<ScanHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    const loadHistoryEntries = async () => {
      if (!userEmail) {
        setIsLoadingHistory(false);
        return;
      }

      try {
        const entries = await fetchUserHistory(userEmail);
        setHistoryEntries(entries);
      } catch (error) {
        console.log("HISTORY ERROR:", error);
        setHistoryEntries([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistoryEntries();
  }, [userEmail]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>

          <Text style={styles.title}>Health History</Text>
          <Text style={styles.subtitle}>Past scan results</Text>
        </View>

        {isLoadingHistory ? (
          <Text style={styles.emptyText}>Loading history...</Text>
        ) : historyEntries.length === 0 ? (
          <Text style={styles.emptyText}>No health history found yet.</Text>
        ) : (
          historyEntries.map((entry, index) => (
            <View key={entry.id ?? index} style={styles.card}>
              <Text style={styles.petName}>
                {entry.petName?.trim() ? entry.petName : "Unknown Pet"}
              </Text>

              {!!entry.petType && (
                <Text style={styles.petType}>
                  {entry.petType.toUpperCase()}
                </Text>
              )}

              <Text style={styles.resultLabel}>
                {formatScanLabel(entry.label)}
              </Text>

              {!!entry.summary && (
                <Text style={styles.summaryText}>{entry.summary}</Text>
              )}

              {!!entry.urgency && (
                <Text style={styles.urgencyText}>
                  {formatScanUrgency(entry.urgency)}
                </Text>
              )}

              <Text style={styles.dateText}>
                {formatHistoryDate(entry.createdAt ?? entry.timestamp)}
              </Text>
            </View>
          ))
        )}
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
    marginBottom: 10,
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
  },
  card: {
    backgroundColor: "#044a1cd1",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  petName: {
    color: "#69B7FF",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 4,
  },
  petType: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    opacity: 0.85,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  resultLabel: {
    color: "#69B7FF",
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  summaryText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginBottom: 10,
  },
  urgencyText: {
    color: "#F7C948",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  dateText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "700",
  },
});
