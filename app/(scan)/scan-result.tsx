import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { API_BASE_URL } from "../../constants/api";

type PetType = "dog" | "cat" | "rabbit" | "bird";
type FollowUpAnswers = Record<string, boolean>; //used to store the answers to the follow-up quetions after user gets the advice

//defines what the advice object may contain
type AdvicePayload = {
  summary?: string;
  urgency?: string;
  safeHomeCare?: string[];
  goToVetIf?: string[];
  historyId?: string | number;
};

//array of follow-up question objects if the advice is 'wound'
const WOUND_QUESTIONS = [
  { key: "bleeding", text: "Is the wound bleeding?" },
  { key: "deep", text: "Does the wound look deep?" },
  { key: "biteOrAnimalCause", text: "Was the wound caused by another animal?" },
  { key: "painOrLimping", text: "Is your pet limping or in pain?" },
  { key: "swellingOrSmell", text: "Is there swelling, discharge, or smell?" },
];

//array of follow-up question objects if the advice is 'rash'
const RASH_QUESTIONS = [
  { key: "scratching", text: "Is your pet scratching or licking a lot?" },
  { key: "spreading", text: "Is the rash spreading?" },
  { key: "bloodOrPus", text: "Is there blood or pus?" },
  { key: "petUnwell", text: "Does your pet seem tired or unwell?" },
  { key: "lastingDays", text: "Has it lasted for more than a couple of days?" },
];

const isValidPetType = (value: string): value is PetType => {
  return (
    value === "dog" || value === "cat" || value === "rabbit" || value === "bird"
  );
};

const normalizePetType = (value?: string): PetType => {
  const normalized = (value ?? "dog").toString().toLowerCase();
  return isValidPetType(normalized) ? normalized : "dog";
};

const parseAdviceParam = (value?: string): AdvicePayload => {
  if (!value) return {};

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

//convert result category labels into readable UI texts
const formatResultLabel = (value?: string) => {
  if (!value) return "";
  if (value === "normal_skin") return "Normal skin";
  if (value === "rash") return "Possible rash";
  if (value === "wound") return "Possible wound";
  if (value === "unclear") return "Unclear";
  return value;
};

//convert Urgency labels into readable UI texts
const formatUrgencyLabel = (value?: string) => {
  if (!value) return "";
  if (value === "home_care") return "Can be closely monitored at home";
  if (value === "vet_soon") return "Vet visit is recommended";
  if (value === "urgent_now") return "Vet attention is needed urgently";
  if (value === "monitor") return "Monitor closely";
  return value;
};

//sets the colours for each urgency label
const getUrgencyBadgeColor = (value?: string) => {
  if (value === "home_care" || value === "monitor") return "#3BD16F";
  if (value === "vet_soon") return "#FFA63D";
  if (value === "urgent_now") return "#FF5A5A";
  return "#69B7FF";
};

//calls the backend again to get updated advice after the follow-up questions have been answered
async function refreshAdvice(options: {
  label: string;
  userEmail: string;
  userId: string;
  petId: string;
  petName: string;
  petType: PetType;
  answers: FollowUpAnswers;
  historyId?: string | number;
}): Promise<AdvicePayload> {
  const response = await fetch(`${API_BASE_URL}/api/advice`, {
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
      historyId: options.historyId,
      ...options.answers,
    }),
  });

  const responseText = await response.text();

  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error(
      `Advice API did not return JSON. Status=${response.status}. Body=${responseText.slice(0, 200)}`,
    );
  }
}

//a resusable component used to display both wound and rash questions
function QuestionList(props: {
  title: string;
  questions: { key: string; text: string }[];
  answers: FollowUpAnswers;
  disabled: boolean;
  onToggle: (key: string) => void;
  onSubmit: () => void;
  submitLabel: string;
}) {
  return (
    <View style={styles.questionBox}>
      <Text style={styles.questionTitle}>{props.title}</Text>

      {props.questions.map((question) => (
        <Pressable
          key={question.key}
          style={styles.questionRow}
          onPress={() => props.onToggle(question.key)}
        >
          <Text style={styles.questionText}>{question.text}</Text>
          <Text style={styles.questionCheck}>
            {props.answers[question.key] ? "✓" : ""}
          </Text>
        </Pressable>
      ))}

      <Pressable
        onPress={props.onSubmit}
        style={[styles.updateButton, props.disabled && { opacity: 0.6 }]}
        disabled={props.disabled}
      >
        <Text style={styles.updateButtonText}>{props.submitLabel}</Text>
      </Pressable>
    </View>
  );
}

