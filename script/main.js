import { ZoomManager } from './zoomManager.js';
import { FloatingButtonManager } from './floatingButton.js';
import { PaginationManager } from './paginationManager.js';
import { EditorHandler } from './editorHandler.js';
import { SaveManager } from './saveManager.js';
import { ImageUploadManager } from './imageUploadManager.js'; 
import { MultiSelectManager } from './multiSelectManager.js';
import { ThumbnailManager } from './thumbnailManager.js';

document.addEventListener('DOMContentLoaded', () => {
    const zoomManager = new ZoomManager();
    const paginationManager = new PaginationManager();
    const thumbnailManager = new ThumbnailManager();

    const handleContentUpdate = () => {
        paginationManager.checkAndHandlePagination();
        zoomManager.applyScale(zoomManager.currentScale);
        thumbnailManager.scheduleRefresh();
    };

    const floatingButtonManager = new FloatingButtonManager(
        handleContentUpdate,
        handleContentUpdate
    );

    const editorHandler = new EditorHandler(
        handleContentUpdate,
        () => floatingButtonManager.updatePosition()
    );

    const saveManager = new SaveManager(() => zoomManager.currentScale);

    // 추가: 선택된 단락에 이미지 업로드
    const imageUploadManager = new ImageUploadManager(
        () => floatingButtonManager.selectedElement,
        handleContentUpdate
    );

    // 추가: 드래그로 여러 단락 선택 후 일괄 삭제
    const multiSelectManager = new MultiSelectManager(handleContentUpdate);

    zoomManager.onScaleChange(() => {
        floatingButtonManager.updatePosition();
    });

    zoomManager.init();
    floatingButtonManager.init();
    editorHandler.init();
    saveManager.init();
    imageUploadManager.init();   // 추가
    multiSelectManager.init();
    thumbnailManager.init();
});