// --- CRAZYGAMES SDK WRAPPER ---
// Graceful wrapper around the CrazyGames v3 SDK.
// Works standalone (no SDK) and on CrazyGames (with SDK).
// Loaded after config.js, before engine.js.

const CG = {
  available: false,
  environment: 'disabled', // 'local', 'crazygames', 'disabled'
  sdk: null,
  user: null,
  _adPlaying: false,

  // --- Init ---
  async init() {
    if (!window.CrazyGames || !window.CrazyGames.SDK) {
      console.log('[CG] SDK not loaded, running standalone');
      return;
    }
    try {
      await window.CrazyGames.SDK.init();
      this.sdk = window.CrazyGames.SDK;
      this.environment = this.sdk.environment || 'disabled';
      this.available = this.environment !== 'disabled';
      console.log('[CG] SDK initialized, environment:', this.environment);

      // Respect muteAudio setting
      if (this.sdk.game && this.sdk.game.settings) {
        if (this.sdk.game.settings.muteAudio) this._muteGame(true);
        this.sdk.game.addSettingsChangeListener((s) => {
          this._muteGame(!!s.muteAudio);
        });
      }

      // Try to get user
      try {
        this.user = await this.sdk.user.getUser();
      } catch (e) {
        this.user = null;
      }
    } catch (e) {
      console.warn('[CG] SDK init failed:', e);
      this.available = false;
    }
  },

  // --- Mute/unmute game audio ---
  _muteGame(mute) {
    if (typeof soundEnabled !== 'undefined') {
      soundEnabled = !mute;
      const btn = document.getElementById('sound-btn');
      if (btn) {
        btn.textContent = soundEnabled ? '\u{1F50A}' : '\u{1F507}';
        btn.classList.toggle('active', soundEnabled);
      }
    }
  },

  // --- Loading events ---
  loadingStart() {
    if (!this.available) return;
    try { this.sdk.game.loadingStart(); } catch (e) {}
  },

  loadingStop() {
    if (!this.available) return;
    try { this.sdk.game.loadingStop(); } catch (e) {}
  },

  // --- Gameplay tracking ---
  gameplayStart() {
    if (!this.available) return;
    try { this.sdk.game.gameplayStart(); } catch (e) {}
  },

  gameplayStop() {
    if (!this.available) return;
    try { this.sdk.game.gameplayStop(); } catch (e) {}
  },

  // --- Happy time (confetti on CrazyGames) ---
  happytime() {
    if (!this.available) return;
    try { this.sdk.game.happytime(); } catch (e) {}
  },

  // --- Ads ---
  // Midgame ad: shown at natural breaks (game over, before restart)
  // Returns a promise that resolves when ad finishes/errors
  requestMidgame() {
    if (!this.available) return Promise.resolve();
    return new Promise((resolve) => {
      this._adPlaying = true;
      this._muteGame(true);
      this.sdk.ad.requestAd('midgame', {
        adStarted: () => { this._adPlaying = true; },
        adFinished: () => { this._adPlaying = false; this._restoreAudio(); resolve(); },
        adError: () => { this._adPlaying = false; this._restoreAudio(); resolve(); },
      });
    });
  },

  // Rewarded ad: user opts in for a bonus
  // Returns a promise that resolves to true (watched) or false (skipped/error)
  requestRewarded() {
    if (!this.available) return Promise.resolve(false);
    return new Promise((resolve) => {
      this._adPlaying = true;
      this._muteGame(true);
      this.sdk.ad.requestAd('rewarded', {
        adStarted: () => { this._adPlaying = true; },
        adFinished: () => { this._adPlaying = false; this._restoreAudio(); resolve(true); },
        adError: () => { this._adPlaying = false; this._restoreAudio(); resolve(false); },
      });
    });
  },

  _restoreAudio() {
    // Restore audio to what it was before ad, unless platform says mute
    if (this.sdk && this.sdk.game && this.sdk.game.settings && this.sdk.game.settings.muteAudio) {
      this._muteGame(true);
    } else {
      // Restore to user's preference (soundEnabled was set before ad)
      this._muteGame(false);
    }
  },

  // --- Data (cloud save) ---
  // Drop-in replacement for localStorage, syncs across devices on CrazyGames
  dataGet(key) {
    if (this.available && this.sdk.data) {
      try { return this.sdk.data.getItem(key); } catch (e) {}
    }
    try { return localStorage.getItem(key); } catch (e) { return null; }
  },

  dataSet(key, value) {
    if (this.available && this.sdk.data) {
      try { this.sdk.data.setItem(key, value); return; } catch (e) {}
    }
    try { localStorage.setItem(key, value); } catch (e) {}
  },

  dataRemove(key) {
    if (this.available && this.sdk.data) {
      try { this.sdk.data.removeItem(key); return; } catch (e) {}
    }
    try { localStorage.removeItem(key); } catch (e) {}
  },
};