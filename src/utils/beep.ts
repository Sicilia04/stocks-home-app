import {createAudioPlayer, setAudioModeAsync} from 'expo-audio';
import type {AudioPlayer} from 'expo-audio';

const beepSource = require('../../assets/sounds/retire_beep.wav');

let audioModeReady: Promise<void> | null = null;
function ensureAudioMode(): Promise<void> {
    if (!audioModeReady) {
        audioModeReady = setAudioModeAsync({
            // The camera is active during stock removals: force the iOS audio
            // session to "playAndRecord" so the output is not cut off by the
            // recording session, and routes through the speaker (not the earpiece).
            allowsRecording: true,
            shouldRouteThroughEarpiece: false,
            interruptionMode: 'mixWithOthers',
        }).catch(err => {
            audioModeReady = null;
            throw err;
        });
    }
    return audioModeReady;
}

function waitLoaded(player: AudioPlayer, timeoutMs = 2000): Promise<AudioPlayer> {
    if (player.isLoaded) {
        return Promise.resolve(player);
    }
    return new Promise<AudioPlayer>((resolve, reject) => {
        const start = Date.now();
        const timer = setInterval(() => {
            if (player.isLoaded) {
                clearInterval(timer);
                resolve(player);
            } else if (Date.now() - start > timeoutMs) {
                clearInterval(timer);
                reject(new Error('Audio not loaded in time'));
            }
        }, 20);
    });
}

function waitFinished(player: AudioPlayer, timeoutMs = 5000): Promise<void> {
    if (!player.playing) {
        return Promise.resolve();
    }
    return new Promise<void>(resolve => {
        const start = Date.now();
        const timer = setInterval(() => {
            if (!player.playing || Date.now() - start > timeoutMs) {
                clearInterval(timer);
                resolve();
            }
        }, 20);
    });
}

export function playBeep(): void {
    ensureAudioMode()
        .then(() => createAudioPlayer(beepSource, {downloadFirst: true}))
        .then(player => waitLoaded(player))
        .then(player => {
            player.muted = false;
            player.volume = 1;
            player.play();
            return waitFinished(player).then(() => player);
        })
        .then(player => {
            try {
                player.remove();
            } catch {
                // ignore
            }
        })
        .catch(err => {
            console.warn('[beep] playback failed:', err);
        });
}
