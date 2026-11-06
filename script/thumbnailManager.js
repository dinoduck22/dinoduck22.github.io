export class ThumbnailManager {
    constructor() {
        this.sidebar = document.getElementById('thumbnail-sidebar');
        this.list = document.getElementById('thumbnail-list');
        this.viewerContainer = document.getElementById('viewer-container');

        this.BASE_WIDTH = 794;
        this.BASE_HEIGHT = 1123;
        this.THUMB_WIDTH = 120;
        this.thumbScale = this.THUMB_WIDTH / this.BASE_WIDTH;

        this.refreshTimer = null;
    }

    init() {
        if (!this.sidebar || !this.list) return;
        this.refresh();

        // 스크롤 시 현재 보고 있는 페이지 강조
        window.addEventListener('scroll', () => this.updateActive(), { passive: true });
    }

    // 입력이 잦으므로 디바운스 처리
    scheduleRefresh() {
        if (this.refreshTimer) clearTimeout(this.refreshTimer);
        this.refreshTimer = setTimeout(() => this.refresh(), 250);
    }

    refresh() {
        if (!this.list) return;
        const papers = document.querySelectorAll('#viewer-container .a4-paper');
        this.list.innerHTML = '';

        papers.forEach((paper, idx) => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'thumb-item';
            item.dataset.page = idx;

            const frame = document.createElement('div');
            frame.className = 'thumb-frame';
            frame.style.width = `${this.THUMB_WIDTH}px`;
            frame.style.height = `${Math.round(this.BASE_HEIGHT * this.thumbScale)}px`;

            frame.appendChild(this.cloneForThumbnail(paper));

            const label = document.createElement('span');
            label.className = 'thumb-label';
            label.textContent = idx + 1;

            item.appendChild(frame);
            item.appendChild(label);
            item.addEventListener('click', () => this.scrollToPage(idx));
            this.list.appendChild(item);
        });

        this.updateActive();
    }

    cloneForThumbnail(paper) {
        const clone = paper.cloneNode(true);
        clone.removeAttribute('id');
        clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
        clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
        clone.classList.remove('multi-selected');
        clone.querySelectorAll('.multi-selected').forEach(el => el.classList.remove('multi-selected'));

        // 본문 줌(transform)과 무관하게 원본 크기에서 썸네일 배율로 축소
        clone.style.transform = `scale(${this.thumbScale})`;
        clone.style.transformOrigin = 'top left';
        clone.style.pointerEvents = 'none';
        clone.style.boxShadow = 'none';
        return clone;
    }

    scrollToPage(idx) {
        const wrapper = this.viewerContainer.querySelectorAll('.page-wrapper')[idx];
        if (!wrapper) return;
        wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // 화면 중앙에 가장 가까운 페이지를 활성 썸네일로 표시
    updateActive() {
        const wrappers = document.querySelectorAll('#viewer-container .page-wrapper');
        const items = this.list.querySelectorAll('.thumb-item');
        if (!wrappers.length) return;

        const center = window.innerHeight / 2;
        let activeIdx = 0;
        let minDist = Infinity;

        wrappers.forEach((w, i) => {
            const r = w.getBoundingClientRect();
            const dist = r.top <= center && r.bottom >= center
                ? 0
                : Math.min(Math.abs(r.top - center), Math.abs(r.bottom - center));
            if (dist < minDist) {
                minDist = dist;
                activeIdx = i;
            }
        });

        items.forEach((item, i) => item.classList.toggle('active', i === activeIdx));

        const activeItem = items[activeIdx];
        if (activeItem) {
            const top = activeItem.offsetTop;
            const bottom = top + activeItem.offsetHeight;
            if (top < this.sidebar.scrollTop || bottom > this.sidebar.scrollTop + this.sidebar.clientHeight) {
                this.sidebar.scrollTop = top - 16;
            }
        }
    }
}