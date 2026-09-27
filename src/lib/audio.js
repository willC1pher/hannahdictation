function getChineseVoice() {
  const voices = window.speechSynthesis?.getVoices?.() ?? [];
  const chinese = voices.filter((voice) => /^zh([-_]|$)/i.test(voice.lang));
  return chinese.find((voice) => /zh[-_]CN/i.test(voice.lang)) ?? chinese[0] ?? null;
}

function waitForVoices(timeoutMs = 800) {
  if (!window.speechSynthesis) return Promise.resolve();
  if (window.speechSynthesis.getVoices().length) return Promise.resolve();

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.speechSynthesis.removeEventListener?.("voiceschanged", finish);
      resolve();
    };
    window.speechSynthesis.addEventListener?.("voiceschanged", finish, { once: true });
    setTimeout(finish, timeoutMs);
  });
}

export async function speakMandarin(text, { rate = 0.82 } = {}) {
  if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
    throw new Error("This browser does not support speech synthesis.");
  }

  await waitForVoices();
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = rate;

  const voice = getChineseVoice();
  if (voice) utterance.voice = voice;

  return new Promise((resolve, reject) => {
    utterance.addEventListener("end", () => resolve());
    utterance.addEventListener("error", (event) => reject(new Error(event.error || "Audio playback failed.")));
    window.speechSynthesis.speak(utterance);
  });
}
