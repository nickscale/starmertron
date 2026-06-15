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
let spawnedLayerCount = 0;
let waveStartTime = 0;
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
const hudTimer = document.getElementById('hud-timer');
let gameElapsedTime = 0; // Cumulative gameplay duration in ms

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
starmerImg.src = 'img/starmer_face.png';

// Preload Lord wig image
const lordWigImg = new Image();
lordWigImg.src = 'img/lord_wig.png';

// Preload mini-boss images
const zackImg = new Image();
zackImg.src = 'img/zack_face.png';

const kemiImg = new Image();
kemiImg.src = 'img/kemi_face.png';

const farageImg = new Image();
farageImg.src = 'img/farage_face.png';

const edImg = new Image();
edImg.src = 'img/ed_face.png';

// Preload party logo images
const toryLogoImg = new Image();
toryLogoImg.src = 'img/tory_logo.png';

const reformLogoImg = new Image();
reformLogoImg.src = 'img/reform_logo.png';

const greenLogoImg = new Image();
greenLogoImg.src = 'img/green_logo.png';

const libdemLogoImg = new Image();
libdemLogoImg.src = 'img/libdem_logo.png';

// Preload Mandipede head image
const mandipedeFaceImg = new Image();
mandipedeFaceImg.src = 'img/mandipede_face.png';

// Preload Euro sprite and cent images
const euroSpriteImg = new Image();
euroSpriteImg.src = 'img/euro_sprite.png';



// Preload handcuffs image (replaced with cuffs)
const handcuffsImg = new Image();
handcuffsImg.src = 'img/cuffs.png';

// Preload dvds image
const dvdsImg = new Image();
dvdsImg.src = 'img/dvds.png';

// Preload paper plane image
const paperPlaneImg = new Image();
paperPlaneImg.src = 'img/paper_plane.png';

// Preload newly replaced sprites (banknotes, cigarettes, student cap)
const banknotesImg = new Image();
banknotesImg.src = 'img/banknotes.png';

const cigarettesImg = new Image();
cigarettesImg.src = 'img/cigarettes.png';

const diplomaImg = new Image();
diplomaImg.src = 'img/diploma.png';

const brainBossImg = new Image();
brainBossImg.src = 'img/brain_boss.png';

const newspaperImg = new Image();
newspaperImg.src = 'img/newspaper.png';

const bloodBagImg = new Image();
bloodBagImg.src = 'img/blood_bag.png';

const breakfastImg = new Image();
breakfastImg.src = 'img/breakfast.png';

const lettuceImg = new Image();
lettuceImg.src = 'img/lettuce.png';

const mopHeadImg = new Image();
mopHeadImg.src = 'img/mop_head.png';

const pigImg = new Image();
pigImg.src = 'img/pig.png';

const tabloidImg = new Image();
tabloidImg.src = 'img/tabloid.png';

const prisonGateImg = new Image();
prisonGateImg.src = 'img/prison_gate.png';

const englishFlagImg = new Image();
englishFlagImg.src = 'img/english_flag.png';

const whatsappImg = new Image();
whatsappImg.src = 'img/whatsapp.png';

const cannabisImg = new Image();
cannabisImg.src = 'img/greens_cannabis.png';

const tieDyeImg = new Image();
tieDyeImg.src = 'img/greens_tiedye.png';

const labourLogoImg = new Image();
labourLogoImg.src = 'img/labour_party_logo_sprite.png';

const bonusRoseImg = new Image();
bonusRoseImg.src = 'img/bonus_rose.png';

const candyflossImg = new Image();
candyflossImg.src = 'img/candyfloss.png';

const toffeeAppleImg = new Image();
toffeeAppleImg.src = 'img/toffee_apple.png';

const partyHatImg = new Image();
partyHatImg.src = 'img/party_hat.png';

const partyRingsImg = new Image();
partyRingsImg.src = 'img/party_rings.png';

const cakeImg = new Image();
cakeImg.src = 'img/cake.png';

const ginImg = new Image();
ginImg.src = 'img/gin.png';

const sewageTankImg = new Image();
sewageTankImg.src = 'img/sewage_tank.png';

const poopProjectileImg = new Image();
poopProjectileImg.src = 'img/poop_projectile.png';

const deadDuckImg = new Image();
deadDuckImg.src = 'img/dead_duck.png';

const deadFishImg = new Image();
deadFishImg.src = 'img/dead_fish.png';

const toxicJarImg = new Image();
toxicJarImg.src = 'img/toxic_jar.png';

const sandalsImg = new Image();
sandalsImg.src = 'img/sandals.png';

const avocadoImg = new Image();
avocadoImg.src = 'img/avocado_on_toast.png';

const oatMilkImg = new Image();
oatMilkImg.src = 'img/oat_milk.png';

const flyImg = new Image();
flyImg.src = 'img/fly.png';

const toryCondomImg = new Image();
toryCondomImg.src = 'img/tory_condom.png';

const rubberRingImg = new Image();
rubberRingImg.src = 'img/rubber_ring.png';

const teddyBearImg = new Image();
teddyBearImg.src = 'img/teddy_bear.png';

const monsterCanImg = new Image();
monsterCanImg.src = 'img/monster_can.png';

const orangeMalletImg = new Image();
orangeMalletImg.src = 'img/orange_mallet.png';

const trafficConeImg = new Image();
trafficConeImg.src = 'img/traffic_cone.png';

const toteBagImg = new Image();
toteBagImg.src = 'img/tote_bag.png';

const solarPanelImg = new Image();
solarPanelImg.src = 'img/solar_panel.png';

const sunscreenImg = new Image();
sunscreenImg.src = 'img/sunscreen.png';

const electricFanImg = new Image();
electricFanImg.src = 'img/electric_fan.png';

const bonusBBImg = new Image();
bonusBBImg.src = 'img/bonus_BB.png';

// Londoncentric sprites preloading
const sadiqImg = new Image();
sadiqImg.src = 'img/sadiq.png';

const limeBikeImg = new Image();
limeBikeImg.src = 'img/lime_bike.png';

const policeHelmetImg = new Image();
policeHelmetImg.src = 'img/police_helmet.png';

const punkImg = new Image();
punkImg.src = 'img/punk.png';

const speedCameraImg = new Image();
speedCameraImg.src = 'img/speed_camera.png';

const phoneboxImg = new Image();
phoneboxImg.src = 'img/phonebox.png';

const blackcabImg = new Image();
blackcabImg.src = 'img/blackcab.png';

const vapeImg = new Image();
vapeImg.src = 'img/vape.png';

const evilKeirImg = new Image();
evilKeirImg.src = 'img/labour_keir_evil_sprite.png';

// Wave 16 "DON'T MENTION EUROPE" sprites preloading
const ursulaImg = new Image();
ursulaImg.src = 'img/ursula.png';

const bluePassportImg = new Image();
bluePassportImg.src = 'img/blue_passport.png';

const euroStarImg = new Image();
euroStarImg.src = 'img/euro_star.png';

const redTapeImg = new Image();
redTapeImg.src = 'img/red_tape.png';

const redWineImg = new Image();
redWineImg.src = 'img/red_wine.png';

// Wave 18 "THE KING IN THE NORTH" sprites preloading
const andyCrownedImg = new Image();
andyCrownedImg.src = 'img/andy_crowned.png';

const andyImg = new Image();
andyImg.src = 'img/andy.png';

const crownImg = new Image();
crownImg.src = 'img/crown.png';

const gravyImg = new Image();
gravyImg.src = 'img/gravy.png';

const lagerImg = new Image();
lagerImg.src = 'img/lager.png';

const chipsImg = new Image();
chipsImg.src = 'img/chips.png';

