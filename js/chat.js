/**
 * 聊天功能模組
 * 處理消息的顯示和管理
 */

class ChatManager {
    constructor() {
        this.messages = [];
        this.fileChunks = new Map(); // 存儲接收到的文件分塊
        
        // DOM 元素
        this.messagesContainer = document.getElementById('messages');
    }

    /**
     * 添加消息到界面
     */
    addMessage(type, content, isSent = true, metadata = {}) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;

        const time = new Date(metadata.timestamp || Date.now());
        const timeStr = time.toLocaleTimeString('zh-TW', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        let contentHtml = '';

        switch (type) {
            case 'text':
                contentHtml = `<div class="message-content">${this.escapeHtml(content)}</div>`;
                break;
                
            case 'image':
                contentHtml = `
                    <div class="message-content message-image" onclick="app.previewMedia('${content}', 'image')">
                        <img src="${content}" alt="圖片">
                    </div>
                `;
                break;
                
            case 'video':
                contentHtml = `
                    <div class="message-content message-video" onclick="app.previewMedia('${content}', 'video')">
                        <video src="${content}"></video>
                        <div class="video-play-icon">▶</div>
                    </div>
                `;
                break;
                
            case 'system':
                messageDiv.className = 'message system';
                contentHtml = `<div class="message-content">${this.escapeHtml(content)}</div>`;
                break;
                
            default:
                contentHtml = `<div class="message-content">${this.escapeHtml(content)}</div>`;
        }

        messageDiv.innerHTML = `
            ${contentHtml}
            <div class="message-time">${timeStr}</div>
        `;

        this.messagesContainer.appendChild(messageDiv);
        
        // 滾動到底部
        this.scrollToBottom();
        
        return messageDiv;
    }

    /**
     * 處理接收到的消息
     */
    handleReceivedMessage(data) {
        switch (data.type) {
            case 'text':
                this.addMessage('text', data.content, false, data);
                break;
                
            case 'file_start':
                // 開始接收文件
                this.fileChunks.set('current', {
                    type: data.fileType,
                    name: data.fileName,
                    mimeType: data.mimeType,
                    totalChunks: data.totalChunks,
                    chunks: [],
                    timestamp: data.timestamp
                });
                this.addMessage('system', `正在接收文件: ${data.fileName}...`, false);
                break;
                
            case 'file_chunk':
                const currentFile = this.fileChunks.get('current');
                if (currentFile) {
                    currentFile.chunks[data.chunkIndex] = data.data;
                }
                break;
                
            case 'file_end':
                this.finishReceivingFile();
                break;
                
            default:
                console.log('未知消息類型:', data.type);
        }
    }

    /**
     * 完成接收文件
     */
    finishReceivingFile() {
        const currentFile = this.fileChunks.get('current');
        if (!currentFile) return;

        try {
            // 組裝分塊數據
            const data = currentFile.chunks.join('');
            
            if (currentFile.type === 'image') {
                this.addMessage('image', data, false, currentFile);
            } else if (currentFile.type === 'video') {
                this.addMessage('video', data, false, currentFile);
            }
            
            this.addMessage('system', '文件接收完成', false);
        } catch (error) {
            console.error('組裝文件錯誤:', error);
            this.addMessage('system', '文件接收失敗', false);
        }

        this.fileChunks.delete('current');
    }

    /**
     * 顯示系統消息
     */
    showSystemMessage(text) {
        this.addMessage('system', text, false);
    }

    /**
     * 滾動到底部
     */
    scrollToBottom() {
        const container = document.getElementById('chatContainer');
        container.scrollTop = container.scrollHeight;
    }

    /**
     * HTML 轉義
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 清除所有消息
     */
    clearMessages() {
        this.messagesContainer.innerHTML = '';
    }
}

// 導出模組
window.ChatManager = ChatManager;
