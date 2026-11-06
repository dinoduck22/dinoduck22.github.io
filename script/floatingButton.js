export class FloatingButtonManager {
    constructor(onParagraphAdded, onParagraphDeleted) {
        this.floatingActionBar = document.getElementById('floating-action-bar');
        this.floatingAddBtn = document.getElementById('floating-add-btn');
        this.floatingDeleteBtn = document.getElementById('floating-delete-btn');
        this.selectedElement = null;
        this.onParagraphAdded = onParagraphAdded;
        this.onParagraphDeleted = onParagraphDeleted;
    }

    init() {
        if (!this.floatingActionBar) return;
        this.bindEvents();
    }

    updatePosition() {
        if (!this.selectedElement || !document.body.contains(this.selectedElement)) {
            this.floatingActionBar.classList.add('hidden');
            return;
        }

        const rect = this.selectedElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        this.floatingActionBar.style.top = `${rect.top + scrollTop - 8}px`;
        this.floatingActionBar.style.left = `${rect.left + scrollLeft + (rect.width / 2)}px`;
        this.floatingActionBar.classList.remove('hidden');
    }

    bindEvents() {
        document.addEventListener('focusin', (e) => {
            const editable = e.target.closest('[contenteditable="true"]');
            if (editable && (editable.classList.contains('report-body') || editable.classList.contains('report-h3'))) {
                this.selectedElement = editable;
                this.updatePosition();
            } else {
                this.selectedElement = null;
                this.floatingActionBar.classList.add('hidden');
            }
        });

        window.addEventListener('resize', () => this.updatePosition());
        window.addEventListener('scroll', () => this.updatePosition());

        // 단락/플로팅 바 바깥을 클릭하면 플로팅 바 숨김
        document.addEventListener('mousedown', (e) => {
            const insideBar = e.target.closest('#floating-action-bar');
            const insideParagraph = e.target.closest('.report-body, .report-h3');
            if (insideBar || insideParagraph) return;

            this.selectedElement = null;
            this.floatingActionBar.classList.add('hidden');

            if (document.activeElement && document.activeElement.isContentEditable) {
                document.activeElement.blur();
            }
        });

        // 단락 추가 버튼 (mousedown 적용으로 포커스 유지 및 동작 보장)
        this.floatingAddBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            if (!this.selectedElement) return;

            const newParagraph = document.createElement('p');
            newParagraph.className = 'report-body text-slate-700';
            newParagraph.contentEditable = 'true';
            newParagraph.textContent = '새로운 단락을 입력하세요.';

            // 선택된 단락의 바로 다음 순서에 단락 삽입
            if (this.selectedElement.nextSibling) {
                this.selectedElement.parentNode.insertBefore(newParagraph, this.selectedElement.nextSibling);
            } else {
                this.selectedElement.parentNode.appendChild(newParagraph);
            }

            newParagraph.focus();
            this.selectedElement = newParagraph;

            // 추가 후 높이 초과 여부에 따라 우측 단 / 새 페이지로 자동 정렬
            if (typeof this.onParagraphAdded === 'function') {
                this.onParagraphAdded();
            }
            this.updatePosition();
        });

        // 단락 삭제 버튼
        this.floatingDeleteBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            if (!this.selectedElement) return;

            const totalParagraphs = document.querySelectorAll('#viewer-container .report-body, #viewer-container .report-h3').length;
            if (totalParagraphs <= 1) {
                alert('마지막 단락은 삭제할 수 없습니다.');
                return;
            }

            const nextTarget = this.selectedElement.nextElementSibling || this.selectedElement.previousElementSibling;
            this.selectedElement.remove();
            this.floatingActionBar.classList.add('hidden');

            if (nextTarget) {
                nextTarget.focus();
                this.selectedElement = nextTarget;
            }

            if (typeof this.onParagraphDeleted === 'function') {
                this.onParagraphDeleted();
            }
        });
    }
}