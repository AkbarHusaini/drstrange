const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const loadingScreen = document.getElementById('loading');
const instructions = document.getElementById('instructions');

let rotation = 0;
let lastResults = null;

const mysticGlyphs = ['❂', '❈', '🌀', '✧', '⎈', '⚔', '🛡', '⚛', '⚜', '✵'];

// Particle system
const particles = [];
class Particle {
    constructor(x, y, color, type = 'spark') {
        this.x = x;
        this.y = y;
        this.size = type === 'heart' ? Math.random() * 15 + 10 : Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 5;
        this.speedY = (Math.random() - 0.5) * 5;
        this.color = color;
        this.life = 1.0;
        this.type = type;
        this.rotation = Math.random() * Math.PI * 2;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 0.02;
        if (this.type === 'heart') this.rotation += 0.05;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.translate(this.x, this.y);
        
        if (this.type === 'heart') {
            ctx.rotate(this.rotation);
            ctx.beginPath();
            const s = this.size;
            ctx.moveTo(0, s/4);
            ctx.bezierCurveTo(-s/2, -s/2, -s, s/4, 0, s);
            ctx.bezierCurveTo(s, s/4, s/2, -s/2, 0, s/4);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

function checkFingerHeart(landmarks) {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const wrist = landmarks[0];
    
    // Check if thumb and index tips are close
    const heartDist = Math.sqrt(Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2));
    
    // Check if middle finger is folded
    const middleDist = Math.sqrt(Math.pow(middleTip.x - wrist.x, 2) + Math.pow(middleTip.y - wrist.y, 2));
    const indexBaseDist = Math.sqrt(Math.pow(landmarks[5].x - wrist.x, 2) + Math.pow(landmarks[5].y - wrist.y, 2));

    return heartDist < 0.05 && middleDist < indexBaseDist;
}

function drawProceduralSpell(ctx, x, y, size, rotation, tiltX, tiltY) {
    ctx.save();
    ctx.translate(x, y);
    
    // Core Transform for 3D Perspective
    ctx.transform(1, tiltY * 0.5, tiltX * 0.5, 1 - Math.abs(tiltX) * 0.2 - Math.abs(tiltY) * 0.2, 0, 0);

    ctx.globalCompositeOperation = 'lighter';

    // Helper to draw a layered ring
    const drawRing = (radius, width, dash = [], rot = 0, color = '#ff9d00', glow = 15) => {
        ctx.save();
        ctx.rotate(rot);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.shadowBlur = glow;
        ctx.shadowColor = color;
        if (dash.length) ctx.setLineDash(dash);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    };

    // 1. Far Outer Aura (Very Faint)
    drawRing(size * 0.65, 1, [2, 10], rotation * 0.1, 'rgba(255, 100, 0, 0.2)', 30);

    // 2. Main Outer Ring (Decorative)
    drawRing(size * 0.55, 2, [10, 20], -rotation * 0.2, '#ff8000', 10);

    // 3. Thick Boundary Ring
    drawRing(size * 0.5, 4, [], 0, '#ff9d00', 20);

    // 4. Glyph Ring (Mystic Symbols)
    ctx.save();
    ctx.rotate(-rotation * 0.4);
    ctx.fillStyle = '#ff9d00';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff9d00';
    ctx.font = `${size * 0.07}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for(let i=0; i<mysticGlyphs.length; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / mysticGlyphs.length);
        ctx.translate(size * 0.45, 0);
        ctx.rotate(Math.PI / 2);
        ctx.fillText(mysticGlyphs[i], 0, 0);
        ctx.restore();
    }
    ctx.restore();

    // 5. Secondary Boundary Ring
    drawRing(size * 0.4, 2, [], 0, '#ff9d00', 15);

    // 6. Geometric Layer 1 (Hexagons)
    ctx.save();
    ctx.rotate(rotation * 0.8);
    ctx.strokeStyle = '#ff9d00';
    ctx.lineWidth = 1.5;
    for (let j = 0; j < 2; j++) {
        ctx.rotate(Math.PI / 6);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const r = size * 0.38;
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.stroke();
    }
    ctx.restore();

    // 7. Geometric Layer 2 (Stars/Triangles)
    ctx.save();
    ctx.rotate(-rotation * 1.2);
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        ctx.rotate(Math.PI / 1.5);
        ctx.beginPath();
        ctx.moveTo(-size * 0.35, 0);
        ctx.lineTo(size * 0.35, 0);
        ctx.stroke();
        ctx.strokeRect(-size * 0.25, -size * 0.25, size * 0.5, size * 0.5);
    }
    ctx.restore();

    // 8. Inner Fast Ring
    drawRing(size * 0.15, 3, [5, 5], rotation * 3, '#ffcc00', 10);

    // 9. Core Sphere
    ctx.save();
    ctx.shadowBlur = 40;
    ctx.shadowColor = '#fff';
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 10. Particles
    if (Math.random() > 0.3) {
        const angle = Math.random() * Math.PI * 2;
        const dist = size * 0.5 * Math.random();
        particles.push(new Particle(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, '#ff9d00'));
    }

    ctx.restore();
}

function drawSpell(wrist, landmarks) {
    const fingerTips = [4, 8, 12, 16, 20];
    let centerX = 0, centerY = 0;
    fingerTips.forEach(tipIdx => {
        centerX += landmarks[tipIdx].x;
        centerY += landmarks[tipIdx].y;
    });
    centerX /= fingerTips.length;
    centerY /= fingerTips.length;

    const x = centerX * canvasElement.width;
    const y = centerY * canvasElement.height;
    const thumb = landmarks[4];
    const pinky = landmarks[20];
    const spread = Math.sqrt(Math.pow(thumb.x - pinky.x, 2) + Math.pow(thumb.y - pinky.y, 2)) * canvasElement.width;
    const size = spread * 1.5;

    const index = landmarks[5];
    const pinky_mcp = landmarks[17];
    const tiltX = (index.z - pinky_mcp.z) * 10; 
    const tiltY = (wrist.z - index.z) * 10;

    rotation += 0.05;
    drawProceduralSpell(canvasCtx, x, y, size, rotation, tiltX, tiltY);
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        } else {
            particles[i].draw(canvasCtx);
        }
    }
}

function onResults(results) {
    if (loadingScreen.style.opacity !== '0') {
        loadingScreen.style.opacity = '0';
        setTimeout(() => loadingScreen.style.display = 'none', 500);
    }
    lastResults = results;
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    if (canvasElement.width !== videoElement.videoWidth || canvasElement.height !== videoElement.videoHeight) {
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
    }

    updateParticles();

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        instructions.classList.add('hidden');
        for (const landmarks of results.multiHandLandmarks) {
            const wrist = landmarks[0];
            if (checkFingerHeart(landmarks)) {
                const x = landmarks[8].x * canvasElement.width;
                const y = landmarks[8].y * canvasElement.height;
                if (Math.random() > 0.8) {
                    particles.push(new Particle(x, y, '#ff4d6d', 'heart'));
                }
                canvasCtx.fillStyle = '#ff4d6d';
                canvasCtx.font = '30px Arial';
                canvasCtx.textAlign = 'center';
                canvasCtx.shadowBlur = 15;
                canvasCtx.shadowColor = '#ff4d6d';
                canvasCtx.fillText('❤️', x, y - 40);
            } else if (checkHandOpen(landmarks)) {
                drawSpell(wrist, landmarks);
            }
        }
    } else {
        instructions.classList.remove('hidden');
    }
    canvasCtx.restore();
}

function checkHandOpen(landmarks) {
    const wrist = landmarks[0];
    const tips = [8, 12, 16, 20];
    let extendedFingers = 0;
    tips.forEach(tipIdx => {
        const tip = landmarks[tipIdx];
        const base = landmarks[tipIdx - 2];
        const distToWrist = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
        const baseToWrist = Math.sqrt(Math.pow(base.x - wrist.x, 2) + Math.pow(base.y - wrist.y, 2));
        if (distToWrist > baseToWrist * 1.1) extendedFingers++;
    });
    return extendedFingers >= 3;
}

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);

async function initCamera() {
    try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        let selectedDevice = videoDevices.find(device => 
            !device.label.toLowerCase().includes('droidcam') && 
            !device.label.toLowerCase().includes('obs') &&
            (device.label.toLowerCase().includes('facetime') || 
             device.label.toLowerCase().includes('integrated') || 
             device.label.toLowerCase().includes('camera'))
        );

        if (!selectedDevice) {
            selectedDevice = videoDevices.find(device => 
                !device.label.toLowerCase().includes('droidcam') && 
                !device.label.toLowerCase().includes('obs')
            );
        }

        const constraints = {
            video: {
                deviceId: selectedDevice ? { exact: selectedDevice.deviceId } : undefined,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => {
            videoElement.play();
            requestAnimationFrame(processVideo);
        };
    } catch (error) {
        console.error('Error initializing camera:', error);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoElement.srcObject = stream;
            videoElement.onloadedmetadata = () => {
                videoElement.play();
                requestAnimationFrame(processVideo);
            };
        } catch (e) {
            alert('Could not access camera. Please ensure permissions are granted.');
        }
    }
}

async function processVideo() {
    if (videoElement.paused || videoElement.ended) return;
    await hands.send({ image: videoElement });
    requestAnimationFrame(processVideo);
}

initCamera();
