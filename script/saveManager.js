export class SaveManager {
    constructor(getCurrentScale) {
        this.btnSave = document.getElementById('btn-save');
        this.getCurrentScale = getCurrentScale;
    }

    init() {
        if (!this.btnSave) return;
        this.btnSave.addEventListener('click', () => this.save());
    }

    // 현재 편집 상태를 읽기 전용 DOM으로 변환
    buildReadOnlyContent() {
        const clone = document.getElementById('viewer-container').cloneNode(true);

        clone.removeAttribute('style');
        clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
        clone.querySelectorAll('.multi-selected').forEach(el => el.classList.remove('multi-selected'));
        clone.querySelectorAll('[data-placeholder]').forEach(el => el.removeAttribute('data-placeholder'));
        clone.querySelectorAll('.editable-field').forEach(el => el.classList.remove('editable-field'));
        // 줌 비율/크기 인라인 스타일 제거 (뷰어에서 ZoomManager가 다시 적용)
        clone.querySelectorAll('.page-wrapper, .a4-paper').forEach(el => el.removeAttribute('style'));

        return clone.outerHTML;
    }

    buildHtml(title, contentHtml) {
        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style/main.css">
</head>
<body class="min-h-screen flex flex-col items-center justify-start relative">

    <header class="no-print fixed top-4 right-4 z-40 flex items-center gap-2 bg-white/90 backdrop-blur border border-slate-300 shadow-md rounded-full px-3 py-1.5 text-xs text-slate-700">
        <button id="btn-zoom-out" title="축소 (-)" class="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
            <i class="fa-solid fa-minus w-4 h-4 flex items-center justify-center"></i>
        </button>
        <button id="btn-zoom-reset" title="기본 크기로 초기화" class="px-2 py-0.5 hover:bg-slate-100 rounded font-medium">Reset</button>
        <button id="btn-zoom-in" title="확대 (+)" class="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
            <i class="fa-solid fa-plus w-4 h-4 flex items-center justify-center"></i>
        </button>
        <div class="h-3 w-px bg-slate-300 mx-1"></div>
        <button onclick="window.print()" title="인쇄하기" class="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
            <i class="fa-solid fa-print w-4 h-4 flex items-center justify-center"></i>
        </button>
    </header>

    ${contentHtml}

    <div id="zoom-badge" class="no-print fixed bottom-12 left-1/2 -translate-x-1/2 z-50 glass-pill px-5 py-2.5 rounded-full shadow-xl flex items-center gap-3 text-slate-900 text-sm font-medium tracking-wide opacity-0 transition-opacity duration-300 pointer-events-none">
        <i class="fa-solid fa-magnifying-glass text-xs text-slate-700"></i>
        <span>확대 비율:</span>
        <span id="zoom-percentage" class="font-bold text-slate-900 w-12 text-center">100%</span>
    </div>

    <script type="module" src="script/main.js"></script>
</body>
</html>`;
    }

    // 읽기 전용 뷰어용 main.js (확대/축소만 동작)
    buildViewerMainJs(scale) {
        return `import { ZoomManager } from './zoomManager.js';

document.addEventListener('DOMContentLoaded', () => {
    const zoomManager = new ZoomManager();
    zoomManager.currentScale = ${scale};
    zoomManager.init();
});
`;
    }

    async fetchText(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${url} 로드 실패`);
        return res.text();
    }

    // main.css의 @import를 따라가 하나의 CSS 문자열로 합침
    async fetchBundledCss(entryUrl) {
        const entry = await this.fetchText(entryUrl);
        const imports = [...entry.matchAll(/@import\s+url\(['"]?([^'")]+)['"]?\)\s*;/g)];

        const SKIP = ['editor.css', 'sidebar.css'];
        const parts = await Promise.all(
            imports
                .filter(([, path]) => !SKIP.some(name => path.endsWith(name)))
                .map(([, path]) => this.fetchText(new URL(path, entryUrl)))
        );

        // 저장본에서 읽기 전용 뷰어에 불필요한 편집/사이드바 스타일을 제외하려면
        // 여기서 path를 필터링하면 됩니다. (예: sidebar.css, editor.css 제외)
        return parts.join('\n\n');
    }

    download(blob, filename) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }

    async save() {
        try {
            const cssLink = document.querySelector('link[rel="stylesheet"][href$="main.css"]');
            const [css, zoomJs] = await Promise.all([
                this.fetchBundledCss(cssLink.href),
                this.fetchText(new URL('./zoomManager.js', import.meta.url))
            ]);

            const title = (document.querySelector('.report-title')?.textContent || '문서').trim();
            const html = this.buildHtml(title, this.buildReadOnlyContent());
            const mainJs = this.buildViewerMainJs(this.getCurrentScale());

            const d = new Date();
            const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
            const baseName = `${title.replace(/[\\/:*?"<>|]/g, '_') || '문서'}_${stamp}`;

            if (window.JSZip) {
                const zip = new JSZip();
                zip.file('index.html', html);
                zip.file('style/main.css', css);
                zip.file('script/main.js', mainJs);
                zip.file('script/zoomManager.js', zoomJs);
                const blob = await zip.generateAsync({ type: 'blob' });
                this.download(blob, `${baseName}.zip`);
            } else {
                // JSZip 로드 실패 시 개별 파일 다운로드
                const files = [
                    ['index.html', html, 'text/html'],
                    ['main.css', css, 'text/css'],
                    ['main.js', mainJs, 'text/javascript'],
                    ['zoomManager.js', zoomJs, 'text/javascript']
                ];
                files.forEach(([name, text, type], i) =>
                    setTimeout(() => this.download(new Blob([text], { type: `${type};charset=utf-8` }), name), i * 300)
                );
                alert('압축 라이브러리를 불러오지 못해 파일을 개별 저장했습니다.\nindex.html은 루트, main.css는 style/, JS 파일은 script/ 폴더에 넣어주세요.');
            }
        } catch (err) {
            console.error(err);
            alert('저장 중 오류가 발생했습니다.\n(로컬 서버 환경에서 실행 중인지 확인해주세요.)');
        }
    }
}