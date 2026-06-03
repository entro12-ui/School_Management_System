export function buildDraftPlainText(subject: string, body: string) {
  return `${subject.trim()}\n\n${body.trim()}`;
}

export function buildWhatsAppShareUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildTelegramShareUrl(text: string) {
  return `https://t.me/share/url?text=${encodeURIComponent(text)}`;
}

export function openShareLink(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function downloadDraftTextFile(subject: string, body: string, fileBaseName: string) {
  const text = buildDraftPlainText(subject, body);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const safeName = fileBaseName.replace(/[^\w\-]+/g, "-").replace(/-+/g, "-") || "message-draft";
  anchor.href = url;
  anchor.download = `${safeName}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function parseApiJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      response.ok
        ? "Unexpected server response."
        : `Request failed (${response.status}). Please sign in again and retry.`
    );
  }
  return (await response.json()) as T;
}
