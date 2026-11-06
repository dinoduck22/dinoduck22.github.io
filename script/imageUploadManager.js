export class ImageUploadManager {
    /**
     * @param {() => HTMLElement|null} getSelectedElement 현재 선택된 단락을 반환
     * @param {() => void} onImageInserted 이미지 삽입 후 호출 (페이지 재정렬용)
     */
    constructor(getSelectedElement, onImageInserted) {
        this.btnImage = document.getElementById('floating-image-btn');
        this.getSelectedElement = getSelectedElement;
        this.onImageInserted = onImageInserted;

        this.MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        this.MAX_WIDTH = 1200;                 // 저장 용량 절감을 위한 최대 가로 해상도
        this.targetParagraph = null;

        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = 'image/*';
        this.fileInput.className = 'hidden';
        document.body.appendChild(this.fileInput);
    }

    init() {
        if (!this.btnImage) return;

        // mousedown + preventDefault: 단락 포커스를 유지한 채 파일 선택창 열기
        this.btnImage.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const selected = this.getSelectedElement();
            if (!selected) return;
            this.targetParagraph = selected;
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', () => {
            const file = this.fileInput.files[0];
            this.fileInput.value = ''; // 같은 파일 재선택 가능하도록 초기화
            if (file) this.handleFile(file);
        });
    }

    async handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드할 수 있습니다.');
            return;
        }
        if (file.size > this.MAX_FILE_SIZE) {
            alert('10MB 이하의 이미지만 업로드할 수 있습니다.');
            return;
        }

        const target = this.targetParagraph;
        if (!target || !document.body.contains(target)) return;

        try {
            const dataUrl = await this.readAndResize(file);
            this.insertImage(target, dataUrl);
        } catch (err) {
            console.error(err);
            alert('이미지를 불러오지 못했습니다.');
        }
    }

    // 파일 → (필요 시 축소된) base64 DataURL. 저장본 HTML에 그대로 포함됨
    readAndResize(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = () => {
                const img = new Image();
                img.onerror = reject;
                img.onload = () => {
                    const ratio = Math.min(1, this.MAX_WIDTH / img.naturalWidth);
                    const w = Math.round(img.naturalWidth * ratio);
                    const h = Math.round(img.naturalHeight * ratio);

                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');

                    const keepAlpha = /png|gif|webp|svg/.test(file.type);
                    if (!keepAlpha) {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, w, h);
                    }
                    ctx.drawImage(img, 0, 0, w, h);

                    resolve(keepAlpha
                        ? canvas.toDataURL('image/png')
                        : canvas.toDataURL('image/jpeg', 0.85));
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
    }

    insertImage(paragraph, src) {
        // 빈 단락의 <br> 자리표시자 제거
        if (paragraph.innerHTML.trim() === '<br>') paragraph.innerHTML = '';

        const img = document.createElement('img');
        img.alt = '';
        img.draggable = false;
        img.contentEditable = 'false';

        // 이미지 높이가 확정된 뒤에 페이지 재정렬
        img.onload = () => {
            if (typeof this.onImageInserted === 'function') this.onImageInserted();
        };
        img.src = src;

        paragraph.appendChild(img);
    }
}