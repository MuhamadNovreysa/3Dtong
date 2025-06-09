// Waste types
const wasteTypes = [
    { name: "Organik", color: "#22c55e", icon: "🍌" },
    { name: "Anorganik", color: "#3b82f6", icon: "🥤" },
    { name: "B3", color: "#ef4444", icon: "🔋" },
    { name: "Kertas", color: "#f59e0b", icon: "📄" },
    { name: "Residu", color: "#6b7280", icon: "🗑️" },
];

// Available waste items
const availableWaste = [
    { id: "1", name: "Kulit Pisang", icon: "🍌", category: "Organik", color: "#22c55e" },
    { id: "2", name: "Botol Plastik", icon: "🥤", category: "Anorganik", color: "#3b82f6" },
    { id: "3", name: "Baterai Bekas", icon: "🔋", category: "B3", color: "#ef4444" },
    { id: "4", name: "Kertas Koran", icon: "📄", category: "Kertas", color: "#f59e0b" },
    { id: "5", name: "Puntung Rokok", icon: "🚬", category: "Residu", color: "#6b7280" },
    { id: "6", name: "Sisa Nasi", icon: "🍚", category: "Organik", color: "#22c55e" },
    { id: "7", name: "Kulit Jeruk", icon: "🍊", category: "Organik", color: "#22c55e" },
    { id: "8", name: "Daun Kering", icon: "🍂", category: "Organik", color: "#22c55e" },
    { id: "9", name: "Sisa Sayuran", icon: "🥬", category: "Organik", color: "#22c55e" },
    { id: "10", name: "Tulang Ayam", icon: "🍗", category: "Organik", color: "#22c55e" },
    { id: "11", name: "Kaleng Soda", icon: "🥫", category: "Anorganik", color: "#3b82f6" },
    { id: "12", name: "Botol Kaca", icon: "🍾", category: "Anorganik", color: "#3b82f6" },
    { id: "13", name: "Plastik Kemasan", icon: "📦", category: "Anorganik", color: "#3b82f6" },
    { id: "14", name: "Sendok Plastik", icon: "🥄", category: "Anorganik", color: "#3b82f6" },
    { id: "15", name: "Gelas Plastik", icon: "🥤", category: "Anorganik", color: "#3b82f6" },
    { id: "16", name: "HP Rusak", icon: "📱", category: "B3", color: "#ef4444" },
    { id: "17", name: "Lampu Bohlam", icon: "💡", category: "B3", color: "#ef4444" },
    { id: "18", name: "Aki Bekas", icon: "🔋", category: "B3", color: "#ef4444" },
    { id: "19", name: "Kardus Bekas", icon: "📦", category: "Kertas", color: "#f59e0b" },
    { id: "20", name: "Majalah Lama", icon: "📖", category: "Kertas", color: "#f59e0b" },
    {
        id: "mixed1",
        name: "Kantong Plastik Campur",
        icon: "🛍️",
        category: "Mixed",
        color: "#8b5cf6",
        isMixed: true,
        contents: [
            { name: "Botol Plastik", icon: "🥤", category: "Anorganik" },
            { name: "Kulit Pisang", icon: "🍌", category: "Organik" },
            { name: "Kertas Bekas", icon: "📄", category: "Kertas" },
        ],
    },
    {
        id: "mixed2",
        name: "Tas Belanja Isi",
        icon: "👜",
        category: "Mixed",
        color: "#8b5cf6",
        isMixed: true,
        contents: [
            { name: "HP Rusak", icon: "📱", category: "B3" },
            { name: "Baterai", icon: "🔋", category: "B3" },
            { name: "Plastik Pembungkus", icon: "🥤", category: "Anorganik" },
        ],
    },
    {
        id: "mixed3",
        name: "Kotak Bekas Isi",
        icon: "📦",
        category: "Mixed",
        color: "#8b5cf6",
        isMixed: true,
        contents: [
            { name: "Kertas", icon: "📄", category: "Kertas" },
            { name: "Botol Kaca", icon: "🍾", category: "Anorganik" },
            { name: "Sisa Makanan", icon: "🍎", category: "Organik" },
        ],
    },
];

