
// Waste types
const wasteTypes = [
    { name: "Organik", color: "#00ffcc", icon: "🍌" },
    { name: "Anorganik", color: "#00ccff", icon: "🥤" },
    { name: "B3", color: "#ff007a", icon: "🔋" },
    { name: "Kertas", color: "#ff9900", icon: "📄" },
    { name: "Residu", color: "#cc00ff", icon: "🗑️" },
];

// Available waste items
const availableWaste = [
    { id: "1", name: "Kulit Pisang", icon: "🍌", category: "Organik", color: "#00ffcc" },
    { id: "2", name: "Botol Plastik", icon: "🥤", category: "Anorganik", color: "#00ccff" },
    { id: "3", name: "Baterai Bekas", icon: "🔋", category: "B3", color: "#ff007a" },
    { id: "4", name: "Kertas Koran", icon: "📄", category: "Kertas", color: "#ff9900" },
    { id: "5", name: "Puntung Rokok", icon: "🚬", category: "Residu", color: "#cc00ff" },
    { id: "6", name: "Sisa Nasi", icon: "🍚", category: "Organik", color: "#00ffcc" },
    { id: "7", name: "Kulit Jeruk", icon: "🍊", category: "Organik", color: "#00ffcc" },
    { id: "8", name: "Daun Kering", icon: "🍂", category: "Organik", color: "#00ffcc" },
    { id: "9", name: "Sisa Sayuran", icon: "🥬", category: "Organik", color: "#00ffcc" },
    { id: "10", name: "Tulang Ayam", icon: "🍗", category: "Organik", color: "#00ffcc" },
    { id: "11", name: "Kaleng Soda", icon: "🥫", category: "Anorganik", color: "#00ccff" },
    { id: "12", name: "Botol Kaca", icon: "🍾", category: "Anorganik", color: "#00ccff" },
    { id: "13", name: "Plastik Kemasan", icon: "📦", category: "Anorganik", color: "#00ccff" },
    { id: "14", name: "Sendok Plastik", icon: "🥄", category: "Anorganik", color: "#00ccff" },
    { id: "15", name: "Gelas Plastik", icon: "🥤", category: "Anorganik", color: "#00ccff" },
    { id: "16", name: "HP Rusak", icon: "📱", category: "B3", color: "#ff007a" },
    { id: "17", name: "Lampu Bohlam", icon: "💡", category: "B3", color: "#ff007a" },
    { id: "18", name: "Aki Bekas", icon: "🔋", category: "B3", color: "#ff007a" },
    { id: "19", name: "Kardus Bekas", icon: "📦", category: "Kertas", color: "#ff9900" },
    { id: "20", name: "Majalah Lama", icon: "📖", category: "Kertas", color: "#ff9900" },
];

// State variables
let isLidOpen = false;
let wasteQueue = [];
let storedWastes = { Organik: [], Anorganik: [], B3: [], Kertas: [], Residu: [] };
let isProcessing = false;
let sortingProcess = [];
let isListening = false;
let recognition = null;
let lastCommandTime = 0;
let commandCooldown = 0;
let isRecognitionRunning = false;

// Animation states for dual grippers
let gripper1State = {
    x: 600,
    y: 250,
    hasWaste: false,
    targetX: 600,
    targetY: 250,
    wasteIcons: [],
    wasteCategory: "",
    isMoving: false,
};
let gripper2State = {
    x: 600,
    y: 250,
    hasWaste: false,
    targetX: 600,
    targetY: 250,
    wasteIcons: [],
    wasteCategory: "",
    isMoving: false,
};
let compressorState = { position: 0, active: false };

// Utility functions
const isMobile = () => window.innerWidth < 768;

