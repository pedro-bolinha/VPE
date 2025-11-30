// Sistema de Upload de Imagens - VPE

class ImageUploader {
  constructor(options = {}) {
    this.type = options.type || 'empresa'; // 'empresa' ou 'avatar'
    this.inputId = options.inputId;
    this.previewId = options.previewId;
    this.buttonId = options.buttonId;
    this.maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB
    this.allowedTypes = options.allowedTypes || ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    this.onSuccess = options.onSuccess || (() => {});
    this.onError = options.onError || (() => {});
    
    this.init();
  }
  
  init() {
    this.input = document.getElementById(this.inputId);
    this.preview = document.getElementById(this.previewId);
    this.button = document.getElementById(this.buttonId);
    
    if (!this.input || !this.preview || !this.button) {
      console.error('ImageUploader: Elementos não encontrados');
      return;
    }
    
    // Event listeners
    this.button.addEventListener('click', () => this.input.click());
    this.input.addEventListener('change', (e) => this.handleFileSelect(e));
    
    // Drag and drop
    this.setupDragAndDrop();
  }
  
  setupDragAndDrop() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      this.preview.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
      this.preview.addEventListener(eventName, () => {
        this.preview.classList.add('drag-over');
      });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      this.preview.addEventListener(eventName, () => {
        this.preview.classList.remove('drag-over');
      });
    });
    
    this.preview.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.input.files = files;
        this.handleFileSelect({ target: { files } });
      }
    });
  }
  
  handleFileSelect(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validar tipo
    if (!this.allowedTypes.includes(file.type)) {
      this.showError('Apenas imagens são permitidas (JPEG, PNG, GIF, WebP)');
      this.input.value = '';
      return;
    }
    
    // Validar tamanho
    if (file.size > this.maxSize) {
      this.showError(`Arquivo muito grande. Tamanho máximo: ${this.formatFileSize(this.maxSize)}`);
      this.input.value = '';
      return;
    }
    
    // Preview da imagem
    this.showPreview(file);
  }
  
  showPreview(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = this.preview.querySelector('img');
      if (img) {
        img.src = e.target.result;
        img.style.display = 'block';
      }
      
      // Mostrar nome e tamanho do arquivo
      this.showFileInfo(file);
    };
    
    reader.readAsDataURL(file);
  }
  
  showFileInfo(file) {
    const infoDiv = this.preview.querySelector('.file-info') || this.createFileInfo();
    infoDiv.innerHTML = `
      <span class="file-name">📄 ${file.name}</span>
      <span class="file-size">${this.formatFileSize(file.size)}</span>
    `;
  }
  
  createFileInfo() {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'file-info';
    this.preview.appendChild(infoDiv);
    return infoDiv;
  }
  
  async upload() {
    const file = this.input.files[0];
    
    if (!file) {
      this.showError('Nenhum arquivo selecionado');
      return null;
    }
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('uploadType', this.type);
    
    try {
      this.showLoading();
      
      const endpoint = this.type === 'avatar' 
        ? '/api/upload/avatar' 
        : '/api/upload/empresa';
      
      const response = await auth.authenticatedFetch(endpoint, {
        method: 'POST',
        body: formData,
        // Remover Content-Type para o navegador definir automaticamente com boundary
        headers: {
          'Authorization': `Bearer ${auth.getToken()}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        this.showSuccess('Upload realizado com sucesso!');
        this.onSuccess(data.file);
        return data.file;
      } else {
        throw new Error(data.message || 'Erro no upload');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      this.showError(error.message);
      this.onError(error);
      return null;
    } finally {
      this.hideLoading();
    }
  }
  
  showLoading() {
    this.button.disabled = true;
    this.button.innerHTML = '<span class="spinner"></span> Enviando...';
  }
  
  hideLoading() {
    this.button.disabled = false;
    this.button.innerHTML = this.type === 'avatar' 
      ? '📤 Escolher Foto' 
      : '📤 Escolher Logo';
  }
  
  showError(message) {
    this.showMessage(message, 'error');
  }
  
  showSuccess(message) {
    this.showMessage(message, 'success');
  }
  
  showMessage(message, type = 'info') {
    // Remover mensagem anterior
    const existingMessage = document.querySelector('.upload-message');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `upload-message upload-message-${type}`;
    messageDiv.textContent = message;
    
    this.preview.parentNode.insertBefore(messageDiv, this.preview.nextSibling);
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
      if (messageDiv.parentElement) {
        messageDiv.style.opacity = '0';
        setTimeout(() => messageDiv.remove(), 300);
      }
    }, 5000);
  }
  
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
  
  reset() {
    this.input.value = '';
    const img = this.preview.querySelector('img');
    if (img) {
      img.src = '';
      img.style.display = 'none';
    }
    const fileInfo = this.preview.querySelector('.file-info');
    if (fileInfo) {
      fileInfo.remove();
    }
  }
}

// Adicionar estilos CSS
const uploadStyles = document.createElement('style');
uploadStyles.textContent = `
  .image-preview {
    position: relative;
    width: 100%;
    min-height: 200px;
    border: 2px dashed #555;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: #2c2c2c;
    transition: all 0.3s ease;
    cursor: pointer;
  }
  
  .image-preview.drag-over {
    border-color: #27ae60;
    background: rgba(39, 174, 96, 0.1);
    transform: scale(1.02);
  }
  
  .image-preview img {
    max-width: 100%;
    max-height: 300px;
    border-radius: 8px;
    object-fit: contain;
    display: none;
  }
  
  .image-preview .file-info {
    margin-top: 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    color: #ccc;
    font-size: 14px;
  }
  
  .image-preview .file-name {
    font-weight: 600;
  }
  
  .image-preview .file-size {
    color: #999;
    font-size: 13px;
  }
  
  .upload-message {
    padding: 12px 20px;
    border-radius: 8px;
    margin: 15px 0;
    font-size: 14px;
    font-weight: 500;
    transition: opacity 0.3s ease;
    text-align: center;
  }
  
  .upload-message-success {
    background: rgba(39, 174, 96, 0.15);
    color: #27ae60;
    border: 1px solid #27ae60;
  }
  
  .upload-message-error {
    background: rgba(231, 76, 60, 0.15);
    color: #e74c3c;
    border: 1px solid #e74c3c;
  }
  
  .upload-message-info {
    background: rgba(52, 152, 219, 0.15);
    color: #3498db;
    border: 1px solid #3498db;
  }
  
  .spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top: 2px solid white;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(uploadStyles);

console.log('📤 Sistema de upload de imagens carregado');

// Exportar para uso global
window.ImageUploader = ImageUploader;