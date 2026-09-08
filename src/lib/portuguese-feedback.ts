const BIDI_AND_ZERO_WIDTH_CONTROLS = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;
const UNEXPECTED_WRITING_SYSTEMS =
  /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Cyrillic}\p{Script=Greek}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Thai}\p{Script=Devanagari}]+/gu;
const HAS_UNEXPECTED_WRITING_SYSTEM =
  /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Cyrillic}\p{Script=Greek}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Thai}\p{Script=Devanagari}]/u;

const KNOWN_MODEL_ARTIFACTS: Array<[RegExp, string]> = [[/التنفيذ/gu, "execução"]];

export function containsUnexpectedWritingSystem(value: string) {
  return HAS_UNEXPECTED_WRITING_SYSTEM.test(value);
}

export function sanitizePortugueseFeedback(value: string) {
  let sanitized = value.normalize("NFC").replace(BIDI_AND_ZERO_WIDTH_CONTROLS, "");

  for (const [artifact, replacement] of KNOWN_MODEL_ARTIFACTS) {
    sanitized = sanitized.replace(artifact, replacement);
  }

  return sanitized
    .replace(UNEXPECTED_WRITING_SYSTEMS, "")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
