/**
 * Auto BT Link - 主應用程序
 * 藍牙聊天應用
 */

class App {
    constructor() {
        // 初始化管理器
        this.bluetooth = new BluetoothManager();
        this.chat = new ChatManager();
        
        // 設置事件監聽
        this.setupEventListeners();
        this.setupBluetoothCallbacks();
        
        // 檢查藍牙支援
        this.checkBluetoothSupport();
    }

    /**
     * 檢查藍牙支援
     */
    checkBluetoothSupport() {
        if (!this.bluetooth.isSupported()) {
            this.chat.showSystemMessage('⚠️ 您的瀏覽器不支持藍牙功能。請使用 Chrome 或 Edge 瀏覽器。');
            document.getElementById('scanBtn').disabled = true;
        }
    }

    /**
     * 設置 DOM 事件監聽
     */
    setupEventListeners() {
        // 掃描按鈕
        document.getElementById('scanBtn').addEventListener('click', () => this.startScan());
        
        // 斷開連接按鈕
        document.getElementById('disconnectBtn').addEventListener('click', () => this.disconnect());
        
        // 發送按鈕
        document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());
        
        // 輸入框 Enter 鍵
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        
        // 圖片按鈕
        document.getElementById('imageBtn').addEventListener('click', () => {
            document.getElementById('imageInput').click();
        });
        
        // 影片按鈕
        document.getElementById('videoBtn').addEventListener('click', () => {
            document.getElementById('videoInput').click();
        });
        
        // 文件按鈕
        document.getElementById('fileBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        
        // 文件輸入變更
        document.getElementById('imageInput').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0], 'image');
        });
        
        document.getElementById('videoInput').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0], 'video');
        });
        
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0], 'file');
        });
        
        // 取消掃描
        document.getElementById('cancelScan').addEventListener('click', () => {
            this.hideModal('pairingModal');
        });
        
        // 關閉預覽
        document.getElementById('closePreview').addEventListener('click', () => {
            this.hideModal('previewModal');
        });
        
        // 點擊背景關閉預覽
        document.getElementById('previewModal').addEventListener('click', (e) => {
            if (e.target.id === 'previewModal') {
                this.hideModal('previewModal');
            }
        });
    }

    /**
     * 設置藍牙回調
     */
    setupBluetoothCallbacks() {
        this.bluetooth.onConnected = (deviceName) => {
            this.onConnected(deviceName);
        };
        
        this.bluetooth.onDisconnected = () => {
            this.onDisconnected();
        };
        
        this.bluetooth.onDataReceived = (data) => {
            this.chat.handleReceivedMessage(data);
        };
        
        this.bluetooth.onError = (error) => {
            this.chat.showSystemMessage('❌ 錯誤: ' + error.message);
            this.enableInput(false);
        };
    }

    /**
     * 開始掃描設備
     */
    async function startScan() {
        try {
            document.getElementById('scanBtn').disabled = true;
            this.chat.showSystemMessage('🔍 正在掃描藍牙設備...');
            
            await this.bluetooth.scanAndConnect();
            
        } catch (error) {
            console.error('掃描錯誤:', error);
            this.chat.showSystemMessage('❌ ' + error.message);
            document.getElementById('scanBtn').disabled = false;
        }
    }

    /**
     * 連接成功
     */
    onConnected(deviceName) {
        // 更新 UI
        document.getElementById('deviceInfo').style.display = 'flex';
        document.getElementById('deviceName').textContent = deviceName;
        document.getElementById('scanBtn').style.display = 'none';
        
        // 更新連接狀態
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        statusDot.className = 'status-dot connected';
        statusText.textContent = '已連接';
        
        // 啟用輸入
        this.enableInput(true);
        
        this.chat.showSystemMessage('✅ 已連接到 ' + deviceName);
    }

    /**
     * 斷開連接
     */
    async function disconnect() {
        try {
            await this.bluetooth.disconnect();
            this.onDisconnected();
        } catch (error) {
            console.error('斷開連接錯誤:', error);
        }
    }

    /**
     * 斷開連接後的處理
     */
    onDisconnected() {
        // 更新 UI
        document.getElementById('deviceInfo').style.display = 'none';
        document.getElementById('scanBtn').style.display = 'block';
        document.getElementById('scanBtn').disabled = false;
        
        // 更新連接狀態
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        statusDot.className = 'status-dot disconnected';
        statusText.textContent = '未連接';
        
        // 禁用輸入
        this.enableInput(false);
        
        this.chat.showSystemMessage('🔌 連接已斷開');
    }

    /**
     * 啟用/禁用輸入
     */
    enableInput(enabled) {
        document.getElementById('messageInput').disabled = !enabled;
        document.getElementById('sendBtn').disabled = !enabled;
        document.getElementById('imageBtn').disabled = !enabled;
        document.getElementById('videoBtn').disabled = !enabled;
        document.getElementById('fileBtn').disabled = !enabled;
    }

    /**
     * 發送消息
     */
    async function sendMessage() {
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        
        if (!text) return;
        
        try {
            // 顯示自己發送的消息
            this.chat.addMessage('text', text, true, { timestamp: Date.now() });
            
            // 通過藍牙發送
            await this.bluetooth.sendText(text);
            
            // 清空輸入框
            input.value = '';
            
        } catch (error) {
            console.error('發送消息錯誤:', error);
            this.chat.showSystemMessage('❌ 發送失敗: ' + error.message);
        }
    }

    /**
     * 處理文件選擇
     */
    async function handleFileSelect(file, type) {
        if (!file) return;
        
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            this.chat.showSystemMessage('⚠️ 文件太大，最大支持 50MB');
            return;
        }
        
        try {
            this.chat.showSystemMessage(`📤 正在發送 ${file.name}...`);
            
            // 顯示本地預覽
            const reader = new FileReader();
            reader.onload = () => {
                if (type === 'image') {
                    this.chat.addMessage('image', reader.result, true, { timestamp: Date.now() });
                } else if (type === 'video') {
                    this.chat.addMessage('video', reader.result, true, { timestamp: Date.now() });
                }
            };
            reader.readAsDataURL(file);
            
            // 通過藍牙發送
            if (type === 'image') {
                await this.bluetooth.sendImage(file);
            } else if (type === 'video') {
                await this.bluetooth.sendVideo(file);
            }
            
            this.chat.showSystemMessage('✅ 文件發送完成');
            
        } catch (error) {
            console.error('發送文件錯誤:', error);
            this.chat.showSystemMessage('❌ 發送失敗: ' + error.message);
        }
        
        // 清空輸入
        document.getElementById('imageInput').value = '';
        document.getElementById('videoInput').value = '';
        document.getElementById('fileInput').value = '';
    }

    /**
     * 預覽媒體
     */
    previewMedia(src, type) {
        const modal = document.getElementById('previewModal');
        const img = document.getElementById('previewImage');
        const video = document.getElementById('previewVideo');
        
        if (type === 'image') {
            img.src = src;
            img.style.display = 'block';
            video.style.display = 'none';
        } else if (type === 'video') {
            video.src = src;
            video.style.display = 'block';
            img.style.display = 'none';
        }
        
        modal.classList.add('active');
    }

    /**
     * 顯示 Modal
     */
    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    /**
     * 隱藏 Modal
     */
    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        
        // 如果關閉預覽，停止影片播放
        if (modalId === 'previewModal') {
            document.getElementById('previewVideo').pause();
        }
    }
}

// 初始化應用
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
    window.app = app; // 讓全局可以訪問
});
