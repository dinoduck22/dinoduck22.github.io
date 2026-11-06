export class PaginationManager {
    constructor() {
        this.viewerContainer = document.getElementById('viewer-container');
    }

    createNewPageWrapper(pageNumber) {
        const wrapper = document.createElement('div');
        wrapper.className = 'page-wrapper';
        wrapper.innerHTML = `
            <article class="a4-paper relative text-slate-800">
                <div class="grid grid-cols-2 gap-8 mb-6 pt-4 editor-content flex-1">
                    <div class="space-y-6 column-left"></div>
                    <div class="space-y-6 column-right"></div>
                </div>
                <footer class="mt-auto pt-6 border-t border-slate-200 text-center page-footer">
                    <p class="report-h3 text-slate-900 mb-0 page-number">${pageNumber}</p>
                </footer>
            </article>
        `;
        return wrapper;
    }

    // 본문 단락이 하나도 없는 페이지를 제거 (문서에 최소 1페이지는 유지)
    removeEmptyPages() {
        const wrappers = [...this.viewerContainer.querySelectorAll('.page-wrapper')];

        wrappers.forEach((wrapper) => {
            // 남은 페이지가 1개뿐이면 삭제하지 않음
            
            if (this.viewerContainer.querySelectorAll('.page-wrapper').length <= 1) return;

            const hasParagraph = wrapper.querySelector(
                '.editor-content .report-body, .editor-content .report-h3'
            );
            if (!hasParagraph) wrapper.remove();
        });
    }

    checkAndHandlePagination() {
        const pages = this.viewerContainer.querySelectorAll('.a4-paper');

        pages.forEach((paper, pageIndex) => {
            const editorContent = paper.querySelector('.editor-content');
            if (!editorContent) return;

            // A4 고정 높이(1123px) 초과 감지
            if (paper.scrollHeight > 1123) {
            const leftCol = editorContent.querySelector('.column-left');
            const rightCol = editorContent.querySelector('.column-right');
            let moved = false;   // 추가

            if (leftCol.scrollHeight > 800 && leftCol.children.length > 1) {
                const overflowChild = leftCol.lastElementChild;
                rightCol.insertBefore(overflowChild, rightCol.firstChild);
                moved = true;    // 추가
            }
            else if (rightCol.children.length > 0) {
                const overflowChild = rightCol.lastElementChild;
                let nextWrapper = this.viewerContainer.children[pageIndex + 1];

                if (!nextWrapper) {
                    nextWrapper = this.createNewPageWrapper(pageIndex + 2);
                    this.viewerContainer.appendChild(nextWrapper);
                }

                const nextLeftCol = nextWrapper.querySelector('.column-left');
                nextLeftCol.insertBefore(overflowChild, nextLeftCol.firstChild);
                moved = true;    // 추가
            }

            // 실제로 이동했을 때만 재귀 처리
            if (moved) this.checkAndHandlePagination();
        }
        });

        this.removeEmptyPages();

        // 페이지 번호 갱신
        this.viewerContainer.querySelectorAll('.page-wrapper').forEach((wrapper, idx) => {
            const pageNumEl = wrapper.querySelector('.page-number');
            if (pageNumEl) pageNumEl.textContent = idx + 1;
        });
    }


}