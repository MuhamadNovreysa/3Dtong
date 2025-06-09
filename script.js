// Waste types with detailed positions
const wasteTypes = [
    { name: "Organik", color: "#00ffcc", icon: "🍌", x: 250, y: 500 },
    { name: "Anorganik", color: "#00ccff", icon: "🥤", x: 400, y: 500 },
    { name: "B3", color: "#ff007a", icon: "🔋", x: 550, y: 500 },
    { name: "Kertas", color: "#ff9900", icon: "📄", x: 700, y: 500 },
    { name: "Residu", color: "#cc00ff", icon: "🗑️", x: 850, y: 500 },
];

// Available waste items with detailed properties
const availableWaste = [
    { id: "1", name: "Kulit Pisang", icon: "🍌", category: "Organik", color: "#00ffcc", weight: 0.1, size: "small" },
    { id: "2", name: "Botol Plastik", icon: "🥤", category: "Anorganik", color: "#00ccff", weight: 0.2, size: "medium" },
    { id: "3", name: "Baterai Bekas", icon: "🔋", category: "B3", color: "#ff007a", weight: 0.15, size: "small" },
    { id: "4", name: "Kertas Koran", icon: "📄", category: "Kertas", color: "#ff9900", weight: 0.3, size: "large" },
    { id: "5", name: "Puntung Rokok", icon: "🚬", category: "Residu", color: "#cc00ff", weight: 0.05, size: "tiny" },
    { id: "6", name: "Sisa Nasi", icon: "🍚", category: "Organik", color: "#00ffcc", weight: 0.25, size: "medium" },
    { id: "7", name: "Kulit Jeruk", icon: "🍊", category: "Organik", color: "#00ffcc", weight: 0.15, size: "small" },
    { id: "8", name: "Daun Kering", icon: "🍂", category: "Organik", color: "#00ffcc", weight: 0.1, size: "small" },
    { id: "9", name: "Sisa Sayuran", icon: "🥬", category: "Organik", color: "#00ffcc", weight: 0.2, size: "medium" },
    { id: "10", name: "Tulang Ayam", icon: "🍗", category: "Organik", color: "#00ffcc", weight: 0.3, size: "large" },
    { id: "11", name: "Kaleng Soda", icon: "🥫", category: "Anorganik", color: "#00ccff", weight: 0.4, size: "large" },
    { id: "12", name: "Botol Kaca", icon: "🍾", category: "Anorganik", color: "#00ccff", weight: 0.5, size: "large" },
    { id: "13", name: "Plastik Kemasan", icon: "📦", category: "Anorganik", color: "#00ccff", weight: 0.2, size: "medium" },
    { id: "14", name: "Sendok Plastik", icon: "🥄", category: "Anorganik", color: "#00ccff", weight: 0.1, size: "small" },
    { id: "15", name: "Gelas Plastik", icon: "🥤", category: "Anorganik", color: "#00ccff", weight: 0.15, size: "medium" },
    { id: "16", name: "HP Rusak", icon: "📱", category: "B3", color: "#ff007a", weight: 0.3, size: "large" },
    { id: "17", name: "Lampu Bohlam", icon: "💡", category: "B3", color: "#ff007a", weight: 0.2, size: "medium" },
    { id: "18", name: "Aki Bekas", icon: "🔋", category: "B3", color: "#ff007a", weight: 0.5, size: "large" },
    { id: "19", name: "Kardus Bekas", icon: "📦", category: "Kertas", color: "#ff9900", weight: 0.4, size: "large" },
    { id: "20", name: "Majalah Lama", icon: "📖", category: "Kertas", color: "#ff9900", weight: 0.3, size: "large" },
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
let systemStatus = "Idle";

// Animation states for dual grippers
let gripper1State = {
    x: 150,
    y: 200,
    hasWaste: false,
    targetX: 150,
    targetY: 200,
    wasteIcons: [],
    wasteCategory: "",
    isMoving: false,
    speed: 10,
    track: "left",
};
let gripper2State = {
    x: 1050,
    y: 200,
    hasWaste: false,
    targetX: 1050,
    targetY: 200,
    wasteIcons: [],
    wasteCategory: "",
    isMoving: false,
    speed: 10,
    track: "right",
};
let compressorState = { position: 0, active: false, power: 0 };

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

const updateTime = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: true }) + " WIB";
    document.getElementById('current-time').textContent = timeString;
    setTimeout(updateTime, 1000);
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
const getCategoryPosition = (category) => {
    const waste = wasteTypes.find(w => w.name === category);
    return { x: waste.x, y: waste.y };
};

const addWasteToStorage = (waste) => {
    storedWastes[waste.category].push({ id: `${waste.id}-${Date.now()}`, icon: waste.icon, category: waste.category, weight: waste.weight });
    updateWasteStorage();
    logSystem(`Sampah ${waste.name} ditambahkan ke ${waste.category}`);
};

