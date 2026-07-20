class AudioManager {
  private static instance: AudioManager;
  private loopAudio: HTMLAudioElement | null = null;
  private currentLoopSrc: string = '';
  private notificationAudio: HTMLAudioElement | null = null;
  private loopRequesters = new Set<string>();

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Request a looping alarm sound to be played.
   * If the sound is already playing, it will register the requester and continue playing.
   * If the sound source changes, the previous loop is stopped first.
   */
  public requestLoop(requesterId: string, src: string) {
    this.loopRequesters.add(requesterId);

    // If the loop is already playing the same source, do nothing
    if (this.loopAudio && this.currentLoopSrc === src) {
      return;
    }

    // Stop existing loop if source changed
    this.stopLoopInstance();

    this.currentLoopSrc = src;
    this.loopAudio = new Audio(src);
    this.loopAudio.loop = true;
    this.loopAudio.play().catch((err) => {
      console.warn(`[AudioManager] Failed to play loop audio: ${src}`, err);
    });
  }

  /**
   * Release a loop request.
   * If no other components are requesting a loop, the loop audio will be stopped.
   */
  public releaseLoop(requesterId: string) {
    this.loopRequesters.delete(requesterId);
    if (this.loopRequesters.size === 0) {
      this.stopLoopInstance();
    }
  }

  private stopLoopInstance() {
    if (this.loopAudio) {
      this.loopAudio.pause();
      this.loopAudio.src = '';
      this.loopAudio = null;
      this.currentLoopSrc = '';
    }
  }

  /**
   * Play a one-shot notification sound.
   * Interrupts any active notification sound to prevent overlapping.
   */
  public playNotification(src: string, volume: number = 1.0) {
    if (this.notificationAudio) {
      this.notificationAudio.pause();
      this.notificationAudio.src = '';
      this.notificationAudio = null;
    }

    this.notificationAudio = new Audio(src);
    this.notificationAudio.volume = volume;
    this.notificationAudio.play().catch((err) => {
      console.warn(`[AudioManager] Failed to play notification audio: ${src}`, err);
    });
  }
}

export const audioManager = AudioManager.getInstance();
