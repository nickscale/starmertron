// Game Configuration Constants
let ARENA_WIDTH = 1024;
let ARENA_HEIGHT = 768;
let ARENA_CEILING = 0;

// Game State Variables
let gameState = 'START'; // START, PLAYING, PAUSED, GAMEOVER
let score = 0;

// Session cookie helpers for High Score
function getHighScoreCookie() {
    const name = "starmertron_hiscore=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return parseInt(c.substring(name.length, c.length), 10) || 0;
        }
    }
    return 0;
}

function setHighScoreCookie(scoreVal) {
    document.cookie = "starmertron_hiscore=" + scoreVal + "; path=/; SameSite=Strict";
}

function clearHighScoreCookie() {
    document.cookie = "starmertron_hiscore=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict";
}

function isHardReload() {
    try {
        const navs = performance.getEntriesByType("navigation");
        if (navs.length > 0 && navs[0].type === "reload") {
            const resources = performance.getEntriesByType("resource");
            const relevant = resources.filter(r => r.name.includes("game.js") || r.name.includes("style.css") || r.name.includes("audio.js"));
            if (relevant.length > 0) {
                return relevant.some(r => r.transferSize > 0);
            }
        }
    } catch (e) {
        console.error(e);
    }
    return false;
}

// Clear high score if page is loaded for the first time or via hard reload
const initNavs = performance.getEntriesByType("navigation");
const isFirstTime = initNavs.length > 0 && initNavs[0].type === "navigate";
const isHard = isHardReload();

if (isFirstTime || isHard) {
    clearHighScoreCookie();
}

let hiScore = getHighScoreCookie();
let lives = 10; // Start with 10 lives
let currentWave = 1;
let waveTransitionTimer = 0;
let waveCompleteDelayTimer = 0;
let waveStartDelayTimer = 0;
let timeSinceLastKill = 0;
let bombSpawnCooldownTimer = 0;
let shakeTime = 0;
let shakeIntensity = 0;

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// DOM Elements for UI Updates
const hudScore = document.getElementById('hud-score');
const hudHiScore = document.getElementById('hud-hiscore');
const hudLives = document.getElementById('hud-lives');
const hudWave = document.getElementById('hud-wave');

// HUD Top Action Buttons
const hudMuteBtn = document.getElementById('hud-btn-mute');
const hudPauseBtn = document.getElementById('hud-btn-pause');

const uiOverlay = document.getElementById('ui-overlay');
const screenStart = document.getElementById('screen-start');
const screenGameOver = document.getElementById('screen-gameover');
const screenPaused = document.getElementById('screen-paused');

const finalScore = document.getElementById('final-score');
const finalWave = document.getElementById('final-wave');

// Buttons
const btnStart = document.getElementById('btn-start');
const btnRestart = document.getElementById('btn-restart');
const btnResume = document.getElementById('btn-resume');

// Touch controls input state
let touchMoveX = 0;
let touchMoveY = 0;

// Detect touch capability comprehensively
const isTouchDevice = ('ontouchstart' in window) || 
                      (navigator.maxTouchPoints > 0) || 
                      (navigator.msMaxTouchPoints > 0) ||
                      window.matchMedia("(pointer: coarse)").matches;

// Game Entities Arrays
let player = null;
let bullets = [];
let enemyBullets = [];
let enemies = [];
let collectibles = [];
let particles = [];

// Preload Starmer face image
const starmerImg = new Image();
starmerImg.src = 'starmer_face.png';

// Preload Lord wig image
const lordWigImg = new Image();
lordWigImg.src = 'lord_wig.png';

// Preload mini-boss images
const zackImg = new Image();
zackImg.src = 'zack_face.png';

const kemiImg = new Image();
kemiImg.src = 'kemi_face.png';

const farageImg = new Image();
farageImg.src = 'farage_face.png';

const edImg = new Image();
edImg.src = 'ed_face.png';

// Preload party logo images
const toryLogoImg = new Image();
toryLogoImg.src = 'tory_logo.png';

const reformLogoImg = new Image();
reformLogoImg.src = 'reform_logo.png';

const greenLogoImg = new Image();
greenLogoImg.src = 'green_logo.png';

const libdemLogoImg = new Image();
libdemLogoImg.src = 'libdem_logo.png';

// Preload Mandipede head image
const mandipedeFaceImg = new Image();
mandipedeFaceImg.src = 'mandipede_face.png';

// Preload Euro sprite and cent images
const euroSpriteImg = new Image();
euroSpriteImg.src = 'euro_sprite.png';

const euroCentImg = new Image();
euroCentImg.src = 'euro_cent.png';

// Preload handcuffs image
const handcuffsImg = new Image();
handcuffsImg.src = 'handcuffs.png';

// Preload newly replaced sprites (banknotes, cigarettes, student cap)
const banknotesImg = new Image();
banknotesImg.src = 'banknotes.png';

const cigarettesImg = new Image();
cigarettesImg.src = 'cigarettes.png';

const diplomaImg = new Image();
diplomaImg.src = 'diploma.png';

const brainBossImg = new Image();
brainBossImg.src = 'brain_boss.png';

const newspaperImg = new Image();
newspaperImg.src = 'newspaper.png';

const bloodBagImg = new Image();
bloodBagImg.src = 'blood_bag.png';

const breakfastImg = new Image();
breakfastImg.src = 'breakfast.png';

const lettuceImg = new Image();
lettuceImg.src = 'lettuce.png';

const mopHeadImg = new Image();
mopHeadImg.src = 'mop_head.png';

const pigImg = new Image();
pigImg.src = 'pig.png';

const tabloidImg = new Image();
tabloidImg.src = 'tabloid.png';

const prisonGateImg = new Image();
prisonGateImg.src = 'prison_gate.png';

const englishFlagImg = new Image();
englishFlagImg.src = 'english_flag.png';

const whatsappImg = new Image();
whatsappImg.src = 'whatsapp.png';

const cannabisImg = new Image();
cannabisImg.src = 'cannabis.png';

const tieDyeImg = new Image();
tieDyeImg.src = 'tie_dye.png';

const labourLogoImg = new Image();
labourLogoImg.src = 'labour_party_logo_sprite.png';

const bonusRoseImg = new Image();
bonusRoseImg.src = 'bonus_rose.png';

const candyflossImg = new Image();
candyflossImg.src = 'candyfloss.png';

const toffeeAppleImg = new Image();
toffeeAppleImg.src = 'toffee_apple.png';

const partyHatImg = new Image();
partyHatImg.src = 'party_hat.png';

const partyRingsImg = new Image();
partyRingsImg.src = 'party_rings.png';

const cakeImg = new Image();
cakeImg.src = 'cake.png';





// Input Management
const keys = {};
let isStrafing = false;

// Initialize HI-SCORE in UI
hudHiScore.textContent = String(hiScore).padStart(6, '0');

// Responsive Canvas Auto-Resize Logic (Responsive Bezel Fitting)
function resizeCanvas() {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    if (width <= 0 || height <= 0) return;
    
    canvas.width = width;
    canvas.height = height;

    // Calculate aspect ratio clamped between 9:16 (tall) and 16:9 (wide)
    let aspect = width / height;
    aspect = Math.max(9 / 16, Math.min(16 / 9, aspect));

    // Limit longest dimension to 1024 pixels to ensure consistent coordinate sizes and speeds
    if (aspect >= 1) {
        ARENA_WIDTH = 1024;
        ARENA_HEIGHT = 1024 / aspect;
    } else {
        ARENA_HEIGHT = 1024;
        ARENA_WIDTH = 1024 * aspect;
    }
    ARENA_CEILING = 0;

    // Clamp all existing entities to new boundaries so they don't get trapped off-screen
    if (player) {
        player.x = Math.max(player.radius + 15, Math.min(ARENA_WIDTH - player.radius - 15, player.x));
        player.y = Math.max(player.radius + ARENA_CEILING, Math.min(ARENA_HEIGHT - player.radius - 15, player.y));
    }
    if (enemies && enemies.length > 0) {
        enemies.forEach(enemy => {
            enemy.x = Math.max(enemy.radius + 15, Math.min(ARENA_WIDTH - enemy.radius - 15, enemy.x));
            enemy.y = Math.max(enemy.radius + ARENA_CEILING + 10, Math.min(ARENA_HEIGHT - enemy.radius - 15, enemy.y));
        });
    }
    if (collectibles && collectibles.length > 0) {
        collectibles.forEach(col => {
            col.x = Math.max(col.radius + 15, Math.min(ARENA_WIDTH - col.radius - 15, col.x));
            col.y = Math.max(col.radius + ARENA_CEILING + 10, Math.min(ARENA_HEIGHT - col.radius - 15, col.y));
        });
    }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Trigger immediately to fit screen layout

// Key Listeners
window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }
    
    keys[e.key.toLowerCase()] = true;

    if (e.key === 'Shift') {
        isStrafing = true;
    }

    // Secret Invincibility Cheat Mode (Shift+I key)
    if (e.key.toLowerCase() === 'i' && e.shiftKey) {
        if (player) {
            player.isInvincibleCheat = !player.isInvincibleCheat;
            showNotification(player.isInvincibleCheat ? "INVINCIBILITY CHEAT: ON" : "INVINCIBILITY CHEAT: OFF");
            updateLivesUI();
        }
    }

    // Secret Kill All Enemies Cheat Mode (Shift+K key)
    if (e.key.toLowerCase() === 'k' && e.shiftKey) {
        if (gameState === 'PLAYING') {
            enemies = [];
            showNotification("CHEAT: WAVE PURGED!");
        }
    }

    // Toggle Pause
    if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        if (gameState === 'PLAYING') {
            pauseGame();
        } else if (gameState === 'PAUSED') {
            resumeGame();
        }
    }

    // Toggle Mute
    if (e.key.toLowerCase() === 'm') {
        const muted = window.audio.toggleMute();
        showNotification(muted ? "SOUND MUTED" : "SOUND ON");
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    
    if (e.key === 'Shift') {
        isStrafing = false;
    }
});

hudMuteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const muted = window.audio.toggleMute();
    hudMuteBtn.textContent = muted ? "UNMUTE" : "MUTE";
    showNotification(muted ? "SOUND MUTED" : "SOUND ON");
});

hudPauseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (gameState === 'PLAYING') {
        pauseGame();
    } else if (gameState === 'PAUSED') {
        resumeGame();
    }
});

btnResume.addEventListener('click', (e) => {
    e.stopPropagation();
    resumeGame();
});

btnStart.addEventListener('click', () => {
    window.audio.init();

    // Fullscreen toggle request (mobile only)
    const wantFullscreen = isTouchDevice;
    if (wantFullscreen) {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
            docEl.requestFullscreen().catch(err => console.log(err));
        } else if (docEl.webkitRequestFullscreen) {
            docEl.webkitRequestFullscreen();
        }
    }

    // Reset HUD text indicators
    hudPauseBtn.textContent = "PAUSE";

    startGame();
});

btnRestart.addEventListener('click', () => {
    window.audio.init();
    
    // Fullscreen toggle request (mobile only)
    const wantFullscreen = isTouchDevice && !document.fullscreenElement;
    if (wantFullscreen) {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
            docEl.requestFullscreen().catch(err => console.log(err));
        } else if (docEl.webkitRequestFullscreen) {
            docEl.webkitRequestFullscreen();
        }
    }

    // Reset HUD text indicators
    hudPauseBtn.textContent = "PAUSE";

    startGame();
});

// HUD overlay notification settings
let notificationTimer = 0;
let notificationText = "";
function showNotification(text, duration = 110) {
    notificationText = text;
    notificationTimer = duration; // Slightly longer to read specific wave names
}

// ----------------------------------------------------
// Entity Classes
// ----------------------------------------------------

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 28; 
        this.speed = 4.2; 
        this.facingAngle = -Math.PI / 2; // Facing UP initially
        this.fireCooldown = 0;
        this.fireRate = 135; 
        this.invulnerabilityFrames = 120;
        this.isInvincibleCheat = false; // Secret cheat mode state
        this.bonusInvincibilityTimer = 0; // 3 seconds bonus invincibility (ms)
        this.threeWayTimer = 0; // Three-way firing powerup timer (ms)
        this.bouncyShotsTimer = 0; // Bouncy shots powerup timer (ms)
    }

    update(deltaTime) {
        let dx = 0;
        let dy = 0;

        if (keys['w'] || keys['arrowup']) dy -= 1;
        if (keys['s'] || keys['arrowdown']) dy += 1;
        if (keys['a'] || keys['arrowleft']) dx -= 1;
        if (keys['d'] || keys['arrowright']) dx += 1;

        if (touchMoveX !== 0 || touchMoveY !== 0) {
            dx = touchMoveX;
            dy = touchMoveY;
        } else if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
        }

        this.x += dx * this.speed;
        this.y += dy * this.speed;

        this.x = Math.max(this.radius + 15, Math.min(ARENA_WIDTH - this.radius - 15, this.x));
        this.y = Math.max(this.radius + ARENA_CEILING, Math.min(ARENA_HEIGHT - this.radius - 15, this.y));

        if (!isStrafing) {
            if (dx !== 0 || dy !== 0) {
                this.facingAngle = Math.atan2(dy, dx);
            }
        }

        if (this.fireCooldown <= 0) {
            this.shoot();
            this.fireCooldown = this.fireRate;
        } else {
            this.fireCooldown -= deltaTime;
        }

        if (this.invulnerabilityFrames > 0) {
            this.invulnerabilityFrames--;
        }

        if (this.bonusInvincibilityTimer > 0) {
            this.bonusInvincibilityTimer -= deltaTime;
            if (this.bonusInvincibilityTimer < 0) {
                this.bonusInvincibilityTimer = 0;
            }
        }

        if (this.threeWayTimer > 0) {
            this.threeWayTimer -= deltaTime;
            if (this.threeWayTimer < 0) {
                this.threeWayTimer = 0;
            }
        }

        if (this.bouncyShotsTimer > 0) {
            this.bouncyShotsTimer -= deltaTime;
            if (this.bouncyShotsTimer < 0) {
                this.bouncyShotsTimer = 0;
            }
        }
    }

    shoot() {
        const bulletSpeed = 8.0; 
        const shootAngle = this.facingAngle;
        const bx = this.x + Math.cos(shootAngle) * 20; // Spawn closer to floating mouth
        const by = this.y + Math.sin(shootAngle) * 20;

        if (this.threeWayTimer > 0) {
            // Three-way splay: center, left (-18 degrees / -0.314 rad), right (+18 degrees / +0.314 rad)
            const angles = [shootAngle, shootAngle - 0.314, shootAngle + 0.314];
            angles.forEach(angle => {
                const vx = Math.cos(angle) * bulletSpeed;
                const vy = Math.sin(angle) * bulletSpeed;
                bullets.push(new Bullet(bx, by, vx, vy, 'player'));
            });
        } else {
            const vx = Math.cos(shootAngle) * bulletSpeed;
            const vy = Math.sin(shootAngle) * bulletSpeed;
            bullets.push(new Bullet(bx, by, vx, vy, 'player'));
        }
        window.audio.playShoot();
    }

    draw() {
        if (this.invulnerabilityFrames > 0 && Math.floor(this.invulnerabilityFrames / 6) % 2 === 0) {
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);

        // Rainbow halo outline if invincibility cheat active or bonus active (Visual feedback)
        if (this.isInvincibleCheat || this.bonusInvincibilityTimer > 0) {
            ctx.save();
            ctx.strokeStyle = `hsl(${(Date.now() / 4) % 360}, 100%, 65%)`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Draw Starmer's floating head image
        ctx.drawImage(starmerImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);

        ctx.restore();
    }
}

class Bullet {
    constructor(x, y, vx, vy, origin = 'player', type = 'laser') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = type === 'dropping' ? 6 : (type === 'brown_lump' ? 9 : (type === 'brown_peanut' ? 12 : (type === 'silver_coin' ? 28 : (type === 'diesel_smoke' ? 14 : 4))));
        this.origin = origin;
        this.type = type; // 'laser' or 'dropping' or 'brown_lump' or 'brown_peanut' or 'silver_coin' or 'diesel_smoke'
        this.bounceCount = 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Feces dropping splat check on bottom border (y=748 approx)
        if (this.type === 'dropping' && this.y >= ARENA_HEIGHT - 20) {
            // Splat particles
            for (let i = 0; i < 6; i++) {
                particles.push(new Particle(this.x, ARENA_HEIGHT - 20, '#ffffff'));
            }
            // Trigger splat sound
            window.audio.playPlayerDeath(); // low crash splat
            this.y = ARENA_HEIGHT + 50; // Force cleanup out of bounds
        }

