export const API_BASE_URL =
  "https://pawpal-backend-production-064f.up.railway.app";

export async function analyzeImage(photoUri: string) {
  const formData = new FormData();

  formData.append("file", {
    uri: photoUri,
    name: "pet.jpg",
    type: "image/jpeg",
  } as any);

  const res = await fetch(`${API_BASE_URL}/api/images/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Analyze failed: ${res.status} ${text}`);
  }

  return res.json();
}