// State variables
let isLidOpen = false;
let currentWaste = null;
let sortingProcess = [];
let isProcessing = false;
let storedWastes = {
    Organik: [],
    Anorganik: [],
    B3: [],
    Kertas: [],
    Residu: [],
};
let animationState = {
    gripperX: 600,
    gripperY: 300,
    gripperHasWaste: false,
    wasteX: 0,
    wasteY: 0,
    wasteVisible: false,
    wasteIcons: [],
    wasteCategory: "",
    compressorPosition: 0,
    compressorActive: false,
    wasteInPipe: false,
    pipeProgress: 0,
    targetCategory: "",
    activePipeIndex: -1,
};
let wasteQueue = [];
let isListening = false;
let recognition = null;
let lastCommandTime = 0;
let commandCooldown = 0;
let isRecognitionRunning = false;

// Utility functions
const isMobile = () => window.innerWidth < 768;

const showToast = (title, description, variant) => {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${variant}`;
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
    } catch (error) {
        console.log('Permission API not supported, checking via getUserMedia');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (err) {
            return false;
        }
    }
};

// Speech recognition setup
const setupSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn('Speech recognition not supported in this browser');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'id-ID';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
        const now = Date.now();
        if (now - lastCommandTime < 2000) return;
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        console.log('Voice command:', transcript);
        handleVoiceCommand(transcript);
        lastCommandTime = now;
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        isRecognitionRunning = false;
        if (event.error === 'no-speech' || event.error === 'audio-capture') {
            setTimeout(() => {
                if (isListening && !isRecognitionRunning) {
                    startRecognition();
                }
            }, 1000);
        }
    };

    recognition.onend = () => {
        isRecognitionRunning = false;
        if (isListening) {
            setTimeout(() => {
                if (!isRecognitionRunning) {
                    startRecognition();
                }
            }, 500);
        }
    };

    const startRecognition = () => {
        if (!isRecognitionRunning && recognition) {
            try {
                recognition.start();
                isRecognitionRunning = true;
            } catch (err) {
                console.error('Error starting recognition:', err);
                isRecognitionRunning = false;
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
        'sisa nasi': 'Sisa Nasi',
        'kulit jeruk': 'Kulit Jeruk',
        'daun kering': 'Daun Kering',
        'sisa sayuran': 'Sisa Sayuran',
        'tulang ayam': 'Tulang Ayam',
        'kaleng soda': 'Kaleng Soda',
        'botol kaca': 'Botol Kaca',
        'plastik kemasan': 'Plastik Kemasan',
        'sendok plastik': 'Sendok Plastik',
        'gelas plastik': 'Gelas Plastik',
        'hp rusak': 'HP Rusak',
        'lampu bohlam': 'Lampu Bohlam',
        'aki bekas': 'Aki Bekas',
        'kardus bekas': 'Kardus Bekas',
        'majalah lama': 'Majalah Lama',
        'kantong plastik campur': 'Kantong Plastik Campur',
        'tas belanja isi': 'Tas Belanja Isi',
        'kotak bekas isi': 'Kotak Bekas Isi'
    };

    for (const [cmd, wasteName] of Object.entries(wasteCommands)) {
        if (command.includes(cmd)) {
            commandCooldown = Date.now();
            const wasteItem = availableWaste.find(w => w.name === wasteName);
            if (wasteItem) {
                throwWaste(wasteItem);
                showToast("Perintah Suara Diterima", `Membuang ${wasteItem.name}`, "default");
            }
            return;
        }
    }
};

const toggleVoiceRecognition = async () => {
    try {
        const hasPermission = await checkMicrophonePermission();
        if (!hasPermission) {
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true });
                isListening = true;
                showToast("Mikrofon Diaktifkan", "Sistem siap menerima perintah suara", "default");
                startRecognition();
            } catch (err) {
                showToast("Izin Mikrofon Dibutuhkan", "Silakan izinkan akses mikrofon untuk menggunakan fitur suara", "destructive");
            }
        } else {
            isListening = !isListening;
            showToast(
                isListening ? "Mikrofon Diaktifkan" : "Mikrofon Dimatikan",
                isListening ? "Sistem siap menerima perintah suara" : "Pendeteksian suara dinonaktifkan",
                "default"
            );
            if (isListening) {
                startRecognition();
            } else {
                stopRecognition();
            }
        }
        updateVoiceButton();
    } catch (error) {
        console.error('Error toggling voice recognition:', error);
        showToast("Error", "Gagal mengakses mikrofon", "destructive");
    }
};

const startRecognition = () => {
    if (!isRecognitionRunning && recognition) {
        try {
            recognition.start();
            isRecognitionRunning = true;
        } catch (err) {
            console.error('Error starting recognition:', err);
            isRecognitionRunning = false;
        }
    }
};

const stopRecognition = () => {
    if (isRecognitionRunning && recognition) {
        try {
            recognition.stop();
            isRecognitionRunning = false;
        } catch (err) {
            console.error('Error stopping recognition:', err);
        }
    }
};

// Waste processing logic
const getCategoryIndex = (category) => {
    const index = wasteTypes.findIndex(w => w.name === category);
    console.log(`🔍 Category: ${category} → Index: ${index}`);
    return index >= 0 ? index : 4;
};

const getCategoryPosition = (category) => {
    const index = getCategoryIndex(category);
    return { x: 255 + index * 150, y: 600 };
};

const getPipePosition = (progress, categoryIndex) => {
    const startX = 680 + categoryIndex * 80;
    const startY = 390;
    const endX = 220 + categoryIndex * 150;
    const endY = 480;
    const controlX = startX;
    const controlY = 430;

    const t = progress / 100;
    const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * endX;
    const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * endY;

    return { x, y };
};

const addWasteToStorage = (waste) => {
    console.log(`💾 Adding waste to storage: ${waste.name} → ${waste.category}`);
    const newWaste = {
        id: `${waste.id}-${Date.now()}`,
        icon: waste.icon,
        category: waste.category,
        timestamp: Date.now(),
    };
    storedWastes[waste.category] = [...storedWastes[waste.category], newWaste];
    updateWasteStorage();
};

const animateWasteThroughPipe = async (wastes) => {
    if (wastes.length === 0) return;

    const category = wastes[0].category;
    const categoryIndex = getCategoryIndex(category);
    console.log(`🎯 Animating ${wastes.length} wastes through pipe: ${category} → index: ${categoryIndex}`);

    if (categoryIndex < 0 || categoryIndex >= wasteTypes.length) {
        console.error(`❌ Invalid category index: ${categoryIndex} for category: ${category}`);
        return;
    }

    animationState = {
        ...animationState,
        wasteInPipe: true,
        pipeProgress: 0,
        targetCategory: category,
        wasteVisible: false,
        activePipeIndex: categoryIndex,
        wasteIcons: wastes.map(w => w.icon),
    };
    updateAnimationState();

    console.log(`🚀 Starting animation through pipe ${categoryIndex} (${wasteTypes[categoryIndex].name})`);

    for (let progress = 0; progress <= 100; progress += 5) {
        const position = getPipePosition(progress, categoryIndex);
        animationState = {
            ...animationState,
            pipeProgress: progress,
            wasteX: position.x,
            wasteY: position.y,
            wasteVisible: true,
        };
        updateAnimationState();
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    const categoryPos = getCategoryPosition(category);
    animationState = {
        ...animationState,
        wasteInPipe: false,
        wasteX: categoryPos.x,
        wasteY: categoryPos.y,
        wasteVisible: true,
        activePipeIndex: -1,
    };
    updateAnimationState();

    console.log(`✅ Wastes arrived at final position: ${categoryPos.x}, ${categoryPos.y}`);

    wastes.forEach(waste => addWasteToStorage(waste));
};

const animateGripperToWaste = async (wastes) => {
    if (wastes.length === 0) return;

    const category = wastes[0].category;
    console.log(`🤖 Starting gripper animation for ${wastes.length} wastes: ${category}`);

    animationState = { ...animationState, gripperX: 355, gripperY: 300 };
    updateAnimationState();
    await new Promise(resolve => setTimeout(resolve, 1000));

    animationState = {
        ...animationState,
        gripperHasWaste: true,
        wasteVisible: false,
        wasteIcons: wastes.map(w => w.icon),
    };
    updateAnimationState();
    await new Promise(resolve => setTimeout(resolve, 500));

    animationState = { ...animationState, gripperX: 785, gripperY: 300 };
    updateAnimationState();
    await new Promise(resolve => setTimeout(resolve, 1000));

    animationState = {
        ...animationState,
        gripperHasWaste: false,
        wasteX: 785,
        wasteY: 300,
        wasteVisible: true,
        wasteIcons: wastes.map(w => w.icon),
    };
    updateAnimationState();
    await new Promise(resolve => setTimeout(resolve, 3000));

    const categoryIndex = getCategoryIndex(category);
    sortingProcess = [
        ...sortingProcess,
        `📤 Mengirim ${wastes.length} sampah ke kategori: ${category} melalui pipa ${wasteTypes[categoryIndex].name}`,
    ];
    updateProcessStatus();
    console.log(`📤 Sending ${wastes.length} wastes to ${category}, using pipe index: ${categoryIndex}`);

    await animateWasteThroughPipe(wastes);
    await new Promise(resolve => setTimeout(resolve, 1000));

    animationState = { ...animationState, compressorPosition: categoryIndex, compressorActive: true };
    updateAnimationState();
    await new Promise(resolve => setTimeout(resolve, 1500));

    animationState = { ...animationState, compressorActive: false, wasteVisible: false, wasteIcons: [] };
    updateAnimationState();

    animationState = { ...animationState, gripperX: 600, gripperY: 300 };
    updateAnimationState();

    console.log(`✅ Process completed for ${wastes.length} wastes → ${category}`);
    sortingProcess = [...sortingProcess, `✅ ${wastes.length} sampah berhasil disimpan di kategori ${category}!`];
    updateProcessStatus();
};

const processMixedWaste = async (waste) => {
    if (!waste.contents) return;

    sortingProcess = [`🤖 Mesin japit mendeteksi: ${waste.name}`];
    updateProcessStatus();
    await new Promise(resolve => setTimeout(resolve, 1000));

    sortingProcess = [...sortingProcess, "🔍 Membuka dan memilah isi..."];
    updateProcessStatus();
    await new Promise(resolve => setTimeout(resolve, 1500));

    const groupedContents = {};
    waste.contents.forEach((item, i) => {
        const individualWaste = {
            id: `mixed-item-${i}`,
            name: item.name,
            icon: item.icon,
            category: item.category,
            color: wasteTypes.find(w => w.name === item.category)?.color || "#6b7280",
        };
        if (!groupedContents[item.category]) {
            groupedContents[item.category] = [];
        }
        groupedContents[item.category].push(individualWaste);
    });

    for (const category of Object.keys(groupedContents)) {
        const items = groupedContents[category];
        sortingProcess = [...sortingProcess, `📤 Memilah ${items.length} item: ${category}`];
        updateProcessStatus();

        currentWaste = items[0];
        updateCurrentWaste();

        animationState = {
            ...animationState,
            wasteX: 355,
            wasteY: 300,
            wasteVisible: true,
            wasteIcons: items.map(item => item.icon),
            wasteCategory: category,
            gripperX: 600,
            gripperY: 300,
            gripperHasWaste: false,
            wasteInPipe: false,
            pipeProgress: 0,
            compressorActive: false,
            activePipeIndex: -1,
        };
        updateAnimationState();
        await new Promise(resolve => setTimeout(resolve, 1000));

        await animateGripperToWaste(items);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    sortingProcess = [...sortingProcess, "✅ Semua sampah berhasil dipilah dan ditempatkan!"];
    updateProcessStatus();
};

const processWasteQueue = async () => {
    if (wasteQueue.length === 0) return;

    isProcessing = true;
    updateProcessStatus();

    const groupedWastes = {};
    wasteQueue.forEach(waste => {
        if (!groupedWastes[waste.category]) {
            groupedWastes[waste.category] = [];
        }
        groupedWastes[waste.category].push(waste);
    });

    const categories = Object.keys(groupedWastes);
    const totalGroups = categories.length;

    sortingProcess = [`🚀 Sistem dimulai! Memproses ${totalGroups} kelompok sampah...`];
    updateProcessStatus();

    try {
        for (let i = 0; i < categories.length; i++) {
            const category = categories[i];
            const wastes = groupedWastes[category];

            currentWaste = null;
            animationState = {
                gripperX: 600,
                gripperY: 300,
                gripperHasWaste: false,
                wasteX: 0,
                wasteY: 0,
                wasteVisible: false,
                wasteIcons: [],
                wasteCategory: "",
                compressorPosition: 0,
                compressorActive: false,
                wasteInPipe: false,
                pipeProgress: 0,
                targetCategory: "",
                activePipeIndex: -1,
            };
            updateAnimationState();
            updateCurrentWaste();
            await new Promise(resolve => setTimeout(resolve, 500));

            currentWaste = wastes[0];
            sortingProcess = [...sortingProcess, `📥 [${i + 1}/${totalGroups}] Memproses ${wastes.length} sampah: ${category}`];
            updateProcessStatus();
            updateCurrentWaste();

            animationState = {
                gripperX: 600,
                gripperY: 300,
                gripperHasWaste: false,
                wasteX: 355,
                wasteY: 300,
                wasteVisible: true,
                wasteIcons: wastes.map(w => w.icon),
                wasteCategory: category,
                compressorPosition: 0,
                compressorActive: false,
                wasteInPipe: false,
                pipeProgress: 0,
                targetCategory: "",
                activePipeIndex: -1,
            };
            updateAnimationState();
            await new Promise(resolve => setTimeout(resolve, 1000));

            wasteQueue = wasteQueue.filter(w => w.category !== category);
            updateWasteQueue();

            if (wastes[0].isMixed && wastes[0].contents) {
                await processMixedWaste(wastes[0]);
            } else {
                sortingProcess = [...sortingProcess, `🤖 Mesin japit bergerak mengambil ${wastes.length} sampah`];
                updateProcessStatus();
                await animateGripperToWaste(wastes);
            }

            await new Promise(resolve => setTimeout(resolve, 500));
        }

        sortingProcess = [...sortingProcess, `✅ Semua ${totalGroups} kelompok sampah berhasil diproses!`];
        updateProcessStatus();

        wasteQueue = [];
        updateWasteQueue();
    } catch (error) {
        console.error("❌ Error during queue processing:", error);
    } finally {
        isProcessing = false;
        currentWaste = null;
        updateCurrentWaste();
        updateProcessStatus();

        showToast("Proses Selesai", "Semua sampah telah berhasil dipilah!", "default");
    }
};

const throwWaste = (waste) => {
    if (!isLidOpen) {
        showToast("Tutup Tertutup", "Buka tutup tong sampah dulu!", "destructive");
        return;
    }

    if (isProcessing) {
        showToast("Sistem Sedang Bekerja", "Tunggu proses selesai!", "destructive");
        return;
    }

    wasteQueue = [...wasteQueue, waste];
    showToast("Sampah Ditambahkan", `${waste.name} ditambahkan ke antrian. Total: ${wasteQueue.length} sampah`, "default");
    console.log(`🗑️ Added to queue: ${waste.name} (${waste.category})`);
    updateWasteQueue();
};

const toggleLid = async () => {
    if (isProcessing) {
        showToast("Sistem Sedang Bekerja", "Tunggu proses pemilahan selesai!", "destructive");
        return;
    }

    if (isLidOpen) {
        if (wasteQueue.length === 0) {
            showToast("Tidak Ada Sampah", "Masukkan sampah dulu sebelum menutup tutup!", "destructive");
            return;
        }

        isLidOpen = false;
        showToast("Tutup Tertutup - Sistem Dimulai", `Memproses ${wasteQueue.length} sampah...`, "default");
        updateLid();
        await processWasteQueue();
    } else {
        isLidOpen = true;
        showToast("Tutup Terbuka", "Masukkan sampah yang ingin dipilah", "default");
        updateLid();
    }
};

const clearAllWaste = () => {
    storedWastes = { Organik: [], Anorganik: [], B3: [], Kertas: [], Residu: [] };
    wasteQueue = [];
    currentWaste = null;
    sortingProcess = [];
    animationState = {
        gripperX: 600,
        gripperY: 300,
        gripperHasWaste: false,
        wasteX: 0,
        wasteY: 0,
        wasteVisible: false,
        wasteIcons: [],
        wasteCategory: "",
        compressorPosition: 0,
        compressorActive: false,
        wasteInPipe: false,
        pipeProgress: 0,
        targetCategory: "",
        activePipeIndex: -1,
    };
    updateWasteQueue();
    updateWasteStorage();
    updateProcessStatus();
    updateAnimationState();
    updateCurrentWaste();
    showToast("Sistem Direset", "Semua sampah dan antrian telah dibersihkan", "default");
};

// DOM update functions
const updateLid = () => {
    const lid = document.getElementById('lid');
    lid.setAttribute('transform', isLidOpen ? 'rotate(25 560 120)' : '');
    const toggleBtn = document.getElementById('toggle-lid-btn');
    toggleBtn.className = `btn h-14 text-lg font-bold px-8 ${isLidOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`;
    toggleBtn.innerHTML = `<i class="fas fa-microphone w-6 h-6 mr-2"></i>${isLidOpen ? '🔴 Tutup' : '🟢 Buka'} Tutup Tong`;
    toggleBtn.disabled = isProcessing;
};

const updateVoiceButton = () => {
    const voiceBtn = document.getElementById('toggle-voice-btn');
    voiceBtn.className = `btn h-14 text-lg font-bold px-8 ${isListening ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-500 hover:bg-gray-600'}`;
    voiceBtn.innerHTML = `<i class="fas fa-microphone w-6 h-6 mr-2"></i>${isListening ? '🎤 Aktif' : '🎤 Suara'}`;
    const voiceSensorBack = document.getElementById('voice-sensor-back');
    const voiceSensorFront = document.getElementById('voice-sensor-front');
    voiceSensorBack.setAttribute('fill', isListening ? '#22c55e' : '#ef4444');
    voiceSensorFront.setAttribute('fill', isListening ? '#16a34a' : '#dc2626');
};

const updateWasteButtons = () => {
    const wasteButtons = document.getElementById('waste-buttons');
    wasteButtons.innerHTML = availableWaste.map(waste => `
        <button class="btn w-full h-auto p-3 text-left justify-start ${waste.isMixed ? 'bg-purple-100 hover:bg-purple-200 text-purple-800 border-2 border-purple-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}" ${isProcessing ? 'disabled' : ''} onclick="throwWaste(availableWaste[${availableWaste.indexOf(waste)}])">
            <div class="flex items-center gap-2 w-full">
                <span class="text-xl md:text-2xl">${waste.icon}</span>
                <div class="flex-1">
                    <div class="font-semibold text-xs md:text-sm">${waste.name} → ${waste.category}</div>
                    ${waste.isMixed && waste.contents ? `<div class="text-xs mt-1 opacity-75 hidden md:block">Isi: ${waste.contents.map(c => `${c.icon} ${c.category}`).join(", ")}</div>` : ''}
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
        <div class="text-sm text-gray-600 mb-2">Tutup tong sampah untuk memulai proses pemilahan:</div>
        ${wasteQueue.map((waste, index) => `
            <div class="flex items-center gap-2 p-2 bg-orange-50 rounded">
                <span class="badge badge-outline">${index + 1}</span>
                <span class="text-xl">${waste.icon}</span>
                <span class="text-sm font-medium">${waste.name}</span>
                <span class="text-xs text-gray-500">→ ${waste.category}</span>
            </div>
        `).join('')}
    ` : '';
    const sekat1 = document.getElementById('sekat-1-wastes');
    sekat1.innerHTML = wasteQueue.map((waste, index) => {
        const row = Math.floor(index / 4);
        const col = index % 4;
        const x = 280 + col * 50;
        const y = 300 + row * 40;
        return `<text x="${x}" y="${y}" text-anchor="middle" font-size="32">${waste.icon}</text>`;
    }).join('');
    document.getElementById('sekat-1-empty').style.display = wasteQueue.length === 0 && isLidOpen ? 'block' : 'none';
};

const updateWasteStorage = () => {
    const wasteStorage = document.getElementById('waste-storage');
    wasteStorage.innerHTML = wasteTypes.map((waste, index) => `
        <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded-full" style="background-color: ${waste.color}"></div>
                <span class="text-sm font-medium">${waste.name}</span>
            </div>
            <div class="flex items-center gap-1">
                <span class="text-sm">${storedWastes[waste.name].length} item</span>
                ${storedWastes[waste.name].slice(0, 3).map(item => `<span class="text-sm">${item.icon}</span>`).join('')}
            </div>
        </div>
    `).join('');
    const compartments = document.getElementById('waste-compartments');
    compartments.innerHTML = wasteTypes.map((waste, index) => `
        <g>
            <rect x="${200 + index * 150}" y="560" width="130" height="100" fill="${waste.color}" fill-opacity="0.3" stroke="${waste.color}" stroke-width="3" />
            <rect x="${190 + index * 150}" y="550" width="130" height="100" fill="${waste.color}" fill-opacity="0.2" stroke="${waste.color}" stroke-width="3" />
            <path d="M ${320 + index * 150} 550 L ${330 + index * 150} 560 L ${330 + index * 150} 660 L ${320 + index * 150} 650 Z" fill="${waste.color}" fill-opacity="0.4" stroke="${waste.color}" stroke-width="2" />
            <text x="${255 + index * 150}" y="580" text-anchor="middle" font-size="14" font-weight="bold">${waste.name.toUpperCase()}</text>
            ${storedWastes[waste.name].map((storedWaste, wasteIndex) => `
                <text x="${255 + index * 150 + (wasteIndex % 3) * 15 - 15}" y="${620 + Math.floor(wasteIndex / 3) * 20}" text-anchor="middle" font-size="20">${storedWaste.icon}</text>
            `).join('')}
            ${storedWastes[waste.name].length === 0 ? `<text x="${255 + index * 150}" y="630" text-anchor="middle" font-size="12" opacity="0.5" fill="#666">KOSONG</text>` : ''}
        </g>
    `).join('');
};

const updateProcessStatus = () => {
    const processCard = document.getElementById('process-status-card');
    const processIcon = document.getElementById('process-icon');
    const processStatus = document.getElementById('process-status');
    processCard.style.display = sortingProcess.length > 0 ? 'block' : 'none';
    processIcon.className = `fas ${isProcessing ? 'fa-play' : 'fa-pause'} w-5 h-5 ${isProcessing ? 'text-blue-600' : 'text-green-600'}`;
    processStatus.innerHTML = sortingProcess.map((step, index) => `
        <div class="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <span class="badge badge-outline">${index + 1}</span>
            <span class="text-xs md:text-sm">${step}</span>
        </div>
    `).join('');
    if (isProcessing) {
        processStatus.innerHTML += `
            <div class="flex items-center gap-2 p-2 bg-blue-50 rounded animate-pulse">
                <div class="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
                <span class="text-xs md:text-sm text-blue-700">Sedang memproses...</span>
            </div>
        `;
    }
};

const updateAnimationState = () => {
    const gripper = document.getElementById('gripper');
    gripper.setAttribute('transform', `translate(${animationState.gripperX - 600}, ${animationState.gripperY - 300})`);
    const armLeft = document.getElementById('gripper-arm-left');
    const armRight = document.getElementById('gripper-arm-right');
    const clawLeft = document.getElementById('gripper-claw-left');
    const clawRight = document.getElementById('gripper-claw-right');
    armLeft.setAttribute('d', animationState.gripperHasWaste
        ? "M 585 300 L 580 330 L 585 335 L 590 305 Z"
        : "M 580 300 L 570 330 L 575 335 L 585 305 Z");
    armRight.setAttribute('d', animationState.gripperHasWaste
        ? "M 615 300 L 620 330 L 615 335 L 610 305 Z"
        : "M 620 300 L 630 330 L 625 335 L 615 305 Z");
    clawLeft.setAttribute('d', animationState.gripperHasWaste
        ? "M 580 330 L 575 335 M 585 335 L 580 340"
        : "M 570 330 L 565 340 M 575 335 L 580 345");
    clawRight.setAttribute('d', animationState.gripperHasWaste
        ? "M 620 330 L 625 335 M 615 335 L 620 340"
        : "M 630 330 L 635 340 M 625 335 L 620 345");
    const gripperWaste = document.getElementById('gripper-waste');
    gripperWaste.innerHTML = animationState.gripperHasWaste
        ? animationState.wasteIcons.map((icon, index) => {
            const offset = index * 20 - (animationState.wasteIcons.length - 1) * 10;
            return `<text x="${600 + offset}" y="300" text-anchor="middle" font-size="20">${icon}</text>`;
        }).join('')
        : '';
    const sekat2Wastes = document.getElementById('sekat-2-wastes');
    sekat2Wastes.innerHTML = animationState.wasteVisible && animationState.wasteX === 785 && animationState.wasteY === 300
        ? animationState.wasteIcons.map((icon, index) => {
            const offset = index * 30 - (animationState.wasteIcons.length - 1) * 15;
            return `<text x="${785 + offset}" y="320" text-anchor="middle" font-size="30">${icon}</text>`;
        }).join('')
        : '';
    const pipeWastes = document.getElementById('pipe-wastes');
    pipeWastes.style.display = animationState.wasteInPipe && animationState.wasteVisible ? 'block' : 'none';
    const pipeWasteCircle = document.getElementById('pipe-waste-circle');
    pipeWasteCircle.setAttribute('cx', animationState.wasteX);
    pipeWasteCircle.setAttribute('cy', animationState.wasteY);
    pipeWasteCircle.setAttribute('r', 20 * animationState.wasteIcons.length);
    const pipeWasteIcons = document.getElementById('pipe-waste-icons');
    pipeWasteIcons.innerHTML = animationState.wasteInPipe && animationState.wasteVisible
        ? animationState.wasteIcons.map((icon, index) => {
            const offset = index * 20 - (animationState.wasteIcons.length - 1) * 10;
            return `<text x="${animationState.wasteX + offset}" y="${animationState.wasteY + 8}" text-anchor="middle" font-size="20">${icon}</text>`;
        }).join('')
        : '';
    const compressor = document.getElementById('compressor');
    compressor.setAttribute('transform', `translate(${180 + animationState.compressorPosition * 140}, 0)`);
    const compressorParts = document.getElementsByClassName('compressor-part');
    for (let part of compressorParts) {
        part.setAttribute('y', animationState.compressorActive ? part.getAttribute('y') - 10 : part.getAttribute('y'));
    }
    const pipes = document.getElementById('pipes');
    pipes.innerHTML = wasteTypes.map((waste, index) => `
        <g>
            <path
                d="M ${680 + index * 80} 390 Q ${680 + index * 80} 430 ${220 + index * 150} 480"
                fill="none"
                stroke="${waste.color}"
                stroke-width="20"
                opacity="${animationState.activePipeIndex === index ? '1' : '0.6'}"
                class="${animationState.activePipeIndex === index ? 'animate-pulse' : ''}"
            />
            <path
                d="M ${685 + index * 80} 390 Q ${685 + index * 80} 430 ${225 + index * 150} 480"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                stroke-width="8"
            />
            <polygon
                points="${675 + index * 80},400 ${685 + index * 80},400 ${680 + index * 80},415"
                fill="${waste.color}"
            />
            <text
                x="${680 + index * 80}"
                y="440"
                text-anchor="middle"
                font-size="12"
                fill="${waste.color}"
                font-weight="bold"
            >${waste.name}</text>
        </g>
    `).join('');
};

const updateCurrentWaste = () => {
    const badge = document.getElementById('current-waste-badge');
    badge.style.display = currentWaste ? 'inline-flex' : 'none';
    badge.textContent = currentWaste ? `Memproses: ${currentWaste.name}` : '';
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
