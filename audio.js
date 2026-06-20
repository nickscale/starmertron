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
        
        gain.gain.setValueAtTime(0.24, time);
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

    // Play projectile destruction sound (retro pop)
    playProjectileDestroy() {
        if (!this.ctx || this.isMuted || !this.noiseBuffer) return;
        this.resumeContext();

        const time = this.ctx.currentTime;
        
        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = this.noiseBuffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, time);
        filter.frequency.exponentialRampToValueAtTime(150, time + 0.15);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.linearRampToValueAtTime(0.01, time + 0.18);
        
        noiseNode.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterVolume);
        
        noiseNode.start(time);
        noiseNode.stop(time + 0.2);
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

    // Play characterful boss sound effects

    // 1. Sewage Tank: Low, wet, gurgling sound (bubbly lowpass sweep)
    playSewageShoot() {
        if (!this.ctx || this.isMuted) return;
        this.resumeContext();
        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(90, time);
        // Fast pitch modulation
        osc.frequency.linearRampToValueAtTime(150, time + 0.1);
        osc.frequency.linearRampToValueAtTime(45, time + 0.3);

        filter.type = 'peaking';
        filter.frequency.setValueAtTime(300, time);
        filter.frequency.linearRampToValueAtTime(80, time + 0.3);
        filter.Q.setValueAtTime(12, time);

        gain.gain.setValueAtTime(0.45, time);
        gain.gain.linearRampToValueAtTime(0.01, time + 0.32);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterVolume);

        osc.start(time);
        osc.stop(time + 0.33);
    }

    // 2. Lords Wig Boss: Dramatic royal fanfare chord/sweep
    playWigShoot() {
        if (!this.ctx || this.isMuted) return;
        this.resumeContext();
        const time = this.ctx.currentTime;

        // Combine three oscillators for a majestic retro chord (A-major)
        const frequencies = [440, 554.37, 659.25]; // A4, C#5, E5
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.45);

        frequencies.forEach(freq => {
            const osc = this.ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, time);
            osc.frequency.linearRampToValueAtTime(freq * 1.5, time + 0.4); // sweep up
            osc.connect(gain);
            osc.start(time);
            osc.stop(time + 0.46);
        });

        gain.connect(this.masterVolume);
    }

    // playLordsGrumble: Low, grumpy grumbling sound (LFO-modulated low sawtooth/square wave)
    playLordsGrumble() {
        if (!this.ctx || this.isMuted) return;
        this.resumeContext();
        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, time);
        // Pitch variation to sound like mumbling/grumbling speech
        osc.frequency.linearRampToValueAtTime(110, time + 0.15);
        osc.frequency.linearRampToValueAtTime(70, time + 0.3);
        osc.frequency.linearRampToValueAtTime(90, time + 0.45);

        lfo.type = 'square';
        lfo.frequency.setValueAtTime(15, time); // 15Hz vibrato/grumble texture
        lfoGain.gain.setValueAtTime(20, time);

        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        osc.connect(gain);
        gain.connect(this.masterVolume);

        lfo.start(time);
        osc.start(time);
        lfo.stop(time + 0.52);
        osc.stop(time + 0.52);
    }

    // 3. Ed Davey: Cartoon bouncy spring boing!
    playEdBungee() {
        if (!this.ctx || this.isMuted) return;
        this.resumeContext();
        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, time);
        // Bouncy modulation
        osc.frequency.exponentialRampToValueAtTime(400, time + 0.12);
        osc.frequency.exponentialRampToValueAtTime(200, time + 0.22);
        osc.frequency.exponentialRampToValueAtTime(500, time + 0.32);
        osc.frequency.exponentialRampToValueAtTime(80, time + 0.45);

        gain.gain.setValueAtTime(0.35, time);
        gain.gain.linearRampToValueAtTime(0.01, time + 0.46);

        osc.connect(gain);
        gain.connect(this.masterVolume);

        osc.start(time);
        osc.stop(time + 0.47);
    }

    // 4. Exploding Brain: Psychic alarm/FM vibrato
    playBrainVibrate() {
        if (!this.ctx || this.isMuted) return;
        this.resumeContext();
        const time = this.ctx.currentTime;
        const carrier = this.ctx.createOscillator();
        const modulator = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        const gain = this.ctx.createGain();

        carrier.type = 'sawtooth';
        carrier.frequency.setValueAtTime(600, time);
        carrier.frequency.linearRampToValueAtTime(100, time + 0.4);

        modulator.frequency.setValueAtTime(55, time); // 55Hz vibration
        modGain.gain.setValueAtTime(180, time); // large FM index

        gain.gain.setValueAtTime(0.28, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);
        carrier.connect(gain);
        gain.connect(this.masterVolume);

        modulator.start(time);
        carrier.start(time);
        modulator.stop(time + 0.42);
        carrier.stop(time + 0.42);
    }

    // 5. Mandipede: Sinister snake-like hiss
    playMandipedeHiss() {
        if (!this.ctx || this.isMuted || !this.noiseBuffer) return;
        this.resumeContext();
        const time = this.ctx.currentTime;
        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(4000, time);
        filter.frequency.exponentialRampToValueAtTime(1200, time + 0.28);
        filter.Q.setValueAtTime(5, time);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35, time);
        gain.gain.linearRampToValueAtTime(0.01, time + 0.3);

        noiseNode.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterVolume);

        noiseNode.start(time);
        noiseNode.stop(time + 0.32);
    }

    // playMandipedeWhine: High-pitched cartoon whining sound
    playMandipedeWhine() {
        if (!this.ctx || this.isMuted) return;
        this.resumeContext();
        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, time);
        // Sweep up and down to whine
        osc.frequency.exponentialRampToValueAtTime(1200, time + 0.2);
        osc.frequency.exponentialRampToValueAtTime(800, time + 0.45);

        gain.gain.setValueAtTime(0.2, time);
        gain.gain.linearRampToValueAtTime(0.01, time + 0.5);

        osc.connect(gain);
        gain.connect(this.masterVolume);

        osc.start(time);
        osc.stop(time + 0.5);
    }

    // 6. Mercedes Boss: Sawtooth diesel engine revving
    playMercedesEngine() {
        if (!this.ctx || this.isMuted) return;
        this.resumeContext();
        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(45, time);
        osc.frequency.linearRampToValueAtTime(130, time + 0.18);
        osc.frequency.linearRampToValueAtTime(35, time + 0.35);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, time);

        gain.gain.setValueAtTime(0.45, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.36);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterVolume);

        osc.start(time);
        osc.stop(time + 0.38);
    }

    // 7. False Teeth Boss: Woodblock chattering chomp
    playTeethChomp() {
        if (!this.ctx || this.isMuted) return;
        this.resumeContext();
        const time = this.ctx.currentTime;

        // Quick triple-tap click (chomp)
        const delayTimes = [0, 0.08, 0.16];
        delayTimes.forEach(delay => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800, time + delay);
            osc.frequency.linearRampToValueAtTime(200, time + delay + 0.04);

            gain.gain.setValueAtTime(0.38, time + delay);
            gain.gain.linearRampToValueAtTime(0.01, time + delay + 0.05);

            osc.connect(gain);
            gain.connect(this.masterVolume);

            osc.start(time + delay);
            osc.stop(time + delay + 0.06);
        });
    }

    // Big Ben Boss: Low resonant chime sound
    playBigBenChime() {
        if (!this.ctx || this.isMuted) return;
        this.resumeContext();
        const time = this.ctx.currentTime;

        // Westminster style bell: fundamental low E-key note (164.81Hz) + harmonics
        const frequencies = [164.81, 329.63, 493.88, 739.99]; 
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 1.25);

        frequencies.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            osc.type = index === 0 ? 'sawtooth' : 'sine';
            osc.frequency.setValueAtTime(freq, time);
            osc.connect(gain);
            osc.start(time);
            osc.stop(time + 1.3);
        });

        gain.connect(this.masterVolume);
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

    // Play wave transition sound with a spacey, echoing delay/reverb effect
    playTransitionSound() {
        if (!this.ctx || this.isMuted) return;
        this.resumeContext();

        const time = this.ctx.currentTime;
        
        // Dual oscillators for a rich retro synth sound
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const mainGain = this.ctx.createGain();
        const delayNode = this.ctx.createDelay(1.5);
        const feedbackGain = this.ctx.createGain();

        // Sweeping frequencies: from 400Hz to 1200Hz
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(400, time);
        osc1.frequency.exponentialRampToValueAtTime(1200, time + 0.4);

        osc2.type = 'square';
        osc2.frequency.setValueAtTime(404, time); // detuned
        osc2.frequency.exponentialRampToValueAtTime(1212, time + 0.4);

        // Sweeping bandpass/lowpass filter for a retro chiptune spacey swoosh
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, time);
        filter.frequency.exponentialRampToValueAtTime(3200, time + 0.35);
        filter.Q.setValueAtTime(5, time);

        // Amplitude envelope for the initial sweep
        mainGain.gain.setValueAtTime(0.22, time);
        mainGain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

        // Config feedback echo loop: 180ms delay time
        delayNode.delayTime.setValueAtTime(0.18, time);
        feedbackGain.gain.setValueAtTime(0.42, time);
        // Ramp down feedback to zero to gracefully clear the loop and prevent resource leaks
        feedbackGain.gain.linearRampToValueAtTime(0.0, time + 1.2);

        // Node connections
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(mainGain);

        // Dry signal
        mainGain.connect(this.masterVolume);

        // Wet signal (delay loop)
        mainGain.connect(delayNode);
        delayNode.connect(feedbackGain);
        feedbackGain.connect(delayNode);
        delayNode.connect(this.masterVolume);

        // Start synth trigger
        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + 0.45);
        osc2.stop(time + 0.45);

        // Disconnect nodes to prevent any memory retention once sound decays
        setTimeout(() => {
            try {
                osc1.disconnect();
                osc2.disconnect();
                filter.disconnect();
                mainGain.disconnect();
                delayNode.disconnect();
                feedbackGain.disconnect();
            } catch (e) {
                // Keep robust against closed context errors
            }
        }, 1500);
    }
}

// Global audio engine instance
const audio = new RetroAudioEngine();
window.audio = audio; // expose globally