const showToast = (title, description, variant = "default") => {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${variant === "destructive" ? "destructive" : ""}`;
    toast.innerHTML = `
        <div class="toast-title">${title}</div>
        <div class="toast-description">${description}</div>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

const checkMicrophonePermission = async () => {
    try {
        const permission = await navigator.permissions.query({ name: 'microphone' });
        return permission.state === 'granted';
    } catch {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch {
            return false;
        }
    }
};

const setupSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'id-ID';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
        const now = Date.now();
        if (now - lastCommandTime < 2000) return;
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        handleVoiceCommand(transcript);
        lastCommandTime = now;
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        isRecognitionRunning = false;
        if (event.error === 'no-speech' || event.error === 'audio-capture') {
            setTimeout(() => startRecognition(), 1000);
        }
    };

    recognition.onend = () => {
        isRecognitionRunning = false;
        if (isListening) setTimeout(startRecognition, 500);
    };

    const startRecognition = () => {
        if (!isRecognitionRunning && recognition) {
            try {
                recognition.start();
                isRecognitionRunning = true;
            } catch (err) {
                console.error('Error starting recognition:', err);
            }
        }
    };

    checkMicrophonePermission().then(hasPermission => {
        if (hasPermission) {
            isListening = true;
            updateVoiceButton();
            startRecognition();
        }
    });
};

const handleVoiceCommand = (command) => {
    if (Date.now() - commandCooldown < 1000) return;

    if (command.includes('buka')) {
        commandCooldown = Date.now();
        if (!isLidOpen) toggleLid();
        return;
    }
    if (command.includes('tutup')) {
        commandCooldown = Date.now();
        if (isLidOpen) toggleLid();
        return;
    }

    const wasteCommands = {
        'kulit pisang': 'Kulit Pisang',
        'botol plastik': 'Botol Plastik',
        'baterai bekas': 'Baterai Bekas',
        'kertas koran': 'Kertas Koran',
        'puntung rokok': 'Puntung Rokok',
    };
    for (const [cmd, wasteName] of Object.entries(wasteCommands)) {
        if (command.includes(cmd)) {
            commandCooldown = Date.now();
            const wasteItem = availableWaste.find(w => w.name === wasteName);
            if (wasteItem) throwWaste(wasteItem);
            return;
        }
    }
};

const toggleVoiceRecognition = async () => {
    try {
        const hasPermission = await checkMicrophonePermission();
        if (!hasPermission) {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            isListening = true;
            showToast("Mikrofon Diaktifkan", "Sistem siap menerima perintah suara", "default");
        } else {
            isListening = !isListening;
            showToast(
                isListening ? "Mikrofon Diaktifkan" : "Mikrofon Dimatikan",
                isListening ? "Sistem siap" : "Pendeteksian suara off",
                "default"
            );
        }
        updateVoiceButton();
        if (isListening) startRecognition();
        else recognition.stop();
    } catch (error) {
        showToast("Error", "Gagal akses mikrofon", "destructive");
    }
};

const startRecognition = () => {
    if (!isRecognitionRunning && recognition) {
        try {
            recognition.start();
            isRecognitionRunning = true;
        } catch (err) {
            console.error('Error:', err);
        }
    }
};

// Waste processing logic
const getCategoryIndex = (category) => wasteTypes.findIndex(w => w.name === category);

const getCategoryPosition = (category) => {
    const index = getCategoryIndex(category);
    return { x: 200 + index * 180, y: 600 };
};

const addWasteToStorage = (waste) => {
    storedWastes[waste.category].push({ id: `${waste.id}-${Date.now()}`, icon: waste.icon, category: waste.category });
    updateWasteStorage();
};

