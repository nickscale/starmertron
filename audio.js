class RetroAudioEngine {
    constructor() {
        this.ctx = null;
        this.musicInterval = null;
        this.isMuted = false;
        this.masterVolume = null;
        
        // Cyberpunk driving bassline frequencies (A minor / retro scale)
        // A1 (55Hz), C2 (65.4Hz), D2 (73.4Hz), E2 (82.4Hz), G2 (98.0Hz)
        this.bassNotes = [
            55.00, 55.00, 65.41, 65.41, 
            73.42, 73.42, 82.41, 98.00,
            55.00, 55.00, 65.41, 65.41,
            73.42, 73.42, 98.00, 110.00
        ];
        this.bassStep = 0;
        this.isPlayingMusic = false;
        
        // Pre-create noise buffer for explosions
        this.noiseBuffer = null;
    }

    init() {
        if (this.ctx) return;
        
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        
        try {
            this.ctx = new AudioContextClass();
            
            // Set up master volume node
            this.masterVolume = this.ctx.createGain();
            this.masterVolume.gain.setValueAtTime(0.2, this.ctx.currentTime); // Low default volume
            this.masterVolume.connect(this.ctx.destination);
            
            this.createNoiseBuffer();
        } catch (e) {
            console.error("Failed to initialize Web Audio API:", e);
        }
    }

    createNoiseBuffer() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 1.5; // 1.5 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        this.noiseBuffer = buffer;
    }

    resumeContext() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterVolume) {
            this.masterVolume.gain.setValueAtTime(this.isMuted ? 0 : 0.2, this.ctx.currentTime);
        }
        return this.isMuted;
    }

    // Play retro laser shoot sound
    playShoot() {
        if (!this.ctx || this.isMuted) return;
        this.resumeContext();

        const time = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle'; // Retro chiptune feel
        osc.frequency.setValueAtTime(800, time);
        // Rapid pitch sweep down
        osc.frequency.exponentialRampToValueAtTime(100, time + 0.15);
        
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.linearRampToValueAtTime(0.01, time + 0.15);
        
        osc.connect(gain);
        gain.connect(this.masterVolume);
        
        osc.start(time);
        osc.stop(time + 0.16);
    }

    // Play retro explosion sound
    playExplosion() {
        if (!this.ctx || this.isMuted || !this.noiseBuffer) return;
        this.resumeContext();

        const time = this.ctx.currentTime;
        
        // Noise source
        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = this.noiseBuffer;
        
        // Synthesizer lowpass filter sweep to simulate blast depth
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, time);
        filter.frequency.exponentialRampToValueAtTime(80, time + 0.6);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.8, time);
        gain.gain.linearRampToValueAtTime(0.01, time + 0.65);
        
        noiseNode.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterVolume);
        
        // Add a deep pitch oscillator sub-bass kick
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, time);
        osc.frequency.linearRampToValueAtTime(30, time + 0.3);
        
        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0.5, time);
        oscGain.gain.linearRampToValueAtTime(0.01, time + 0.3);
        
        osc.connect(oscGain);
        oscGain.connect(this.masterVolume);
        
        noiseNode.start(time);
        noiseNode.stop(time + 0.7);
        osc.start(time);
        osc.stop(time + 0.3);
    }

    // Play retro item collection sound (chirpy arpeggio)
    playCollect() {
        if (!this.ctx || this.isMuted) return;
        this.resumeContext();

        const time = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'square'; // Blippy 8-bit sound
        
        // Fast pitch arpeggio
        osc.frequency.setValueAtTime(523.25, time); // C5
        osc.frequency.setValueAtTime(659.25, time + 0.06); // E5
        osc.frequency.setValueAtTime(783.99, time + 0.12); // G5
        osc.frequency.setValueAtTime(1046.50, time + 0.18); // C6
        
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.setValueAtTime(0.2, time + 0.18);
        gain.gain.linearRampToValueAtTime(0.01, time + 0.3);
        
        osc.connect(gain);
        gain.connect(this.masterVolume);
        
        osc.start(time);
        osc.stop(time + 0.3);
    }

    // Play player death sound
    playPlayerDeath() {
        if (!this.ctx || this.isMuted) return;
        this.resumeContext();

        const time = this.ctx.currentTime;
        
        // Descending metal sweep sound
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(300, time);
        osc1.frequency.linearRampToValueAtTime(50, time + 0.8);
        
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(305, time);
        osc2.frequency.linearRampToValueAtTime(45, time + 0.8);
        
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.8);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterVolume);
        
        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + 0.85);
        osc2.stop(time + 0.85);
        
        // Add a bit of white noise crash
        if (this.noiseBuffer) {
            const noiseNode = this.ctx.createBufferSource();
            noiseNode.buffer = this.noiseBuffer;
            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.4, time);
            noiseGain.gain.linearRampToValueAtTime(0.01, time + 0.8);
            noiseNode.connect(noiseGain);
            noiseGain.connect(this.masterVolume);
            noiseNode.start(time);
            noiseNode.stop(time + 0.85);
        }
    }

    // Play background looping retro synthesizer music
    startMusic() {
        if (this.isPlayingMusic) return;
        this.init();
        this.resumeContext();
        
        this.isPlayingMusic = true;
        this.bassStep = 0;
        
        const noteDuration = 0.22; // 220ms step time (~136 BPM)
        
        this.musicInterval = setInterval(() => {
            if (!this.ctx || this.isMuted) return;
            
            const time = this.ctx.currentTime;
            const frequency = this.bassNotes[this.bassStep];
            
            // Core bass oscillator (warm triangle/sine sub)
            const subOsc = this.ctx.createOscillator();
            subOsc.type = 'triangle';
            subOsc.frequency.setValueAtTime(frequency, time);
            
            // High grit oscillator (sawtooth with short decay for retro pluck)
            const gritOsc = this.ctx.createOscillator();
            gritOsc.type = 'sawtooth';
            gritOsc.frequency.setValueAtTime(frequency * 2, time); // Octave up
            
            const pluckGain = this.ctx.createGain();
            pluckGain.gain.setValueAtTime(0.12, time);
            pluckGain.gain.exponentialRampToValueAtTime(0.005, time + 0.15);
            
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(250, time);
            filter.frequency.exponentialRampToValueAtTime(100, time + 0.18);
            
            subOsc.connect(pluckGain);
            gritOsc.connect(pluckGain);
            pluckGain.connect(filter);
            filter.connect(this.masterVolume);
            
            subOsc.start(time);
            gritOsc.start(time);
            subOsc.stop(time + noteDuration);
            gritOsc.stop(time + noteDuration);
            
            // Advance pattern sequence
            this.bassStep = (this.bassStep + 1) % this.bassNotes.length;
        }, noteDuration * 1000);
    }

    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
        this.isPlayingMusic = false;
    }
}

// Global audio engine instance
const audio = new RetroAudioEngine();
window.audio = audio; // expose globally
