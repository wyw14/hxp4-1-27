type Color = 'red' | 'yellow' | 'blue' | 'green';

interface FeedbackSettings {
  soundEnabled: boolean;
  textHintEnabled: boolean;
  vibrationEnabled: boolean;
}

interface FeedbackElements {
  soundToggle: HTMLInputElement | null;
  textHintToggle: HTMLInputElement | null;
  vibrationToggle: HTMLInputElement | null;
}

const COLOR_NAMES: Record<Color, string> = {
  red: '红色',
  yellow: '黄色',
  blue: '蓝色',
  green: '绿色',
};

const COLOR_FREQUENCIES: Record<Color, number> = {
  red: 329.63,
  yellow: 392.00,
  blue: 493.88,
  green: 587.33,
};

const STORAGE_KEY = 'color_memory_feedback_settings';

class FeedbackManager {
  private settings: FeedbackSettings;
  private audioContext: AudioContext | null = null;
  private elements: FeedbackElements = {
    soundToggle: null,
    textHintToggle: null,
    vibrationToggle: null,
  };

  constructor() {
    this.settings = this.loadSettings();
  }

  public init(): void {
    this.elements = {
      soundToggle: document.getElementById('sound-toggle') as HTMLInputElement,
      textHintToggle: document.getElementById('text-hint-toggle') as HTMLInputElement,
      vibrationToggle: document.getElementById('vibration-toggle') as HTMLInputElement,
    };

    this.updateToggleStates();
    this.setupEventListeners();
  }

  private loadSettings(): FeedbackSettings {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('加载设置失败:', e);
    }
    return {
      soundEnabled: true,
      textHintEnabled: true,
      vibrationEnabled: true,
    };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.error('保存设置失败:', e);
    }
  }

  private updateToggleStates(): void {
    if (this.elements.soundToggle) {
      this.elements.soundToggle.checked = this.settings.soundEnabled;
    }
    if (this.elements.textHintToggle) {
      this.elements.textHintToggle.checked = this.settings.textHintEnabled;
    }
    if (this.elements.vibrationToggle) {
      this.elements.vibrationToggle.checked = this.settings.vibrationEnabled;
    }
  }

  private setupEventListeners(): void {
    if (this.elements.soundToggle) {
      this.elements.soundToggle.addEventListener('change', (e) => {
        this.settings.soundEnabled = (e.target as HTMLInputElement).checked;
        this.saveSettings();
        if (this.settings.soundEnabled) {
          this.playSound('green');
        }
      });
    }

    if (this.elements.textHintToggle) {
      this.elements.textHintToggle.addEventListener('change', (e) => {
        this.settings.textHintEnabled = (e.target as HTMLInputElement).checked;
        this.saveSettings();
      });
    }

    if (this.elements.vibrationToggle) {
      this.elements.vibrationToggle.addEventListener('change', (e) => {
        this.settings.vibrationEnabled = (e.target as HTMLInputElement).checked;
        this.saveSettings();
        if (this.settings.vibrationEnabled) {
          this.vibrate(50);
        }
      });
    }
  }

  private initAudioContext(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  public playSound(color: Color, duration: number = 200): void {
    if (!this.settings.soundEnabled) return;

    try {
      this.initAudioContext();
      if (!this.audioContext) return;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(
        COLOR_FREQUENCIES[color],
        this.audioContext.currentTime
      );

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + duration / 1000
      );

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (e) {
      console.error('播放音效失败:', e);
    }
  }

  public playErrorSound(): void {
    if (!this.settings.soundEnabled) return;

    try {
      this.initAudioContext();
      if (!this.audioContext) return;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        80,
        this.audioContext.currentTime + 0.3
      );

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.3
      );

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.3);
    } catch (e) {
      console.error('播放错误音效失败:', e);
    }
  }

  public playSuccessSound(): void {
    if (!this.settings.soundEnabled) return;

    try {
      this.initAudioContext();
      if (!this.audioContext) return;

      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const oscillator = this.audioContext!.createOscillator();
        const gainNode = this.audioContext!.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime + i * 0.1);

        gainNode.gain.setValueAtTime(0.2, this.audioContext!.currentTime + i * 0.1);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          this.audioContext!.currentTime + i * 0.1 + 0.2
        );

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);

        oscillator.start(this.audioContext!.currentTime + i * 0.1);
        oscillator.stop(this.audioContext!.currentTime + i * 0.1 + 0.2);
      });
    } catch (e) {
      console.error('播放成功音效失败:', e);
    }
  }

  public showTextHint(button: HTMLButtonElement, color: Color): void {
    if (!this.settings.textHintEnabled) return;

    const existingHint = button.querySelector('.text-hint');
    if (existingHint) {
      existingHint.remove();
    }

    const hint = document.createElement('span');
    hint.className = 'text-hint';
    hint.textContent = COLOR_NAMES[color];
    button.appendChild(hint);

    setTimeout(() => {
      hint.classList.add('fade-out');
      setTimeout(() => {
        if (hint.parentNode === button) {
          button.removeChild(hint);
        }
      }, 300);
    }, 600);
  }

  public vibrate(duration: number = 100): void {
    if (!this.settings.vibrationEnabled) return;

    const container = document.querySelector('.container') as HTMLElement;
    if (!container) return;

    container.classList.remove('vibrate');
    void container.offsetWidth;
    container.classList.add('vibrate');

    setTimeout(() => {
      container.classList.remove('vibrate');
    }, duration);
  }

  public vibrateError(): void {
    if (!this.settings.vibrationEnabled) return;

    const container = document.querySelector('.container') as HTMLElement;
    if (!container) return;

    container.classList.remove('vibrate', 'vibrate-heavy');
    void container.offsetWidth;
    container.classList.add('vibrate-heavy');

    setTimeout(() => {
      container.classList.remove('vibrate-heavy');
    }, 500);
  }

  public onButtonClick(button: HTMLButtonElement, color: Color): void {
    this.playSound(color);
    this.showTextHint(button, color);
    this.vibrate(80);
  }

  public onCorrect(): void {
    this.playSuccessSound();
    this.vibrate(100);
  }

  public onWrong(): void {
    this.playErrorSound();
    this.vibrateError();
  }

  public onGameOver(): void {
    this.playErrorSound();
    this.vibrateError();
  }

  public onNewRecord(): void {
    this.playSuccessSound();
    if (this.settings.vibrationEnabled) {
      setTimeout(() => this.vibrate(100), 100);
      setTimeout(() => this.vibrate(100), 250);
      setTimeout(() => this.vibrate(150), 400);
    }
  }

  public getSettings(): FeedbackSettings {
    return { ...this.settings };
  }
}

export { FeedbackManager };
export type { FeedbackSettings, Color };