const animateGripper = async (gripperState, targetX, targetY, waste) => {
    gripperState.isMoving = true;
    const step = 10;
    while (gripperState.x !== targetX || gripperState.y !== targetY) {
        gripperState.x += (targetX - gripperState.x) > 0 ? step : -step;
        gripperState.y += (targetY - gripperState.y) > 0 ? step : -step;
        updateAnimationState();
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    gripperState.isMoving = false;
    if (waste) {
        gripperState.hasWaste = true;
        gripperState.wasteIcons = [waste.icon];
        gripperState.wasteCategory = waste.category;
        updateAnimationState();
        await new Promise(resolve => setTimeout(resolve, 500));
        gripperState.hasWaste = false;
        addWasteToStorage(waste);
        gripperState.wasteIcons = [];
        gripperState.wasteCategory = "";
        updateAnimationState();
    }
};

const processWasteQueue = async () => {
    if (wasteQueue.length === 0) return;

    isProcessing = true;
    updateProcessStatus();

    let i = 0;
    while (i < wasteQueue.length) {
        const waste = wasteQueue[i];
        const categoryPos = getCategoryPosition(waste.category);
        const gripper = !gripper1State.isMoving ? gripper1State : !gripper2State.isMoving ? gripper2State : null;

        if (!gripper) {
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
        }

        sortingProcess.push(`🤖 Gripper ${gripper === gripper1State ? 1 : 2} memproses: ${waste.name}`);
        updateProcessStatus();

        await animateGripper(gripper, 600, 250, waste); // Pick up
        await animateGripper(gripper, categoryPos.x, categoryPos.y); // Move to compartment
        await animateGripper(gripper, categoryPos.x, categoryPos.y, null); // Drop
        await animateGripper(gripper, 600, 250); // Return

        wasteQueue.splice(i, 1);
        updateWasteQueue();
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    isProcessing = false;
    sortingProcess.push("✅ Pemilahan selesai!");
    updateProcessStatus();
    showToast("Proses Selesai", "Semua sampah dipilah!", "default");
};

const throwWaste = (waste) => {
    if (!isLidOpen || isProcessing) {
        showToast("Error", isLidOpen ? "Sistem sibuk" : "Buka tutup dulu!", "destructive");
        return;
    }
    wasteQueue.push(waste);
    showToast("Sampah Ditambahkan", `${waste.name} di antrian. Total: ${wasteQueue.length}`, "default");
    updateWasteQueue();
};

const toggleLid = async () => {
    if (isProcessing) {
        showToast("Sistem Sibuk", "Tunggu pemilahan selesai!", "destructive");
        return;
    }
    isLidOpen = !isLidOpen;
    showToast("Tutup", isLidOpen ? "Terbuka - Masukkan sampah" : "Tertutup - Memulai pemilahan", "default");
    updateLid();
    if (!isLidOpen && wasteQueue.length > 0) await processWasteQueue();
};

const clearAllWaste = () => {
    wasteQueue = [];
    storedWastes = { Organik: [], Anorganik: [], B3: [], Kertas: [], Residu: [] };
    gripper1State = { x: 600, y: 250, hasWaste: false, targetX: 600, targetY: 250, wasteIcons: [], wasteCategory: "", isMoving: false };
    gripper2State = { x: 600, y: 250, hasWaste: false, targetX: 600, targetY: 250, wasteIcons: [], wasteCategory: "", isMoving: false };
    compressorState = { position: 0, active: false };
    sortingProcess = [];
    updateWasteQueue();
    updateWasteStorage();
    updateProcessStatus();
    updateAnimationState();
    showToast("Sistem Direset", "Semua data dibersihkan", "default");
};

// DOM update functions
const updateLid = () => {
    const lid = document.getElementById('lid');
    lid.setAttribute('transform', isLidOpen ? 'rotate(30 600 100)' : '');
    const toggleBtn = document.getElementById('toggle-lid-btn');
    toggleBtn.className = `btn h-16 text-xl font-bold px-10 ${isLidOpen ? 'bg-cyber-blue hover:bg-cyber-dark-blue' : 'bg-neon-green hover:bg-neon-dark-green'}`;
    toggleBtn.innerHTML = `<i class="fas fa-microphone w-6 h-6 mr-2"></i>${isLidOpen ? '🔴 Tutup' : '🟢 Buka'} Tutup Tong`;
    toggleBtn.disabled = isProcessing;
};

const updateVoiceButton = () => {
    const voiceBtn = document.getElementById('toggle-voice-btn');
    voiceBtn.className = `btn h-16 text-xl font-bold px-10 ${isListening ? 'bg-neon-purple hover:bg-purple-800' : 'bg-gray-700 hover:bg-gray-800'}`;
    voiceBtn.innerHTML = `<i class="fas fa-microphone w-6 h-6 mr-2"></i>${isListening ? '🎤 Aktif' : '🎤 Suara'}`;
    const voiceSensorBack = document.getElementById('voice-sensor-back');
    const voiceSensorFront = document.getElementById('voice-sensor-front');
    voiceSensorBack.setAttribute('fill', isListening ? '#00ffcc' : '#ff007a');
    voiceSensorFront.setAttribute('fill', isListening ? '#00cc99' : '#ff00cc');
};

const updateWasteButtons = () => {
    const wasteButtons = document.getElementById('waste-buttons');
    wasteButtons.innerHTML = availableWaste.map(waste => `
        <button class="btn w-full p-3 text-left justify-start bg-gray-800 hover:bg-gray-700 text-neon-green ${isProcessing ? 'opacity-50' : ''}" ${isProcessing ? 'disabled' : ''} onclick="throwWaste(availableWaste[${availableWaste.indexOf(waste)}])">
            <div class="flex items-center gap-3">
                <span class="text-2xl">${waste.icon}</span>
                <div class="flex-1">
                    <div class="font-bold text-sm">${waste.name} → ${waste.category}</div>
                </div>
            </div>
        </button>
    `).join('');
};

const updateWasteQueue = () => {
    const queueCard = document.getElementById('waste-queue-card');
    const queueCount = document.getElementById('queue-count');
    const wasteQueueEl = document.getElementById('waste-queue');
    queueCard.style.display = wasteQueue.length > 0 ? 'block' : 'none';
    queueCount.textContent = wasteQueue.length;
    wasteQueueEl.innerHTML = wasteQueue.length > 0 ? `
        <div class="text-sm text-gray-300 mb-2">Tutup tong untuk memulai pemilahan:</div>
        ${wasteQueue.map((waste, index) => `
            <div class="flex items-center gap-2 p-2 bg-gray-700 rounded">
                <span class="badge">${index + 1}</span>
                <span class="text-xl">${waste.icon}</span>
                <span class="text-sm font-medium">${waste.name}</span>
            </div>
        `).join('')}
    ` : '';
};

const updateWasteStorage = () => {
    const wasteStorage = document.getElementById('waste-storage');
    wasteStorage.innerHTML = wasteTypes.map(waste => `
        <div class="flex items-center justify-between p-2 bg-gray-700 rounded">
            <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded-full" style="background-color: ${waste.color}"></div>
                <span class="text-sm font-medium">${waste.name}</span>
            </div>
            <div class="flex items-center gap-1">
                <span class="text-sm">${storedWastes[waste.name].length} item</span>
                ${storedWastes[waste.name].slice(0, 3).map(item => `<span class="text-lg">${item.icon}</span>`).join('')}
            </div>
        </div>
    `).join('');
    const compartments = document.getElementById('waste-compartments');
    compartments.innerHTML = wasteTypes.map((waste, index) => `
        <g>
            <rect x="${150 + index * 180}" y="550" width="160" height="130" fill="${waste.color}" fill-opacity="0.3" stroke="${waste.color}" stroke-width="4" />
            <rect x="${140 + index * 180}" y="540" width="160" height="130" fill="${waste.color}" fill-opacity="0.2" stroke="${waste.color}" stroke-width="5" />
            <text x="${230 + index * 180}" y="570" text-anchor="middle" font-size="16" fill="${waste.color}">${waste.name}</text>
            ${storedWastes[waste.name].map((storedWaste, i) => `
                <text x="${200 + index * 180 + (i % 3) * 40}" y="${610 + Math.floor(i / 3) * 30}" text-anchor="middle" font-size="24">${storedWaste.icon}</text>
            `).join('')}
        </g>
    `).join('');
};

const updateProcessStatus = () => {
    const processCard = document.getElementById('process-status-card');
    const processIcon = document.getElementById('process-icon');
    const processStatus = document.getElementById('process-status');
    processCard.style.display = sortingProcess.length > 0 ? 'block' : 'none';
    processIcon.className = `fas ${isProcessing ? 'fa-play' : 'fa-pause'} w-6 h-6 ${isProcessing ? 'text-cyber-blue' : 'text-neon-purple'}`;
    processStatus.innerHTML = sortingProcess.map((step, index) => `
        <div class="flex items-center gap-2 p-2 bg-gray-700 rounded">
            <span class="badge">${index + 1}</span>
            <span class="text-sm">${step}</span>
        </div>
    `).join('');
    if (isProcessing) {
        processStatus.innerHTML += `
            <div class="flex items-center gap-2 p-2 bg-gray-700 rounded animate-pulse">
                <div class="w-4 h-4 bg-neon-green rounded-full animate-bounce"></div>
                <span class="text-sm text-neon-green">Memproses...</span>
            </div>
        `;
    }
};

const updateAnimationState = () => {
    const gripper1 = document.getElementById('gripper-1');
    gripper1.setAttribute('transform', `translate(${gripper1State.x - 600}, ${gripper1State.y - 250})`);
    const gripper1ArmLeft = document.getElementById('gripper-1-arm-left');
    const gripper1ArmRight = document.getElementById('gripper-1-arm-right');
    const gripper1ClawLeft = document.getElementById('gripper-1-claw-left');
    const gripper1ClawRight = document.getElementById('gripper-1-claw-right');
    gripper1ArmLeft.setAttribute('d', gripper1State.hasWaste ? "M 585 280 L 580 310 L 585 315 L 590 285 Z" : "M 580 280 L 570 310 L 575 315 L 585 285 Z");
    gripper1ArmRight.setAttribute('d', gripper1State.hasWaste ? "M 615 280 L 620 310 L 615 315 L 610 285 Z" : "M 620 280 L 630 310 L 625 315 L 615 285 Z");
    gripper1ClawLeft.setAttribute('d', gripper1State.hasWaste ? "M 580 310 L 575 315 M 585 315 L 580 320" : "M 570 310 L 565 320 M 575 315 L 580 325");
    gripper1ClawRight.setAttribute('d', gripper1State.hasWaste ? "M 620 310 L 625 315 M 615 315 L 620 320" : "M 630 310 L 635 320 M 625 315 L 620 325");
    const gripper1Waste = document.getElementById('gripper-1-waste');
    gripper1Waste.innerHTML = gripper1State.hasWaste ? gripper1State.wasteIcons.map((icon, i) => `<text x="600" y="${260 + i * 20}" text-anchor="middle" font-size="24">${icon}</text>`).join('') : '';

    const gripper2 = document.getElementById('gripper-2');
    gripper2.setAttribute('transform', `translate(${gripper2State.x - 600}, ${gripper2State.y - 250})`);
    const gripper2ArmLeft = document.getElementById('gripper-2-arm-left');
    const gripper2ArmRight = document.getElementById('gripper-2-arm-right');
    const gripper2ClawLeft = document.getElementById('gripper-2-claw-left');
    const gripper2ClawRight = document.getElementById('gripper-2-claw-right');
    gripper2ArmLeft.setAttribute('d', gripper2State.hasWaste ? "M 585 280 L 580 310 L 585 315 L 590 285 Z" : "M 580 280 L 570 310 L 575 315 L 585 285 Z");
    gripper2ArmRight.setAttribute('d', gripper2State.hasWaste ? "M 615 280 L 620 310 L 615 315 L 610 285 Z" : "M 620 280 L 630 310 L 625 315 L 615 285 Z");
    gripper2ClawLeft.setAttribute('d', gripper2State.hasWaste ? "M 580 310 L 575 315 M 585 315 L 580 320" : "M 570 310 L 565 320 M 575 315 L 580 325");
    gripper2ClawRight.setAttribute('d', gripper2State.hasWaste ? "M 620 310 L 625 315 M 615 315 L 620 320" : "M 630 310 L 635 320 M 625 315 L 620 325");
    const gripper2Waste = document.getElementById('gripper-2-waste');
    gripper2Waste.innerHTML = gripper2State.hasWaste ? gripper2State.wasteIcons.map((icon, i) => `<text x="600" y="${260 + i * 20}" text-anchor="middle" font-size="24">${icon}</text>`).join('') : '';

    const compressor = document.getElementById('compressor');
    compressor.setAttribute('transform', `translate(${180 + compressorState.position * 180}, 0)`);
    const compressorParts = document.getElementsByClassName('compressor-part');
    for (let part of compressorParts) {
        part.setAttribute('y', compressorState.active ? parseInt(part.getAttribute('y')) - 10 : parseInt(part.getAttribute('y')));
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupSpeechRecognition();
    updateWasteButtons();
    updateWasteQueue();
    updateWasteStorage();
    updateProcessStatus();
    updateAnimationState();
    updateLid();
    updateVoiceButton();

    document.getElementById('toggle-lid-btn').addEventListener('click', toggleLid);
    document.getElementById('toggle-voice-btn').addEventListener('click', toggleVoiceRecognition);
    document.getElementById('clear-all-btn').addEventListener('click', clearAllWaste);
    document.getElementById('clear-all-btn').disabled = isProcessing;
});