const animateGripper = async (gripperState, targetX, targetY, waste) => {
    gripperState.isMoving = true;
    const step = gripperState.speed;
    while (Math.abs(gripperState.x - targetX) > step || Math.abs(gripperState.y - targetY) > step) {
        gripperState.x += (targetX - gripperState.x) > 0 ? step : -step;
        gripperState.y += (targetY - gripperState.y) > 0 ? step : -step;
        updateAnimationState();
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    gripperState.x = targetX;
    gripperState.y = targetY;
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
    systemStatus = "Processing";
    updateProcessStatus();
    updateSystemStatus();

    for (let i = 0; i < wasteQueue.length; i++) {
        const waste = wasteQueue[i];
        const categoryPos = getCategoryPosition(waste.category);
        const gripper = !gripper1State.isMoving ? gripper1State : !gripper2State.isMoving ? gripper2State : null;

        if (!gripper) {
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
        }

        sortingProcess.push(`🤖 Gripper ${gripper === gripper1State ? 1 : 2} memproses: ${waste.name}`);
        updateProcessStatus();

        await animateGripper(gripper, gripper.track === "left" ? 150 : 1050, 200, waste); // Pick up
        await animateGripper(gripper, categoryPos.x, categoryPos.y); // Move to compartment
        await animateGripper(gripper, categoryPos.x, categoryPos.y, null); // Drop
        await animateGripper(gripper, gripper.track === "left" ? 150 : 1050, 200); // Return

        wasteQueue.splice(i, 1);
        updateWasteQueue();
        i--; // Adjust index after removal
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    isProcessing = false;
    systemStatus = "Idle";
    sortingProcess.push("✅ Pemilahan selesai!");
    updateProcessStatus();
    updateSystemStatus();
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
    logSystem(`Sampah ${waste.name} ditambahkan ke antrian`);
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
    logSystem(`Tutup ${isLidOpen ? 'dibuka' : 'ditutup'}`);
};

const toggleCompressor = async () => {
    if (compressorState.active || isProcessing) return;
    compressorState.active = true;
    compressorState.power = 0;
    const maxPower = 100;
    const compressor = document.getElementById('compressor');
    while (compressorState.power < maxPower) {
        compressorState.power += 5;
        compressorState.position = compressorState.power / maxPower;
        updateAnimationState();
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    compressorState.active = false;
    compressorState.power = 0;
    compressorState.position = 0;
    updateAnimationState();
    showToast("Kompresi Selesai", "Sampah telah dikompres!", "default");
    logSystem("Mesin tekan diaktifkan dan selesai");
};

const clearAllWaste = () => {
    wasteQueue = [];
    storedWastes = { Organik: [], Anorganik: [], B3: [], Kertas: [], Residu: [] };
    gripper1State = { x: 150, y: 200, hasWaste: false, targetX: 150, targetY: 200, wasteIcons: [], wasteCategory: "", isMoving: false, speed: 10, track: "left" };
    gripper2State = { x: 1050, y: 200, hasWaste: false, targetX: 1050, targetY: 200, wasteIcons: [], wasteCategory: "", isMoving: false, speed: 10, track: "right" };
    compressorState = { position: 0, active: false, power: 0 };
    sortingProcess = [];
    updateWasteQueue();
    updateWasteStorage();
    updateProcessStatus();
    updateAnimationState();
    showToast("Sistem Direset", "Semua data dibersihkan", "default");
    logSystem("Sistem direset sepenuhnya");
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
                    <div class="text-xs text-gray-400">Berat: ${waste.weight}kg, Ukuran: ${waste.size}</div>
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
                <span class="text-xs text-gray-400">(${waste.weight}kg)</span>
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
                <span class="text-xs text-gray-400">Total Berat: ${storedWastes[waste.name].reduce((sum, w) => sum + w.weight, 0).toFixed(2)}kg</span>
            </div>
        </div>
    `).join('');
    const compartments = document.getElementById('waste-compartments');
    compartments.innerHTML = wasteTypes.map((waste, index) => `
        <g>
            <rect x="${waste.x - 50}" y="500" width="100" height="200" fill="${waste.color}" fill-opacity="0.3" stroke="${waste.color}" stroke-width="4" />
            <rect x="${waste.x - 60}" y="490" width="100" height="200" fill="${waste.color}" fill-opacity="0.2" stroke="${waste.color}" stroke-width="5" />
            <text x="${waste.x - 5}" y="510" text-anchor="middle" font-size="16" fill="${waste.color}">${waste.name}</text>
            ${storedWastes[waste.name].map((storedWaste, i) => `
                <text x="${waste.x - 50 + (i % 2) * 40}" y="${540 + Math.floor(i / 2) * 30}" text-anchor="middle" font-size="24">${storedWaste.icon}</text>
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

const updateSystemStatus = () => {
    document.getElementById('system-status').textContent = systemStatus;
};

const logSystem = (message) => {
    const logs = document.getElementById('system-logs');
    const logEntry = document.createElement('div');
    logEntry.className = 'text-xs text-gray-400 p-1 bg-gray-800 rounded';
    logEntry.textContent = `[${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}] ${message}`;
    logs.appendChild(logEntry);
    if (logs.childElementCount > 20) logs.removeChild(logs.firstChild);
    logs.scrollTop = logs.scrollHeight;
};

const updateAnimationState = () => {
    const gripper1 = document.getElementById('gripper-1');
    gripper1.setAttribute('transform', `translate(${gripper1State.x - 150}, ${gripper1State.y - 200})`);
    const gripper1ArmLeft = document.getElementById('gripper-1-arm-left');
    const gripper1ArmRight = document.getElementById('gripper-1-arm-right');
    const gripper1ClawLeft = document.getElementById('gripper-1-claw-left');
    const gripper1ClawRight = document.getElementById('gripper-1-claw-right');
    gripper1ArmLeft.setAttribute('d', gripper1State.hasWaste ? "M 135 230 L 130 260 L 135 265 L 140 235 Z" : "M 130 230 L 120 260 L 125 265 L 135 235 Z");
    gripper1ArmRight.setAttribute('d', gripper1State.hasWaste ? "M 165 230 L 170 260 L 165 265 L 160 235 Z" : "M 170 230 L 180 260 L 175 265 L 165 235 Z");
    gripper1ClawLeft.setAttribute('d', gripper1State.hasWaste ? "M 130 260 L 125 265 M 135 265 L 130 270" : "M 120 260 L 115 270 M 125 265 L 130 275");
    gripper1ClawRight.setAttribute('d', gripper1State.hasWaste ? "M 170 260 L 175 265 M 165 265 L 170 270" : "M 180 260 L 185 270 M 175 265 L 170 275");
    const gripper1Waste = document.getElementById('gripper-1-waste');
    gripper1Waste.innerHTML = gripper1State.hasWaste ? gripper1State.wasteIcons.map((icon, i) => `<text x="150" y="${210 + i * 20}" text-anchor="middle" font-size="24">${icon}</text>`).join('') : '';

    const gripper2 = document.getElementById('gripper-2');
    gripper2.setAttribute('transform', `translate(${gripper2State.x - 1050}, ${gripper2State.y - 200})`);
    const gripper2ArmLeft = document.getElementById('gripper-2-arm-left');
    const gripper2ArmRight = document.getElementById('gripper-2-arm-right');
    const gripper2ClawLeft = document.getElementById('gripper-2-claw-left');
    const gripper2ClawRight = document.getElementById('gripper-2-claw-right');
    gripper2ArmLeft.setAttribute('d', gripper2State.hasWaste ? "M 1035 230 L 1030 260 L 1035 265 L 1040 235 Z" : "M 1030 230 L 1020 260 L 1025 265 L 1035 235 Z");
    gripper2ArmRight.setAttribute('d', gripper2State.hasWaste ? "M 1065 230 L 1070 260 L 1065 265 L 1060 235 Z" : "M 1070 230 L 1080 260 L 1075 265 L 1065 235 Z");
    gripper2ClawLeft.setAttribute('d', gripper2State.hasWaste ? "M 1030 260 L 1025 265 M 1035 265 L 1030 270" : "M 1020 260 L 1015 270 M 1025 265 L 1030 275");
    gripper2ClawRight.setAttribute('d', gripper2State.hasWaste ? "M 1070 260 L 1075 265 M 1065 265 L 1070 270" : "M 1080 260 L 1085 270 M 1075 265 L 1070 275");
    const gripper2Waste = document.getElementById('gripper-2-waste');
    gripper2Waste.innerHTML = gripper2State.hasWaste ? gripper2State.wasteIcons.map((icon, i) => `<text x="1050" y="${210 + i * 20}" text-anchor="middle" font-size="24">${icon}</text>`).join('') : '';

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
    updateTime();
    updateWasteButtons();
    updateWasteQueue();
    updateWasteStorage();
    updateProcessStatus();
    updateAnimationState();
    updateLid();
    updateVoiceButton();
    updateSystemStatus();

    document.getElementById('toggle-lid-btn').addEventListener('click', toggleLid);
    document.getElementById('toggle-voice-btn').addEventListener('click', toggleVoiceRecognition);
    document.getElementById('clear-all-btn').addEventListener('click', clearAllWaste);
    document.getElementById('toggle-compressor-btn').addEventListener('click', toggleCompressor);
    document.getElementById('clear-all-btn').disabled = isProcessing;

    // Additional initialization checks
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast("Peringatan", "Browser tidak mendukung mikrofon", "destructive");
    }
});
