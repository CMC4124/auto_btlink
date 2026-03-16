/**
 * 藍牙通訊模組
 * 使用 Web Bluetooth API 進行藍牙連接和數據傳輸
 */

class BluetoothManager {
    constructor() {
        this.device = null;
        this.server = null;
        this.chatService = null;
        this.txCharacteristic = null;
        this.rxCharacteristic = null;
        
        // UUID 配置
        this.SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'; // Nordic UART Service
        this.TX_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // TX Characteristic (Write)
        this.RX_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // RX Characteristic (Notify)
        
        // 事件回調
        this.onConnected = null;
        this.onDisconnected = null;
        this.onDataReceived = null;
        this.onError = null;
    }

    /**
     * 檢查藍牙支援
     */
    isSupported() {
        return 'bluetooth' in navigator;
    }

    /**
     * 掃描並連接設備
     */
    async scanAndConnect() {
        if (!this.isSupported()) {
            throw new Error('您的瀏覽器不支持藍牙功能。請使用 Chrome 或 Edge 瀏覽器。');
        }

        try {
            this.device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [this.SERVICE_UUID]
            });

            console.log('設備已選擇:', this.device.name);

            // 監聽斷開連接
            this.device.addEventListener('gattserverdisconnected', () => {
                console.log('藍牙設備已斷開');
                if (this.onDisconnected) {
                    this.onDisconnected();
                }
            });

            // 連接到 GATT Server
            this.server = await this.device.gatt.connect();
            console.log('已連接到 GATT Server');

            // 獲取服務
            this.chatService = await this.server.getPrimaryService(this.SERVICE_UUID);

            // 獲取特徵
            this.txCharacteristic = await this.chatService.getCharacteristic(this.TX_UUID);
            this.rxCharacteristic = await this.chatService.getCharacteristic(this.RX_UUID);

            // 啟用通知
            await this.rxCharacteristic.startNotifications();
            this.rxCharacteristic.addEventListener('characteristicvaluechanged', 
                this.handleDataReceived.bind(this)
            );

            console.log('藍牙連接成功！');
            
            if (this.onConnected) {
                this.onConnected(this.device.name || '未知設備');
            }

            return true;

        } catch (error) {
            console.error('藍牙連接錯誤:', error);
            
            if (error.name === 'NotFoundError') {
                throw new Error('未選擇設備或設備不支持');
            } else if (error.name === 'SecurityError') {
                throw new Error('藍牙權限被拒絕');
            } else if (error.name === 'NetworkError') {
                throw new Error('藍牙連接失敗，請確保設備在範圍內');
            }
            
            throw error;
        }
    }

    /**
     * 處理接收到的數據
     */
    handleDataReceived(event) {
        const value = event.target.value;
        const decoder = new TextDecoder('utf-8');
        let data = '';

        // 處理 ArrayBuffer
        if (value instanceof ArrayBuffer) {
            data = decoder.decode(value);
        } else if (value.buffer) {
            data = decoder.decode(value.buffer);
        }

        console.log('接收到數據:', data);

        if (this.onDataReceived) {
            try {
                const message = JSON.parse(data);
                this.onDataReceived(message);
            } catch (e) {
                // 如果不是 JSON，可能是普通文本
                this.onDataReceived({
                    type: 'text',
                    content: data,
                    timestamp: Date.now()
                });
            }
        }
    }

    /**
     * 發送數據
     */
    async send(data) {
        if (!this.txCharacteristic) {
            throw new Error('藍牙未連接');
        }

        try {
            const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
            const encoder = new TextEncoder();
            const encodedData = encoder.encode(jsonString);

            await this.txCharacteristic.writeValue(encodedData);
            console.log('數據已發送:', jsonString);
            return true;

        } catch (error) {
            console.error('發送數據錯誤:', error);
            throw error;
        }
    }

    /**
     * 發送文本消息
     */
    async sendText(text) {
        return this.send({
            type: 'text',
            content: text,
            timestamp: Date.now()
        });
    }

    /**
     * 發送圖片（轉換為 Base64）
     */
    async sendImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const base64 = reader.result;
                    // 分塊發送大文件
                    const chunkSize = 512;
                    const chunks = [];
                    
                    for (let i = 0; i < base64.length; i += chunkSize) {
                        chunks.push(base64.slice(i, i + chunkSize));
                    }

                    // 發送文件頭
                    await this.send({
                        type: 'file_start',
                        fileType: 'image',
                        fileName: file.name,
                        mimeType: file.type,
                        totalChunks: chunks.length,
                        timestamp: Date.now()
                    });

                    // 分塊發送數據
                    for (let i = 0; i < chunks.length; i++) {
                        await this.send({
                            type: 'file_chunk',
                            chunkIndex: i,
                            data: chunks[i],
                            timestamp: Date.now()
                        });
                    }

                    // 發送文件結束標記
                    await this.send({
                        type: 'file_end',
                        fileType: 'image',
                        timestamp: Date.now()
                    });

                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('讀取文件失敗'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * 發送影片
     */
    async sendVideo(file) {
        // 影片文件通常較大，這裡使用類似的分塊邏輯
        return this.sendImage(file); // 復用圖片邏輯
    }

    /**
     * 斷開連接
     */
    async disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
        }
        
        this.device = null;
        this.server = null;
        this.chatService = null;
        this.txCharacteristic = null;
        this.rxCharacteristic = null;
    }

    /**
     * 檢查是否已連接
     */
    isConnected() {
        return this.device && this.device.gatt.connected;
    }
}

// 導出模組
window.BluetoothManager = BluetoothManager;