export default function ScanResultScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    pet?: string;
    petId?: string;
    petName?: string;
    userId?: string;
    userEmail?: string;
    label?: string;
    historyId?: string;
    advice?: string;
  }>();

  const petType = useMemo(() => normalizePetType(params.pet), [params.pet]);

  //cleaning up string params
  const petId = (params.petId ?? "").toString().trim();
  const petName = (params.petName ?? "").toString().trim();
  const userId = (params.userId ?? "").toString().trim();
  const userEmail = (params.userEmail ?? "").toString().trim();
  const label = (params.label ?? "").toString().trim();
  const initialHistoryId = (params.historyId ?? "").toString().trim();

  const [advice, setAdvice] = useState<AdvicePayload>(() =>
    parseAdviceParam(params.advice),
  );
  const [followUpAnswers, setFollowUpAnswers] = useState<FollowUpAnswers>({});
  const [isRefreshingAdvice, setIsRefreshingAdvice] = useState(false);

  const showUnclearTips = label === "unclear";

  const toggleAnswerSelection = (key: string) => {
    setFollowUpAnswers((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  //called when user clicks on "update advice" button
  const handleAdviceRefresh = async () => {
    try {
      if (!label) return;

      setIsRefreshingAdvice(true);

      const updatedAdvice = await refreshAdvice({
        label,
        userEmail,
        userId,
        petId,
        petName,
        petType,
        answers: followUpAnswers,
        historyId: (advice.historyId ?? initialHistoryId) || undefined,
      });

      setAdvice(updatedAdvice);
    } catch (error: any) {
      console.log("UPDATE ADVICE ERROR:", error?.message ?? error);
      alert(`Could not update advice: ${error?.message ?? error}`);
    } finally {
      setIsRefreshingAdvice(false);
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
            <Text style={styles.headerTitle}>RESULT</Text>
            <Text style={styles.headerSubtitle}>
              {petName || petType.toUpperCase()}
            </Text>
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

        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Scan result</Text>

          {!!petName && (
            <Text style={styles.resultPetName}>Pet: {petName}</Text>
          )}

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>{formatResultLabel(label)}</Text>
          </View>

          {!!advice.summary && (
            <Text style={styles.adviceSummary}>{advice.summary}</Text>
          )}

          {!!advice.urgency && (
            <View
              style={[
                styles.urgencyPill,
                { backgroundColor: getUrgencyBadgeColor(advice.urgency) },
              ]}
            >
              <Text style={styles.urgencyPillText}>
                {formatUrgencyLabel(advice.urgency)}
              </Text>
            </View>
          )}

          {label === "wound" && (
            <QuestionList
              title="A few quick questions"
              questions={WOUND_QUESTIONS}
              answers={followUpAnswers}
              disabled={isRefreshingAdvice}
              onToggle={toggleAnswerSelection}
              onSubmit={handleAdviceRefresh}
              submitLabel={isRefreshingAdvice ? "Updating..." : "Update Advice"}
            />
          )}

          {label === "rash" && (
            <QuestionList
              title="A few quick questions"
              questions={RASH_QUESTIONS}
              answers={followUpAnswers}
              disabled={isRefreshingAdvice}
              onToggle={toggleAnswerSelection}
              onSubmit={handleAdviceRefresh}
              submitLabel={isRefreshingAdvice ? "Updating..." : "Update Advice"}
            />
          )}

          {!!advice.safeHomeCare?.length && (
            <View style={styles.adviceSection}>
              <Text style={styles.adviceSectionTitle}>Safe home care</Text>
              {advice.safeHomeCare.map((item, index) => (
                <Text key={`home-${index}`} style={styles.adviceBullet}>
                  • {item}
                </Text>
              ))}
            </View>
          )}

          {!!advice.goToVetIf?.length && (
            <View style={styles.adviceSection}>
              <Text style={styles.adviceSectionTitle}>See a vet if</Text>
              {advice.goToVetIf.map((item, index) => (
                <Text key={`vet-${index}`} style={styles.adviceBullet}>
                  • {item}
                </Text>
              ))}
            </View>
          )}

          {showUnclearTips && (
            <View style={styles.tipsBox}>
              <Text style={styles.tipsTitle}>Try again for a clearer scan</Text>
              <Text style={styles.tipsText}>• Use brighter lighting</Text>
              <Text style={styles.tipsText}>
                • Move closer, but keep the image sharp
              </Text>
              <Text style={styles.tipsText}>• Keep the issue centered</Text>
              <Text style={styles.tipsText}>• Wipe the camera lens</Text>
            </View>
          )}

          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerTitle}>Disclaimer</Text>
            <Text style={styles.disclaimerText}>
              This guidance is for informational purposes only and is not a
              substitute for professional veterinary advice, diagnosis, or
              treatment. Always consult a qualified veterinarian if you are
              concerned about your pet’s health.
            </Text>
          </View>
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
  resultCard: {
    borderRadius: 12,
    backgroundColor: "#044a1cd1",
    padding: 16,
  },
  resultTitle: {
    color: "#69B7FF",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  resultPetName: {
    color: "#69B7FF",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 8,
    opacity: 0.95,
    textTransform: "uppercase",
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  resultLabel: {
    color: "#69B7FF",
    fontWeight: "900",
    fontSize: 22,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    flex: 1,
    paddingRight: 10,
  },
  adviceSummary: {
    marginTop: 12,
    color: "#69B7FF",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  urgencyPill: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  urgencyPillText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  questionBox: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(105,183,255,0.18)",
  },
  questionTitle: {
    color: "#69B7FF",
    fontWeight: "900",
    marginBottom: 10,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  questionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(105,183,255,0.12)",
  },
  questionText: {
    color: "#69B7FF",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    paddingRight: 12,
    lineHeight: 18,
  },
  questionCheck: {
    color: "#69B7FF",
    fontSize: 16,
    fontWeight: "900",
    width: 24,
    textAlign: "right",
  },
  updateButton: {
    marginTop: 14,
    height: 46,
    borderRadius: 10,
    backgroundColor: "#044a1cff",
    alignItems: "center",
    justifyContent: "center",
  },
  updateButtonText: {
    color: "#69B7FF",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  adviceSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(105,183,255,0.18)",
  },
  adviceSectionTitle: {
    color: "#69B7FF",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  adviceBullet: {
    color: "#69B7FF",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 6,
  },
  tipsBox: {
    marginTop: 16,
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#044a1cff",
  },
  tipsTitle: {
    color: "#69B7FF",
    fontWeight: "900",
    marginBottom: 6,
    fontSize: 12,
  },
  tipsText: {
    color: "#69B7FF",
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 18,
  },
  disclaimerBox: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(105,183,255,0.18)",
  },
  disclaimerTitle: {
    color: "#69B7FF",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  disclaimerText: {
    color: "#69B7FF",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    opacity: 0.95,
  },
});
