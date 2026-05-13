const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const loadingScreen = document.getElementById('loading');
const instructions = document.getElementById('instructions');

let rotation = 0;
let lastResults = null;

const mysticGlyphs = ['❂', '❈', '🌀', '✧', '⎈', '⚔', '🛡', '⚛', '⚜', '✵'];


// Particle system for sparks
const particles = [];
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 5;
        this.speedY = (Math.random() - 0.5) * 5;
        this.color = color;
        this.life = 1.0;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 0.02;
    }
    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawProceduralSpell(ctx, x, y, size, rotation, tiltX, tiltY) {
    ctx.save();
    ctx.translate(x, y);
    
    // Apply 3D Perspective Projection (Simulated)
    // We use tiltX and tiltY to skew and scale the canvas
    ctx.transform(1, tiltY * 0.5, tiltX * 0.5, 1 - Math.abs(tiltX) * 0.2 - Math.abs(tiltY) * 0.2, 0, 0);

    // Set glow effect
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#ff9d00';
    ctx.strokeStyle = '#ff9d00';
    ctx.lineWidth = 2;
    ctx.globalCompositeOperation = 'lighter';

    // Draw layers with different Z-offsets (simulated by scale and rotation speed)
    
    // 1. Outer Decorative Ring (Distant)
    ctx.save();
    ctx.scale(1.1, 1.1);
    ctx.rotate(rotation * 0.2);
    ctx.setLineDash([5, 15]);
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 2. Main Outer Ring
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Thick Inner Ring
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2);
    ctx.stroke();

    // 4. Glyph Ring
    ctx.save();
    ctx.rotate(-rotation * 0.5);
    ctx.fillStyle = '#ff9d00';
    ctx.font = `${size * 0.08}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for(let i=0; i<mysticGlyphs.length; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / mysticGlyphs.length);
        ctx.translate(size * 0.38, 0);
        ctx.rotate(Math.PI / 2);
        ctx.fillText(mysticGlyphs[i], 0, 0);
        ctx.restore();
    }
    ctx.restore();

    // 5. Rotating Geometric Core
    ctx.save();
    ctx.rotate(rotation);
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(-size * 0.4, 0);
        ctx.lineTo(size * 0.4, 0);
        ctx.stroke();
        ctx.strokeRect(-size * 0.3, -size * 0.3, size * 0.6, size * 0.6);
    }
    ctx.restore();

    // 6. Inner Geometric Layer (Faster)
    ctx.save();
    ctx.rotate(-rotation * 1.5);
    ctx.scale(0.9, 0.9); // Slightly offset for 3D feel
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        const px = Math.cos(angle) * size * 0.2;
        const py = Math.sin(angle) * size * 0.2;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // 7. Center Core (Brightest)
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.05, 0, Math.PI * 2);
    ctx.fillStyle = '#ffcc00';
    ctx.fill();
    
    // Emit particles
    if (Math.random() > 0.3) {
        const angle = Math.random() * Math.PI * 2;
        const dist = size * 0.5 * Math.random();
        particles.push(new Particle(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, '#ff9d00'));
    }

    ctx.restore();
}

function drawSpell(wrist, landmarks) {
    // Fingertip landmarks: 4 (thumb), 8 (index), 12 (middle), 16 (ring), 20 (pinky)
    const fingerTips = [4, 8, 12, 16, 20];
    
    // Calculate a smaller size for the finger spells
    const palmBase = landmarks[0];
    const indexBase = landmarks[5];
    const baseSize = Math.sqrt(Math.pow(palmBase.x - indexBase.x, 2) + Math.pow(palmBase.y - indexBase.y, 2)) * canvasElement.width;
    const fingerSpellSize = baseSize * 2.5; // Smaller than palm shield

    rotation += 0.05;

    fingerTips.forEach(tipIdx => {
        const tip = landmarks[tipIdx];
        const x = tip.x * canvasElement.width;
        const y = tip.y * canvasElement.height;
        
        // Calculate a slight individual tilt for each finger if possible, 
        // or just use the general hand tilt
        const index = landmarks[5];
        const pinky = landmarks[17];
        const tiltX = (index.z - pinky.z) * 10; 
        const tiltY = (wrist.z - index.z) * 10;

        drawProceduralSpell(canvasCtx, x, y, fingerSpellSize, rotation, tiltX, tiltY);
    });
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
            if (checkHandOpen(landmarks)) {
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
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
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
        // Request initial permission to ensure labels are populated
        await navigator.mediaDevices.getUserMedia({ video: true });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        console.log('Available video devices:', videoDevices);

        // Try to find a device that is NOT DroidCam or OBS
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
        // Fallback to basic constraints if specific device fails
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
