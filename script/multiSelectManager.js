export class MultiSelectManager {
    /**
     * @param {() => void} onParagraphsDeleted 일괄 삭제 후 호출 (페이지 재정렬용)
     */
    constructor(onParagraphsDeleted) {
        this.onParagraphsDeleted = onParagraphsDeleted;
        this.floatingActionBar = document.getElementById('floating-action-bar');

        this.PARAGRAPH_SELECTOR = '#viewer-container .editor-content .report-body, #viewer-container .editor-content .report-h3';
        this.DRAG_THRESHOLD = 4;

        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.selected = new Set();

        this.marquee = document.createElement('div');
        this.marquee.className = 'selection-marquee no-print';
        this.marquee.style.display = 'none';
        document.body.appendChild(this.marquee);
    }

    init() {
        document.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mouseup', () => this.onMouseUp());
        // 캡처 단계: 다른 keydown 핸들러보다 먼저 처리
        document.addEventListener('keydown', (e) => this.onKeyDown(e), true);
    }

    onMouseDown(e) {
        if (e.button !== 0) return;

        // 툴바/플로팅 바 클릭은 무시 (선택 유지)
        if (e.target.closest('#floating-action-bar, header.no-print, #zoom-badge')) return;

        // 어떤 클릭이든 기존 선택은 해제
        this.clearSelection();

        // 편집 가능한 요소(단락, 제목, 날짜) 안에서 시작하면 일반 편집 동작
        if (e.target.closest('[contenteditable="true"]')) return;

        // 단락 바깥에서 드래그 시작
        e.preventDefault(); // 브라우저 기본 텍스트 선택 방지
        if (document.activeElement && document.activeElement.isContentEditable) {
            document.activeElement.blur();
        }
        this.isDragging = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
    }

    onMouseMove(e) {
        if (!this.isDragging) return;

        const dx = e.clientX - this.startX;
        const dy = e.clientY - this.startY;
        if (Math.abs(dx) < this.DRAG_THRESHOLD && Math.abs(dy) < this.DRAG_THRESHOLD) return;

        const box = {
            left: Math.min(this.startX, e.clientX),
            top: Math.min(this.startY, e.clientY),
            right: Math.max(this.startX, e.clientX),
            bottom: Math.max(this.startY, e.clientY)
        };

        Object.assign(this.marquee.style, {
            display: 'block',
            left: `${box.left}px`,
            top: `${box.top}px`,
            width: `${box.right - box.left}px`,
            height: `${box.bottom - box.top}px`
        });

        this.updateSelection(box);
    }

    onMouseUp() {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.marquee.style.display = 'none';
    }

    // 드래그 영역과 겹치는 단락만 선택 상태로 표시
    updateSelection(box) {
        document.querySelectorAll(this.PARAGRAPH_SELECTOR).forEach((p) => {
            const r = p.getBoundingClientRect();
            const hit = r.left < box.right && r.right > box.left &&
                        r.top < box.bottom && r.bottom > box.top;

            p.classList.toggle('multi-selected', hit);
            if (hit) this.selected.add(p);
            else this.selected.delete(p);
        });

        // 선택이 생기면 플로팅 바는 숨김
        if (this.selected.size > 0 && this.floatingActionBar) {
            this.floatingActionBar.classList.add('hidden');
        }
    }

    clearSelection() {
        this.selected.forEach((p) => p.classList.remove('multi-selected'));
        this.selected.clear();
    }

    onKeyDown(e) {
        if (this.selected.size === 0) return;

        if (e.key === 'Escape') {
            this.clearSelection();
            return;
        }

        if (e.key !== 'Backspace' && e.key !== 'Delete') return;

        e.preventDefault();
        e.stopPropagation();
        this.deleteSelected();
    }

    deleteSelected() {
        const total = document.querySelectorAll(this.PARAGRAPH_SELECTOR).length;
        const targets = [...this.selected].filter((p) => document.body.contains(p));

        // 문서에 단락이 최소 1개는 남도록 보호
        if (targets.length >= total) {
            alert('모든 단락을 삭제할 수는 없습니다.\n마지막 1개 단락은 남겨둡니다.');
            targets.shift();
        }

        targets.forEach((p) => p.remove());
        this.clearSelection();

        if (typeof this.onParagraphsDeleted === 'function') {
            this.onParagraphsDeleted();
        }
    }
}