        // Bouncy shots check (only for player bullets if bouncy timer is active)
        if (this.origin === 'player' && player && player.bouncyShotsTimer > 0) {
            // Left boundary
            if (this.x - this.radius <= 15) {
                this.x = 15 + this.radius + 1;
                this.vx = Math.abs(this.vx);
                this.bounceCount = (this.bounceCount || 0) + 1;
            }
            // Right boundary
            else if (this.x + this.radius >= ARENA_WIDTH - 15) {
                this.x = ARENA_WIDTH - 15 - this.radius - 1;
                this.vx = -Math.abs(this.vx);
                this.bounceCount = (this.bounceCount || 0) + 1;
            }

            // Top boundary
            if (this.y - this.radius <= ARENA_CEILING + 5) {
                this.y = ARENA_CEILING + 5 + this.radius + 1;
                this.vy = Math.abs(this.vy);
                this.bounceCount = (this.bounceCount || 0) + 1;
            }
            // Bottom boundary
            else if (this.y + this.radius >= ARENA_HEIGHT - 15) {
                this.y = ARENA_HEIGHT - 15 - this.radius - 1;
                this.vy = -Math.abs(this.vy);
                this.bounceCount = (this.bounceCount || 0) + 1;
            }

            if (this.bounceCount > 4) {
                this.x = -100; // Force cleanup out of bounds
            }
        }
    }

    draw() {
        ctx.save();
        if (this.type === 'dropping') {
            // White splat dropping from Lib Dem bird
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Drip tail
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x, this.y - 12);
            ctx.stroke();
        } else if (this.type === 'brown_lump') {
            // Lumpy organic sewage mass
            ctx.fillStyle = '#8b5a2b';
            ctx.strokeStyle = '#5c3818';
            ctx.lineWidth = 1.8;
            
            ctx.beginPath();
            const r = this.radius;
            // Draw overlapping circles to form a lumpy shape
            ctx.arc(this.x, this.y, r * 0.9, 0, Math.PI * 2);
            ctx.arc(this.x - r * 0.3, this.y - r * 0.2, r * 0.7, 0, Math.PI * 2);
            ctx.arc(this.x + r * 0.3, this.y + r * 0.1, r * 0.6, 0, Math.PI * 2);
            ctx.arc(this.x - r * 0.1, this.y + r * 0.3, r * 0.7, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // texture spots
            ctx.fillStyle = '#5c3818';
            ctx.beginPath();
            ctx.arc(this.x - 2, this.y - 1, 2, 0, Math.PI * 2);
            ctx.arc(this.x + 3, this.y + 1, 1.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'brown_peanut') {
            // Sienna brown figure-8 lumpy poop projectile
            const angle = Math.atan2(this.vy, this.vx);
            ctx.translate(this.x, this.y);
            ctx.rotate(angle);
            
            ctx.fillStyle = '#8b5a2b';
            ctx.strokeStyle = '#5c3818';
            ctx.lineWidth = 2;
            
            // Draw overlapping poop segments to look lumpy
            ctx.beginPath();
            ctx.arc(-6, -1, 7, 0, Math.PI * 2);
            ctx.arc(0, 1, 8, 0, Math.PI * 2);
            ctx.arc(6, -1, 6.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Texture spots
            ctx.fillStyle = '#5c3818';
            ctx.beginPath();
            ctx.arc(-3, -2, 1.5, 0, Math.PI * 2);
            ctx.arc(3, 2, 1.2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'silver_coin') {
            // Euro cent symbol dropping down
            ctx.translate(this.x, this.y);
            ctx.drawImage(euroCentImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
        } else if (this.type === 'diesel_smoke') {
            // Dark diesel smoke clouds - drawn with multiple overlapping circles
            ctx.fillStyle = 'rgba(80, 80, 80, 0.45)';
            ctx.strokeStyle = 'rgba(50, 50, 50, 0.6)';
            ctx.lineWidth = 1.5;
            
            ctx.beginPath();
            const r = this.radius;
            ctx.arc(this.x, this.y, r * 0.8, 0, Math.PI * 2);
            ctx.arc(this.x - r * 0.4, this.y - r * 0.2, r * 0.6, 0, Math.PI * 2);
            ctx.arc(this.x + r * 0.4, this.y - r * 0.2, r * 0.6, 0, Math.PI * 2);
            ctx.arc(this.x - r * 0.2, this.y + r * 0.3, r * 0.6, 0, Math.PI * 2);
            ctx.arc(this.x + r * 0.2, this.y + r * 0.3, r * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else {
            // High speed glowing laser lines
            ctx.beginPath();
            const trailX = this.x - this.vx * 1.5;
            const trailY = this.y - this.vy * 1.5;
            
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(trailX, trailY);
            ctx.lineCap = 'round';
            
            const isPlayer = this.origin === 'player';
            ctx.strokeStyle = isPlayer ? 'rgba(0, 229, 255, 0.35)' : 'rgba(255, 42, 42, 0.35)';
            ctx.lineWidth = 7.5;
            ctx.stroke();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.stroke();
        }
        ctx.restore();
    }

    isOutOfBounds() {
        return (
            this.x < -20 || 
            this.x > ARENA_WIDTH + 20 || 
            this.y < -20 || 
            this.y > ARENA_HEIGHT + 20
        );
    }
}

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.type = type; // 'swarmer', 'bouncer', 'shooter', 'wig', 'tory', 'reform', 'green', 'libdem', 'mandipede', 'newspaper', 'ballot_enemy'
        this.angle = 0;
        this.vx = 0;
        this.vy = 0;
        this.bobOffset = Math.random() * Math.PI * 2;
        
        switch (type) {
            case 'swarmer': 
                this.radius = 14;
                this.speed = 1.2 + currentWave * 0.08;
                this.hp = 1;
                this.color = '#39ff14';
                this.scoreValue = 150;
                this.sineOffset = Math.random() * Math.PI * 2;
                break;
            case 'bouncer': 
                this.radius = 24;
                this.hp = 1;
                this.color = '#bf00ff';
                this.scoreValue = 300;
                const angle = Math.random() * Math.PI * 2;
                const bounceSpeed = 1.4 + currentWave * 0.1;
                this.vx = Math.cos(angle) * bounceSpeed;
                this.vy = Math.sin(angle) * bounceSpeed;
                break;
            case 'wig': 
                this.radius = 22;
                this.speed = 0.4 + currentWave * 0.04;
                this.hp = 1;
                this.color = '#e2e2e9';
                this.scoreValue = 200;
                this.bobOffset = Math.random() * Math.PI * 2;
                break;
            case 'newspaper': 
                this.radius = 25.3;
                this.speed = 0.7 + currentWave * 0.06;
                this.hp = 1;
                this.color = '#ffffff';
                this.scoreValue = 180;
                const newsAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(newsAngle) * this.speed;
                this.vy = Math.sin(newsAngle) * this.speed;
                break;
            case 'ballot_enemy': 
                this.radius = 20;
                this.speed = 0.7 + currentWave * 0.05;
                this.hp = 1;
                this.color = '#ff007f';
                this.scoreValue = 120;
                const ballotAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(ballotAngle) * this.speed;
                this.vy = Math.sin(ballotAngle) * this.speed;
                break;
            case 'tory': // Conservative oak tree scribble
                this.radius = 24;
                this.speed = 0.6 + currentWave * 0.05;
                this.hp = 1;
                this.color = '#0087dc';
                this.scoreValue = 200;
                const toryAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(toryAngle) * this.speed;
                this.vy = Math.sin(toryAngle) * this.speed;
                break;
            case 'reform': // Reform UK arrow circle
                this.radius = 24.2;
                this.hp = 1;
                this.color = '#00d2c4';
                this.scoreValue = 350;
                this.state = 'aiming';
                this.timer = 0;
                this.vx = 0;
                this.vy = 0;
                break;
            case 'green': // Green party sunflower globe
                this.radius = 24.2;
                this.speed = 0.35; // Very slowly traverse
                this.hp = 1;
                this.color = '#6ab023';
                this.scoreValue = 180;
                const greenAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(greenAngle) * this.speed;
                this.vy = Math.sin(greenAngle) * this.speed;
                break;
            case 'libdem': // Yellow Lib Dem bird
                this.radius = 24.2;
                this.hp = 1;
                this.color = '#ffd700';
                this.scoreValue = 300;
                this.dropTimer = 0;
                this.vx = 2.2;
                break;
            case 'mandipede': // Boss centipede segment
                this.radius = 18;
                this.hp = 1;
                const blueShades = ['#00e5ff', '#00b0ff', '#2979ff', '#3d5afe', '#1a237e', '#0d47a1', '#002f6c', '#4fc3f7', '#0288d1'];
                this.color = blueShades[Math.floor(Math.random() * blueShades.length)];
                this.scoreValue = 200;
                this.segmentType = 'body'; 
                this.leader = null;
                this.directionY = 1; 
                break;
            case 'sewage_tank':
                this.radius = 45;
                this.hp = 20;
                this.color = '#795548';
                this.scoreValue = 1000;
                this.fireTimer = 0;
                this.angle = 0;
                this.speed = 0.4;
                const sewageAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(sewageAngle) * this.speed;
                this.vy = Math.sin(sewageAngle) * this.speed;
                break;
            case 'euro_chomper':
                this.radius = 22;
                this.hp = 1;
                this.color = '#3f51b5';
                this.scoreValue = 250;
                this.speed = 1.0 + currentWave * 0.05;
                const ecAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(ecAngle) * this.speed;
                this.vy = Math.sin(ecAngle) * this.speed;
                this.chompCycle = 0;
                this.coinTimer = 2500 + Math.random() * 1500;
                break;
            case 'ed_davey':
                this.radius = 48; // giant size
                this.hp = 20; // 20 hits to kill
                this.color = '#ffd700';
                this.scoreValue = 1200;
                this.swingLength = 220;
                this.angle = 0; // bungee accumulator
                this.vx = 2.0; // horizontal speed (will be scaled by 1.6 to 3.2 below)
                break;
            case 'labour_enemy':
                this.radius = 20;
                this.speed = 0.6 + currentWave * 0.05;
                this.hp = 1;
                this.color = '#e51c23';
                this.scoreValue = 200;
                this.fireTimer = Math.random() * 1000;
                const labourAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(labourAngle) * this.speed;
                this.vy = Math.sin(labourAngle) * this.speed;
                break;
            case 'exploding_brain':
                this.radius = 45; // giant brain boss
                this.hp = 20;
                this.color = '#ff80ab';
                this.scoreValue = 250;
                this.speed = 0.5 + currentWave * 0.03;
                break;
            case 'mini_brain':
                this.radius = 10;
                this.hp = 1;
                this.color = '#ff80ab';
                this.scoreValue = 50;
                this.speed = 2.0 + Math.random() * 1.0;
                const mbAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(mbAngle) * this.speed;
                this.vy = Math.sin(mbAngle) * this.speed;
                break;
            case 'tree_trunk':
                this.radius = 22;
                this.hp = 1;
                this.color = '#8d6e63';
                this.scoreValue = 150;
                this.speed = 0.4;
                const ttAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(ttAngle) * this.speed;
                this.vy = Math.sin(ttAngle) * this.speed;
                break;
            case 'cat_enemy':
                this.radius = 18;
                this.hp = 1;
                this.color = '#9e9e9e'; // Grey color
                this.scoreValue = 180;
                this.speed = 0.7;
                const catAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(catAngle) * this.speed;
                this.vy = Math.sin(catAngle) * this.speed;
                break;
            case 'cigarette':
                this.radius = 31; // enlarged
                this.hp = 1;
                this.color = '#eeeeee';
                this.scoreValue = 150;
                this.speed = 0.6;
                const cigAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(cigAngle) * this.speed;
                this.vy = Math.sin(cigAngle) * this.speed;
                break;
            case 'booze_enemy':
                this.radius = 30; // enlarged
                this.hp = 1;
                this.color = '#4caf50';
                this.scoreValue = 200;
                this.speed = 0.5;
                const boozeAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(boozeAngle) * this.speed;
                this.vy = Math.sin(boozeAngle) * this.speed;
                break;
            case 'candy_floss':
                this.radius = 30; // enlarged
                this.hp = 1;
                this.color = '#f48fb1';
                this.scoreValue = 150;
                this.speed = 0.5;
                const cfAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(cfAngle) * this.speed;
                this.vy = Math.sin(cfAngle) * this.speed;
                break;
            case 'toffee_apple':
                this.radius = 27; // enlarged
                this.hp = 1;
                this.color = '#e53935';
                this.scoreValue = 180;
                this.speed = 0.6;
                const taAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(taAngle) * this.speed;
                this.vy = Math.sin(taAngle) * this.speed;
                break;
            case 'party_hat':
                this.radius = 28;
                this.hp = 1;
                this.color = '#ffa726';
                this.scoreValue = 150;
                this.speed = 0.5;
                const phAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(phAngle) * this.speed;
                this.vy = Math.sin(phAngle) * this.speed;
                break;
            case 'party_rings':
                this.radius = 26;
                this.hp = 1;
                this.color = '#ec407a';
                this.scoreValue = 180;
                this.speed = 0.55;
                const prAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(prAngle) * this.speed;
                this.vy = Math.sin(prAngle) * this.speed;
                break;
            case 'cake':
                this.radius = 25;
                this.hp = 1;
                this.color = '#ffd54f';
                this.scoreValue = 200;
                this.speed = 0.5;
                const cakeAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(cakeAngle) * this.speed;
                this.vy = Math.sin(cakeAngle) * this.speed;
                break;
            case 'brighton_rock':
                this.radius = 20;
                this.hp = 1;
                this.color = '#e91e63';
                this.scoreValue = 200;
                this.speed = 0.5;
                const brAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(brAngle) * this.speed;
                this.vy = Math.sin(brAngle) * this.speed;
                break;
            case 'bikini':
                this.radius = 27; // enlarged
                this.hp = 1;
                this.color = '#ff4081';
                this.scoreValue = 150;
                this.speed = 0.6;
                const bikAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(bikAngle) * this.speed;
                this.vy = Math.sin(bikAngle) * this.speed;
                break;
            case 'banknote':
                this.radius = 31; // enlarged
                this.hp = 1;
                this.color = '#4cfc4c';
                this.scoreValue = 180;
                this.speed = 0.5;
                const bnAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(bnAngle) * this.speed;
                this.vy = Math.sin(bnAngle) * this.speed;
                break;
            case 'ooze_bucket':
                this.radius = 30; // enlarged
                this.hp = 1;
                this.color = '#39ff14';
                this.scoreValue = 200;
                this.speed = 0.5;
                const oozeAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(oozeAngle) * this.speed;
                this.vy = Math.sin(oozeAngle) * this.speed;
                break;
            case 'vape':
                this.radius = 26.4; // Bigger Lost Mary vape
                this.hp = 1;
                this.color = '#bf55ec'; // Purple body
                this.scoreValue = 150;
                this.speed = 0.6;
                const vapeAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(vapeAngle) * this.speed;
                this.vy = Math.sin(vapeAngle) * this.speed;
                break;
            case 'breakfast':
                this.radius = 25.3;
                this.hp = 1;
                this.color = '#e0f7fa'; // Plate white
                this.scoreValue = 180;
                this.speed = 0.5;
                const bfAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(bfAngle) * this.speed;
                this.vy = Math.sin(bfAngle) * this.speed;
                break;
            case 'lettuce':
                this.radius = 25.3;
                this.hp = 1;
                this.color = '#4caf50'; // green
                this.scoreValue = 150;
                this.speed = 0.55;
                const letAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(letAngle) * this.speed;
                this.vy = Math.sin(letAngle) * this.speed;
                break;
            case 'mop_head':
                this.radius = 25.3;
                this.hp = 1;
                this.color = '#e0e0e0'; // grey/white
                this.scoreValue = 150;
                this.speed = 0.5;
                const mopAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(mopAngle) * this.speed;
                this.vy = Math.sin(mopAngle) * this.speed;
                break;
            case 'pig':
                this.radius = 27;
                this.hp = 1;
                this.color = '#ff80ab'; // pinkish
                this.scoreValue = 180;
                this.speed = 0.6;
                const pigAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(pigAngle) * this.speed;
                this.vy = Math.sin(pigAngle) * this.speed;
                break;
            case 'tabloid':
                this.radius = 25.3;
                this.hp = 1;
                this.color = '#ffffff'; // white
                this.scoreValue = 150;
                this.speed = 0.55;
                const tabAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(tabAngle) * this.speed;
                this.vy = Math.sin(tabAngle) * this.speed;
                break;
            case 'english_flag':
                this.radius = 26;
                this.hp = 1;
                this.color = '#ffffff'; // white background flag
                this.scoreValue = 180;
                this.speed = 0.55;
                const efAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(efAngle) * this.speed;
                this.vy = Math.sin(efAngle) * this.speed;
                break;
            case 'whatsapp':
                this.radius = 25.3;
                this.hp = 1;
                this.color = '#25d366'; // WhatsApp green
                this.scoreValue = 150;
                this.speed = 0.55;
                const waAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(waAngle) * this.speed;
                this.vy = Math.sin(waAngle) * this.speed;
                break;
            case 'tshirt':
                this.radius = 22;
                this.hp = 1;
                this.color = '#e040fb'; // tie-dye purple
                this.scoreValue = 160;
                this.speed = 0.7;
                const tsAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(tsAngle) * this.speed;
                this.vy = Math.sin(tsAngle) * this.speed;
                break;
            case 'cannabis':
                this.radius = 24;
                this.hp = 1;
                this.color = '#2e7d32'; // cannabis green
                this.scoreValue = 180;
                this.speed = 0.6;
                const canAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(canAngle) * this.speed;
                this.vy = Math.sin(canAngle) * this.speed;
                break;
            case 'tie_dye':
                this.radius = 24;
                this.hp = 1;
                this.color = '#e040fb'; // tie-dye purple
                this.scoreValue = 180;
                this.speed = 0.6;
                const tdAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(tdAngle) * this.speed;
                this.vy = Math.sin(tdAngle) * this.speed;
                break;
            case 'reform_mercedes':
                this.radius = 50;
                this.hp = 20;
                this.color = '#d32f2f'; // Mercedes red
                this.scoreValue = 1500;
                this.speed = 0.5;
                this.fireTimer = 0;
                const mercAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(mercAngle) * this.speed;
                this.vy = Math.sin(mercAngle) * this.speed;
                break;
            case 'false_teeth':
                this.radius = 42;
                this.hp = 999;
                this.color = '#ff4081';
                this.scoreValue = 1500;
                this.speed = 0.4;
                this.angle = 0;
                const teethAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(teethAngle) * this.speed;
                this.vy = Math.sin(teethAngle) * this.speed;
                break;

            case 'needle':
                this.radius = 22.8;
                this.speed = 0.6;
                this.hp = 1;
                this.color = '#e0e0e0';
                this.scoreValue = 180;
                const ndAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(ndAngle) * this.speed;
                this.vy = Math.sin(ndAngle) * this.speed;
                break;
            case 'grad_cap':
                this.radius = 22;
                this.speed = 0.55;
                this.hp = 1;
                this.color = '#212121';
                this.scoreValue = 160;
                const gcAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(gcAngle) * this.speed;
                this.vy = Math.sin(gcAngle) * this.speed;
                break;
            case 'padlocks':
                this.radius = 27.5;
                this.speed = 0.5;
                this.hp = 1;
                this.color = '#ffd700';
                this.scoreValue = 200;
                const plAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(plAngle) * this.speed;
                this.vy = Math.sin(plAngle) * this.speed;
                break;

            case 'lord_wig_boss':
                this.radius = 50; // giant boss size
                this.hp = 20;
                this.color = '#ffffff';
                this.scoreValue = 1500;
                this.speed = 0.4;
                this.fireTimer = 0;
                const lwbAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(lwbAngle) * this.speed;
                this.vy = Math.sin(lwbAngle) * this.speed;
                break;
            case 'zack_miniboss':
                this.radius = 30;
                this.hp = 10;
                this.color = '#6ab023';
                this.scoreValue = 500;
                this.speed = 0.5;
                this.fireTimer = 0;
                const zmbAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(zmbAngle) * this.speed;
                this.vy = Math.sin(zmbAngle) * this.speed;
                break;
            case 'kemi_miniboss':
                this.radius = 30;
                this.hp = 10;
                this.color = '#0087dc';
                this.scoreValue = 500;
                this.speed = 0.5;
                this.fireTimer = 0;
                const kmbAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(kmbAngle) * this.speed;
                this.vy = Math.sin(kmbAngle) * this.speed;
                break;
            case 'farage_miniboss':
                this.radius = 30;
                this.hp = 10;
                this.color = '#00d2c4';
                this.scoreValue = 500;
                this.speed = 0.5;
                this.fireTimer = 0;
                const fmbAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(fmbAngle) * this.speed;
                this.vy = Math.sin(fmbAngle) * this.speed;
                break;
            case 'ed_miniboss':
                this.radius = 30;
                this.hp = 10;
                this.color = '#ffd700';
                this.scoreValue = 500;
                this.speed = 0.5;
                this.fireTimer = 0;
                const embAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(embAngle) * this.speed;
                this.vy = Math.sin(embAngle) * this.speed;
                break;
            case 'tooth':
                this.radius = 10;
                this.hp = 1;
                this.color = '#ffffff';
                this.scoreValue = 100;
                this.parentBoss = null;
                this.angleOffset = 0;
                break;
        }

        // Global speed scaling to make the game feel fast and arcade-like
        if (this.speed) this.speed *= 1.6;
        if (this.vx) this.vx *= 1.6;
        if (this.vy) this.vy *= 1.6;
    }

    update(deltaTime) {
        this.angle += 0.03;

        const layoutWave = 1 + ((currentWave - 1) % 18);

        // Wave 10 Commons Debate: only Labour and Tory logo enemies are stationary
        if (layoutWave === 10) {
            if (this.type === 'labour_enemy') {
                this.fireTimer += deltaTime;
                if (this.fireTimer > 2200) {
                    this.fireTimer = 0;
                    enemyBullets.push(new Bullet(this.x + 22, this.y, 4.0, 0, 'enemy'));
                }
                return;
            }
            else if (this.type === 'tory') {
                if (!this.fireTimer) this.fireTimer = 0;
                this.fireTimer += deltaTime;
                if (this.fireTimer > 2200) {
                    this.fireTimer = 0;
                    enemyBullets.push(new Bullet(this.x - 22, this.y, -4.0, 0, 'enemy'));
                }
                return;
            }
        }

        if (this.type === 'swarmer') {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist > 1) {
                const dirX = dx / dist;
                const dirY = dy / dist;
                const perpX = -dirY;
                const perpY = dirX;
                
                this.sineOffset += 0.06;
                const lateralOffset = Math.sin(this.sineOffset) * 1.2;
                
                this.x += dirX * this.speed + perpX * lateralOffset;
                this.y += dirY * this.speed + perpY * lateralOffset;
            }
        }
        else if (this.type === 'bouncer') {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x - this.radius <= 10) {
                this.x = this.radius + 11;
                this.vx *= -1;
            } else if (this.x + this.radius >= ARENA_WIDTH - 10) {
                this.x = ARENA_WIDTH - this.radius - 11;
                this.vx *= -1;
            }

            if (this.y - this.radius <= ARENA_CEILING) {
                this.y = this.radius + ARENA_CEILING + 1;
                this.vy *= -1;
            } else if (this.y + this.radius >= ARENA_HEIGHT - 10) {
                this.y = ARENA_HEIGHT - this.radius - 11;
                this.vy *= -1;
            }
        }
        else if (this.type === 'wig') {
            this.bobOffset += 0.03;
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 1) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed + Math.sin(this.bobOffset) * 0.3;
            }
        }
        else if (this.type === 'newspaper' || this.type === 'ballot_enemy') {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x - this.radius <= 10 || this.x + this.radius >= ARENA_WIDTH - 10) {
                this.vx *= -1;
            }
            
            if (this.y - this.radius <= ARENA_CEILING) {
                this.y = this.radius + ARENA_CEILING + 1;
                this.vy *= -1;
            } else if (this.y + this.radius >= ARENA_HEIGHT - 10) {
                this.y = ARENA_HEIGHT - this.radius - 11;
                this.vy *= -1;
            }
        }
        else if (this.type === 'tory') {
            this.bobOffset += 0.04;
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off boundaries
            if (this.x - this.radius <= 10) { this.x = this.radius + 11; this.vx = Math.abs(this.vx); }
            else if (this.x + this.radius >= ARENA_WIDTH - 10) { this.x = ARENA_WIDTH - this.radius - 11; this.vx = -Math.abs(this.vx); }
            if (this.y - this.radius <= ARENA_CEILING) { this.y = this.radius + ARENA_CEILING + 1; this.vy = Math.abs(this.vy); }
            else if (this.y + this.radius >= ARENA_HEIGHT - 10) { this.y = ARENA_HEIGHT - this.radius - 11; this.vy = -Math.abs(this.vy); }

            if (layoutWave === 10) {
                if (!this.fireTimer) this.fireTimer = 0;
                this.fireTimer += deltaTime;
                if (this.fireTimer > 2200) {
                    this.fireTimer = 0;
                    enemyBullets.push(new Bullet(this.x - 22, this.y, -4.0, 0, 'enemy'));
                }
            }
        }
        else if (this.type === 'green') {
            // Very slowly traverse around the screen, bouncing off borders
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x - this.radius <= 10) {
                this.x = this.radius + 11;
                this.vx = Math.abs(this.vx);
            } else if (this.x + this.radius >= ARENA_WIDTH - 10) {
                this.x = ARENA_WIDTH - this.radius - 11;
                this.vx = -Math.abs(this.vx);
            }
            
            if (this.y - this.radius <= ARENA_CEILING) {
                this.y = this.radius + ARENA_CEILING + 1;
                this.vy = Math.abs(this.vy);
            } else if (this.y + this.radius >= ARENA_HEIGHT - 10) {
                this.y = ARENA_HEIGHT - this.radius - 11;
                this.vy = -Math.abs(this.vy);
            }
        }
        else if (this.type === 'reform') {
            // Very slowly move towards Starmer, and rotate to point at him
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            this.targetAngle = Math.atan2(dy, dx);
            const dist = Math.hypot(dx, dy);
            if (dist > 1) {
                const slowSpeed = 0.56;
                this.x += (dx / dist) * slowSpeed;
                this.y += (dy / dist) * slowSpeed;
            }
        }
        else if (this.type === 'libdem') {
            // Horizontal back/forth flying near top
            this.x += this.vx;
            
            if (this.x - this.radius <= 10) {
                this.x = this.radius + 11;
                this.vx = Math.abs(this.vx);
            } else if (this.x + this.radius >= ARENA_WIDTH - 10) {
                this.x = ARENA_WIDTH - this.radius - 11;
                this.vx = -Math.abs(this.vx);
            }

            // Drop white feces droppings
            this.dropTimer += deltaTime;
            if (this.dropTimer > 1800 + Math.random() * 800) {
                this.dropTimer = 0;
                enemyBullets.push(new Bullet(this.x, this.y + 12, 0, 4.5, 'enemy', 'dropping'));
            }
        }
        else if (this.type === 'mandipede') {
            if (this.segmentType === 'head') {
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 1) {
                    const pursueSpeed = (0.6 + currentWave * 0.02) * 1.6;
                    this.x += (dx / dist) * pursueSpeed;
                    this.y += (dy / dist) * pursueSpeed;
                }
                
                // Sinister whining sound periodically
                if (!this.soundTimer) this.soundTimer = 0;
                this.soundTimer += deltaTime;
                if (this.soundTimer > 2000 + Math.random() * 1500) {
                    this.soundTimer = 0;
                    window.audio.playMandipedeWhine();
                }

                // Shoot at player periodically
                if (!this.fireTimer) this.fireTimer = 0;
                this.fireTimer += deltaTime;
                if (this.fireTimer > 1500 + Math.random() * 1000) {
                    this.fireTimer = 0;
                    this.shootAtPlayer();
                }
            } else {
                if (!this.leader || !enemies.includes(this.leader)) {
                    this.segmentType = 'head';
                    this.directionY = 1;
                    this.leader = null;
                    this.hp = 10; // Promoted head starts with 10 HP
                } else {
                    const dx = this.leader.x - this.x;
                    const dy = this.leader.y - this.y;
                    const dist = Math.hypot(dx, dy);
                    const targetDist = (this.leader.segmentType === 'head') ? 48 : 25;
                    if (dist > targetDist) {
                        this.x += (dx / dist) * (dist - targetDist);
                        this.y += (dy / dist) * (dist - targetDist);
                    }
                }
            }
        }
        else if (this.type === 'sewage_tank') {
            this.angle += 0.005;
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off boundaries
            if (this.x - this.radius <= 10) { this.x = this.radius + 11; this.vx = Math.abs(this.vx); }
            else if (this.x + this.radius >= ARENA_WIDTH - 10) { this.x = ARENA_WIDTH - this.radius - 11; this.vx = -Math.abs(this.vx); }
            if (this.y - this.radius <= ARENA_CEILING) { this.y = this.radius + ARENA_CEILING + 1; this.vy = Math.abs(this.vy); }
            else if (this.y + this.radius >= ARENA_HEIGHT - 10) { this.y = ARENA_HEIGHT - this.radius - 11; this.vy = -Math.abs(this.vy); }

            this.fireTimer += deltaTime;
            if (this.fireTimer > 1200) {
                this.fireTimer = 0;
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 5) {
                    const peanutSpeed = 2.6;
                    const vx = (dx / dist) * peanutSpeed;
                    const vy = (dy / dist) * peanutSpeed;
                    enemyBullets.push(new Bullet(this.x, this.y, vx, vy, 'enemy', 'brown_peanut'));
                    window.audio.playSewageShoot();
                }
            }
        }
        else if (this.type === 'euro_chomper') {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x - this.radius <= 10) { this.x = this.radius + 11; this.vx = Math.abs(this.vx); }
            else if (this.x + this.radius >= ARENA_WIDTH - 10) { this.x = ARENA_WIDTH - this.radius - 11; this.vx = -Math.abs(this.vx); }
            if (this.y - this.radius <= ARENA_CEILING) { this.y = this.radius + ARENA_CEILING + 1; this.vy = Math.abs(this.vy); }
            else if (this.y + this.radius >= ARENA_HEIGHT - 10) { this.y = ARENA_HEIGHT - this.radius - 11; this.vy = -Math.abs(this.vy); }
            this.chompCycle += 0.15;

            // Coin dropping timer
            this.coinTimer -= deltaTime;
            if (this.coinTimer <= 0) {
                this.coinTimer = 2500 + Math.random() * 1500;
                enemyBullets.push(new Bullet(this.x, this.y + 12, 0, 2.4, 'enemy', 'silver_coin'));
            }
        }
        else if (this.type === 'ed_davey') {
            this.angle += 0.064;
            this.y = (ARENA_CEILING + 60) + (Math.sin(this.angle) * 0.5 + 0.5) * 350;
            
            // Bounce side to side horizontally
            if (!this.vx) this.vx = 3.2;
            this.x += this.vx;
            if (this.x - this.radius <= 10) {
                this.x = this.radius + 11;
                this.vx = Math.abs(this.vx);
            } else if (this.x + this.radius >= ARENA_WIDTH - 10) {
                this.x = ARENA_WIDTH - this.radius - 11;
                this.vx = -Math.abs(this.vx);
            }

            // Shoot targeting projectiles periodically
            if (!this.fireTimer) this.fireTimer = 0;
            this.fireTimer += deltaTime;
            if (this.fireTimer > 2000) {
                this.fireTimer = 0;
                this.shootAtPlayer();
                window.audio.playEdBungee();
            }
        }
        else if (this.type === 'labour_enemy') {
            this.bobOffset += 0.05;
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off boundaries
            if (this.x - this.radius <= 10) { this.x = this.radius + 11; this.vx = Math.abs(this.vx); }
            else if (this.x + this.radius >= ARENA_WIDTH - 10) { this.x = ARENA_WIDTH - this.radius - 11; this.vx = -Math.abs(this.vx); }
            if (this.y - this.radius <= ARENA_CEILING) { this.y = this.radius + ARENA_CEILING + 1; this.vy = Math.abs(this.vy); }
            else if (this.y + this.radius >= ARENA_HEIGHT - 10) { this.y = ARENA_HEIGHT - this.radius - 11; this.vy = -Math.abs(this.vy); }
        }
        else if (this.type === 'exploding_brain') {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 1) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
            
            // Brain psychic vibration periodically
            if (!this.soundTimer) this.soundTimer = 0;
            this.soundTimer += deltaTime;
            if (this.soundTimer > 1800 + Math.random() * 1200) {
                this.soundTimer = 0;
                window.audio.playBrainVibrate();
            }
        }
        else if (this.type === 'reform_mercedes') {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x - this.radius <= 10) { this.x = this.radius + 11; this.vx = Math.abs(this.vx); }
            else if (this.x + this.radius >= ARENA_WIDTH - 10) { this.x = ARENA_WIDTH - this.radius - 11; this.vx = -Math.abs(this.vx); }
            if (this.y - this.radius <= ARENA_CEILING) { this.y = this.radius + ARENA_CEILING + 1; this.vy = Math.abs(this.vy); }
            else if (this.y + this.radius >= ARENA_HEIGHT - 10) { this.y = ARENA_HEIGHT - this.radius - 11; this.vy = -Math.abs(this.vy); }

            // Spew cosmetic diesel smoke particles
            if (Math.random() < 0.2) {
                const norm = Math.hypot(this.vx, this.vy) || 1;
                const bx = this.x - (this.vx / norm) * 45;
                const by = this.y - (this.vy / norm) * 45;
                particles.push(new Particle(bx, by, '#424242'));
                particles.push(new Particle(bx, by, '#757575'));
            }

            // Firing diesel smoke cloud bullets
            this.fireTimer += deltaTime;
            if (this.fireTimer > 1500) {
                this.fireTimer = 0;
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 5) {
                    const smokeSpeed = 1.9;
                    const vx = (dx / dist) * smokeSpeed;
                    const vy = (dy / dist) * smokeSpeed;
                    enemyBullets.push(new Bullet(this.x, this.y, vx, vy, 'enemy', 'diesel_smoke'));
                    window.audio.playMercedesEngine();
                }
            }
        }
        else if (this.type === 'false_teeth') {
            if (!this.swingTimer) this.swingTimer = 0;
            this.swingTimer += 0.012;
            this.angle = Math.sin(this.swingTimer) * 0.8; // slowly oscillate the jaw structure
            this.x += this.vx;
            this.y += this.vy;
            if (this.x - this.radius <= 10) { this.x = this.radius + 11; this.vx = Math.abs(this.vx); }
            else if (this.x + this.radius >= ARENA_WIDTH - 10) { this.x = ARENA_WIDTH - this.radius - 11; this.vx = -Math.abs(this.vx); }
            if (this.y - this.radius <= ARENA_CEILING) { this.y = this.radius + ARENA_CEILING + 1; this.vy = Math.abs(this.vy); }
            else if (this.y + this.radius >= ARENA_HEIGHT - 10) { this.y = ARENA_HEIGHT - this.radius - 11; this.vy = -Math.abs(this.vy); }

            // Gums chomping sound periodically
            if (!this.soundTimer) this.soundTimer = 0;
            this.soundTimer += deltaTime;
            if (this.soundTimer > 1800 + Math.random() * 1000) {
                this.soundTimer = 0;
                window.audio.playTeethChomp();
            }

            // Destruct gums if all teeth are destroyed
            const hasTeeth = enemies.some(e => e.type === 'tooth' && e.parentBoss === this);
            if (!hasTeeth) {
                enemies = enemies.filter(e => e !== this);
                window.audio.playExplosion();
                triggerScreenShake(8, 250);
                score += this.scoreValue;
                hudScore.textContent = String(score).padStart(6, '0');
                for (let i = 0; i < 30; i++) {
                    particles.push(new Particle(this.x, this.y, this.color));
                }
            }
        }
        else if (this.type === 'lord_wig_boss') {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x - this.radius <= 10) { this.x = this.radius + 11; this.vx = Math.abs(this.vx); }
            else if (this.x + this.radius >= ARENA_WIDTH - 10) { this.x = ARENA_WIDTH - this.radius - 11; this.vx = -Math.abs(this.vx); }
            if (this.y - this.radius <= ARENA_CEILING) { this.y = this.radius + ARENA_CEILING + 1; this.vy = Math.abs(this.vy); }
            else if (this.y + this.radius >= ARENA_HEIGHT - 10) { this.y = ARENA_HEIGHT - this.radius - 11; this.vy = -Math.abs(this.vy); }

            this.fireTimer += deltaTime;
            if (this.fireTimer > 3000) {
                this.fireTimer = 0;
                const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);
                for (let i = 0; i < 3; i++) {
                    const angle = baseAngle + (i - 1) * 0.4;
                    const wx = this.x + Math.cos(angle) * 55;
                    const wy = this.y + Math.sin(angle) * 55;
                    const smallWig = new Enemy(wx, wy, 'wig');
                    smallWig.speed = (0.8 + Math.random() * 0.4) * 1.6;
                    enemies.push(smallWig);
                }
                window.audio.playLordsGrumble();
            }
        }
        else if (this.type === 'tooth') {
            if (this.parentBoss && enemies.includes(this.parentBoss)) {
                // Attached chomping radius
                const chompRadius = (32 + Math.sin(Date.now() / 250) * 8) * 1.2;
                this.x = this.parentBoss.x + Math.cos(this.parentBoss.angle + this.angleOffset) * chompRadius;
                this.y = this.parentBoss.y + Math.sin(this.parentBoss.angle + this.angleOffset) * chompRadius;
            } else {
                enemies = enemies.filter(e => e !== this);
            }
        }
        else if (['zack_miniboss', 'kemi_miniboss', 'farage_miniboss', 'ed_miniboss'].includes(this.type)) {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x - this.radius <= 10) { this.x = this.radius + 11; this.vx = Math.abs(this.vx); }
            else if (this.x + this.radius >= ARENA_WIDTH - 10) { this.x = ARENA_WIDTH - this.radius - 11; this.vx = -Math.abs(this.vx); }
            if (this.y - this.radius <= ARENA_CEILING) { this.y = this.radius + ARENA_CEILING + 1; this.vy = Math.abs(this.vy); }
            else if (this.y + this.radius >= ARENA_HEIGHT - 10) { this.y = ARENA_HEIGHT - this.radius - 11; this.vy = -Math.abs(this.vy); }

            // Spawn colored particle trails trailing them
            if (Math.random() < 0.35) {
                const colors = {
                    'zack_miniboss': '#6ab023',
                    'kemi_miniboss': '#0087dc',
                    'farage_miniboss': '#00d2c4',
                    'ed_miniboss': '#ffd700'
                };
                particles.push(new Particle(
                    this.x + (Math.random() - 0.5) * 15,
                    this.y + (Math.random() - 0.5) * 15,
                    colors[this.type] || '#ffd700'
                ));
            }

            if (!this.fireTimer) this.fireTimer = 0;
            this.fireTimer += deltaTime;
            if (this.fireTimer > 2500) {
                this.fireTimer = 0;
                this.shootAtPlayer();
            }
        }
        else if (['tree_trunk', 'cat_enemy', 'cigarette', 'booze_enemy', 'candy_floss', 'toffee_apple', 'brighton_rock', 'bikini', 'banknote', 'ooze_bucket', 'mini_brain', 'vape', 'breakfast', 'tshirt', 'needle', 'grad_cap', 'padlocks', 'lettuce', 'mop_head', 'pig', 'tabloid', 'english_flag', 'whatsapp', 'cannabis', 'tie_dye', 'party_hat', 'party_rings', 'cake'].includes(this.type)) {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x - this.radius <= 10) { this.x = this.radius + 11; this.vx = Math.abs(this.vx); }
            else if (this.x + this.radius >= ARENA_WIDTH - 10) { this.x = ARENA_WIDTH - this.radius - 11; this.vx = -Math.abs(this.vx); }
            if (this.y - this.radius <= ARENA_CEILING) { this.y = this.radius + ARENA_CEILING + 1; this.vy = Math.abs(this.vy); }
            else if (this.y + this.radius >= ARENA_HEIGHT - 10) { this.y = ARENA_HEIGHT - this.radius - 11; this.vy = -Math.abs(this.vy); }
        }
    }

    detonate() {
        // Exploding Brain Detonation
        enemies = enemies.filter(e => e !== this);
        window.audio.playExplosion();
        const numBullets = 8;
        const speed = 3.2;
        for (let i = 0; i < numBullets; i++) {
            const bulletAngle = (i * Math.PI * 2) / numBullets;
            const vx = Math.cos(bulletAngle) * speed;
            const vy = Math.sin(bulletAngle) * speed;
            enemyBullets.push(new Bullet(this.x, this.y, vx, vy, 'enemy'));
        }
        for (let i = 0; i < 15; i++) {
            particles.push(new Particle(this.x, this.y, this.color));
        }
    }

    shootAtPlayer() {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 5) {
            const bulletSpeed = (2.4 + currentWave * 0.1) * 1.6;
            const vx = (dx / dist) * bulletSpeed;
            const vy = (dy / dist) * bulletSpeed;
            enemyBullets.push(new Bullet(this.x, this.y, vx, vy, 'enemy'));
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2.5;

        // Pulsating dashed gold ring around mini-bosses
        if (['zack_miniboss', 'kemi_miniboss', 'farage_miniboss', 'ed_miniboss'].includes(this.type)) {
            ctx.save();
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            const ringRadius = this.radius + 6 + Math.sin(Date.now() / 100) * 2;
            ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        if (this.type === 'swarmer') {
            ctx.rotate(this.angle);
            ctx.beginPath();
            ctx.moveTo(0, -this.radius);
            ctx.lineTo(this.radius * 0.8, 0);
            ctx.lineTo(0, this.radius);
            ctx.lineTo(-this.radius * 0.8, 0);
            ctx.closePath();
            ctx.stroke();
            
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-2, -2, 4, 4);
        }
        else if (this.type === 'bouncer') {
            ctx.rotate(this.angle);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                ctx.rotate(Math.PI / 2);
                ctx.moveTo(this.radius * 0.5, 0);
                ctx.lineTo(this.radius * 1.3, 0);
            }
            ctx.stroke();
        }
        else if (this.type === 'wig') {
            ctx.save();
            ctx.rotate(Math.sin(this.bobOffset) * 0.08);
            ctx.drawImage(lordWigImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'newspaper') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            ctx.drawImage(newspaperImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'ballot_enemy') {
            // Chancellor's dark red briefcase
            ctx.fillStyle = '#8b1e0f'; // Dark red/burgundy briefcase body
            ctx.fillRect(-20, -12, 40, 26);
            ctx.strokeStyle = '#ffd700'; // Gold border highlight
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-20, -12, 40, 26);
            
            // Handle at the top
            ctx.strokeStyle = '#d4af37'; // Gold handle
            ctx.lineWidth = 3.5;
            ctx.lineCap = 'square';
            ctx.beginPath();
            ctx.moveTo(-7, -12);
            ctx.lineTo(-7, -18);
            ctx.lineTo(7, -18);
            ctx.lineTo(7, -12);
            ctx.stroke();
            
            // Gold latches
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-12, -12, 4, 4);
            ctx.fillRect(8, -12, 4, 4);
            
            // Latch details
            ctx.fillStyle = '#111111';
            ctx.fillRect(-11, -10, 2, 2);
            ctx.fillRect(9, -10, 2, 2);
            
            // Gold central seal
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-3, -2, 6, 6);
            ctx.fillRect(-5, 0, 10, 2);
        }
        else if (this.type === 'tory') {
            ctx.save();
            ctx.translate(0, Math.sin(this.bobOffset) * 15);
            ctx.rotate(Math.sin(this.angle * 0.5) * 0.08); // slow sway
            ctx.drawImage(toryLogoImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'reform') {
            ctx.save();
            const arrowAngle = (this.state === 'charging') ? Math.atan2(this.vy, this.vx) : this.targetAngle;
            ctx.rotate(arrowAngle);
            ctx.drawImage(reformLogoImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'green') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            ctx.drawImage(greenLogoImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'libdem') {
            ctx.save();
            if (this.vx < 0) {
                ctx.scale(-1, 1);
            }
            ctx.drawImage(libdemLogoImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'mandipede') {
            if (this.segmentType === 'head') {
                ctx.save();
                const wobble = Math.sin(Date.now() / 200) * 0.05;
                ctx.rotate(wobble);
                ctx.drawImage(mandipedeFaceImg, -this.radius * 1.5, -this.radius * 1.5, this.radius * 3, this.radius * 3);
                ctx.restore();
            } else {
                ctx.save();
                ctx.rotate(Math.sin(this.angle * 0.5) * 0.08);
                
                // Draw white Y-front briefs
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#cccccc';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-this.radius, -this.radius * 0.7); // Top-left waistband
                ctx.lineTo(this.radius, -this.radius * 0.7);  // Top-right waistband
                ctx.lineTo(this.radius * 0.9, -this.radius * 0.1); // Right hip
                ctx.lineTo(this.radius * 0.3, this.radius * 0.7);  // Right crotch
                ctx.lineTo(-this.radius * 0.3, this.radius * 0.7); // Left crotch
                ctx.lineTo(-this.radius * 0.9, -this.radius * 0.1); // Left hip
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // waistband line detail
                ctx.strokeStyle = '#e0e0e0';
                ctx.lineWidth = 2.0;
                ctx.beginPath();
                ctx.moveTo(-this.radius, -this.radius * 0.6);
                ctx.lineTo(this.radius, -this.radius * 0.6);
                ctx.stroke();

                // Y-front stitch seam lines
                ctx.strokeStyle = '#90a4ae'; // blue-grey stitching thread
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(0, this.radius * 0.7);
                ctx.lineTo(0, -this.radius * 0.1);
                ctx.lineTo(-this.radius * 0.5, -this.radius * 0.6);
                ctx.moveTo(0, -this.radius * 0.1);
                ctx.lineTo(this.radius * 0.5, -this.radius * 0.6);
                ctx.stroke();
                
                ctx.restore();
            }
        }
        else if (this.type === 'sewage_tank') {
            // Sewage Treatment Tank - matches photo (circular tank with rotating yellow diameter bridge)
            ctx.rotate(this.angle);
            
            // Concrete outer rim
            ctx.fillStyle = '#b0bec5';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Concrete outer wall line
            ctx.strokeStyle = '#78909c';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.stroke();

            // Dark navy water inside
            ctx.fillStyle = '#102a43'; // Deep dark navy
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.9, 0, Math.PI * 2);
            ctx.fill();

            // Inner concrete lip wall
            ctx.strokeStyle = '#90a4ae';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.9, 0, Math.PI * 2);
            ctx.stroke();

            // Central concrete hub
            ctx.fillStyle = '#cfd8dc';
            ctx.strokeStyle = '#78909c';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.18, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Yellow diameter bridge/radial arm
            ctx.strokeStyle = '#fbc02d'; // Yellow girder
            ctx.lineWidth = 4.0;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(this.radius * 0.9, 0);
            ctx.stroke();

            // Bridge railings
            ctx.strokeStyle = '#ffeb3b'; // Brighter yellow
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            // Left railing
            ctx.moveTo(0, -3.5);
            ctx.lineTo(this.radius * 0.9, -3.5);
            // Right railing
            ctx.moveTo(0, 3.5);
            ctx.lineTo(this.radius * 0.9, 3.5);
            ctx.stroke();

            // White cross-braces walkway trusses
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            for (let x = 6; x < this.radius * 0.9; x += 6) {
                ctx.moveTo(x, -3.5);
                ctx.lineTo(x, 3.5);
            }
            ctx.stroke();
        }
        else if (this.type === 'euro_chomper') {
            const travelAngle = Math.atan2(this.vy, this.vx);
            ctx.rotate(travelAngle);
            ctx.save();
            const wobble = Math.sin(this.chompCycle * 2) * 0.05;
            ctx.rotate(wobble);
            ctx.drawImage(euroSpriteImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'ed_davey') {
            // Elastic wavy yellow bungee cord (from start ceiling coordinate (startX, ARENA_CEILING) to translated position (0, 0))
            ctx.restore(); // Exit local translation temporarily to draw rope relative to screen
            ctx.save();
            ctx.strokeStyle = '#ffd700'; // Lib Dem yellow
            ctx.lineWidth = 3.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            const startY = ARENA_CEILING;
            const endY = this.y;
            const segments = 24;
            const stepY = (endY - startY) / segments;
            ctx.moveTo(this.startX, startY);
            const stepX = (this.x - this.startX) / segments;
            for (let i = 1; i <= segments; i++) {
                const cy = startY + i * stepY;
                const cx = this.startX + i * stepX;
                const amp = 8 * Math.sin((i / segments) * Math.PI * 8);
                ctx.lineTo(cx + amp, cy);
            }
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.scale(2.0, 2.0); // Bungee Ed Davey is giant size

            // Draw Ed Davey head
            // Yellow Lib Dem T-Shirt shoulders
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.ellipse(0, 18, 18, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            // Face (using custom image edImg)
            ctx.save();
            const wobble = Math.sin(Date.now() / 150) * 0.05;
            ctx.rotate(wobble);
            ctx.drawImage(edImg, -20, -20, 40, 40);
            ctx.restore();

        }
        else if (this.type === 'labour_enemy') {
            // Labour Square Block Logo (drift wobble)
            ctx.translate(Math.sin(this.bobOffset) * 20, 0);
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 0.5) * 0.08); // slow sway matching other party logos like tory
            ctx.drawImage(labourLogoImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'exploding_brain' || this.type === 'mini_brain') {
            // Apply visual vibration for psycho energy
            ctx.save();
            if (this.type === 'exploding_brain') {
                const shakeX = (Math.random() - 0.5) * 4.0;
                const shakeY = (Math.random() - 0.5) * 4.0;
                ctx.translate(shakeX, shakeY);
                
                // Pulsate size of giant brain boss
                const scale = 1.0 + Math.sin(Date.now() / 150) * 0.08;
                ctx.scale(scale, scale);
            } else {
                const shakeX = (Math.random() - 0.5) * 1.5;
                const shakeY = (Math.random() - 0.5) * 1.5;
                ctx.translate(shakeX, shakeY);
            }

            // Draw glowing vibrating psycho-energy ring around the brain
            ctx.save();
            ctx.strokeStyle = `hsl(${(Date.now() / 2) % 360}, 100%, 75%)`;
            ctx.lineWidth = this.type === 'exploding_brain' ? 2.2 : 1.2;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + (this.type === 'exploding_brain' ? 5 : 3.2) + Math.sin(Date.now() / 25) * (this.type === 'exploding_brain' ? 3 : 1.5), 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            // Draw the brain image asset
            ctx.drawImage(brainBossImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);

            ctx.restore();
        }
        else if (this.type === 'tree_trunk') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);

            // Main branch (diagonal thick brown line)
            ctx.strokeStyle = '#8d6e63'; // branch brown
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-this.radius, -this.radius * 0.2);
            ctx.lineTo(this.radius, this.radius * 0.2);
            ctx.stroke();

            // Outline
            ctx.strokeStyle = '#5d4037'; // dark brown outline
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-this.radius, -this.radius * 0.2);
            ctx.lineTo(this.radius, this.radius * 0.2);
            ctx.stroke();

            // Side twig 1
            ctx.strokeStyle = '#8d6e63';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(-this.radius * 0.2, -this.radius * 0.04);
            ctx.quadraticCurveTo(-this.radius * 0.1, -this.radius * 0.6, this.radius * 0.3, -this.radius * 0.6);
            ctx.stroke();

            // Side twig 2
            ctx.beginPath();
            ctx.moveTo(this.radius * 0.3, 0.06);
            ctx.quadraticCurveTo(this.radius * 0.4, this.radius * 0.5, this.radius * 0.7, this.radius * 0.4);
            ctx.stroke();

            // Leaves (bright green ellipses/circles)
            ctx.fillStyle = '#4caf50'; // leaf green
            ctx.strokeStyle = '#2e7d32'; // dark green outline
            ctx.lineWidth = 1.0;

            const leaf = (lx, ly, la) => {
                ctx.save();
                ctx.translate(lx, ly);
                ctx.rotate(la);
                ctx.beginPath();
                ctx.ellipse(0, 0, 7, 3.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            };

            leaf(this.radius * 0.3, -this.radius * 0.6, -Math.PI / 6);
            leaf(this.radius * 0.7, this.radius * 0.4, Math.PI / 4);
            leaf(this.radius, this.radius * 0.2, 0);
            leaf(-this.radius * 0.5, -this.radius * 0.4, -Math.PI / 3);

            ctx.restore();
        }
        else if (this.type === 'cat_enemy') {
            // Grey cat head - stays upright, does not rotate, blinks slowly
            ctx.fillStyle = '#9e9e9e'; // Grey skin
            ctx.strokeStyle = '#616161'; // Grey outline
            ctx.lineWidth = 2;

            // Triangular ears
            ctx.beginPath();
            ctx.moveTo(-this.radius, -this.radius * 0.2);
            ctx.lineTo(-this.radius * 0.9, -this.radius * 1.1);
            ctx.lineTo(-this.radius * 0.2, -this.radius * 0.7);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Ear pink insides
            ctx.fillStyle = '#ff80ab';
            ctx.beginPath();
            ctx.moveTo(-this.radius * 0.85, -this.radius * 0.3);
            ctx.lineTo(-this.radius * 0.8, -this.radius * 0.95);
            ctx.lineTo(-this.radius * 0.35, -this.radius * 0.65);
            ctx.closePath();
            ctx.fill();

            // Right ear outer
            ctx.fillStyle = '#9e9e9e';
            ctx.beginPath();
            ctx.moveTo(this.radius, -this.radius * 0.2);
            ctx.lineTo(this.radius * 0.9, -this.radius * 1.1);
            ctx.lineTo(this.radius * 0.2, -this.radius * 0.7);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Right ear pink insides
            ctx.fillStyle = '#ff80ab';
            ctx.beginPath();
            ctx.moveTo(this.radius * 0.85, -this.radius * 0.3);
            ctx.lineTo(this.radius * 0.8, -this.radius * 0.95);
            ctx.lineTo(this.radius * 0.35, -this.radius * 0.65);
            ctx.closePath();
            ctx.fill();

            // Main head circle
            ctx.fillStyle = '#9e9e9e';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.88, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Slow blinking eyes (close for 300ms every 3 seconds)
            const blinkCycle = Date.now() % 3000;
            const isBlinking = blinkCycle < 300;

            if (isBlinking) {
                // Closed eye lines
                ctx.strokeStyle = '#616161';
                ctx.lineWidth = 2.0;
                ctx.beginPath();
                ctx.moveTo(-this.radius * 0.45, -this.radius * 0.1);
                ctx.lineTo(-this.radius * 0.15, -this.radius * 0.1);
                ctx.moveTo(this.radius * 0.15, -this.radius * 0.1);
                ctx.lineTo(this.radius * 0.45, -this.radius * 0.1);
                ctx.stroke();
            } else {
                // Open blue eyes
                ctx.fillStyle = '#00b0ff'; // Light blue
                ctx.beginPath();
                ctx.arc(-this.radius * 0.3, -this.radius * 0.1, 4, 0, Math.PI * 2);
                ctx.arc(this.radius * 0.3, -this.radius * 0.1, 4, 0, Math.PI * 2);
                ctx.fill();

                // Pupil slits
                ctx.fillStyle = '#000000';
                ctx.fillRect(-this.radius * 0.3 - 0.5, -this.radius * 0.1 - 2, 1, 4);
                ctx.fillRect(this.radius * 0.3 - 0.5, -this.radius * 0.1 - 2, 1, 4);
            }

            // Little pink nose
            ctx.fillStyle = '#ff80ab';
            ctx.beginPath();
            ctx.moveTo(-2, 2);
            ctx.lineTo(2, 2);
            ctx.lineTo(0, 4.5);
            ctx.closePath();
            ctx.fill();

            // Big smiling mouth
            ctx.strokeStyle = '#616161';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.arc(0, 4.5, 5, 0.1, Math.PI - 0.1);
            ctx.stroke();

            // Whiskers
            ctx.beginPath();
            // Left
            ctx.moveTo(-this.radius * 0.4, 4);
            ctx.lineTo(-this.radius * 0.85, 2);
            ctx.moveTo(-this.radius * 0.4, 5.5);
            ctx.lineTo(-this.radius * 0.85, 7);
            // Right
            ctx.moveTo(this.radius * 0.4, 4);
            ctx.lineTo(this.radius * 0.85, 2);
            ctx.moveTo(this.radius * 0.4, 5.5);
            ctx.lineTo(this.radius * 0.85, 7);
            ctx.stroke();
        }
        else if (this.type === 'cigarette') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            ctx.drawImage(cigarettesImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'booze_enemy') {
            ctx.save();
            const originalRadius = 20;
            const scale = this.radius / originalRadius;
            ctx.scale(scale, scale);
            // Green glass bottle of booze
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            ctx.fillStyle = '#2e7d32'; // Green bottle glass
            ctx.strokeStyle = '#1b5e20';
            ctx.lineWidth = 1.5;

            // Bottle body
            ctx.beginPath();
            ctx.roundRect(-10, -5, 20, 24, 3);
            ctx.fill();
            ctx.stroke();

            // Bottle neck
            ctx.fillRect(-4, -14, 8, 10);
            ctx.strokeRect(-4, -14, 8, 10);

            // Cork/cap
            ctx.fillStyle = '#8d6e63';
            ctx.fillRect(-3.5, -18, 7, 4);

            // Bottle Label (White)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-7, 0, 14, 12);
            ctx.fillStyle = '#ff3d00'; // label text scribble
            ctx.fillRect(-5, 3, 10, 2);
            ctx.fillStyle = '#333333';
            ctx.fillRect(-5, 7, 8, 1.5);
            ctx.restore();
        }
        else if (this.type === 'candy_floss') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            ctx.drawImage(candyflossImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'toffee_apple') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            ctx.drawImage(toffeeAppleImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'party_hat') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            ctx.drawImage(partyHatImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'party_rings') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            ctx.drawImage(partyRingsImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'cake') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            ctx.drawImage(cakeImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'brighton_rock') {
            // Striped Brighton Rock stick
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            
            // Stick body
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-this.radius * 1.1, -6, this.radius * 2.2, 12);
            ctx.strokeStyle = '#e91e63'; // pink ends
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-this.radius * 1.1, -6, this.radius * 2.2, 12);

            // Brighton rock pink stripes
            ctx.fillStyle = '#e91e63';
            ctx.fillRect(-this.radius * 1.1, -6, 5, 12);
            ctx.fillRect(this.radius * 1.1 - 5, -6, 5, 12);
            
            ctx.fillRect(-this.radius * 0.5, -6, 3, 12);
            ctx.fillRect(0, -6, 3, 12);
            ctx.fillRect(this.radius * 0.5, -6, 3, 12);
        }
        else if (this.type === 'bikini') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            ctx.drawImage(handcuffsImg, -this.radius * 1.15, -this.radius * 1.05, this.radius * 2.3, this.radius * 2.1);
            ctx.restore();
        }
        else if (this.type === 'banknote') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            ctx.drawImage(banknotesImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'ooze_bucket') {
            ctx.save();
            const originalRadius = 20;
            const scale = this.radius / originalRadius;
            ctx.scale(scale, scale);
            // Metal bucket spilling glowing green ooze
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.05);
            ctx.fillStyle = '#78909c'; // grey bucket body
            ctx.strokeStyle = '#455a64';
            ctx.lineWidth = 1.8;

            ctx.beginPath();
            ctx.moveTo(-12, -7);
            ctx.lineTo(12, -7);
            ctx.lineTo(8, 12);
            ctx.lineTo(-8, 12);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Bucket handle
            ctx.beginPath();
            ctx.arc(0, -7, 12, Math.PI, 0);
            ctx.stroke();

            // Spilling neon green ooze spilling out top and dripping
            ctx.fillStyle = '#39ff14'; // glowing green
            ctx.beginPath();
            ctx.ellipse(0, -7, 12, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Drip at the bottom left
            ctx.beginPath();
            ctx.ellipse(-6, 2, 4.5, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        else if (this.type === 'vape') {
            ctx.save();
            ctx.scale(1.1, 1.1);
            ctx.rotate(Math.sin(this.angle) * 0.15);

            // Mouthpiece (black, offset to the left)
            ctx.fillStyle = '#111111';
            ctx.beginPath();
            ctx.roundRect(-10, -21, 8, 7, 2);
            ctx.fill();

            // Gradient body (Lost Mary dual tone style: blue to pink)
            const bodyGrad = ctx.createLinearGradient(-15, -14, 15, 14);
            bodyGrad.addColorStop(0, '#00e5ff'); // bright cyan
            bodyGrad.addColorStop(1, '#ff4081'); // bright hot pink
            
            ctx.fillStyle = bodyGrad;
            ctx.strokeStyle = '#222222';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.roundRect(-15, -14, 30, 28, 5); // short and wide Lost Mary style
            ctx.fill();
            ctx.stroke();

            // Top cap cover (silver/metallic)
            ctx.fillStyle = '#cfd8dc';
            ctx.fillRect(-15, -14, 30, 3);

            // Bottom base (silver/metallic)
            ctx.fillStyle = '#b0bec5';
            ctx.fillRect(-15, 11, 30, 3);

            // Branding text representation
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 7px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('LOST', 0, -2);
            ctx.fillText('MARY', 0, 5);

            ctx.restore();
        }
        else if (this.type === 'breakfast') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle) * 0.15); // slow oscillate
            ctx.drawImage(breakfastImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'tshirt') {
            ctx.save();
            ctx.scale(1.1, 1.1);
            ctx.rotate(Math.sin(this.angle) * 0.12);

            ctx.fillStyle = '#e040fb';
            ctx.strokeStyle = '#aa00ff';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.moveTo(-10, -18);
            ctx.lineTo(-20, -12);
            ctx.lineTo(-15, -4);
            ctx.lineTo(-10, -6);
            ctx.lineTo(-10, 18);
            ctx.lineTo(10, 18);
            ctx.lineTo(10, -6);
            ctx.lineTo(15, -4);
            ctx.lineTo(20, -12);
            ctx.lineTo(10, -18);
            ctx.quadraticCurveTo(0, -14, -10, -18);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Tie-dye spiral
            ctx.save();
            ctx.clip();
            const colors = ['#ff1744', '#ffea00', '#00e676', '#00b0ff', '#ff3d00'];
            for (let r = 5; r < 35; r += 6) {
                ctx.strokeStyle = colors[Math.floor(r / 6) % colors.length];
                ctx.lineWidth = 3.5;
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
            
            ctx.strokeStyle = '#aa00ff';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.arc(0, -18, 10, 0.25 * Math.PI, 0.75 * Math.PI);
            ctx.stroke();

            ctx.restore();
        }
        else if (this.type === 'reform_mercedes') {
            const angle = Math.atan2(this.vy, this.vx);
            ctx.rotate(angle);

            ctx.fillStyle = '#d32f2f';
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.roundRect(-42, -20, 84, 40, 8);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#b71c1c';
            ctx.beginPath();
            ctx.roundRect(-15, -17, 40, 34, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#80deea';
            ctx.beginPath();
            ctx.moveTo(25, -16);
            ctx.lineTo(25, 16);
            ctx.lineTo(19, 14);
            ctx.lineTo(19, -14);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(-15, -15);
            ctx.lineTo(-15, 15);
            ctx.lineTo(-10, 13);
            ctx.lineTo(-10, -13);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(38, -10, 5, 20);
            ctx.strokeStyle = '#757575';
            ctx.lineWidth = 1;
            ctx.strokeRect(38, -10, 5, 20);
            
            ctx.strokeStyle = '#bdbdbd';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(42, -18);
            ctx.quadraticCurveTo(44, 0, 42, 18);
            ctx.stroke();

            ctx.fillStyle = '#ffeb3b';
            ctx.beginPath();
            ctx.arc(38, -14, 4, 0, Math.PI * 2);
            ctx.arc(38, 14, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(28, 0, 3.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(28, 0); ctx.lineTo(28, -3.5);
            ctx.moveTo(28, 0); ctx.lineTo(25, 2);
            ctx.moveTo(28, 0); ctx.lineTo(31, 2);
            ctx.stroke();

            ctx.fillStyle = '#212121';
            ctx.fillRect(20, -23, 14, 4);
            ctx.fillRect(20, 19, 14, 4);
            ctx.fillRect(-28, -23, 14, 4);
            ctx.fillRect(-28, 19, 14, 4);
            
            ctx.fillStyle = '#bdbdbd';
            ctx.fillRect(24, -22, 6, 2);
            ctx.fillRect(24, 20, 6, 2);
            ctx.fillRect(-24, -22, 6, 2);
            ctx.fillRect(-24, 20, 6, 2);
        }
        else if (this.type === 'false_teeth') {
            ctx.save();
            ctx.rotate(this.angle);
            ctx.scale(1.2, 1.2);
            ctx.strokeStyle = '#ff4081';
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(0, 0, 32, -Math.PI * 0.8, Math.PI * 0.8);
            ctx.stroke();
            
            ctx.fillStyle = '#880e4f';
            ctx.beginPath();
            ctx.arc(0, 0, 27, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        else if (this.type === 'needle') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15); // slow oscillate
            ctx.drawImage(bloodBagImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'grad_cap') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.1); // subtle sway
            ctx.drawImage(diplomaImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'lettuce') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            ctx.drawImage(lettuceImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'mop_head') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            ctx.drawImage(mopHeadImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'pig') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            ctx.drawImage(pigImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'tabloid') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            ctx.drawImage(tabloidImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'english_flag') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 0.5) * 0.12); // gentle sway
            
            const w = this.radius * 2;
            const h = this.radius * 2;
            const sliceCount = 20;
            const sliceWidth = w / sliceCount;
            const time = Date.now() * 0.005; // wave movement speed
            
            for (let i = 0; i < sliceCount; i++) {
                const sx = (i / sliceCount) * englishFlagImg.width;
                const sw = englishFlagImg.width / sliceCount;
                const sy = 0;
                const sh = englishFlagImg.height;
                
                const dx = -this.radius + i * sliceWidth;
                const dy = -this.radius + Math.sin(i * 0.4 - time) * 3.5;
                
                ctx.drawImage(
                    englishFlagImg, 
                    sx, sy, sw, sh, 
                    dx, dy, sliceWidth, h
                );
            }
            ctx.restore();
        }
        else if (this.type === 'whatsapp') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            ctx.drawImage(whatsappImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'cannabis') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle) * 0.15); // slow oscillate
            if (cannabisImg.complete && cannabisImg.naturalWidth !== 0) {
                ctx.drawImage(cannabisImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            } else {
                ctx.fillStyle = '#2e7d32';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
        else if (this.type === 'tie_dye') {
            ctx.save();
            if (tieDyeImg.complete && tieDyeImg.naturalWidth !== 0) {
                ctx.rotate(Math.sin(this.angle) * 0.15); // slow oscillate
                ctx.drawImage(tieDyeImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            } else {
                // Draw vector fallback (tie-dye tshirt)
                ctx.scale(1.1, 1.1);
                ctx.rotate(Math.sin(this.angle) * 0.12);

                ctx.fillStyle = '#e040fb';
                ctx.strokeStyle = '#aa00ff';
                ctx.lineWidth = 2;
                
                ctx.beginPath();
                ctx.moveTo(-10, -18);
                ctx.lineTo(-20, -12);
                ctx.lineTo(-15, -4);
                ctx.lineTo(-10, -6);
                ctx.lineTo(-10, 18);
                ctx.lineTo(10, 18);
                ctx.lineTo(10, -6);
                ctx.lineTo(15, -4);
                ctx.lineTo(20, -12);
                ctx.lineTo(10, -18);
                ctx.quadraticCurveTo(0, -14, -10, -18);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.save();
                ctx.clip();
                const colors = ['#ff1744', '#ffea00', '#00e676', '#00b0ff', '#ff3d00'];
                for (let r = 5; r < 35; r += 6) {
                    ctx.strokeStyle = colors[Math.floor(r / 6) % colors.length];
                    ctx.lineWidth = 3.5;
                    ctx.beginPath();
                    ctx.arc(0, 0, r, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
                
                ctx.strokeStyle = '#aa00ff';
                ctx.lineWidth = 2.0;
                ctx.beginPath();
                ctx.arc(0, -18, 10, 0.25 * Math.PI, 0.75 * Math.PI);
                ctx.stroke();
            }
            ctx.restore();
        }
        else if (this.type === 'padlocks') {
            ctx.save();
            ctx.scale(1.1, 1.1);
            ctx.rotate(this.angle * 0.08); // slow spin

            const drawSinglePadlock = (tx, ty, scale = 1.0) => {
                ctx.save();
                ctx.translate(tx, ty);
                ctx.scale(scale, scale);

                // Shackle (silver loop)
                ctx.strokeStyle = '#cfd8dc'; // metallic silver
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(0, -3, 6, Math.PI, 0); // shackle arc
                ctx.moveTo(-6, -3); ctx.lineTo(-6, 3);
                ctx.moveTo(6, -3); ctx.lineTo(6, 3);
                ctx.stroke();

                // Body (gold rectangular box)
                ctx.fillStyle = '#ffd54f'; // golden yellow
                ctx.strokeStyle = '#ffb300'; // dark gold border
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.roundRect(-10, 0, 20, 14, 2);
                ctx.fill();
                ctx.stroke();

                // Keyhole
                ctx.fillStyle = '#212121';
                ctx.beginPath();
                ctx.arc(0, 5, 1.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(-0.8, 6.5, 1.6, 4);

                ctx.restore();
            };

            // Draw three overlapping locked padlocks (The Triple Lock)
            drawSinglePadlock(-9, 4, 0.95);
            drawSinglePadlock(9, 4, 0.95);
            drawSinglePadlock(0, -8, 0.95);

            ctx.restore();
        }

        else if (this.type === 'lord_wig_boss') {
            ctx.save();
            const wobble = Math.sin(Date.now() / 200) * 0.05;
            ctx.rotate(wobble);
            ctx.drawImage(lordWigImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'zack_miniboss') {
            ctx.save();
            const wobble = Math.sin(Date.now() / 200) * 0.05;
            ctx.rotate(wobble);
            ctx.drawImage(zackImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'kemi_miniboss') {
            ctx.save();
            const wobble = Math.sin(Date.now() / 200) * 0.05;
            ctx.rotate(wobble);
            ctx.drawImage(kemiImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'farage_miniboss') {
            ctx.save();
            const wobble = Math.sin(Date.now() / 200) * 0.05;
            ctx.rotate(wobble);
            ctx.drawImage(farageImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'ed_miniboss') {
            ctx.save();
            const wobble = Math.sin(Date.now() / 200) * 0.05;
            ctx.rotate(wobble);
            ctx.drawImage(edImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
        else if (this.type === 'tooth') {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(-5, -6, 10, 12, 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#f5f5f5';
            ctx.fillRect(-3, -5, 6, 3);
        }

        ctx.restore();
    }
}

class Collectible {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'xvote', 'rose', 'bomb', 'three_way', or 'bouncy_shots'
        this.radius = 20; 
        this.bobOffset = Math.random() * Math.PI * 2;
        this.pulseSize = 0;
        this.timeRemaining = 10000; // 10 seconds lifetime

        // Slow arbitrary drift path
        const driftAngle = Math.random() * Math.PI * 2;
        const driftSpeed = 0.65;
        this.vx = Math.cos(driftAngle) * driftSpeed;
        this.vy = Math.sin(driftAngle) * driftSpeed;
    }

    update() {
        this.timeRemaining -= 16.666;
        this.bobOffset += 0.04;
        this.pulseSize = Math.sin(this.bobOffset) * 2;

        this.x += this.vx;
        this.y += this.vy;

        // Bounce off play boundaries
        if (this.x - this.radius <= 15) {
            this.x = this.radius + 16;
            this.vx = Math.abs(this.vx);
        } else if (this.x + this.radius >= ARENA_WIDTH - 15) {
            this.x = ARENA_WIDTH - this.radius - 16;
            this.vx = -Math.abs(this.vx);
        }

        if (this.y - this.radius <= ARENA_CEILING + 5) {
            this.y = this.radius + ARENA_CEILING + 6;
            this.vy = Math.abs(this.vy);
        } else if (this.y + this.radius >= ARENA_HEIGHT - 15) {
            this.y = ARENA_HEIGHT - this.radius - 16;
            this.vy = -Math.abs(this.vy);
        }
    }

    draw() {
        // Warning flash when close to expiration
        if (this.timeRemaining < 3000) {
            const blinkPeriod = this.timeRemaining < 1000 ? 80 : 160;
            if (Math.floor(this.timeRemaining / blinkPeriod) % 2 === 0) {
                return;
            }
        }

        ctx.save();
        ctx.translate(this.x, this.y + this.pulseSize);

        // 1. Pulsing Distinctive Rainbow Outline
        ctx.save();
        ctx.strokeStyle = `hsl(${(Date.now() / 2.5) % 360}, 100%, 65%)`;
        ctx.lineWidth = 3.5;
        ctx.shadowColor = `hsl(${(Date.now() / 2.5) % 360}, 100%, 65%)`;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 2. Draw item type
        if (this.type === 'xvote') {
            // Marker pen X
            ctx.save();
            ctx.strokeStyle = '#e51c23'; // Marker red
            ctx.lineCap = 'round';
            ctx.lineWidth = 6.0;
            
            ctx.beginPath();
            ctx.moveTo(-10, -9);
            ctx.quadraticCurveTo(-2, -2, 10, 10);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(9, -11);
            ctx.quadraticCurveTo(1, -1, -11, 9);
            ctx.stroke();
            ctx.restore();
        } else if (this.type === 'rose') {
            // Draw detailed rose image asset
            ctx.drawImage(bonusRoseImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
        } else if (this.type === 'bomb') {
            // Draw a round black cartoon bomb with a fuse
            ctx.save();
            // 1. Fuse (curved line)
            ctx.strokeStyle = '#d7ccc8'; // Light brown/grey fuse
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(0, -12);
            ctx.quadraticCurveTo(8, -20, 12, -22);
            ctx.stroke();

            // Fuse spark (orange/yellow star/sparkle)
            ctx.fillStyle = '#ffb300'; // Amber/orange spark
            ctx.beginPath();
            ctx.arc(12, -22, 3 + Math.sin(Date.now() / 80) * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // 2. Bomb body (black circle)
            ctx.fillStyle = '#111111'; // Off-black
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Highlight (white/grey reflection dot)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-5, -5, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // 3. Brass collar/cap on top of bomb
            ctx.fillStyle = '#8d6e63'; // brass brown
            ctx.fillRect(-4, -15, 8, 3);
            
            ctx.restore();
        } else if (this.type === 'three_way') {
            // Three-way firing icon (The Triple Lock sprite!)
            ctx.save();
            
            // Draw a circular background or icon frame
            ctx.fillStyle = 'rgba(0, 229, 255, 0.2)'; // transparent cyan
            ctx.strokeStyle = '#00e5ff'; // neon cyan border
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Draw three overlapping locked padlocks (The Triple Lock)
            ctx.scale(0.8, 0.8); // Scale down slightly to fit the collectible radius
            
            const drawSinglePadlock = (tx, ty, scale = 1.0) => {
                ctx.save();
                ctx.translate(tx, ty);
                ctx.scale(scale, scale);

                // Shackle (silver loop)
                ctx.strokeStyle = '#cfd8dc'; // metallic silver
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(0, -3, 6, Math.PI, 0); // shackle arc
                ctx.moveTo(-6, -3); ctx.lineTo(-6, 3);
                ctx.moveTo(6, -3); ctx.lineTo(6, 3);
                ctx.stroke();

                // Body (gold rectangular box)
                ctx.fillStyle = '#ffd54f'; // golden yellow
                ctx.strokeStyle = '#ffb300'; // dark gold border
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.roundRect(-10, 0, 20, 14, 2);
                ctx.fill();
                ctx.stroke();

                // Keyhole
                ctx.fillStyle = '#212121';
                ctx.beginPath();
                ctx.arc(0, 5, 1.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(-0.8, 6.5, 1.6, 4);

                ctx.restore();
            };

            drawSinglePadlock(-6, 3, 0.75);
            drawSinglePadlock(6, 3, 0.75);
            drawSinglePadlock(0, -6, 0.75);

            ctx.restore();
        } else if (this.type === 'bouncy_shots') {
            // Bouncy shots icon: light ray reflecting off a surface
            ctx.save();
            
            // Icon background/frame: transparent yellow-orange
            ctx.fillStyle = 'rgba(255, 204, 0, 0.2)'; // transparent yellow
            ctx.strokeStyle = '#ffcc00'; // neon yellow border
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Reflected surface line (draw a small flat mirror line at the bottom)
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-9, 5);
            ctx.lineTo(9, 5);
            ctx.stroke();

            // Incident light ray (bright yellow ray entering from top-left to center-bottom, then exiting to top-right)
            ctx.strokeStyle = '#ffeb3b'; // bright yellow ray
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(-8, -8);
            ctx.lineTo(0, 5);
            ctx.lineTo(8, -8);
            ctx.stroke();

            // Small sparkle/reflection point glow
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 5, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2.0 + 0.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.015;
        this.size = Math.random() * 4 + 1.5;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.97;
        this.vy *= 0.97;
        this.life -= this.decay;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI*2);
        ctx.fill();
        
        ctx.restore();
    }
}

// ----------------------------------------------------
// Game Actions & Systems
// ----------------------------------------------------

function startGame() {
    gameState = 'PLAYING';
    updateTouchControlsVisibility();
    
    uiOverlay.style.display = 'none';
    screenStart.classList.add('hidden');
    screenStart.classList.remove('active');
    screenGameOver.classList.add('hidden');
    screenGameOver.classList.remove('active');
    screenPaused.classList.add('hidden');
    screenPaused.classList.remove('active');

    score = 0;
    lives = 10; // Start with 10 lives
    currentWave = 1;
    waveTransitionTimer = 0;
    waveCompleteDelayTimer = 0;
    waveStartDelayTimer = 0;
    timeSinceLastKill = 0;
    bombSpawnCooldownTimer = 0;
    hudScore.textContent = '000000';
    hudWave.textContent = '1';
    updateLivesUI();

    bullets = [];
    enemyBullets = [];
    enemies = [];
    collectibles = [];
    particles = [];

    player = new Player(ARENA_WIDTH / 2, ARENA_HEIGHT / 2);

    window.audio.stopMusic();
    window.audio.startMusic();

    spawnWave();
    
    showNotification("TORY COLLAPSE", 220);

}

function spawnWave() {
    enemies = [];
    bullets = [];
    enemyBullets = [];
    timeSinceLastKill = 0;

    const px = player ? player.x : ARENA_WIDTH / 2;
    const py = player ? player.y : ARENA_HEIGHT / 2;
    const safeRadius = 180;

    const spawnEnemy = (type) => {
        let ex, ey, dist;
        do {
            ex = Math.random() * (ARENA_WIDTH - 80) + 40;
            ey = Math.random() * (ARENA_HEIGHT - (ARENA_CEILING + 70)) + (ARENA_CEILING + 20);
            dist = Math.hypot(ex - px, ey - py);
        } while (dist < safeRadius);

        enemies.push(new Enemy(ex, ey, type));
    };

    const layoutWave = 1 + ((currentWave - 1) % 18);

    // Design waves according to user requirements
    if (layoutWave === 1) {
        // Wave 1 - "Tory Collapse" - Tory trees + banknotes + newspapers + lettuce + mop heads + pigs + tabloids + Kemi Badenoch mini boss
        for (let i = 0; i < 6; i++) spawnEnemy('tory');
        for (let i = 0; i < 3; i++) spawnEnemy('banknote');
        for (let i = 0; i < 2; i++) spawnEnemy('newspaper');

        for (let i = 0; i < 2; i++) spawnEnemy('lettuce');
        for (let i = 0; i < 2; i++) spawnEnemy('mop_head');
        for (let i = 0; i < 2; i++) spawnEnemy('pig');
        for (let i = 0; i < 2; i++) spawnEnemy('tabloid');
        spawnEnemy('kemi_miniboss');
    }
    else if (layoutWave === 2) {
        // Wave 2 - "Reform Booze Up" - Reform arrows + cigarettes + breakfast + booze bottles + vapes + tabloid + banknotes + English flags + Nigel Farage mini boss
        for (let i = 0; i < 6; i++) spawnEnemy('reform');
        for (let i = 0; i < 3; i++) spawnEnemy('cigarette');
        for (let i = 0; i < 2; i++) spawnEnemy('breakfast');
        for (let i = 0; i < 3; i++) spawnEnemy('booze_enemy');
        for (let i = 0; i < 2; i++) spawnEnemy('vape');
        for (let i = 0; i < 2; i++) spawnEnemy('tabloid');
        for (let i = 0; i < 3; i++) spawnEnemy('banknote');
        for (let i = 0; i < 3; i++) spawnEnemy('english_flag');
        spawnEnemy('farage_miniboss');
    }
    else if (layoutWave === 3) {
        // Wave 3 - Boss level - Mandipede centipede + banknotes + tabloids + English flags + Labour logos + breakfast + diplomas + whatsapp
        let lastSegment = null;
        for (let i = 0; i < 10; i++) {
            const sx = 150 - i * 25;
            const sy = 120;
            const segment = new Enemy(sx, sy, 'mandipede');
            
            if (i === 0) {
                segment.segmentType = 'head';
                segment.vx = 2.2;
                segment.directionY = 1;
                segment.hp = 10; // Head starts with 10 HP
            } else {
                segment.segmentType = 'body';
                segment.leader = lastSegment;
            }
            enemies.push(segment);
            lastSegment = segment;
        }
        for (let i = 0; i < 3; i++) spawnEnemy('banknote');
        for (let i = 0; i < 2; i++) spawnEnemy('tabloid');
        for (let i = 0; i < 2; i++) spawnEnemy('english_flag');
        for (let i = 0; i < 2; i++) spawnEnemy('labour_enemy');
        for (let i = 0; i < 2; i++) spawnEnemy('breakfast');
        for (let i = 0; i < 2; i++) spawnEnemy('grad_cap'); // diploma
        for (let i = 0; i < 3; i++) spawnEnemy('whatsapp'); // new WhatsApp enemy
    }
    else if (layoutWave === 4) {
        // Wave 4 - \"LIB DEMS POLITICAL PARTY TIME\" - Lib Dem bird, candy floss, toffee apples, party hats, party rings, cakes + Ed mini boss
        for (let i = 0; i < 4; i++) {
            const bx = Math.random() * (ARENA_WIDTH - 120) + 60;
            const by = 80 + Math.random() * 100;
            const bird = new Enemy(bx, by, 'libdem');
            bird.vx = (Math.random() > 0.5 ? 1 : -1) * 2.2;
            enemies.push(bird);
        }
        for (let i = 0; i < 5; i++) spawnEnemy('candy_floss');
        for (let i = 0; i < 5; i++) spawnEnemy('toffee_apple');
        for (let i = 0; i < 3; i++) spawnEnemy('party_hat');
        for (let i = 0; i < 3; i++) spawnEnemy('party_rings');
        for (let i = 0; i < 3; i++) spawnEnemy('cake');
        spawnEnemy('ed_miniboss');
    }
    else if (layoutWave === 5) {
        // Wave 5 - "Liberal Democraps" - Lib Dem bird + candy floss, toffee apples, Brighton rock + Ed mini boss
        for (let i = 0; i < 4; i++) {
            const bx = Math.random() * (ARENA_WIDTH - 120) + 60;
            const by = 80 + Math.random() * 100;
            const bird = new Enemy(bx, by, 'libdem');
            bird.vx = (Math.random() > 0.5 ? 1 : -1) * 2.2;
            enemies.push(bird);
        }
        for (let i = 0; i < 6; i++) spawnEnemy('candy_floss');
        for (let i = 0; i < 5; i++) spawnEnemy('toffee_apple');
        for (let i = 0; i < 5; i++) spawnEnemy('brighton_rock');
        for (let i = 0; i < 2; i++) spawnEnemy('newspaper');
        for (let i = 0; i < 2; i++) spawnEnemy('ballot_enemy');
        spawnEnemy('ed_miniboss');
    }
    else if (layoutWave === 6) {
        // Wave 6 - Boss level - Mandipede centipede
        let lastSegment = null;
        for (let i = 0; i < 10; i++) {
            const sx = 150 - i * 25;
            const sy = 120;
            const segment = new Enemy(sx, sy, 'mandipede');
            
            if (i === 0) {
                segment.segmentType = 'head';
                segment.vx = 2.2;
                segment.directionY = 1;
                segment.hp = 10; // Head starts with 10 HP
            } else {
                segment.segmentType = 'body';
                segment.leader = lastSegment;
            }
            enemies.push(segment);
            lastSegment = segment;
        }
    }
    else if (layoutWave === 7) {
        // Wave 7 - Circular sewage treatment tank mini boss + newspapers & briefcases
        const boss = new Enemy(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, 'sewage_tank');
        enemies.push(boss);
        for (let i = 0; i < 4; i++) spawnEnemy('newspaper');
        for (let i = 0; i < 4; i++) spawnEnemy('ballot_enemy');
    }
    else if (layoutWave === 8) {
        // Wave 8 - Lords Boss - One large boss wig firing out lots of small wig enemies
        const bossWig = new Enemy(ARENA_WIDTH / 2, 160, 'lord_wig_boss');
        enemies.push(bossWig);

        // Spawn 4 initial small wigs as guards
        for (let i = 0; i < 4; i++) {
            spawnEnemy('wig');
        }
    }
    else if (layoutWave === 9) {
        // Wave 9 - Ed Davey mini boss + Lib Dem birds, candy floss, toffee apples, Brighton rock
        const boss = new Enemy(ARENA_WIDTH / 2, 160, 'ed_davey');
        enemies.push(boss);
        
        for (let i = 0; i < 2; i++) {
            const bx = Math.random() * (ARENA_WIDTH - 120) + 60;
            const by = 80 + Math.random() * 100;
            const bird = new Enemy(bx, by, 'libdem');
            bird.vx = (Math.random() > 0.5 ? 1 : -1) * 2.2;
            enemies.push(bird);
        }
        for (let i = 0; i < 2; i++) spawnEnemy('candy_floss');
        for (let i = 0; i < 2; i++) spawnEnemy('toffee_apple');
        for (let i = 0; i < 2; i++) spawnEnemy('brighton_rock');
    }
    else if (layoutWave === 10) {
        // Wave 10 - Commons Debate block-breaker grid layout: 3 stationary rows on each side
        if (player) {
            player.x = ARENA_WIDTH / 2;
            player.y = ARENA_HEIGHT / 2;
        }

        const numRows = 9;
        const baseSpacing = 70;
        const maxGridHeight = (numRows - 1) * baseSpacing;
        const topPadding = ARENA_CEILING + 65;
        const bottomPadding = 75;
        const availableHeight = ARENA_HEIGHT - topPadding - bottomPadding;
        
        let spacing = baseSpacing;
        if (maxGridHeight > availableHeight) {
            spacing = availableHeight / (numRows - 1);
        }
        
        const gridHeight = (numRows - 1) * spacing;
        const startY = topPadding + (availableHeight - gridHeight) / 2;
        
        const yPositions = [];
        for (let i = 0; i < numRows; i++) {
            yPositions.push(startY + i * spacing);
        }

        // Left Side (Labour): 3 Columns
        // Front Row (x = 210) - Shields
        yPositions.forEach((y, index) => {
            const type = index % 2 === 0 ? 'ballot_enemy' : 'newspaper';
            enemies.push(new Enemy(210, y, type));
        });
        // Middle Row (x = 140)
        yPositions.forEach((y, index) => {
            const type = index % 2 === 0 ? 'euro_chomper' : 'newspaper';
            enemies.push(new Enemy(140, y, type));
        });
        // Back Row (x = 70) - Active Shooters
        yPositions.forEach((y) => {
            enemies.push(new Enemy(70, y, 'labour_enemy'));
        });

        // Right Side (Conservative): 3 Columns
        // Front Row (x = ARENA_WIDTH - 210) - Shields
        yPositions.forEach((y, index) => {
            const type = index % 2 === 0 ? 'banknote' : 'bikini';
            enemies.push(new Enemy(ARENA_WIDTH - 210, y, type));
        });
        // Middle Row (x = ARENA_WIDTH - 140)
        yPositions.forEach((y, index) => {
            const type = index % 2 === 0 ? 'ooze_bucket' : 'banknote';
            enemies.push(new Enemy(ARENA_WIDTH - 140, y, type));
        });
        // Back Row (x = ARENA_WIDTH - 70) - Active Shooters
        yPositions.forEach((y) => {
            enemies.push(new Enemy(ARENA_WIDTH - 70, y, 'tory'));
        });
    }
    else if (layoutWave === 11) {
        // Wave 11 - Tory wave "Tory Psychodrama" - Giant Brain Boss + Tory trees, banknotes, ooze buckets, bikinis + Kemi Badenoch mini boss
        const bossBrain = new Enemy(ARENA_WIDTH / 2, 160, 'exploding_brain');
        enemies.push(bossBrain);
        for (let i = 0; i < 4; i++) spawnEnemy('tory');
        for (let i = 0; i < 2; i++) spawnEnemy('banknote');
        for (let i = 0; i < 2; i++) spawnEnemy('ooze_bucket');
        for (let i = 0; i < 2; i++) spawnEnemy('bikini');
        spawnEnemy('kemi_miniboss');
    }
    else if (layoutWave === 12) {
        // Wave 12 - Greens wave "Climate Catastrophe" - Green logo + tree branches, newspapers, tree trunks, cannabis, tie_dye + Zack mini bosses
        for (let i = 0; i < 6; i++) spawnEnemy('green');
        for (let i = 0; i < 4; i++) spawnEnemy('tree_trunk');
        for (let i = 0; i < 4; i++) spawnEnemy('newspaper');
        for (let i = 0; i < 4; i++) spawnEnemy('cannabis');
        for (let i = 0; i < 4; i++) spawnEnemy('tie_dye');
        spawnEnemy('zack_miniboss');
    }
    else if (layoutWave === 13) {
        // Wave 13 - Reform wave "Reform Booze-up" - Reform arrows + cigarettes, booze, vapes, breakfast + Nigel Farage mini bosses
        for (let i = 0; i < 6; i++) spawnEnemy('reform');
        for (let i = 0; i < 6; i++) spawnEnemy('cigarette');
        for (let i = 0; i < 6; i++) spawnEnemy('booze_enemy');
        for (let i = 0; i < 3; i++) spawnEnemy('vape');
        for (let i = 0; i < 3; i++) spawnEnemy('breakfast');
        spawnEnemy('farage_miniboss');
    }
    else if (layoutWave === 14) {
        // Wave 14 - Lib Dem wave "Lib Dem Funland" with candy floss, toffee apple, Brighton rock + Ed mini bosses
        for (let i = 0; i < 4; i++) {
            const bx = Math.random() * (ARENA_WIDTH - 120) + 60;
            const by = 80 + Math.random() * 100;
            const bird = new Enemy(bx, by, 'libdem');
            bird.vx = (Math.random() > 0.5 ? 1 : -1) * 2.2;
            enemies.push(bird);
        }
        for (let i = 0; i < 6; i++) spawnEnemy('candy_floss');
        for (let i = 0; i < 6; i++) spawnEnemy('toffee_apple');
        for (let i = 0; i < 6; i++) spawnEnemy('brighton_rock');
        spawnEnemy('ed_miniboss');
    }
    else if (layoutWave === 15) {
        // Wave 15 - Tory wave "Tory Sleaze" with bikinis, wads of banknotes, buckets green ooze + Kemi Badenoch mini bosses
        for (let i = 0; i < 6; i++) spawnEnemy('tory');
        for (let i = 0; i < 6; i++) spawnEnemy('bikini');
        for (let i = 0; i < 8; i++) spawnEnemy('banknote');
        for (let i = 0; i < 6; i++) spawnEnemy('ooze_bucket');
        spawnEnemy('kemi_miniboss');
    }
    else if (layoutWave === 16) {
        // Wave 16 - Reform Boss - Mercedes car spewing diesel smoke + Reform arrow, cigarette, booze, vape, breakfast + Nigel Farage mini boss
        const bossMerc = new Enemy(ARENA_WIDTH / 2, 160, 'reform_mercedes');
        enemies.push(bossMerc);
        for (let i = 0; i < 4; i++) spawnEnemy('reform');
        for (let i = 0; i < 2; i++) spawnEnemy('cigarette');
        for (let i = 0; i < 2; i++) spawnEnemy('booze_enemy');
        for (let i = 0; i < 2; i++) spawnEnemy('vape');
        for (let i = 0; i < 2; i++) spawnEnemy('breakfast');
        spawnEnemy('farage_miniboss');
    }
    else if (layoutWave === 17) {
        // Wave 17 - Greens Boss - Set of False Teeth gums + 10 tooth sub-enemies + Green logo, tree, tshirt, cat + Zack mini boss
        const gums = new Enemy(ARENA_WIDTH / 2, 160, 'false_teeth');
        enemies.push(gums);

        const numTeeth = 10;
        for (let i = 0; i < numTeeth; i++) {
            const angle = -Math.PI * 0.7 + (i / (numTeeth - 1)) * Math.PI * 1.4;
            const tooth = new Enemy(gums.x, gums.y, 'tooth');
            tooth.parentBoss = gums;
            tooth.angleOffset = angle;
            enemies.push(tooth);
        }

        for (let i = 0; i < 4; i++) spawnEnemy('green');
        for (let i = 0; i < 2; i++) spawnEnemy('tree_trunk');
        for (let i = 0; i < 2; i++) spawnEnemy('newspaper');
        for (let i = 0; i < 2; i++) spawnEnemy('cannabis');
        for (let i = 0; i < 2; i++) spawnEnemy('tie_dye');
        spawnEnemy('zack_miniboss');
    }
    else if (layoutWave === 18) {
        // Wave 18 - Euro chompers € symbols (Labour themed) + briefcases & newspapers
        for (let i = 0; i < 6; i++) spawnEnemy('euro_chomper');
        for (let i = 0; i < 3; i++) spawnEnemy('newspaper');
        for (let i = 0; i < 3; i++) spawnEnemy('ballot_enemy');
    }

    else {
        // Wave 19+: Endless scaling mix with party isolation (only one party logo type per wave)
        const scalar = 1 + (currentWave - 18) * 0.15;
        const totalParty = Math.floor(8 * scalar);
        const totalNeutrals = Math.floor(12 * scalar);
        
        const partyList = ['tory', 'reform', 'green', 'libdem', 'labour_enemy'];
        const chosenParty = partyList[Math.floor(Math.random() * partyList.length)];
        
        if (chosenParty === 'libdem') {
            const numBirds = Math.min(6, 1 + Math.floor(totalParty / 3));
            for (let i = 0; i < numBirds; i++) {
                const bx = Math.random() * (ARENA_WIDTH - 120) + 60;
                const by = 80 + Math.random() * 100;
                const bird = new Enemy(bx, by, 'libdem');
                bird.vx = (Math.random() > 0.5 ? 1 : -1) * 2.2;
                enemies.push(bird);
            }
        } else {
            for (let i = 0; i < totalParty; i++) {
                spawnEnemy(chosenParty);
            }
        }
        
        const neutralList = ['newspaper', 'ballot_enemy'];
        for (let i = 0; i < totalNeutrals; i++) {
            const randNeutral = neutralList[Math.floor(Math.random() * neutralList.length)];
            spawnEnemy(randNeutral);
        }
    }
    // Scatter scandal enemies in every wave
    const numScandalEnemies = 4 + Math.floor(currentWave / 4);
    const scandalTypes = ['needle', 'grad_cap'];
    for (let i = 0; i < numScandalEnemies; i++) {
        const randomType = scandalTypes[Math.floor(Math.random() * scandalTypes.length)];
        spawnEnemy(randomType);
    }

    collectibles = [];
    const numCollectibles = Math.min(2, 1 + Math.floor(currentWave / 5));
    for (let i = 0; i < numCollectibles; i++) {
        spawnCollectible();
    }
}

function spawnCollectible(forcedType) {
    const cx = Math.random() * (ARENA_WIDTH - 80) + 40;
    const cy = Math.random() * (ARENA_HEIGHT - (ARENA_CEILING + 70)) + (ARENA_CEILING + 20);
    let type = forcedType;
    if (!type) {
        const rand = Math.random();
        if (rand < 0.4) {
            type = 'xvote';
        } else if (rand < 0.8) {
            type = 'rose';
        } else if (rand < 0.9) {
            type = 'three_way';
        } else {
            type = 'bouncy_shots';
        }
    }
    collectibles.push(new Collectible(cx, cy, type));
}

function updateLivesUI() {
    hudLives.innerHTML = '';
    for (let i = 0; i < lives; i++) {
        hudLives.innerHTML += '♥';
    }
    if (player && player.isInvincibleCheat) {
        hudLives.innerHTML += ' <span style="animation: textFlash 0.5s infinite; color: #ffd700;">[CHEAT]</span>';
    }
}

window.updateLivesUI = updateLivesUI;

function triggerScreenShake(intensity, durationMs) {
    shakeTime = durationMs / 16.66;
    shakeIntensity = intensity;
}

function pauseGame() {
    gameState = 'PAUSED';
    updateTouchControlsVisibility();
    uiOverlay.style.display = 'flex';
    screenPaused.classList.remove('hidden');
    screenPaused.classList.add('active');
    window.audio.stopMusic();
    if (hudPauseBtn) hudPauseBtn.textContent = "RESUME";
}

function resumeGame() {
    gameState = 'PLAYING';
    updateTouchControlsVisibility();
    uiOverlay.style.display = 'none';
    screenPaused.classList.add('hidden');
    screenPaused.classList.remove('active');
    window.audio.startMusic();
    if (hudPauseBtn) hudPauseBtn.textContent = "PAUSE";
}

function playerDeath() {
    if (player && (player.isInvincibleCheat || player.bonusInvincibilityTimer > 0)) {
        return;
    }

    lives--;
    updateLivesUI();
    timeSinceLastKill = 0;
    triggerScreenShake(15, 600);
    window.audio.playPlayerDeath();

    for (let i = 0; i < 60; i++) {
        particles.push(new Particle(player.x, player.y, '#00e5ff'));
        particles.push(new Particle(player.x, player.y, '#ff2a2a'));
    }

    if (lives <= 0) {
        gameOver();
    } else {
        player.x = ARENA_WIDTH / 2;
        player.y = ARENA_HEIGHT / 2;
        player.invulnerabilityFrames = 120;

        enemies.forEach(enemy => {
            const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
            if (dist < 180) {
                const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
                enemy.x = player.x + Math.cos(angle) * 220;
                enemy.y = player.y + Math.sin(angle) * 220;
            }
        });
        showNotification("LIVES REMAINING: " + lives);
    }
}

function gameOver() {
    gameState = 'GAMEOVER';
    updateTouchControlsVisibility();
    uiOverlay.style.display = 'flex';
    screenGameOver.classList.remove('hidden');
    screenGameOver.classList.add('active');
    finalScore.textContent = score;
    finalWave.textContent = currentWave;
    window.audio.stopMusic();

    // Exit fullscreen if active on game over
    if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(err => console.log(err));
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }

    if (score > hiScore) {
        hiScore = score;
        setHighScoreCookie(hiScore);
        hudHiScore.textContent = String(hiScore).padStart(6, '0');
        showNotification("NEW HI-SCORE!");
    }
}

// ----------------------------------------------------
// Main Loops and Collision Physics
// ----------------------------------------------------

let lastTime = 0;
let accumulator = 0;
const fixedTimeStep = 16.666; // 60 updates per second

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // Clamp deltaTime to avoid "spiral of death" or huge jumps when tab loses focus
    if (deltaTime > 100) {
        deltaTime = fixedTimeStep;
    }

    accumulator += deltaTime;

    while (accumulator >= fixedTimeStep) {
        if (gameState === 'PLAYING') {
            updateGame(fixedTimeStep);
        }
        accumulator -= fixedTimeStep;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Calculate aspect-locked uniform scale and centering offsets
    const scale = Math.min(canvas.width / ARENA_WIDTH, canvas.height / ARENA_HEIGHT);
    const offsetX = (canvas.width - ARENA_WIDTH * scale) / 2;
    const offsetY = (canvas.height - ARENA_HEIGHT * scale) / 2;
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    if (shakeTime > 0) {
        const dx = (Math.random() * 2 - 1) * shakeIntensity;
        const dy = (Math.random() * 2 - 1) * shakeIntensity;
        ctx.translate(dx, dy);
        shakeTime--;
    }

    drawArenaBoundary();
    drawGame();
    if (waveTransitionTimer > 0) {
        drawUnionJackTransition(waveTransitionTimer);
    }
    drawCanvasHUD();

    ctx.restore();

    requestAnimationFrame(gameLoop);
}

function updateGame(deltaTime) {
    if (player) {
        player.update(deltaTime);
    }

    bullets.forEach(bullet => bullet.update());
    bullets = bullets.filter(bullet => !bullet.isOutOfBounds());

    enemyBullets.forEach(bullet => bullet.update());
    enemyBullets = enemyBullets.filter(bullet => !bullet.isOutOfBounds());

    enemies.forEach(enemy => enemy.update(deltaTime));

    collectibles.forEach(col => col.update());
    collectibles = collectibles.filter(col => col.timeRemaining > 0);

    particles.forEach(p => p.update());
    particles = particles.filter(p => p.life > 0);

    if (collectibles.length < 1 && Math.random() < 0.002) {
        spawnCollectible();
    }

    if (gameState === 'PLAYING') {
        if (enemies.length > 0) {
            timeSinceLastKill += fixedTimeStep;
        } else {
            timeSinceLastKill = 0;
        }

        if (bombSpawnCooldownTimer > 0) {
            bombSpawnCooldownTimer -= fixedTimeStep;
        }

        const hasBomb = collectibles.some(c => c.type === 'bomb');
        if (timeSinceLastKill >= 10000 && !hasBomb && bombSpawnCooldownTimer <= 0) {
            spawnCollectible('bomb');
            timeSinceLastKill = 0;
            bombSpawnCooldownTimer = 30000; // 30 seconds cooldown
        }
    }

    checkCollisions();

    // End of wave transition triggering logic with 500ms delay
    if (enemies.length === 0 && waveTransitionTimer === 0 && waveCompleteDelayTimer === 0 && waveStartDelayTimer === 0) {
        waveCompleteDelayTimer = 500;
    }

    if (waveCompleteDelayTimer > 0) {
        waveCompleteDelayTimer -= deltaTime;
        if (waveCompleteDelayTimer <= 0) {
            waveCompleteDelayTimer = 0;
            waveTransitionTimer = 75;
            
            // Clear remaining items and projectiles from arena
            collectibles = [];
            bullets = [];
            enemyBullets = [];
            
            // Play retro transition echoing sound effect
            if (window.audio) {
                window.audio.playTransitionSound();
            }

            const isInvincible = player && player.isInvincibleCheat;
            if (!isInvincible) {
                showNotification("WAVE COMPLETE! EXTRA LIFE!");
                lives++;
                updateLivesUI();
            } else {
                showNotification("WAVE COMPLETE!");
            }
            triggerScreenShake(5, 400);
        }
    }

    if (waveTransitionTimer > 0) {
        waveTransitionTimer--;
        if (waveTransitionTimer === 0) {
            waveStartDelayTimer = 500;
        }
    }

    if (waveStartDelayTimer > 0) {
        waveStartDelayTimer -= deltaTime;
        if (waveStartDelayTimer <= 0) {
            waveStartDelayTimer = 0;
            currentWave++;
            hudWave.textContent = currentWave;
            spawnWave();
            
            const layoutWave = 1 + ((currentWave - 1) % 18);
            let waveMsg = "";
            if (layoutWave === 1) waveMsg = "TORY COLLAPSE";
            else if (layoutWave === 2) waveMsg = "REFORM BOOZE UP";
            else if (layoutWave === 3) waveMsg = "BOSS - THE MANDIPEDE";
            else if (layoutWave === 4) waveMsg = "LIB DEMS POLITICAL PARTY TIME";
            else if (layoutWave === 5) waveMsg = "LIBERAL DEMOCRAPS";
            else if (layoutWave === 6) waveMsg = "BOSS - THE MANDIPEDE";
            else if (layoutWave === 7) waveMsg = "SEWAGE CRISIS";
            else if (layoutWave === 8) waveMsg = "THE LORDS ARE REVOLTING";
            else if (layoutWave === 9) waveMsg = "DAVEY BUNGEE";
            else if (layoutWave === 10) waveMsg = "COMMONS DEBATE";
            else if (layoutWave === 11) waveMsg = "TORY PSYCHODRAMA";
            else if (layoutWave === 12) waveMsg = "CLIMATE CATASTROPHE";
            else if (layoutWave === 13) waveMsg = "REFORM BOOZE-UP";
            else if (layoutWave === 14) waveMsg = "LIB DEM FUNLAND";
            else if (layoutWave === 15) waveMsg = "TORY SLEAZE";
            else if (layoutWave === 16) waveMsg = "REFORM BOSS";
            else if (layoutWave === 17) waveMsg = "GREEN BOSS";
            else if (layoutWave === 18) waveMsg = "EURO ZONE";
            
            showNotification(waveMsg, 220);
        }
    }
}

function collectItem(cIndex) {
    const col = collectibles[cIndex];
    if (!col) return;
    
    collectibles.splice(cIndex, 1);
    
    window.audio.playCollect();
    timeSinceLastKill = 0; // Reset countdown on any item collection

    if (col.type === 'bomb') {
        score += 250;
        hudScore.textContent = String(score).padStart(6, '0');
        showNotification("SCREEN BOMB TRIGGERED!");
        timeSinceLastKill = 0;

        // Inflict 1 damage to every active enemy
        for (let eIndex = enemies.length - 1; eIndex >= 0; eIndex--) {
            const enemy = enemies[eIndex];
            
            // Mandipede head invulnerability handling
            if (enemy.type === 'mandipede' && enemy.segmentType === 'head') {
                const hasBody = enemies.some(e => e.type === 'mandipede' && e.segmentType === 'body');
                if (hasBody) {
                    for (let i = 0; i < 4; i++) {
                        particles.push(new Particle(enemy.x, enemy.y, '#00e5ff'));
                    }
                    continue;
                }
            }

            enemy.hp--;
            for (let i = 0; i < 3; i++) {
                particles.push(new Particle(enemy.x, enemy.y, enemy.color));
            }

            if (enemy.hp <= 0) {
                if (enemy.type === 'mandipede') {
                    enemies.forEach(e => {
                        if (e.type === 'mandipede' && e.leader === enemy) {
                            e.leader = enemy.leader;
                        }
                    });
                }
                
                if (enemy.type === 'exploding_brain') {
                    enemies.splice(eIndex, 1);
                    score += enemy.scoreValue;
                    hudScore.textContent = String(score).padStart(6, '0');
                    window.audio.playExplosion();
                    triggerScreenShake(8, 250);
                    
                    const numMiniBrains = 6 + Math.floor(Math.random() * 3);
                    for (let k = 0; k < numMiniBrains; k++) {
                        const mb = new Enemy(enemy.x, enemy.y, 'mini_brain');
                        mb.x += (Math.random() - 0.5) * 15;
                        mb.y += (Math.random() - 0.5) * 15;
                        enemies.push(mb);
                    }
                } else {
                    enemies.splice(eIndex, 1);
                    score += enemy.scoreValue;
                    hudScore.textContent = String(score).padStart(6, '0');
                    window.audio.playExplosion();
                    triggerScreenShake(4, 150);
                    
                    const particleCount = enemy.type === 'bouncer' ? 25 : 12;
                    for (let i = 0; i < particleCount; i++) {
                        particles.push(new Particle(enemy.x, enemy.y, enemy.color));
                    }
                }
            }
        }
    } else if (col.type === 'three_way') {
        score += 500;
        hudScore.textContent = String(score).padStart(6, '0');
        showNotification("Triple Lock Guarantee");
        if (player) {
            player.threeWayTimer = 8000; // 8 seconds duration
        }
    } else if (col.type === 'bouncy_shots') {
        score += 500;
        hudScore.textContent = String(score).padStart(6, '0');
        showNotification("BOUNCY SHOTS ACTIVE!");
        if (player) {
            player.bouncyShotsTimer = 10000; // 10 seconds duration
        }
    } else {
        const points = col.type === 'rose' ? 1000 : 500;
        score += points;
        hudScore.textContent = String(score).padStart(6, '0');
        if (player) {
            player.bonusInvincibilityTimer = 3000;
            showNotification("INVINCIBLE! +3s");
        }
    }
    
    // Spawn gorgeous pulsing rainbow spark particles!
    for (let i = 0; i < 20; i++) {
        const hue = Math.random() * 360;
        particles.push(new Particle(col.x, col.y, `hsl(${hue}, 100%, 60%)`));
    }
}

function checkCollisions() {
    if (!player) return;

    // A. Player Bullets vs Enemies
    for (let bIndex = bullets.length - 1; bIndex >= 0; bIndex--) {
        const bullet = bullets[bIndex];
        for (let eIndex = enemies.length - 1; eIndex >= 0; eIndex--) {
            const enemy = enemies[eIndex];
            const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
            
            if (dist < bullet.radius + enemy.radius) {
                // Mandipede head invulnerability handling
                if (enemy.type === 'mandipede' && enemy.segmentType === 'head') {
                    const hasBody = enemies.some(e => e.type === 'mandipede' && e.segmentType === 'body');
                    if (hasBody) {
                        bullets.splice(bIndex, 1);
                        for (let i = 0; i < 4; i++) {
                            particles.push(new Particle(bullet.x, bullet.y, '#00e5ff'));
                        }
                        break;
                    }
                }

                bullets.splice(bIndex, 1);
                enemy.hp--;
                
                for (let i = 0; i < 3; i++) {
                    particles.push(new Particle(bullet.x, bullet.y, enemy.color));
                }

                if (enemy.hp <= 0) {
                    timeSinceLastKill = 0;
                    if (enemy.type === 'mandipede') {
                        // Relink body segment to prevent splitting
                        enemies.forEach(e => {
                            if (e.type === 'mandipede' && e.leader === enemy) {
                                e.leader = enemy.leader;
                            }
                        });
                    }
                    if (enemy.type === 'exploding_brain') {
                        enemies.splice(eIndex, 1);
                        score += enemy.scoreValue;
                        hudScore.textContent = String(score).padStart(6, '0');
                        window.audio.playExplosion();
                        triggerScreenShake(8, 250);
                        
                        // Spawn 6 to 8 mini brains bouncing around
                        const numMiniBrains = 6 + Math.floor(Math.random() * 3);
                        for (let k = 0; k < numMiniBrains; k++) {
                            const mb = new Enemy(enemy.x, enemy.y, 'mini_brain');
                            mb.x += (Math.random() - 0.5) * 15;
                            mb.y += (Math.random() - 0.5) * 15;
                            enemies.push(mb);
                        }
                    } else {
                        enemies.splice(eIndex, 1);
                        score += enemy.scoreValue;
                        hudScore.textContent = String(score).padStart(6, '0');

                        window.audio.playExplosion();
                        triggerScreenShake(4, 150);

                        const particleCount = enemy.type === 'bouncer' ? 25 : 12;
                        for (let i = 0; i < particleCount; i++) {
                            particles.push(new Particle(enemy.x, enemy.y, enemy.color));
                        }
                    }
                }
                break;
            }
        }
    }


    // B. Player vs Collectibles (Colliding with bonus items)
    for (let cIndex = collectibles.length - 1; cIndex >= 0; cIndex--) {
        const col = collectibles[cIndex];
        const dist = Math.hypot(player.x - col.x, player.y - col.y);
        
        if (dist < player.radius + col.radius) {
            collectItem(cIndex);
        }
    }

    // C. Player vs Enemies
    if (gameState === 'PLAYING') {
        for (let eIndex = enemies.length - 1; eIndex >= 0; eIndex--) {
            const enemy = enemies[eIndex];
            const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            
             if (dist < player.radius + enemy.radius) {
                // Enemy dies!
                // Bosses are not killed by collision; Starmer loses life but boss remains
                const isBoss = ['sewage_tank', 'ed_davey', 'exploding_brain', 'reform_mercedes', 'false_teeth', 'lord_wig_boss', 'zack_miniboss', 'kemi_miniboss', 'farage_miniboss', 'ed_miniboss'].includes(enemy.type) || (enemy.type === 'mandipede' && enemy.segmentType === 'head');
                if (isBoss) {
                    for (let i = 0; i < 6; i++) {
                        particles.push(new Particle(player.x + (enemy.x - player.x) * 0.5, player.y + (enemy.y - player.y) * 0.5, enemy.color));
                    }
                } else {
                    if (enemy.type === 'mandipede') {
                        // Relink segments before splicing
                        enemies.forEach(e => {
                            if (e.type === 'mandipede' && e.leader === enemy) {
                                e.leader = enemy.leader;
                            }
                        });
                    }
                    enemies.splice(eIndex, 1);
                    timeSinceLastKill = 0;
                    score += enemy.scoreValue;
                    hudScore.textContent = String(score).padStart(6, '0');
                    
                    window.audio.playExplosion();
                    triggerScreenShake(4, 150);
                    
                    const particleCount = enemy.type === 'bouncer' ? 25 : 12;
                    for (let i = 0; i < particleCount; i++) {
                        particles.push(new Particle(enemy.x, enemy.y, enemy.color));
                    }
                }

                // Starmer loses a life unless he has invincibility (cheat or bonus) or invulnerability frames active
                if (!(player.isInvincibleCheat || player.bonusInvincibilityTimer > 0 || player.invulnerabilityFrames > 0)) {
                    playerDeath();
                    break; // Stop loop to prevent losing multiple lives in a single frame
                }
            }
        }
    }

    // D. Player vs Enemy Bullets (Skip if cheat or bonus active)
    if (gameState === 'PLAYING' && !(player.isInvincibleCheat || player.bonusInvincibilityTimer > 0 || player.invulnerabilityFrames > 0)) {
        for (let bIndex = enemyBullets.length - 1; bIndex >= 0; bIndex--) {
            const bullet = enemyBullets[bIndex];
            const dist = Math.hypot(player.x - bullet.x, player.y - bullet.y);
            
            if (dist < player.radius + bullet.radius) {
                enemyBullets.splice(bIndex, 1);
                playerDeath();
                break;
            }
        }
    }
}

// ----------------------------------------------------
// Rendering Functions
// ----------------------------------------------------

function drawUnionJackTransition(timer) {
    let t = (75 - timer) / 75; // Total duration is 75 frames (half of 150)
    
    // Helper function for staggered segment progress
    function getSegmentProgress(tVal, startOn, endOn, startOff, endOff) {
        if (tVal < startOn) return 0;
        if (tVal < endOn) return (tVal - startOn) / (endOn - startOn);
        if (tVal < startOff) return 1;
        if (tVal < endOff) return 1 - (tVal - startOff) / (endOff - startOff);
        return 0;
    }

    // 1. Blue Background Quadrants (animate first)
    let pBlue = getSegmentProgress(t, 0.0, 0.15, 0.65, 0.85);
    if (pBlue > 0) {
        const quadrants = [
            { x: 0, y: 0, cx: ARENA_WIDTH / 4, cy: ARENA_HEIGHT / 4 },
            { x: ARENA_WIDTH / 2, y: 0, cx: ARENA_WIDTH * 0.75, cy: ARENA_HEIGHT / 4 },
            { x: 0, y: ARENA_HEIGHT / 2, cx: ARENA_WIDTH / 4, cy: ARENA_HEIGHT * 0.75 },
            { x: ARENA_WIDTH / 2, y: ARENA_HEIGHT / 2, cx: ARENA_WIDTH * 0.75, cy: ARENA_HEIGHT * 0.75 }
        ];
        
        quadrants.forEach((q) => {
            ctx.save();
            ctx.globalAlpha = pBlue;
            ctx.translate(q.cx, q.cy);
            ctx.scale(pBlue, pBlue);
            ctx.translate(-q.cx, -q.cy);
            ctx.fillStyle = '#00247D';
            ctx.fillRect(q.x, q.y, ARENA_WIDTH / 2, ARENA_HEIGHT / 2);
            ctx.restore();
        });
    }

    // 2. White saltire (diagonals)
    let pWhiteDiag = getSegmentProgress(t, 0.08, 0.23, 0.70, 0.90);
    if (pWhiteDiag > 0) {
        ctx.save();
        ctx.globalAlpha = pWhiteDiag;
        ctx.translate(ARENA_WIDTH / 2, ARENA_HEIGHT / 2);
        ctx.scale(pWhiteDiag, pWhiteDiag);
        ctx.translate(-ARENA_WIDTH / 2, -ARENA_HEIGHT / 2);
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = ARENA_HEIGHT * 0.12;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(ARENA_WIDTH, ARENA_HEIGHT);
        ctx.moveTo(ARENA_WIDTH, 0);
        ctx.lineTo(0, ARENA_HEIGHT);
        ctx.stroke();
        
        ctx.restore();
    }

    // 3. Red saltire (diagonals)
    let pRedDiag = getSegmentProgress(t, 0.16, 0.31, 0.75, 0.95);
    if (pRedDiag > 0) {
        ctx.save();
        ctx.globalAlpha = pRedDiag;
        ctx.translate(ARENA_WIDTH / 2, ARENA_HEIGHT / 2);
        ctx.scale(pRedDiag, pRedDiag);
        ctx.translate(-ARENA_WIDTH / 2, -ARENA_HEIGHT / 2);
        
        ctx.strokeStyle = '#CF142B';
        ctx.lineWidth = ARENA_HEIGHT * 0.04;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(ARENA_WIDTH, ARENA_HEIGHT);
        ctx.moveTo(ARENA_WIDTH, 0);
        ctx.lineTo(0, ARENA_HEIGHT);
        ctx.stroke();
        
        ctx.restore();
    }

    // 4. White St George Cross
    let pWhiteCross = getSegmentProgress(t, 0.24, 0.39, 0.80, 1.0);
    if (pWhiteCross > 0) {
        ctx.save();
        ctx.globalAlpha = pWhiteCross;
        ctx.translate(ARENA_WIDTH / 2, ARENA_HEIGHT / 2);
        ctx.scale(pWhiteCross, pWhiteCross);
        ctx.translate(-ARENA_WIDTH / 2, -ARENA_HEIGHT / 2);
        
        let whiteCrossWidth = ARENA_HEIGHT * 0.24;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, ARENA_HEIGHT / 2 - whiteCrossWidth / 2, ARENA_WIDTH, whiteCrossWidth);
        ctx.fillRect(ARENA_WIDTH / 2 - whiteCrossWidth / 2, 0, whiteCrossWidth, ARENA_HEIGHT);
        
        ctx.restore();
    }

    // 5. Red St George Cross
    let pRedCross = getSegmentProgress(t, 0.32, 0.47, 0.80, 1.0);
    if (pRedCross > 0) {
        ctx.save();
        ctx.globalAlpha = pRedCross;
        ctx.translate(ARENA_WIDTH / 2, ARENA_HEIGHT / 2);
        ctx.scale(pRedCross, pRedCross);
        ctx.translate(-ARENA_WIDTH / 2, -ARENA_HEIGHT / 2);
        
        let redCrossWidth = ARENA_HEIGHT * 0.145;
        ctx.fillStyle = '#CF142B';
        ctx.fillRect(0, ARENA_HEIGHT / 2 - redCrossWidth / 2, ARENA_WIDTH, redCrossWidth);
        ctx.fillRect(ARENA_WIDTH / 2 - redCrossWidth / 2, 0, redCrossWidth, ARENA_HEIGHT);
        
        ctx.restore();
    }

    // 6. Gold border (based on overall alpha)
    let overallAlpha = 0;
    if (t < 0.15) {
        overallAlpha = t / 0.15;
    } else if (t > 0.85) {
        overallAlpha = (1.0 - t) / 0.15;
    } else {
        overallAlpha = 1.0;
    }
    
    if (overallAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = overallAlpha;
        ctx.strokeStyle = '#FFD700'; // Gold border
        ctx.lineWidth = 15;
        ctx.strokeRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
        ctx.restore();
    }

    // Flashing overlay in the middle of transition
    if (t > 0.35 && t < 0.65) {
        let flashOpacity = Math.sin(Date.now() / 30) * 0.18 + 0.18;
        ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
        ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    }
}

function drawArenaBoundary() {
    ctx.strokeStyle = 'rgba(255, 0, 127, 0.18)';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, ARENA_CEILING, ARENA_WIDTH - 20, ARENA_HEIGHT - ARENA_CEILING - 10);

    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, ARENA_CEILING, ARENA_WIDTH - 20, ARENA_HEIGHT - ARENA_CEILING - 10);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    const spacing = 40;
    ctx.beginPath();
    for (let x = 40; x < ARENA_WIDTH - 20; x += spacing) {
        for (let y = ARENA_CEILING + 25; y < ARENA_HEIGHT - 20; y += spacing) {
            ctx.rect(x - 1, y - 1, 2, 2);
        }
    }
    ctx.fill();
}

function drawGame() {
    collectibles.forEach(col => col.draw());
    enemies.forEach(enemy => enemy.draw());
    
    if (player) {
        player.draw();
    }

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    bullets.forEach(bullet => bullet.draw());
    enemyBullets.forEach(bullet => bullet.draw());
    particles.forEach(p => p.draw());
    ctx.restore();
}

function drawCanvasHUD() {
    if (notificationTimer > 0 && notificationText !== "") {
        ctx.save();
        ctx.font = 'normal 22px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const alpha = Math.min(1.0, notificationTimer / 25);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        
        if (notificationText.startsWith('+') && player) {
            ctx.font = 'bold 15px "Press Start 2P", monospace';
            ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
            ctx.fillText(notificationText, player.x, player.y - 38);
        } else {
            ctx.fillStyle = `rgba(0, 229, 255, ${alpha})`;
            ctx.fillText(notificationText, ARENA_WIDTH / 2, ARENA_HEIGHT / 2 + 20);
        }

        ctx.restore();
        notificationTimer--;
    }

    // Render version number in bottom-right corner
    ctx.save();
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('v1.8.3', ARENA_WIDTH - 15, ARENA_HEIGHT - 15);
    ctx.restore();
}

// ----------------------------------------------------
// Touch Controls setup
// ----------------------------------------------------

const touchControls = document.getElementById('touch-controls');
const joystickBoundary = document.getElementById('joystick-boundary');
const joystickKnob = document.getElementById('joystick-knob');
const btnTouchStrafe = document.getElementById('btn-touch-strafe');

function updateTouchControlsVisibility() {
    if (isTouchDevice && touchControls) {
        if (gameState === 'PLAYING') {
            touchControls.classList.remove('hidden');
        } else {
            touchControls.classList.add('hidden');
        }
        // Force canvas layout recalculation to match the new size immediately
        resizeCanvas();
    }
}

// Perform initial dynamic text replacement for instructions on touch device
if (isTouchDevice) {
    const controlsGuide = document.getElementById('controls-guide');
    if (controlsGuide) {
        controlsGuide.innerHTML = `
            <div style="font-size: 0.85rem; line-height: 1.5; text-align: center; color: #b5b5c9;">
                Use the joystick to <span class="text-cyan">MOVE</span> and the button to <span class="text-cyan">STRAFE</span> (locks firing angle).
            </div>
        `;
    }
}

// Joystick active state tracking
let joystickTouchId = null;
let joystickCenter = { x: 0, y: 0 };
const maxDragRadius = 40; // max distance joystick handle can drag

function getTouchById(touches, id) {
    for (let i = 0; i < touches.length; i++) {
        if (touches[i].identifier === id) return touches[i];
    }
    return null;
}

joystickBoundary.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (joystickTouchId !== null) return; // already active

    const rect = joystickBoundary.getBoundingClientRect();
    joystickCenter.x = rect.left + rect.width / 2;
    joystickCenter.y = rect.top + rect.height / 2;

    const touch = e.changedTouches[0];
    joystickTouchId = touch.identifier;

    handleJoystickMove(touch.clientX, touch.clientY);
}, { passive: false });

window.addEventListener('touchmove', (e) => {
    if (joystickTouchId === null) return;
    const touch = getTouchById(e.touches, joystickTouchId);
    if (!touch) return;

    handleJoystickMove(touch.clientX, touch.clientY);
}, { passive: false });

window.addEventListener('touchend', (e) => {
    if (joystickTouchId === null) return;
    const touch = getTouchById(e.changedTouches, joystickTouchId);
    if (touch) {
        resetJoystick();
    }
}, { passive: false });

window.addEventListener('touchcancel', (e) => {
    if (joystickTouchId === null) return;
    const touch = getTouchById(e.changedTouches, joystickTouchId);
    if (touch) {
        resetJoystick();
    }
}, { passive: false });

function handleJoystickMove(clientX, clientY) {
    const dx = clientX - joystickCenter.x;
    const dy = clientY - joystickCenter.y;
    const dist = Math.hypot(dx, dy);

    let dragX = dx;
    let dragY = dy;

    if (dist > maxDragRadius) {
        dragX = (dx / dist) * maxDragRadius;
        dragY = (dy / dist) * maxDragRadius;
    }

    joystickKnob.style.transform = `translate(${dragX}px, ${dragY}px)`;

    // Convert to normalized speed components (-1 to 1)
    touchMoveX = dragX / maxDragRadius;
    touchMoveY = dragY / maxDragRadius;
}

function resetJoystick() {
    joystickTouchId = null;
    joystickKnob.style.transform = 'translate(0px, 0px)';
    touchMoveX = 0;
    touchMoveY = 0;
}

// Action buttons touches

btnTouchStrafe.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isStrafing = true;
    btnTouchStrafe.classList.add('active');
}, { passive: false });

btnTouchStrafe.addEventListener('touchend', (e) => {
    e.preventDefault();
    isStrafing = false;
    btnTouchStrafe.classList.remove('active');
}, { passive: false });

btnTouchStrafe.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    isStrafing = false;
    btnTouchStrafe.classList.remove('active');
}, { passive: false });

// Automatically lock orientation to landscape on mobile when fullscreen is entered
document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        if (isTouchDevice && screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(err => console.log(err));
        }
    } else {
        if (isTouchDevice && screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
        }
    }
});
document.addEventListener('webkitfullscreenchange', () => {
    if (document.webkitFullscreenElement) {
        if (isTouchDevice && screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(err => console.log(err));
        }
    } else {
        if (isTouchDevice && screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
        }
    }
});

// ----------------------------------------------------
// Init Loop Execution
// ----------------------------------------------------
requestAnimationFrame(gameLoop);
