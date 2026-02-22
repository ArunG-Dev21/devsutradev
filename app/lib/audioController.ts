// ─── Audio Controller ────────────────────────────────────────────────────────
// Event-driven ambient audio engine with smooth fade transitions.
// Zero UI dependencies — communicates via CustomEvents on window.

const AUDIO_SRC = "/audio/ambient.mp3";
const AUDIO_PREF_KEY = "devotion-audio-pref";
const TARGET_VOLUME = 0.3;
const STATE_EVENT = "audio-state-change";

let audio: HTMLAudioElement | null = null;
let playing = false;
let fadeFrame: number | null = null;

// ─── Lifecycle ───────────────────────────────────────────────────────────────

export function init(): void {
    if (audio) return; // Already initialised
    audio = document.createElement("audio");
    audio.src = AUDIO_SRC;
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    document.body.appendChild(audio);
}

/** Call synchronously inside a click handler to unlock audio on the browser. */
export function unlock(): void {
    if (!audio) return;
    audio.volume = 0;
    audio.play().catch(() => { });
}

// ─── Fade helpers ────────────────────────────────────────────────────────────

function cancelFade(): void {
    if (fadeFrame !== null) {
        cancelAnimationFrame(fadeFrame);
        fadeFrame = null;
    }
}

export function fadeIn(durationMs: number = 2500): void {
    if (!audio) return;
    cancelFade();

    audio.volume = 0;
    audio.play().catch(() => { });

    const start = performance.now();

    const step = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / durationMs, 1);
        // Ease-out curve for natural fade
        const eased = 1 - Math.pow(1 - progress, 3);
        audio!.volume = eased * TARGET_VOLUME;

        if (progress < 1) {
            fadeFrame = requestAnimationFrame(step);
        } else {
            fadeFrame = null;
            playing = true;
            localStorage.setItem(AUDIO_PREF_KEY, "unmuted");
            dispatch();
        }
    };

    playing = true;
    dispatch();
    fadeFrame = requestAnimationFrame(step);
}

export function fadeOut(durationMs: number = 800): void {
    if (!audio) return;
    cancelFade();

    const startVol = audio.volume;
    const start = performance.now();

    const step = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / durationMs, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        audio!.volume = startVol * (1 - eased);

        if (progress < 1) {
            fadeFrame = requestAnimationFrame(step);
        } else {
            audio!.pause();
            audio!.volume = 0;
            fadeFrame = null;
            playing = false;
            localStorage.setItem(AUDIO_PREF_KEY, "muted");
            dispatch();
        }
    };

    fadeFrame = requestAnimationFrame(step);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function toggle(): boolean {
    if (playing) {
        fadeOut();
        return false;
    } else {
        fadeIn();
        return true;
    }
}

export function isPlaying(): boolean {
    return playing;
}

export function getPreference(): "muted" | "unmuted" | null {
    return localStorage.getItem(AUDIO_PREF_KEY) as "muted" | "unmuted" | null;
}

// ─── Events ──────────────────────────────────────────────────────────────────

function dispatch(): void {
    window.dispatchEvent(
        new CustomEvent(STATE_EVENT, { detail: { playing } }),
    );
}

export { STATE_EVENT };
