// src/utils/soundHelper.ts
import { Platform } from 'react-native';

const beautyAudioModule = require('../../assets/beauty_ambient.mp3');
const barberAudioModule = require('../../assets/barber_ambient.mp3');

function resolveAudioUri(asset: any): string {
  if (typeof asset === 'string') return asset;
  if (asset && typeof asset.uri === 'string') return asset.uri;
  if (asset && typeof asset.default === 'string') return asset.default;
  if (asset && typeof asset.default === 'object' && typeof asset.default?.uri === 'string') {
    return asset.default.uri;
  }
  return '';
}

class SalonSoundManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentBranch: 'beauty' | 'barber' | null = null;
  private isMuted: boolean = false;
  private listeners: Set<(isPlaying: boolean, isMuted: boolean, branch: 'beauty' | 'barber' | null) => void> = new Set();

  public subscribe(cb: (isPlaying: boolean, isMuted: boolean, branch: 'beauty' | 'barber' | null) => void) {
    this.listeners.add(cb);
    cb(this.isPlaying(), this.isMuted, this.currentBranch);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    const playing = this.isPlaying();
    this.listeners.forEach(cb => cb(playing, this.isMuted, this.currentBranch));
  }

  public isPlaying(): boolean {
    return !!(this.currentAudio && !this.currentAudio.paused && !this.currentAudio.ended);
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getCurrentBranch(): 'beauty' | 'barber' | null {
    return this.currentBranch;
  }

  public playBranchMusic(branch: 'beauty' | 'barber') {
    if (Platform.OS !== 'web' && typeof Audio === 'undefined') {
      return;
    }

    try {
      const srcUri = resolveAudioUri(branch === 'beauty' ? beautyAudioModule : barberAudioModule);
      if (!srcUri) return;

      // Se já está a tocar o mesmo salão, apenas assegura que não está pausado
      if (this.currentAudio && this.currentBranch === branch) {
        if (!this.isMuted && this.currentAudio.paused) {
          this.currentAudio.play().catch(() => {});
        }
        this.notify();
        return;
      }

      // Parar o áudio anterior suavemente se existir
      if (this.currentAudio) {
        try {
          this.currentAudio.pause();
          this.currentAudio.currentTime = 0;
        } catch (_) {}
      }

      const audio = new Audio(srcUri);
      audio.loop = true;
      audio.volume = this.isMuted ? 0 : 0.35; // Volume de salão ambiente delicado e relaxante
      this.currentAudio = audio;
      this.currentBranch = branch;

      audio.play().then(() => {
        this.notify();
      }).catch(err => {
        // Autoplay pode ser bloqueado antes de interação do utilizador
        console.log('[SalonSound] Audio play prevented until user interaction:', err);
        this.notify();
      });

      this.notify();
    } catch (e) {
      console.log('[SalonSound] Error playing branch music:', e);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.currentAudio) {
      if (this.isMuted) {
        this.currentAudio.volume = 0;
      } else {
        this.currentAudio.volume = 0.35;
        if (this.currentAudio.paused) {
          this.currentAudio.play().catch(() => {});
        }
      }
    }
    this.notify();
    return this.isMuted;
  }

  public stop() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (_) {}
      this.currentAudio = null;
      this.currentBranch = null;
    }
    this.notify();
  }
}

export const salonSound = new SalonSoundManager();
