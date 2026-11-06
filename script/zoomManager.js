export class ZoomManager {
    constructor() {
        this.currentScale = 1.20;
        this.MIN_SCALE = 0.3;
        this.MAX_SCALE = 2.5;
        this.STEP = 0.05;
        this.hideTimer = null;

        this.viewerContainer = document.getElementById('viewer-container');
        this.zoomBadge = document.getElementById('zoom-badge');
        this.zoomPercentageEl = document.getElementById('zoom-percentage');
        this.btnZoomIn = document.getElementById('btn-zoom-in');
        this.btnZoomOut = document.getElementById('btn-zoom-out');
        this.btnZoomReset = document.getElementById('btn-zoom-reset');

        this.onScaleChangeCallbacks = [];
    }

    init() {
        this.bindEvents();
        this.applyScale(this.currentScale);
    }

    onScaleChange(callback) {
        this.onScaleChangeCallbacks.push(callback);
    }

    showZoomBadge() {
        if (!this.zoomBadge) return;
        this.zoomBadge.classList.remove('opacity-0');
        this.zoomBadge.classList.add('opacity-100');

        if (this.hideTimer) clearTimeout(this.hideTimer);

        this.hideTimer = setTimeout(() => {
            this.zoomBadge.classList.remove('opacity-100');
            this.zoomBadge.classList.add('opacity-0');
        }, 1500);
    }

    applyScale(scale) {
        this.currentScale = Math.min(Math.max(scale, this.MIN_SCALE), this.MAX_SCALE);

        const baseWidth = 794;
        const baseHeight = 1123;
        const baseMarginBottom = 37.8; // 1cm ≒ 37.8px

        // 변경: 썸네일 복제본이 섞이지 않도록 viewer-container 안에서만 조회
        const wrappers = this.viewerContainer.querySelectorAll('.page-wrapper');
        let totalHeight = 0;

        wrappers.forEach((wrapper, index) => {
            const paper = wrapper.querySelector('.a4-paper');   // 변경: 래퍼 안의 용지를 직접 참조
            if (!paper) return;
            paper.style.transform = `scale(${this.currentScale})`;

            const scaledWidth = baseWidth * this.currentScale;
            const scaledHeight = baseHeight * this.currentScale;

            wrapper.style.width = `${scaledWidth}px`;
            wrapper.style.height = `${scaledHeight}px`;

            if (index === wrappers.length - 1) {
                wrapper.style.marginBottom = '0px';
                totalHeight += scaledHeight;
            } else {
                const scaledMargin = baseMarginBottom * this.currentScale;
                wrapper.style.marginBottom = `${scaledMargin}px`;
                totalHeight += scaledHeight + scaledMargin;
            }
        });

        if (this.viewerContainer) {
            this.viewerContainer.style.minHeight = `${totalHeight}px`;
        }
        if (this.zoomPercentageEl) {
            this.zoomPercentageEl.textContent = `${Math.round(this.currentScale * 100)}%`;
        }

        this.showZoomBadge();

        this.onScaleChangeCallbacks.forEach(cb => cb(this.currentScale));
    }

    bindEvents() {
        window.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault(); 
                this.applyScale(e.deltaY < 0 ? this.currentScale + this.STEP : this.currentScale - this.STEP);
            }
        }, { passive: false });

        window.addEventListener('keydown', (e) => {
            if (e.key === '+' || e.key === '=' || (e.ctrlKey && e.key === '=')) {
                if (e.ctrlKey) e.preventDefault();
                this.applyScale(this.currentScale + this.STEP);
            } else if (e.key === '-' || (e.ctrlKey && e.key === '-')) {
                if (e.ctrlKey) e.preventDefault();
                this.applyScale(this.currentScale - this.STEP);
            } else if (e.ctrlKey && e.key === '0') {
                e.preventDefault();
                this.applyScale(1.0);
            }
        });

        if (this.btnZoomIn) this.btnZoomIn.addEventListener('click', () => this.applyScale(this.currentScale + this.STEP * 2));
        if (this.btnZoomOut) this.btnZoomOut.addEventListener('click', () => this.applyScale(this.currentScale - this.STEP * 2));
        if (this.btnZoomReset) this.btnZoomReset.addEventListener('click', () => this.applyScale(1.0));
    }
}