function drawImagePreservingAspect(img, radius, scale = 1.0) {
    if (!img || !img.complete || img.naturalWidth === 0) return;
    const aspect = img.naturalWidth / img.naturalHeight;
    let w, h;
    if (aspect >= 1) {
        w = radius * 2 * scale;
        h = w / aspect;
    } else {
        h = radius * 2 * scale;
        w = h * aspect;
    }
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
}





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

    // Weapon Selection Keys
    if (e.key === '1') {
        if (player) {
            player.bulletType = 'laser';
            showNotification("WEAPON: LASER");
        }
    }
    if (e.key === '2') {
        if (player) {
            player.bulletType = 'brown_peanut';
            showNotification("WEAPON: POOP");
        }
    }
    if (e.key === '3') {
        if (player) {
            player.bulletType = 'diesel_smoke';
            showNotification("WEAPON: DIESEL SMOKE");
        }
    }

    // Secret Invincibility Cheat Mode (Shift+I key)
    if (e.key.toLowerCase() === 'i' && e.shiftKey) {
        if (player) {
            player.isInvincibleCheat = !player.isInvincibleCheat;
            showNotification(player.isInvincibleCheat ? "INVINCIBILITY CHEAT: ON" : "INVINCIBILITY CHEAT: OFF");
            updateLivesUI();
        }
    }

    // Secret Kill All Enemies Cheat Mode (Shift+L key) - Skips transition and immediately draws next level
    if (e.key.toLowerCase() === 'l' && e.shiftKey) {
        if (gameState === 'PLAYING') {
            bullets = [];
            enemyBullets = [];
            collectibles = [];
            waveCompleteDelayTimer = 0;
            waveTransitionTimer = 0;
            waveStartDelayTimer = 0;
            currentWave++;
            hudWave.textContent = currentWave;
            spawnWave();
            showNotification(getWaveName(currentWave) + "\nCHEAT: NEXT WAVE", 440);
        }
    }

    // Secret Skip to Previous Wave Cheat Mode (Shift+J key)
    if (e.key.toLowerCase() === 'j' && e.shiftKey) {
        if (gameState === 'PLAYING') {
            currentWave = Math.max(1, currentWave - 1);
            hudWave.textContent = currentWave;
            spawnWave();
            showNotification(getWaveName(currentWave) + "\nCHEAT: PREV WAVE", 440);
        }
    }

    // Secret Restart Current Wave Cheat Mode (Shift+K key)
    if (e.key.toLowerCase() === 'k' && e.shiftKey) {
        if (gameState === 'PLAYING') {
            spawnWave();
            showNotification(getWaveName(currentWave) + "\nCHEAT: RESTARTED", 440);
        }
    }

    // Secret Kill Player / End Current Life (Shift+U key)
    if (e.key.toLowerCase() === 'u' && e.shiftKey) {
        if (gameState === 'PLAYING') {
            playerDeath(true);
            showNotification("CHEAT: LIFE ENDED");
        }
    }

    // Toggle Pause
    if (e.key.toLowerCase() === 'p') {
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
    notificationText = String(text).toUpperCase();
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
        this.bulletType = 'laser';
        this.catAssistantTimer = 0;
        this.catShootTimer = 0;
        this.catX = x;
        this.catY = y;
        this.catVx = 0;
        this.catVy = 0;
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

        const moveSpeed = this.speed + (currentWave - 1) * 0.05;
        this.x += dx * moveSpeed;
        this.y += dy * moveSpeed;

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

        if (this.catAssistantTimer > 0) {
            this.catAssistantTimer -= deltaTime;
            if (this.catAssistantTimer <= 0) {
                this.catAssistantTimer = 0;
            }

            // Move independently
            if (this.catVx === undefined || this.catVy === undefined || (this.catVx === 0 && this.catVy === 0)) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2.0;
                this.catVx = Math.cos(angle) * speed;
                this.catVy = Math.sin(angle) * speed;
            }
            this.catX += this.catVx;
            this.catY += this.catVy;

            // Bounce off boundaries of playing area
            const catRadius = 25;
            if (this.catX - catRadius <= 10) {
                this.catX = catRadius + 11;
                this.catVx = Math.abs(this.catVx);
            } else if (this.catX + catRadius >= ARENA_WIDTH - 10) {
                this.catX = ARENA_WIDTH - catRadius - 11;
                this.catVx = -Math.abs(this.catVx);
            }
            if (this.catY - catRadius <= ARENA_CEILING) {
                this.catY = catRadius + ARENA_CEILING + 1;
                this.catVy = Math.abs(this.catVy);
            } else if (this.catY + catRadius >= ARENA_HEIGHT - 10) {
                this.catY = ARENA_HEIGHT - catRadius - 11;
                this.catVy = -Math.abs(this.catVy);
            }

            // Smoothly change velocity over time for a wandering effect
            this.catVx += (Math.random() - 0.5) * 0.2;
            this.catVy += (Math.random() - 0.5) * 0.2;

            // Clamp velocity to a reasonable speed
            const speed = Math.hypot(this.catVx, this.catVy);
            const maxSpeed = 3.0;
            if (speed > maxSpeed) {
                this.catVx = (this.catVx / speed) * maxSpeed;
                this.catVy = (this.catVy / speed) * maxSpeed;
            }

            // Cat shooting logic: shoots matching player rate of fire and bonus powerups
            if (!this.catShootTimer) this.catShootTimer = 0;
            this.catShootTimer += deltaTime;
            if (this.catShootTimer >= this.fireRate) {
                this.catShootTimer = 0;
                
                // Find nearest enemy
                let nearestEnemy = null;
                let minDist = Infinity;
                enemies.forEach(e => {
                    const d = Math.hypot(e.x - this.catX, e.y - this.catY);
                    if (d < minDist) {
                        minDist = d;
                        nearestEnemy = e;
                    }
                });

                if (nearestEnemy) {
                    const angle = Math.atan2(nearestEnemy.y - this.catY, nearestEnemy.x - this.catX);
                    const speed = 7.0;
                    const bulletType = this.bulletType || 'laser';
                    
                    if (this.threeWayTimer > 0) {
                        const angles = [angle, angle - 0.314, angle + 0.314];
                        angles.forEach(a => {
                            const vx = Math.cos(a) * speed;
                            const vy = Math.sin(a) * speed;
                            bullets.push(new Bullet(this.catX, this.catY, vx, vy, 'player', bulletType));
                        });
                    } else {
                        const vx = Math.cos(angle) * speed;
                        const vy = Math.sin(angle) * speed;
                        bullets.push(new Bullet(this.catX, this.catY, vx, vy, 'player', bulletType));
                    }
                    window.audio.playShoot();
                }
            }
        } else {
            // Keep cat at player position so it spawns/appears smoothly from player
            this.catX = this.x;
            this.catY = this.y;
            this.catVx = undefined;
            this.catVy = undefined;
        }
    }

    shoot() {
        const bulletSpeed = 8.0; 
        const shootAngle = this.facingAngle;
        const bx = this.x + Math.cos(shootAngle) * 20; // Spawn closer to floating mouth
        const by = this.y + Math.sin(shootAngle) * 20;

        const bulletType = this.bulletType || 'laser';

        if (this.threeWayTimer > 0) {
            // Three-way splay: center, left (-18 degrees / -0.314 rad), right (+18 degrees / +0.314 rad)
            const angles = [shootAngle, shootAngle - 0.314, shootAngle + 0.314];
            angles.forEach(angle => {
                const vx = Math.cos(angle) * bulletSpeed;
                const vy = Math.sin(angle) * bulletSpeed;
                bullets.push(new Bullet(bx, by, vx, vy, 'player', bulletType));
            });
        } else {
            const vx = Math.cos(shootAngle) * bulletSpeed;
            const vy = Math.sin(shootAngle) * bulletSpeed;
            bullets.push(new Bullet(bx, by, vx, vy, 'player', bulletType));
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
        drawImagePreservingAspect(starmerImg, this.radius);

        ctx.restore();
    }
}

class Bullet {
    constructor(x, y, vx, vy, origin = 'player', type = 'laser') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = type === 'dropping' ? 6 : (type === 'brown_lump' ? 9 : (type === 'brown_peanut' ? 15 : (type === 'diesel_smoke' ? 14 : (['gravy', 'lager', 'chips'].includes(type) ? 21 : 4))));
        this.origin = origin;
        this.type = type; // 'laser' or 'dropping' or 'brown_lump' or 'brown_peanut' or 'silver_coin' or 'diesel_smoke' or 'gravy' or 'lager' or 'chips'
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

