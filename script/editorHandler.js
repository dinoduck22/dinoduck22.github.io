export class EditorHandler {
    constructor(onContentChange, onUpdateFloatingPos) {
        this.onContentChange = onContentChange;           
        this.onUpdateFloatingPos = onUpdateFloatingPos;   
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('paste', (e) => {
            const target = e.target.closest('[contenteditable="true"]');
            if (target) {
                e.preventDefault();
                const text = e.clipboardData.getData('text/plain');
                document.execCommand('insertText', false, text);
            }
        });

        document.addEventListener('keydown', (e) => {
            const target = e.target;
            if (!target.isContentEditable) return;

            // '# ' 또는 '#' 후 Enter 시 report-h3 서식으로 변경
            if (e.key === ' ' || e.key === 'Enter') {
                const textContent = target.textContent.trim();
                if (textContent === '#') {
                    e.preventDefault();
                    target.textContent = '';
                    target.className = 'report-h3 text-slate-900';
                    if (this.onUpdateFloatingPos) this.onUpdateFloatingPos();
                    return;
                }
            }

            // Backspace 시 report-h3 -> report-body 복원
            if (e.key === 'Backspace' && target.classList.contains('report-h3')) {
                if (target.textContent.trim() === '') {
                    target.className = 'report-body text-slate-700';
                    if (this.onUpdateFloatingPos) this.onUpdateFloatingPos();
                }
            }

            // Enter 키 입력 시 단락 삽입
            if (e.key === 'Enter' && !e.shiftKey) {
                if (target.classList.contains('report-body') || target.classList.contains('report-h3')) {
                    e.preventDefault();
                    
                    const newParagraph = document.createElement('p');
                    newParagraph.className = 'report-body text-slate-700';
                    newParagraph.contentEditable = 'true';
                    newParagraph.innerHTML = '<br>';

                    if (target.nextSibling) {
                        target.parentNode.insertBefore(newParagraph, target.nextSibling);
                    } else {
                        target.parentNode.appendChild(newParagraph);
                    }

                    const range = document.createRange();
                    const sel = window.getSelection();
                    range.setStart(newParagraph, 0);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);

                    if (this.onContentChange) this.onContentChange();
                }
            }
        });

        document.addEventListener('input', () => {
            if (this.onContentChange) this.onContentChange();
        });
    }
}