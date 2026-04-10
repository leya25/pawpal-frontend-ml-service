export const API_BASE_URL = "http://172.20.10.9:8080";

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