        // Bouncy check for boss projectiles ('gravy', 'lager', 'chips')
        if (['gravy', 'lager', 'chips'].includes(this.type)) {
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

            if (this.bounceCount > 3) {
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
            
            drawImagePreservingAspect(poopProjectileImg, this.radius);
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
        } else if (this.type === 'gravy') {
            ctx.translate(this.x, this.y);
            ctx.rotate(Date.now() / 200);
            drawImagePreservingAspect(gravyImg, this.radius);
        } else if (this.type === 'lager') {
            ctx.translate(this.x, this.y);
            ctx.rotate(Date.now() / 150);
            drawImagePreservingAspect(lagerImg, this.radius);
        } else if (this.type === 'chips') {
            ctx.translate(this.x, this.y);
            ctx.rotate(Date.now() / 250);
            drawImagePreservingAspect(chipsImg, this.radius);
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
                this.radius = 30.25;
                this.speed = 0.35; // Very slowly traverse
                this.hp = 1;
                this.color = '#6ab023';
                this.scoreValue = 180;
                const greenAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(greenAngle) * this.speed;
                this.vy = Math.sin(greenAngle) * this.speed;
                break;
            case 'libdem': // Yellow Lib Dem bird
                this.radius = 36.3; // 50% larger
                this.hp = 1;
                this.color = '#ffd700';
                this.scoreValue = 300;
                this.dropTimer = 0;
                this.vx = 2.2;
                break;
            case 'dead_fish':
                this.radius = 30; // 25% bigger (original 24)
                this.hp = 1;
                this.color = '#78909c';
                this.scoreValue = 150;
                this.speed = 1.2 + currentWave * 0.04;
                const dfAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(dfAngle) * this.speed;
                this.vy = Math.sin(dfAngle) * this.speed;
                break;
            case 'dead_duck':
                this.radius = 32.5; // 25% bigger (original 26)
                this.hp = 1;
                this.color = '#5d4037';
                this.scoreValue = 150;
                this.speed = 1.1 + currentWave * 0.04;
                const ddAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(ddAngle) * this.speed;
                this.vy = Math.sin(ddAngle) * this.speed;
                break;
            case 'toxic_jar':
                this.radius = 22;
                this.hp = 1;
                this.color = '#00e676';
                this.scoreValue = 250;
                this.speed = 1.3 + currentWave * 0.05;
                const tjAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(tjAngle) * this.speed;
                this.vy = Math.sin(tjAngle) * this.speed;
                break;
            case 'fly':
                this.radius = 18;
                this.hp = 1;
                this.color = '#37474f';
                this.scoreValue = 100;
                this.speed = 1.8 + currentWave * 0.05;
                const flyAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(flyAngle) * this.speed;
                this.vy = Math.sin(flyAngle) * this.speed;
                break;
            case 'tory_condom':
                this.radius = 22;
                this.hp = 1;
                this.color = '#bbdefb';
                this.scoreValue = 120;
                this.speed = 1.0 + currentWave * 0.03;
                const tcAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(tcAngle) * this.speed;
                this.vy = Math.sin(tcAngle) * this.speed;
                break;
            case 'handcuffs':
                this.radius = 24;
                this.hp = 1;
                this.color = '#e91e63'; // Pink
                this.scoreValue = 150;
                this.speed = 0.8 + currentWave * 0.04;
                const hcAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(hcAngle) * this.speed;
                this.vy = Math.sin(hcAngle) * this.speed;
                break;
            case 'poo':
                this.radius = 22;
                this.hp = 1;
                this.color = '#8b5a2b'; // Sienna Brown
                this.scoreValue = 120;
                this.speed = 0.7 + currentWave * 0.03;
                const pooAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(pooAngle) * this.speed;
                this.vy = Math.sin(pooAngle) * this.speed;
                break;
            case 'dvds':
                this.radius = 26;
                this.hp = 1;
                this.color = '#00e5ff'; // Neon Blue
                this.scoreValue = 180;
                this.speed = 1.0 + currentWave * 0.04;
                const dvdAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(dvdAngle) * this.speed;
                this.vy = Math.sin(dvdAngle) * this.speed;
                break;
            case 'rubber_ring':
                this.radius = 24;
                this.hp = 1;
                this.color = '#ffeb3b';
                this.scoreValue = 150;
                this.speed = 0.8 + currentWave * 0.04;
                const rrAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(rrAngle) * this.speed;
                this.vy = Math.sin(rrAngle) * this.speed;
                break;
            case 'teddy_bear':
                this.radius = 25;
                this.hp = 1;
                this.color = '#e57373';
                this.scoreValue = 180;
                this.speed = 0.7 + currentWave * 0.03;
                const tbAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(tbAngle) * this.speed;
                this.vy = Math.sin(tbAngle) * this.speed;
                break;
            case 'monster_can':
                this.radius = 27.5;
                this.hp = 1;
                this.color = '#4caf50';
                this.scoreValue = 200;
                this.speed = 1.1 + currentWave * 0.05;
                const mcAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(mcAngle) * this.speed;
                this.vy = Math.sin(mcAngle) * this.speed;
                break;
            case 'orange_mallet':
                this.radius = 26;
                this.hp = 1;
                this.color = '#ff9800';
                this.scoreValue = 160;
                this.speed = 0.9 + currentWave * 0.04;
                const omallAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(omallAngle) * this.speed;
                this.vy = Math.sin(omallAngle) * this.speed;
                break;
            case 'traffic_cone':
                this.radius = 23;
                this.hp = 1;
                this.color = '#ff5722';
                this.scoreValue = 140;
                this.speed = 0.8 + currentWave * 0.04;
                const tcConeAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(tcConeAngle) * this.speed;
                this.vy = Math.sin(tcConeAngle) * this.speed;
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
                this.speed = 0.5 + currentWave * 0.01;
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
                this.radius = 37.5; // enlarged
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
            case 'paper_plane':
                this.radius = 23;
                this.hp = 1;
                this.color = '#cccccc'; // Grey/White
                this.scoreValue = 150;
                this.speed = 0.8 + currentWave * 0.04;
                const ppAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(ppAngle) * this.speed;
                this.vy = Math.sin(ppAngle) * this.speed;
                break;
            case 'tote_bag':
                this.radius = 30;
                this.hp = 1;
                this.color = '#81c784'; // Light green
                this.scoreValue = 150;
                this.speed = 0.8 + currentWave * 0.04;
                const tbagAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(tbagAngle) * this.speed;
                this.vy = Math.sin(tbagAngle) * this.speed;
                break;
            case 'solar_panel':
                this.radius = 31.25;
                this.hp = 1;
                this.color = '#1565c0'; // Dark blue
                this.scoreValue = 180;
                this.speed = 0.7 + currentWave * 0.03;
                const spAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(spAngle) * this.speed;
                this.vy = Math.sin(spAngle) * this.speed;
                break;
            case 'sunscreen':
                this.radius = 27.5;
                this.hp = 1;
                this.color = '#ffb74d'; // Orange
                this.scoreValue = 150;
                this.speed = 0.9 + currentWave * 0.04;
                const ssAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(ssAngle) * this.speed;
                this.vy = Math.sin(ssAngle) * this.speed;
                break;
            case 'electric_fan':
                this.radius = 30;
                this.hp = 1;
                this.color = '#e91e63'; // Pink (matches sunglasses frames)
                this.scoreValue = 150;
                this.speed = 1.0 + currentWave * 0.05;
                const efanAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(efanAngle) * this.speed;
                this.vy = Math.sin(efanAngle) * this.speed;
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
                this.radius = 27.5;
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
                this.radius = 30;
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
            case 'sandals':
                this.radius = 30;
                this.speed = 0.9 + currentWave * 0.04;
                this.hp = 1;
                this.color = '#8d6e63';
                this.scoreValue = 200;
                const sdAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(sdAngle) * this.speed;
                this.vy = Math.sin(sdAngle) * this.speed;
                break;
            case 'avocado_on_toast':
                this.radius = 22;
                this.speed = 0.8 + currentWave * 0.04;
                this.hp = 1;
                this.color = '#4caf50';
                this.scoreValue = 200;
                const avAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(avAngle) * this.speed;
                this.vy = Math.sin(avAngle) * this.speed;
                break;
            case 'oat_milk':
                this.radius = 31.25;
                this.speed = 1.0 + currentWave * 0.04;
                this.hp = 1;
                this.color = '#e0f7fa';
                this.scoreValue = 200;
                const omAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(omAngle) * this.speed;
                this.vy = Math.sin(omAngle) * this.speed;
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
                this.radius = 37.5;
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
            case 'sadiq_miniboss':
                this.radius = 37.5;
                this.hp = 10;
                this.color = '#ff9800';
                this.scoreValue = 500;
                this.speed = 0.5;
                this.fireTimer = 0;
                const sadiqAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(sadiqAngle) * this.speed;
                this.vy = Math.sin(sadiqAngle) * this.speed;
                break;
            case 'lime_bike':
                this.radius = 45;
                this.hp = 1;
                this.color = '#00ff00';
                this.scoreValue = 150;
                this.speed = 1.6 + currentWave * 0.04;
                const limeBikeAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(limeBikeAngle) * this.speed;
                this.vy = Math.sin(limeBikeAngle) * this.speed;
                break;
            case 'police_helmet':
                this.radius = 41.25;
                this.hp = 2;
                this.color = '#0d47a1';
                this.scoreValue = 200;
                this.speed = 1.0 + currentWave * 0.03;
                const policeHelmetAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(policeHelmetAngle) * this.speed;
                this.vy = Math.sin(policeHelmetAngle) * this.speed;
                break;
            case 'punk':
                this.radius = 41.25;
                this.hp = 1;
                this.color = '#e91e63';
                this.scoreValue = 150;
                this.speed = 1.2 + currentWave * 0.04;
                const punkAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(punkAngle) * this.speed;
                this.vy = Math.sin(punkAngle) * this.speed;
                break;
            case 'speed_camera':
                this.radius = 37.5;
                this.hp = 2;
                this.color = '#ffd54f';
                this.scoreValue = 250;
                this.speed = 1.0 + currentWave * 0.03;
                const speedCameraAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(speedCameraAngle) * this.speed;
                this.vy = Math.sin(speedCameraAngle) * this.speed;
                break;
            case 'phonebox':
                this.radius = 41.25;
                this.hp = 2;
                this.color = '#d32f2f';
                this.scoreValue = 200;
                this.speed = 1.0 + currentWave * 0.03;
                const phoneboxAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(phoneboxAngle) * this.speed;
                this.vy = Math.sin(phoneboxAngle) * this.speed;
                break;
            case 'blackcab':
                this.radius = 48.75;
                this.hp = 3;
                this.color = '#212121';
                this.scoreValue = 250;
                this.speed = 1.3 + currentWave * 0.04;
                const blackcabAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(blackcabAngle) * this.speed;
                this.vy = Math.sin(blackcabAngle) * this.speed;
                break;
            case 'ursula_miniboss':
                this.radius = 30;
                this.hp = 10;
                this.color = '#003399';
                this.scoreValue = 500;
                this.speed = 0.5;
                this.fireTimer = 0;
                const ursulaAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(ursulaAngle) * this.speed;
                this.vy = Math.sin(ursulaAngle) * this.speed;
                break;
            case 'blue_passport':
                this.radius = 24;
                this.hp = 1;
                this.color = '#0d47a1';
                this.scoreValue = 150;
                this.speed = 1.2 + currentWave * 0.03;
                const passportAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(passportAngle) * this.speed;
                this.vy = Math.sin(passportAngle) * this.speed;
                break;
            case 'euro_star':
                this.radius = 22;
                this.hp = 1;
                this.color = '#ffd700';
                this.scoreValue = 150;
                this.speed = 1.4 + currentWave * 0.04;
                const starAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(starAngle) * this.speed;
                this.vy = Math.sin(starAngle) * this.speed;
                break;
            case 'red_tape':
                this.radius = 22;
                this.hp = 1;
                this.color = '#d32f2f';
                this.scoreValue = 200;
                this.speed = 1.1 + currentWave * 0.03;
                const tapeAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(tapeAngle) * this.speed;
                this.vy = Math.sin(tapeAngle) * this.speed;
                break;
            case 'red_wine':
                this.radius = 41.25;
                this.hp = 1;
                this.color = '#7c0a02';
                this.scoreValue = 200;
                this.speed = 1.2 + currentWave * 0.03;
                const wineAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(wineAngle) * this.speed;
                this.vy = Math.sin(wineAngle) * this.speed;
                break;
            case 'evil_keir':
                this.radius = 30;
                this.hp = 1;
                this.color = '#d32f2f'; // Labour Red
                this.scoreValue = 100;
                this.speed = 1.0;
                this.vx = 0;
                this.vy = 0;
                break;
            case 'tooth':
                this.radius = 10;
                this.hp = 1;
                this.color = '#ffffff';
                this.scoreValue = 100;
                this.parentBoss = null;
                this.angleOffset = 0;
                break;
            case 'crowned_andy':
                this.radius = 75;
                this.hp = 30;
                this.color = '#e53935';
                this.scoreValue = 1500;
                this.speed = 1.5;
                this.fireTimer = 0;
                const caAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(caAngle) * this.speed;
                this.vy = Math.sin(caAngle) * this.speed;
                break;
            case 'andy_no_crown':
                this.radius = 90;
                this.hp = 10;
                this.color = '#e53935';
                this.scoreValue = 500;
                this.speed = 2.2;
                this.fireTimer = 0;
                const ancAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(ancAngle) * this.speed;
                this.vy = Math.sin(ancAngle) * this.speed;
                break;
            case 'crown':
                this.radius = 53;
                this.hp = 10;
                this.color = '#ffd700';
                this.scoreValue = 500;
                this.speed = 2.8;
                this.fireTimer = 0;
                const crAngle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(crAngle) * this.speed;
                this.vy = Math.sin(crAngle) * this.speed;
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

        if (this.type === 'evil_keir') {
            if (this.spawnTimer === undefined) this.spawnTimer = 0;
            if (this.spawnTimer > 0) {
                this.spawnTimer -= deltaTime;
                if (this.spawnTimer < 0) this.spawnTimer = 0;
            }

            const pos = getPatrolTarget(this.keirLayer, this.keirIndex, this.keirTotal, waveStartTime);
            this.x = pos.x;
            this.y = pos.y;
            return;
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
                    const pursueSpeed = (0.6 + currentWave * 0.008) * 1.6;
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
        }
        else if (this.type === 'ed_davey') {
            this.angle += 0.064;
            this.y = (ARENA_CEILING + 60) + (Math.sin(this.angle) * 0.5 + 0.5) * (ARENA_HEIGHT * 0.7 - (ARENA_CEILING + 60));
            
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
        else if (this.type === 'crowned_andy') {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x - this.radius <= 10) { this.x = this.radius + 11; this.vx = Math.abs(this.vx); }
            else if (this.x + this.radius >= ARENA_WIDTH - 10) { this.x = ARENA_WIDTH - this.radius - 11; this.vx = -Math.abs(this.vx); }
            if (this.y - this.radius <= ARENA_CEILING) { this.y = this.radius + ARENA_CEILING + 1; this.vy = Math.abs(this.vy); }
            else if (this.y + this.radius >= ARENA_HEIGHT - 10) { this.y = ARENA_HEIGHT - this.radius - 11; this.vy = -Math.abs(this.vy); }

            this.fireTimer += deltaTime;
            if (this.fireTimer > 2000) {
                this.fireTimer = 0;
                if (player) {
                    const dx = player.x - this.x;
                    const dy = player.y - this.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist > 5) {
                        const bulletSpeed = (2.4 + currentWave * 0.04) * 1.6;
                        const baseAngle = Math.atan2(dy, dx);
                        const types = ['gravy', 'lager', 'chips'];
                        const angles = [baseAngle - 0.22, baseAngle, baseAngle + 0.22];
                        for (let idx = 0; idx < 3; idx++) {
                            const angle = angles[idx];
                            const vx = Math.cos(angle) * bulletSpeed;
                            const vy = Math.sin(angle) * bulletSpeed;
                            enemyBullets.push(new Bullet(this.x, this.y, vx, vy, 'enemy', types[idx]));
                        }
                    }
                }
            }
        }
        else if (this.type === 'andy_no_crown') {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x - this.radius <= 10) { this.x = this.radius + 11; this.vx = Math.abs(this.vx); }
            else if (this.x + this.radius >= ARENA_WIDTH - 10) { this.x = ARENA_WIDTH - this.radius - 11; this.vx = -Math.abs(this.vx); }
            if (this.y - this.radius <= ARENA_CEILING) { this.y = this.radius + ARENA_CEILING + 1; this.vy = Math.abs(this.vy); }
            else if (this.y + this.radius >= ARENA_HEIGHT - 10) { this.y = ARENA_HEIGHT - this.radius - 11; this.vy = -Math.abs(this.vy); }

            this.fireTimer += deltaTime;
            if (this.fireTimer > 2500) {
                this.fireTimer = 0;
                const types = ['lager', 'chips'];
                const projType = types[Math.floor(Math.random() * types.length)];
                if (player) {
                    const dx = player.x - this.x;
                    const dy = player.y - this.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist > 5) {
                        const bulletSpeed = (2.6 + currentWave * 0.04) * 1.6;
                        const vx = (dx / dist) * bulletSpeed;
                        const vy = (dy / dist) * bulletSpeed;
                        enemyBullets.push(new Bullet(this.x, this.y, vx, vy, 'enemy', projType));
                    }
                }
            }
        }
        else if (this.type === 'crown') {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x - this.radius <= 10) { this.x = this.radius + 11; this.vx = Math.abs(this.vx); }
            else if (this.x + this.radius >= ARENA_WIDTH - 10) { this.x = ARENA_WIDTH - this.radius - 11; this.vx = -Math.abs(this.vx); }
            if (this.y - this.radius <= ARENA_CEILING) { this.y = this.radius + ARENA_CEILING + 1; this.vy = Math.abs(this.vy); }
            else if (this.y + this.radius >= ARENA_HEIGHT - 10) { this.y = ARENA_HEIGHT - this.radius - 11; this.vy = -Math.abs(this.vy); }

            this.fireTimer += deltaTime;
            if (this.fireTimer > 1800) {
                this.fireTimer = 0;
                if (player) {
                    const dx = player.x - this.x;
                    const dy = player.y - this.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist > 5) {
                        const bulletSpeed = (2.8 + currentWave * 0.04) * 1.6;
                        const vx = (dx / dist) * bulletSpeed;
                        const vy = (dy / dist) * bulletSpeed;
                        enemyBullets.push(new Bullet(this.x, this.y, vx, vy, 'enemy', 'gravy'));
                    }
                }
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
        else if (['zack_miniboss', 'kemi_miniboss', 'farage_miniboss', 'ed_miniboss', 'sadiq_miniboss', 'ursula_miniboss'].includes(this.type)) {
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
                    'ed_miniboss': '#ffd700',
                    'sadiq_miniboss': '#ff9800',
                    'ursula_miniboss': '#003399'
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
        else if (['tree_trunk', 'cat_enemy', 'cigarette', 'booze_enemy', 'candy_floss', 'toffee_apple', 'banknote', 'mini_brain', 'vape', 'breakfast', 'tshirt', 'grad_cap', 'padlocks', 'lettuce', 'mop_head', 'pig', 'tabloid', 'english_flag', 'whatsapp', 'cannabis', 'tie_dye', 'party_hat', 'party_rings', 'cake', 'dead_fish', 'dead_duck', 'toxic_jar', 'sandals', 'avocado_on_toast', 'oat_milk', 'fly', 'tory_condom', 'rubber_ring', 'teddy_bear', 'monster_can', 'orange_mallet', 'traffic_cone', 'handcuffs', 'poo', 'dvds', 'paper_plane', 'tote_bag', 'solar_panel', 'sunscreen', 'electric_fan', 'lime_bike', 'police_helmet', 'punk', 'speed_camera', 'phonebox', 'blackcab', 'blue_passport', 'euro_star', 'red_tape', 'red_wine'].includes(this.type)) {
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
            const bulletSpeed = (2.4 + currentWave * 0.04) * 1.6;
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
        if (['zack_miniboss', 'kemi_miniboss', 'farage_miniboss', 'ed_miniboss', 'sadiq_miniboss', 'ursula_miniboss'].includes(this.type)) {
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
            drawImagePreservingAspect(lordWigImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'newspaper') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(newspaperImg, this.radius);
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
            drawImagePreservingAspect(toryLogoImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'reform') {
            ctx.save();
            const arrowAngle = (this.state === 'charging') ? Math.atan2(this.vy, this.vx) : this.targetAngle;
            ctx.rotate(arrowAngle);
            drawImagePreservingAspect(reformLogoImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'green') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(greenLogoImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'libdem') {
            ctx.save();
            if (this.vx < 0) {
                ctx.scale(-1, 1);
            }
            drawImagePreservingAspect(libdemLogoImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'mandipede') {
            if (this.segmentType === 'head') {
                ctx.save();
                const wobble = Math.sin(Date.now() / 200) * 0.05;
                ctx.rotate(wobble);
                drawImagePreservingAspect(mandipedeFaceImg, this.radius, 1.5);
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
            drawImagePreservingAspect(sewageTankImg, this.radius);
        }
        else if (this.type === 'dead_fish') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(deadFishImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'dead_duck') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(deadDuckImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'toxic_jar') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(toxicJarImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'sandals') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(sandalsImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'avocado_on_toast') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(avocadoImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'oat_milk') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(oatMilkImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'fly') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(flyImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'tory_condom') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(toryCondomImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'handcuffs') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(handcuffsImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'poo') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(poopProjectileImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'dvds') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(dvdsImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'rubber_ring') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(rubberRingImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'teddy_bear') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(teddyBearImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'monster_can') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(monsterCanImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'orange_mallet') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(orangeMalletImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'traffic_cone') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(trafficConeImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'euro_chomper') {
            const travelAngle = Math.atan2(this.vy, this.vx);
            ctx.rotate(travelAngle);
            ctx.save();
            const wobble = Math.sin(this.chompCycle * 2) * 0.05;
            ctx.rotate(wobble);
            drawImagePreservingAspect(euroSpriteImg, this.radius);
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
            drawImagePreservingAspect(edImg, 20);
            ctx.restore();

        }
        else if (this.type === 'labour_enemy') {
            // Labour Square Block Logo (drift wobble)
            ctx.translate(Math.sin(this.bobOffset) * 20, 0);
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 0.5) * 0.08); // slow sway matching other party logos like tory
            drawImagePreservingAspect(labourLogoImg, this.radius);
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
            drawImagePreservingAspect(brainBossImg, this.radius);

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
            drawImagePreservingAspect(cigarettesImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'booze_enemy') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(ginImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'candy_floss') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(candyflossImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'toffee_apple') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(toffeeAppleImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'party_hat') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(partyHatImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'party_rings') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(partyRingsImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'cake') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(cakeImg, this.radius);
            ctx.restore();
        }


        else if (this.type === 'banknote') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(banknotesImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'paper_plane') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(paperPlaneImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'tote_bag') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(toteBagImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'solar_panel') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(solarPanelImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'sunscreen') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(sunscreenImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'electric_fan') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(electricFanImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'vape') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle) * 0.15);
            drawImagePreservingAspect(vapeImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'breakfast') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle) * 0.15); // slow oscillate
            drawImagePreservingAspect(breakfastImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'tshirt') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle) * 0.15);
            drawImagePreservingAspect(tieDyeImg, this.radius);
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
            drawImagePreservingAspect(bloodBagImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'grad_cap') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.1); // subtle sway
            drawImagePreservingAspect(diplomaImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'lettuce') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(lettuceImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'mop_head') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(mopHeadImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'pig') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(pigImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'tabloid') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(tabloidImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'english_flag') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 0.5) * 0.12); // gentle sway
            
            const aspect = englishFlagImg.complete && englishFlagImg.naturalHeight !== 0 ? (englishFlagImg.naturalWidth / englishFlagImg.naturalHeight) : 1.0;
            const w = this.radius * 2 * aspect;
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
            drawImagePreservingAspect(whatsappImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'cannabis') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle) * 0.15); // slow oscillate
            if (cannabisImg.complete && cannabisImg.naturalWidth !== 0) {
                drawImagePreservingAspect(cannabisImg, this.radius);
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
                drawImagePreservingAspect(tieDyeImg, this.radius);
            } else {
                // Draw vector fallback (tie-dye tshirt)
                ctx.scale(1.375, 1.375);
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
            drawImagePreservingAspect(lordWigImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'zack_miniboss') {
            ctx.save();
            const wobble = Math.sin(Date.now() / 200) * 0.05;
            ctx.rotate(wobble);
            drawImagePreservingAspect(zackImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'kemi_miniboss') {
            ctx.save();
            const wobble = Math.sin(Date.now() / 200) * 0.05;
            ctx.rotate(wobble);
            drawImagePreservingAspect(kemiImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'farage_miniboss') {
            ctx.save();
            const wobble = Math.sin(Date.now() / 200) * 0.05;
            ctx.rotate(wobble);
            drawImagePreservingAspect(farageImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'ed_miniboss') {
            ctx.save();
            const wobble = Math.sin(Date.now() / 200) * 0.05;
            ctx.rotate(wobble);
            drawImagePreservingAspect(edImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'sadiq_miniboss') {
            ctx.save();
            const wobble = Math.sin(Date.now() / 200) * 0.05;
            ctx.rotate(wobble);
            drawImagePreservingAspect(sadiqImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'lime_bike') {
            ctx.save();
            ctx.rotate(this.angle);
            drawImagePreservingAspect(limeBikeImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'police_helmet') {
            ctx.save();
            ctx.rotate(this.angle);
            drawImagePreservingAspect(policeHelmetImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'punk') {
            ctx.save();
            ctx.rotate(this.angle);
            drawImagePreservingAspect(punkImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'speed_camera') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(speedCameraImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'phonebox') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(phoneboxImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'blackcab') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(blackcabImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'ursula_miniboss') {
            ctx.save();
            const wobble = Math.sin(Date.now() / 200) * 0.05;
            ctx.rotate(wobble);
            drawImagePreservingAspect(ursulaImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'crowned_andy') {
            ctx.save();
            const wobble = Math.sin(Date.now() / 200) * 0.05;
            ctx.rotate(wobble);
            drawImagePreservingAspect(andyCrownedImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'andy_no_crown') {
            ctx.save();
            const wobble = Math.sin(Date.now() / 200) * 0.05;
            ctx.rotate(wobble);
            drawImagePreservingAspect(andyImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'crown') {
            ctx.save();
            const wobble = Math.sin(Date.now() / 150) * 0.1;
            ctx.rotate(wobble);
            drawImagePreservingAspect(crownImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'evil_keir') {
            ctx.save();
            if (this.spawnTimer !== undefined && this.spawnTimer > 0) {
                ctx.globalAlpha = 1 - (this.spawnTimer / 1000);
            }
            const wobble = Math.sin(Date.now() / 150) * 0.05;
            ctx.rotate(wobble);
            drawImagePreservingAspect(evilKeirImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'blue_passport') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(bluePassportImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'euro_star') {
            ctx.save();
            ctx.rotate(this.angle);
            drawImagePreservingAspect(euroStarImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'red_tape') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(redTapeImg, this.radius);
            ctx.restore();
        }
        else if (this.type === 'red_wine') {
            ctx.save();
            ctx.rotate(Math.sin(this.angle * 1.5) * 0.15);
            drawImagePreservingAspect(redWineImg, this.radius);
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
        this.type = type; // 'xvote', 'rose', 'bomb', 'three_way', 'bouncy_shots', or 'bonus_BB'
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
            drawImagePreservingAspect(bonusRoseImg, this.radius);
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
        } else if (this.type === 'bonus_BB') {
            drawImagePreservingAspect(bonusBBImg, this.radius);
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
    gameElapsedTime = 0;
    if (hudTimer) hudTimer.textContent = '00:00';
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
}

function getPatrolTarget(layerNum, index, total, spawnTimeMs) {
    const isClockwise = (layerNum % 2 === 0);
    const layerIdx = index;
    const layerCount = total;

    const elapsedMs = Date.now() - spawnTimeMs;
    const elapsedSec = elapsedMs / 1000;
    const speedPixelsPerSec = 130;
    const baseOffset = elapsedSec * speedPixelsPerSec;
    
    let targetX, targetY;
    
    const inset = 35 + layerNum * 40;
    const minX = 10 + inset;
    const maxX = ARENA_WIDTH - 10 - inset;
    const minY = ARENA_CEILING + inset;
    const maxY = ARENA_HEIGHT - 10 - inset;
    const w = maxX - minX;
    const h = maxY - minY;
    const P = 2 * (w + h);
    
    let s;
    if (isClockwise) {
        s = (baseOffset + layerIdx * (P / layerCount)) % P;
    } else {
        s = (((-baseOffset + layerIdx * (P / layerCount)) % P) + P) % P;
    }
    
    if (s < w) {
        targetX = minX + s; targetY = minY;
    } else if (s < w + h) {
        targetX = maxX; targetY = minY + (s - w);
    } else if (s < 2 * w + h) {
        targetX = maxX - (s - (w + h)); targetY = maxY;
    } else {
        targetX = minX; targetY = maxY - (s - (2 * w + h));
    }
    return { x: targetX, y: targetY };
}

function spawnKeirLayer(layerNum, count) {
    for (let i = 0; i < count; i++) {
        // Calculate initial target position directly to avoid glitching across
        const pos = getPatrolTarget(layerNum, i, count, waveStartTime);
        const enemy = new Enemy(pos.x, pos.y, 'evil_keir');
        enemy.keirLayer = layerNum;
        enemy.keirIndex = i;
        enemy.keirTotal = count;
        enemy.spawnTimer = 1000; // 1 second of safe spawn fade-in
        enemies.push(enemy);
    }
}

function getWaveName(waveNum) {
    const layoutWave = 1 + ((waveNum - 1) % 18);
    if (layoutWave === 1) return "TORY COLLAPSE";
    if (layoutWave === 2) return "REFORM BOOZE UP";
    if (layoutWave === 3) return "THE LORDS ARE REVOLTING";
    if (layoutWave === 4) return "LIB DEMS POLITICAL PARTY TIME";
    if (layoutWave === 5) return "GREEN UNPLEASANT LAND";
    if (layoutWave === 6) return "SEWAGE CRISIS";
    if (layoutWave === 7) return "TORY PSYCHODRAMA";
    if (layoutWave === 8) return "THE MANDIPEDE";
    if (layoutWave === 9) return "DAVEY BUNGEE";
    if (layoutWave === 10) return "COMMONS DEBATE";
    if (layoutWave === 11) return "GREENS CLIMATE ANTICLIMAX";
    if (layoutWave === 12) return "TORY SLEAZE";
    if (layoutWave === 13) return "REFORM BOSS";
    if (layoutWave === 14) return "GREEN BOSS";
    if (layoutWave === 15) return "LONDONCENTRIC";
    if (layoutWave === 16) return "DON'T MENTION EUROPE";
    if (layoutWave === 17) return "HIS GREATEST FOE";
    if (layoutWave === 18) return "THE KING IN THE NORTH";
    return "";
}

function spawnWave() {
    enemies = [];
    bullets = [];
    enemyBullets = [];
    timeSinceLastKill = 0;
    showNotification(getWaveName(currentWave) + "\nWAVE " + currentWave, 440);

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

        const newEnemy = new Enemy(ex, ey, type);
        enemies.push(newEnemy);
        return newEnemy;
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
        // Wave 2 - "Reform Booze Up" - Reform arrows + cigarettes + breakfast + booze bottles + vapes + tabloid + banknotes + English flags + red wine + Nigel Farage mini boss
        for (let i = 0; i < 6; i++) spawnEnemy('reform');
        for (let i = 0; i < 3; i++) spawnEnemy('cigarette');
        for (let i = 0; i < 2; i++) spawnEnemy('breakfast');
        for (let i = 0; i < 3; i++) spawnEnemy('booze_enemy');
        for (let i = 0; i < 2; i++) spawnEnemy('vape');
        for (let i = 0; i < 2; i++) spawnEnemy('tabloid');
        for (let i = 0; i < 3; i++) spawnEnemy('banknote');
        for (let i = 0; i < 3; i++) spawnEnemy('english_flag');
        for (let i = 0; i < 3; i++) spawnEnemy('red_wine');
        spawnEnemy('farage_miniboss');
    }
    else if (layoutWave === 3) {
        // Wave 3 - Boss level - Lords Boss - One large boss wig firing out lots of small wig enemies + fly + gin
        const bossWig = new Enemy(ARENA_WIDTH / 2, 160, 'lord_wig_boss');
        enemies.push(bossWig);

        // Spawn 4 initial small wigs as guards
        for (let i = 0; i < 4; i++) {
            spawnEnemy('wig');
        }
        for (let i = 0; i < 3; i++) {
            spawnEnemy('fly');
        }
        for (let i = 0; i < 3; i++) {
            spawnEnemy('booze_enemy');
        }
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
        // Wave 5 - "GREEN UNPLEASANT LAND" - Green party theme: Green logo, cannabis, tie dye, sandals, avocado, oat milk + Zack mini boss
        for (let i = 0; i < 4; i++) spawnEnemy('green');
        for (let i = 0; i < 3; i++) spawnEnemy('cannabis');
        for (let i = 0; i < 3; i++) spawnEnemy('tie_dye');
        for (let i = 0; i < 3; i++) spawnEnemy('sandals');
        for (let i = 0; i < 3; i++) spawnEnemy('avocado_on_toast');
        for (let i = 0; i < 3; i++) spawnEnemy('oat_milk');
        spawnEnemy('zack_miniboss');
    }
    else if (layoutWave === 6) {
        // Wave 6 - "SEWAGE CRISIS"
        const boss = new Enemy(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, 'sewage_tank');
        boss.radius = 90; // Twice the size (original 45)
        enemies.push(boss);
        for (let i = 0; i < 4; i++) {
            spawnEnemy('dead_fish');
        }
        for (let i = 0; i < 4; i++) {
            spawnEnemy('dead_duck');
        }
        for (let i = 0; i < 3; i++) {
            spawnEnemy('toxic_jar');
        }
        for (let i = 0; i < 3; i++) {
            spawnEnemy('fly');
        }
        for (let i = 0; i < 3; i++) {
            spawnEnemy('tory_condom');
        }
    }
    else if (layoutWave === 7) {
        // Wave 7 - Tory wave "Tory Psychodrama" - Exploding Brain Boss + Kemi Badenoch mini boss + banknotes, diplomas, lettuce, newspaper, mop, pig
        const bossBrain = new Enemy(ARENA_WIDTH / 2, 160, 'exploding_brain');
        enemies.push(bossBrain);
        spawnEnemy('kemi_miniboss');
        
        for (let i = 0; i < 3; i++) spawnEnemy('banknote');
        for (let i = 0; i < 3; i++) spawnEnemy('grad_cap'); // diploma
        for (let i = 0; i < 3; i++) spawnEnemy('lettuce');
        for (let i = 0; i < 3; i++) spawnEnemy('newspaper');
        for (let i = 0; i < 3; i++) spawnEnemy('mop_head');
        for (let i = 0; i < 3; i++) spawnEnemy('pig');
    }
    else if (layoutWave === 8) {
        // Wave 8 - Boss level - Mandipede centipede + banknotes + tabloids + English flags + Labour logos + breakfast + diplomas + whatsapp
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
        for (let i = 0; i < 3; i++) spawnEnemy('whatsapp'); // new WhatsApp enemy
    }
    else if (layoutWave === 9) {
        // Wave 9 - Ed Davey mini boss + Lib Dem birds, rubber rings, teddy bears, monster cans, orange mallets, cones
        const boss = new Enemy(ARENA_WIDTH / 2, 160, 'ed_davey');
        enemies.push(boss);
        
        for (let i = 0; i < 2; i++) {
            const bx = Math.random() * (ARENA_WIDTH - 120) + 60;
            const by = 80 + Math.random() * 100;
            const bird = new Enemy(bx, by, 'libdem');
            bird.vx = (Math.random() > 0.5 ? 1 : -1) * 2.2;
            enemies.push(bird);
        }
        for (let i = 0; i < 2; i++) spawnEnemy('rubber_ring');
        for (let i = 0; i < 2; i++) spawnEnemy('teddy_bear');
        for (let i = 0; i < 2; i++) spawnEnemy('monster_can');
        for (let i = 0; i < 2; i++) spawnEnemy('orange_mallet');
        for (let i = 0; i < 2; i++) spawnEnemy('traffic_cone');
    }
    else if (layoutWave === 10) {
        // Wave 10 - Commons Debate block-breaker grid layout: 3 stationary rows on each side
        if (player) {
            player.x = ARENA_WIDTH / 2;
            player.y = ARENA_HEIGHT / 2;
        }

        const numRows = 9;
        const baseSpacing = 82; // spaced slightly further apart (original 70)
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

        // Column coordinates (spaced further apart at 85px instead of 70px)
        const colSpacing = 85;
        const leftX1 = colSpacing;       // Back Row (Labour)
        const leftX2 = colSpacing * 2;   // Middle Row (Labour)
        const leftX3 = colSpacing * 3;   // Front Row (Labour)

        const rightX1 = ARENA_WIDTH - colSpacing;       // Back Row (Conservatives)
        const rightX2 = ARENA_WIDTH - colSpacing * 2;   // Middle Row (Conservatives)
        const rightX3 = ARENA_WIDTH - colSpacing * 3;   // Front Row (Conservatives)

        // Helper to spawn and clamp positions inside the playing area boundaries
        const addCommonsEnemy = (x, y, type) => {
            const enemy = new Enemy(x, y, type);
            // Never place them outside the playing area
            enemy.x = Math.max(enemy.radius + 15, Math.min(ARENA_WIDTH - enemy.radius - 15, enemy.x));
            enemy.y = Math.max(enemy.radius + ARENA_CEILING + 10, Math.min(ARENA_HEIGHT - enemy.radius - 15, enemy.y));
            enemies.push(enemy);
        };

        // Left Side (Labour): 3 Columns
        // Front Row (x = leftX3) - Shields
        yPositions.forEach((y, index) => {
            const type = index % 2 === 0 ? 'euro_chomper' : 'newspaper';
            addCommonsEnemy(leftX3, y, type);
        });
        // Middle Row (x = leftX2)
        yPositions.forEach((y, index) => {
            const type = index % 2 === 0 ? 'euro_chomper' : 'newspaper';
            addCommonsEnemy(leftX2, y, type);
        });
        // Back Row (x = leftX1) - Active Shooters
        yPositions.forEach((y) => {
            addCommonsEnemy(leftX1, y, 'labour_enemy');
        });

        // Right Side (Conservative): 3 Columns
        // Front Row (x = rightX3) - Shields
        yPositions.forEach((y) => {
            addCommonsEnemy(rightX3, y, 'banknote');
        });
        // Middle Row (x = rightX2)
        yPositions.forEach((y, index) => {
            const type = index % 2 === 0 ? 'paper_plane' : 'banknote';
            addCommonsEnemy(rightX2, y, type);
        });
        // Back Row (x = rightX1) - Active Shooters
        yPositions.forEach((y) => {
            addCommonsEnemy(rightX1, y, 'tory');
        });
    }
    else if (layoutWave === 11) {
        // Wave 11 - Greens wave "GREENS CLIMATE ANTICLIMAX" - Green logo + tie-dyed T-shirt (tshirt), tote bag, solar panel, sunscreen, electric fan + Zack mini bosses
        for (let i = 0; i < 4; i++) spawnEnemy('green');
        for (let i = 0; i < 3; i++) spawnEnemy('tshirt');
        for (let i = 0; i < 3; i++) spawnEnemy('tote_bag');
        for (let i = 0; i < 3; i++) spawnEnemy('solar_panel');
        for (let i = 0; i < 3; i++) spawnEnemy('sunscreen');
        for (let i = 0; i < 3; i++) spawnEnemy('electric_fan');
        spawnEnemy('zack_miniboss');
    }
    else if (layoutWave === 12) {
        // Wave 12 - Tory wave "Tory Sleaze" with banknotes, condoms, cuffs, gin, fly, poo, dvds + Kemi Badenoch mini bosses
        for (let i = 0; i < 6; i++) spawnEnemy('tory');
        for (let i = 0; i < 7; i++) spawnEnemy('banknote');
        for (let i = 0; i < 2; i++) spawnEnemy('tory_condom');
        for (let i = 0; i < 5; i++) spawnEnemy('handcuffs');
        for (let i = 0; i < 6; i++) spawnEnemy('booze_enemy');
        for (let i = 0; i < 3; i++) spawnEnemy('fly');
        for (let i = 0; i < 3; i++) spawnEnemy('poo');
        for (let i = 0; i < 3; i++) spawnEnemy('dvds');
        spawnEnemy('kemi_miniboss');
    }
    else if (layoutWave === 13) {
        // Wave 13 - Reform Boss - Mercedes car spewing diesel smoke + Reform arrow, cigarette, booze, vape, breakfast + Nigel Farage mini boss
        const bossMerc = new Enemy(ARENA_WIDTH / 2, 160, 'reform_mercedes');
        enemies.push(bossMerc);
        for (let i = 0; i < 4; i++) spawnEnemy('reform');
        for (let i = 0; i < 2; i++) spawnEnemy('cigarette');
        for (let i = 0; i < 2; i++) spawnEnemy('booze_enemy');
        for (let i = 0; i < 2; i++) spawnEnemy('vape');
        for (let i = 0; i < 2; i++) spawnEnemy('breakfast');
        spawnEnemy('farage_miniboss');
    }
    else if (layoutWave === 14) {
        // Wave 14 - Greens Boss - Set of False Teeth gums + 10 tooth sub-enemies + Green logo, tree, tshirt, cat + Zack mini boss
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
    else if (layoutWave === 15) {
        // Wave 15 - Londoncentric - Sadiq miniboss + lime bike, police helmet, punk, speed camera, phonebox, blackcab
        spawnEnemy('sadiq_miniboss');
        for (let i = 0; i < 4; i++) spawnEnemy('lime_bike');
        for (let i = 0; i < 4; i++) spawnEnemy('police_helmet');
        for (let i = 0; i < 4; i++) spawnEnemy('punk');
        for (let i = 0; i < 2; i++) spawnEnemy('speed_camera');
        for (let i = 0; i < 2; i++) spawnEnemy('phonebox');
        for (let i = 0; i < 2; i++) spawnEnemy('blackcab');
    }
    else if (layoutWave === 16) {
        // Wave 16 - Don't Mention Europe - Ursula miniboss + blue passport, euro star, red tape, red wine
        spawnEnemy('ursula_miniboss');
        for (let i = 0; i < 4; i++) spawnEnemy('blue_passport');
        for (let i = 0; i < 4; i++) spawnEnemy('euro_star');
        for (let i = 0; i < 4; i++) spawnEnemy('red_tape');
        for (let i = 0; i < 4; i++) spawnEnemy('red_wine');
    }
    else if (layoutWave === 17) {
        // Wave 17 - His Greatest Foe - Evil Keir concentric layers
        spawnedLayerCount = 0;
        waveStartTime = Date.now();
        spawnKeirLayer(0, 8);
        spawnKeirLayer(1, 8);
        spawnKeirLayer(2, 8);
        spawnKeirLayer(3, 8);
        spawnedLayerCount = 4;
    }
    else if (layoutWave === 18) {
        // Wave 18 - "THE KING IN THE NORTH" - Crowned Andy Burnham boss
        const boss = new Enemy(ARENA_WIDTH / 2, 160, 'crowned_andy');
        enemies.push(boss);
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
        
        const neutralList = ['newspaper'];
        for (let i = 0; i < totalNeutrals; i++) {
            const randNeutral = neutralList[Math.floor(Math.random() * neutralList.length)];
            spawnEnemy(randNeutral);
        }
    }
    // Scatter scandal enemies in designated waves (TORY COLLAPSE = 1, LORDS ARE REVOLTING = 3, TORY PSYCHODRAMA = 7)
    if ([1, 3, 7].includes(layoutWave)) {
        const numScandalEnemies = 4 + Math.floor(currentWave / 4);
        const scandalTypes = ['grad_cap'];
        for (let i = 0; i < numScandalEnemies; i++) {
            const randomType = scandalTypes[Math.floor(Math.random() * scandalTypes.length)];
            spawnEnemy(randomType);
        }
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
        const layoutWave = 1 + ((currentWave - 1) % 18);
        if (layoutWave === 17) {
            const itemRand = Math.random();
            if (itemRand < 0.2) {
                type = 'xvote';
            } else if (itemRand < 0.4) {
                type = 'rose';
            } else if (itemRand < 0.7) {
                type = 'three_way';
            } else {
                type = 'bouncy_shots';
            }
        } else {
            const rand = Math.random();
            if (currentWave > 15 && rand < 0.1) {
                type = 'bonus_BB';
            } else {
                const itemRand = Math.random();
                if (itemRand < 0.4) {
                    type = 'xvote';
                } else if (itemRand < 0.8) {
                    type = 'rose';
                } else if (itemRand < 0.9) {
                    type = 'three_way';
                } else {
                    type = 'bouncy_shots';
                }
            }
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

function playerDeath(force = false) {
    if (!force && player && (player.isInvincibleCheat || player.bonusInvincibilityTimer > 0)) {
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
    // Accumulate and update gameplay elapsed duration timer
    gameElapsedTime += deltaTime;
    if (hudTimer) {
        const totalSeconds = Math.floor(gameElapsedTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        hudTimer.textContent = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
    }

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

    if (gameState === 'PLAYING') {
        const layoutWave = 1 + ((currentWave - 1) % 18);
        if (layoutWave === 17) {
            const activeCount0 = enemies.filter(e => e.type === 'evil_keir' && e.keirLayer === 0).length;
            const activeCount1 = enemies.filter(e => e.type === 'evil_keir' && e.keirLayer === 1).length;
            const activeCount2 = enemies.filter(e => e.type === 'evil_keir' && e.keirLayer === 2).length;
            const activeCount3 = enemies.filter(e => e.type === 'evil_keir' && e.keirLayer === 3).length;
            
            if (activeCount0 === 0 && spawnedLayerCount < 24) {
                spawnKeirLayer(0, 8);
                spawnedLayerCount++;
            }
            if (activeCount1 === 0 && spawnedLayerCount < 24) {
                spawnKeirLayer(1, 8);
                spawnedLayerCount++;
            }
            if (activeCount2 === 0 && spawnedLayerCount < 24) {
                spawnKeirLayer(2, 8);
                spawnedLayerCount++;
            }
            if (activeCount3 === 0 && spawnedLayerCount < 24) {
                spawnKeirLayer(3, 8);
                spawnedLayerCount++;
            }
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
        }
    }
}

function collectItem(cIndex) {
    const col = collectibles[cIndex];
    if (!col) return;
    
    collectibles.splice(cIndex, 1);
    
    window.audio.playCollect();
    timeSinceLastKill = 0; // Reset countdown on any item collection
    if (player) {
        player.bonusInvincibilityTimer = 3000;
    }

    if (col.type === 'bomb') {
        score += 250;
        hudScore.textContent = String(score).padStart(6, '0');
        showNotification("SCREEN BOMB TRIGGERED!");
        timeSinceLastKill = 0;

        // Inflict 1 damage to every active enemy
        for (let eIndex = enemies.length - 1; eIndex >= 0; eIndex--) {
            const enemy = enemies[eIndex];
            if (enemy.spawnTimer !== undefined && enemy.spawnTimer > 0) continue;
            
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
                } else if (enemy.type === 'crowned_andy') {
                    enemies.splice(eIndex, 1);
                    score += enemy.scoreValue;
                    hudScore.textContent = String(score).padStart(6, '0');
                    window.audio.playExplosion();
                    triggerScreenShake(8, 250);
                    
                    const andyPart = new Enemy(enemy.x - 15, enemy.y, 'andy_no_crown');
                    const crownPart = new Enemy(enemy.x + 15, enemy.y, 'crown');
                    andyPart.vx = -andyPart.speed;
                    andyPart.vy = andyPart.speed * 0.5;
                    crownPart.vx = crownPart.speed;
                    crownPart.vy = -crownPart.speed * 0.5;
                    enemies.push(andyPart, crownPart);
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
        showNotification("TRIPLE LOCK GUARANTEE");
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
    } else if (col.type === 'bonus_BB') {
        score += 1000;
        hudScore.textContent = String(score).padStart(6, '0');
        showNotification("CAT ASSISTANT ACTIVE!");
        if (player) {
            player.catAssistantTimer = 10000; // 10 seconds duration
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

    // A0. Player Bullets vs Large Enemy Projectiles (poop and smoke)
    for (let bIndex = bullets.length - 1; bIndex >= 0; bIndex--) {
        const pBullet = bullets[bIndex];
        for (let ebIndex = enemyBullets.length - 1; ebIndex >= 0; ebIndex--) {
            const eBullet = enemyBullets[ebIndex];
            if (eBullet.type === 'brown_peanut' || eBullet.type === 'diesel_smoke' || eBullet.type === 'gravy' || eBullet.type === 'lager' || eBullet.type === 'chips') {
                const dist = Math.hypot(pBullet.x - eBullet.x, pBullet.y - eBullet.y);
                if (dist < pBullet.radius + eBullet.radius) {
                    bullets.splice(bIndex, 1);
                    enemyBullets.splice(ebIndex, 1);
                    const pColor = eBullet.type === 'brown_peanut' ? '#8b5a2b' : eBullet.type === 'gravy' ? '#6b3a1f' : eBullet.type === 'lager' ? '#daa520' : eBullet.type === 'chips' ? '#f5d442' : '#505050';
                    for (let i = 0; i < 6; i++) {
                        particles.push(new Particle(eBullet.x, eBullet.y, pColor));
                    }
                    window.audio.playExplosion();
                    break;
                }
            }
        }
    }

    // A. Player Bullets vs Enemies
    for (let bIndex = bullets.length - 1; bIndex >= 0; bIndex--) {
        const bullet = bullets[bIndex];
        for (let eIndex = enemies.length - 1; eIndex >= 0; eIndex--) {
            const enemy = enemies[eIndex];
            if (enemy.spawnTimer !== undefined && enemy.spawnTimer > 0) continue;
            let collided = false;
            if (enemy.type === 'sewage_tank') {
                const aspect = 450 / 209;
                const halfW = enemy.radius;
                const halfH = enemy.radius / aspect;
                const closestX = Math.max(enemy.x - halfW, Math.min(bullet.x, enemy.x + halfW));
                const closestY = Math.max(enemy.y - halfH, Math.min(bullet.y, enemy.y + halfH));
                collided = Math.hypot(bullet.x - closestX, bullet.y - closestY) < bullet.radius;
            } else {
                collided = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y) < bullet.radius + enemy.radius;
            }
            
            if (collided) {
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
                    } else if (enemy.type === 'crowned_andy') {
                        enemies.splice(eIndex, 1);
                        score += enemy.scoreValue;
                        hudScore.textContent = String(score).padStart(6, '0');
                        window.audio.playExplosion();
                        triggerScreenShake(8, 250);
                        
                        const andyPart = new Enemy(enemy.x - 15, enemy.y, 'andy_no_crown');
                        const crownPart = new Enemy(enemy.x + 15, enemy.y, 'crown');
                        andyPart.vx = -andyPart.speed;
                        andyPart.vy = andyPart.speed * 0.5;
                        crownPart.vx = crownPart.speed;
                        crownPart.vy = -crownPart.speed * 0.5;
                        enemies.push(andyPart, crownPart);
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
            if (enemy.spawnTimer !== undefined && enemy.spawnTimer > 0) continue;
            let collided = false;
            if (enemy.type === 'sewage_tank') {
                const aspect = 450 / 209;
                const halfW = enemy.radius;
                const halfH = enemy.radius / aspect;
                const closestX = Math.max(enemy.x - halfW, Math.min(player.x, enemy.x + halfW));
                const closestY = Math.max(enemy.y - halfH, Math.min(player.y, enemy.y + halfH));
                collided = Math.hypot(player.x - closestX, player.y - closestY) < player.radius;
            } else {
                collided = Math.hypot(player.x - enemy.x, player.y - enemy.y) < player.radius + enemy.radius;
            }
            
             if (collided) {
                // Enemy dies!
                // Bosses are not killed by collision; Starmer loses life but boss remains
                const isBoss = ['sewage_tank', 'ed_davey', 'exploding_brain', 'reform_mercedes', 'false_teeth', 'lord_wig_boss', 'zack_miniboss', 'kemi_miniboss', 'farage_miniboss', 'ed_miniboss', 'sadiq_miniboss', 'ursula_miniboss', 'crowned_andy', 'andy_no_crown', 'crown'].includes(enemy.type) || (enemy.type === 'mandipede' && enemy.segmentType === 'head');
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
        if (player.catAssistantTimer > 0) {
            ctx.save();
            const bobbing = Math.sin(Date.now() / 200) * 4;
            ctx.translate(player.catX, player.catY + bobbing);
            
            // Draw the same rainbow halo circle surrounding it as the player
            ctx.save();
            ctx.strokeStyle = `hsl(${(Date.now() / 4) % 360}, 100%, 65%)`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, 25 + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            drawImagePreservingAspect(bonusBBImg, 25);
            ctx.restore();
        }
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
        
        let alpha = 1.0;
        if (notificationTimer < 60) {
            alpha = (Math.floor(notificationTimer / 4) % 2 === 0) ? 0.0 : 1.0;
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        
        if (notificationText.startsWith('+') && player) {
            ctx.font = 'bold 15px "Press Start 2P", monospace';
            ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
            ctx.fillText(notificationText, player.x, player.y - 38);
        } else if (notificationText.includes('\n')) {
            const lines = notificationText.split('\n');
            ctx.fillStyle = `rgba(0, 229, 255, ${alpha})`;
            ctx.fillText(lines[0], ARENA_WIDTH / 2, ARENA_HEIGHT / 2 - 10);
            
            ctx.font = 'normal 15px "Press Start 2P", monospace';
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillText(lines[1], ARENA_WIDTH / 2, ARENA_HEIGHT / 2 + 25);
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
    ctx.fillStyle = '#BBB';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('v1.10.11', ARENA_WIDTH - 15, ARENA_HEIGHT - 15);
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
