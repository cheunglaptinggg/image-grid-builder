// FINAL script.js for use on GitHub Pages (or any HTTP server)
// Includes more robust handling for background-only templates and photo display.
// Added extensive logging in drawLivePreview.

document.addEventListener('DOMContentLoaded', () => {
    // --- Get references --- (Ensure all these IDs match your HTML)
    const photoBatchInput = document.getElementById('photoBatchInput');
    const clearAllPhotosBtn = document.getElementById('clearAllPhotosBtn');
    const clearSlotBtns = document.querySelectorAll('.clear-slot-btn');
    const previewBgs = Array.from({ length: 4 }, (_, i) => document.getElementById(`previewBg${i}`));
    const scaleSliders = document.querySelectorAll('.scale-slider');
    const offsetXSliders = document.querySelectorAll('.offset-slider-x');
    const offsetYSliders = document.querySelectorAll('.offset-slider-y');
    const templatePresetSelect = document.getElementById('templatePresets');
    const customTemplateUploadDiv = document.getElementById('customTemplateUpload');
    const templateInput = document.getElementById('template');
    const selectedTemplatePreviewImg = document.getElementById('selectedTemplatePreviewImg');
    const gridMarginsContainer = document.getElementById('gridMarginsContainer');
    const gridMarginTopInput = document.getElementById('gridMarginTop');
    const gridMarginBottomInput = document.getElementById('gridMarginBottom');
    const gridMarginLeftInput = document.getElementById('gridMarginLeft');
    const gridMarginRightInput = document.getElementById('gridMarginRight');
    const bgTypeRadios = document.querySelectorAll('input[name="backgroundType"]');
    const bgColorSettingDiv = document.getElementById('bgColorSetting');
    const bgImageSettingDiv = document.getElementById('bgImageSetting');
    const bgColorPicker = document.getElementById('bgColorPicker');
    const bgImageInput = document.getElementById('bgImageInput');
    const bgImagePreview = document.getElementById('bgImagePreview');
    const clearBgImageBtn = document.getElementById('clearBgImageBtn');
    const generateBtn = document.getElementById('generateBtn');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const livePreviewCanvas = document.getElementById('livePreviewCanvas');
    const liveCtx = livePreviewCanvas.getContext('2d');
    const resultImage = document.getElementById('resultImage');
    const downloadLink = document.getElementById('downloadLink');
    const statusElem = document.getElementById('status');
    const mobileSaveHint = document.getElementById('mobileSaveHint');

    const MAX_PHOTOS = 4;
    // --- State Management ---
    let photoFiles = Array(MAX_PHOTOS).fill(null);
    let photoImageObjects = Array(MAX_PHOTOS).fill(null);
    let imageTransforms = Array.from({ length: MAX_PHOTOS }, () => ({ scale: 1, offsetX: 50, offsetY: 50, dataUrl: null }));
    let templateFile = null;
    let templateImageObject = null;
    let activeTemplateSettings = null;
    let backgroundType = 'color';
    let backgroundColor = '#FFFFFF';
    let backgroundImageFile = null;
    let backgroundImageObject = null;
    let backgroundImagePreviewUrl = null;

    // --- Template Presets Definition ---
    const templatePresets = [
        { name: "Blue Chalk", url: "templates/dog_inn_template.png", margins: { top: 18, bottom: 245, left: 15, right: 15 }, padding: { top: 20, bottom: 20, left: 20, right: 20 } },
        { name: "Easter", url: "templates/2025Easter.png", margins: { top: 205, bottom: 205, left: 75, right: 75 }, padding: { top: 95, bottom: 105, left: 60, right: 60 }, background: { type: 'color', value: '#B7C8DC'} },
        { name: "Blue Sky", url: "templates/BlueSky-top.png", margins: { top: 350, bottom: 80, left: 65 , right: 65 }, padding: { top: 50, bottom: 50, left: 50, right: 50 }, background: { type: 'image', url: 'templates/BlueSky-bg.png' } },
        { name: "School", url: null, margins: { top: 330, bottom: 330, left: 120 , right: 120 }, padding: { top: 20, bottom: 20, left: 20, right: 20 }, background: { type: 'image', url: 'templates/School.png' } }
    ];

    // --- Utilities ---
    function debounce(func, wait) { /* ... */ }
    function loadImage(src) { /* ... */ }

    // --- UI / State Updates ---
    function updatePreviewBackground(index) { /* ... */ }
    function setPhotoSlotState(index, file, dataUrl, imgObject) { /* ... */ }
    function clearPhotoSlot(index) { /* ... */ }
    function clearAllPhotoSlots() { /* ... */ }
    function setMarginInputs(margins, disable = false) { /* ... */ }
    const debouncedDrawLivePreview = debounce(drawLivePreview, 150);
    function handleMarginChange() { /* ... */ }

    // --- Event Listeners ---
    photoBatchInput.addEventListener('change', async (event) => { /* ... */ });
    clearSlotBtns.forEach(btn => btn.addEventListener('click', (event) => clearPhotoSlot(parseInt(event.target.dataset.index, 10))));
    clearAllPhotosBtn.addEventListener('click', clearAllPhotoSlots);
    if (templatePresetSelect) { templatePresetSelect.addEventListener('change', handlePresetChange); } else { console.error("templatePresetSelect not found!"); }
    templateInput.addEventListener('change', async (event) => { /* ... */ });
    scaleSliders.forEach(slider => slider.addEventListener('input', handleSliderChange));
    offsetXSliders.forEach(slider => slider.addEventListener('input', handleSliderChange));
    offsetYSliders.forEach(slider => slider.addEventListener('input', handleSliderChange));
    gridMarginTopInput.addEventListener('input', handleMarginChange);
    gridMarginBottomInput.addEventListener('input', handleMarginChange);
    gridMarginLeftInput.addEventListener('input', handleMarginChange);
    gridMarginRightInput.addEventListener('input', handleMarginChange);
    bgTypeRadios.forEach(radio => { /* ... */ });
    const debouncedBgColorDraw = debounce(drawLivePreview, 100);
    bgColorPicker.addEventListener('input', (event) => { /* ... */ });
    bgImageInput.addEventListener('change', async (event) => { /* ... */ });
    clearBgImageBtn.addEventListener('click', () => { /* ... */ });

    // --- Background Image Loading/Clearing Helpers ---
    async function loadManualBackgroundImage(file) { /* ... */ }
    async function loadPresetBackgroundImage(url) { /* ... */ }
    function clearBackgroundImageState(clearInput = true) { /* ... */ }

    // --- Template Loading ---
    async function handlePresetChange() { /* ... (Keep corrected version from previous step) ... */ }
    async function loadCustomTemplate(file) { /* ... (Keep corrected version from previous step) ... */ }

    // --- Helpers to manage background control states ---
    function disableManualBackgroundControls() { /* ... */ }
    function enableManualBackgroundControls() { /* ... */ }
    function resetManualBackgroundControls() { /* ... */ }

    // --- Slider handler ---
    const debouncedSliderDrawLivePreview = debounce(drawLivePreview, 50); // Already declared earlier, ensure only one
    function handleSliderChange(event) { /* ... */ }

    // --- Generate Button State ---
    const updateGenerateButtonState = () => { /* ... */ };

    // --- Get Settings Helper ---
    function getCurrentSettings() { /* ... (Keep corrected version from previous step) ... */ }


    // --- ** REFINED Live Preview Drawing with Extensive Logging ** ---
    function drawLivePreview() {
        console.log("[drawLivePreview] Called. Current States -> templateImageObject:", !!templateImageObject, "backgroundImageObject:", !!backgroundImageObject, "backgroundType:", backgroundType);

        let canvasW = 1000, canvasH = 1000; // Fallback default size

        if (templateImageObject && templateImageObject.naturalWidth > 0 && templateImageObject.naturalHeight > 0) {
            canvasW = templateImageObject.naturalWidth;
            canvasH = templateImageObject.naturalHeight;
            console.log(`[drawLivePreview] Sizing by TEMPLATE: ${canvasW}x${canvasH}`);
        } else if (backgroundImageObject && backgroundType === 'image' && backgroundImageObject.naturalWidth > 0 && backgroundImageObject.naturalHeight > 0) {
            canvasW = backgroundImageObject.naturalWidth;
            canvasH = backgroundImageObject.naturalHeight;
            console.log(`[drawLivePreview] Sizing by BACKGROUND IMAGE: ${canvasW}x${canvasH}`);
        } else {
            console.log(`[drawLivePreview] Using FALLBACK size: ${canvasW}x${canvasH}`);
        }

        // Ensure canvas has valid dimensions before trying to set them
        if (canvasW <= 0 || canvasH <= 0) {
            console.error(`[drawLivePreview] Invalid calculated canvas dimensions: ${canvasW}x${canvasH}. Aborting draw.`);
            liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height); // Clear if dimensions were bad
            return;
        }

        if (livePreviewCanvas.width !== canvasW) livePreviewCanvas.width = canvasW;
        if (livePreviewCanvas.height !== canvasH) livePreviewCanvas.height = canvasH;
        console.log(`[drawLivePreview] Live Preview Canvas actual size set to: ${livePreviewCanvas.width}x${livePreviewCanvas.height}`);

        const { margins, padding, background } = getCurrentSettings();
        console.log("[drawLivePreview] Current Settings for Drawing -> Margins:", margins, "Padding:", padding, "Background:", background);

        // --- 1. Draw Background ---
        if (background.type === 'image' && background.imageObject && background.imageObject.naturalWidth > 0) {
             console.log("[drawLivePreview] Drawing IMAGE background.");
             drawImageCover(liveCtx, background.imageObject, 0, 0, canvasW, canvasH);
        } else {
             liveCtx.fillStyle = background.colorValue || '#FFFFFF'; // Fallback to white
             console.log("[drawLivePreview] Drawing COLOR background:", liveCtx.fillStyle);
             liveCtx.fillRect(0, 0, canvasW, canvasH);
        }

        // --- 2. Draw Grid & Photos ---
        const gridAreaX = margins.left;
        const gridAreaY = margins.top;
        const gridAreaWidth = canvasW - margins.left - margins.right;
        const gridAreaHeight = canvasH - margins.top - margins.bottom;

        console.log(`[drawLivePreview] Photo Grid Area: X:${gridAreaX} Y:${gridAreaY} W:${gridAreaWidth} H:${gridAreaHeight}`);

        if (gridAreaWidth > 0 && gridAreaHeight > 0) {
            const quadWidth = gridAreaWidth / 2; const quadHeight = gridAreaHeight / 2;
            const baseDrawPositions = [ { x: gridAreaX, y: gridAreaY }, { x: gridAreaX + quadWidth, y: gridAreaY }, { x: gridAreaX, y: gridAreaY + quadHeight }, { x: gridAreaX + quadWidth, y: gridAreaY + quadHeight } ];

            photoImageObjects.forEach((img, index) => {
                if (img && img.naturalWidth > 0) { // Check if photo image object is loaded
                    const transform = imageTransforms[index]; const basePos = baseDrawPositions[index];
                    const drawX = basePos.x + padding.left; const drawY = basePos.y + padding.top;
                    const drawW = quadWidth - padding.left - padding.right; const drawH = quadHeight - padding.top - padding.bottom;
                    console.log(`[drawLivePreview] Photo ${index + 1} - Draw params: dX:${drawX} dY:${drawY} dW:${drawW} dH:${drawH}`);
                    if(drawW > 0 && drawH > 0) {
                        drawImageCover(liveCtx, img, drawX, drawY, drawW, drawH, transform.offsetX, transform.offsetY, transform.scale);
                    } else {
                         console.warn(`[drawLivePreview] Photo ${index + 1} NOT drawn (invalid W/H after padding).`);
                    }
                } else if (img) {
                    console.warn(`[drawLivePreview] Photo ${index + 1} exists but not loaded (naturalWidth is 0).`);
                }
            });
        } else {
            console.warn("[drawLivePreview] Photo grid area has invalid dimensions (W or H <= 0). Photos not drawn.");
        }

        // --- 3. Draw Template Overlay (Only if template is loaded and has dimensions) ---
        if(templateImageObject && templateImageObject.naturalWidth > 0) {
            console.log("[drawLivePreview] Drawing template overlay.");
            liveCtx.drawImage(templateImageObject, 0, 0, canvasW, canvasH);
        } else if (templateImageObject) {
            console.warn("[drawLivePreview] Template object exists but not loaded (naturalWidth is 0). Overlay not drawn.");
        } else {
            console.log("[drawLivePreview] No template overlay to draw.");
        }
        console.log("[drawLivePreview] Finished.");
    }


    // --- Main Image Generation ---
    generateBtn.addEventListener('click', () => { /* ... same as before ... */ });
    // --- Core Drawing Function ---
    function drawImageCover(targetCtx, img, targetX, targetY, targetW, targetH, offsetXPercent = 50, offsetYPercent = 50, zoomScale = 1) { /* ... same as before ... */ }

    // --- Initial Page Setup ---
    function populatePresets() { /* ... same as before ... */ }
    console.log("DOM Loaded. Initializing...");
    populatePresets();
    console.log("Initialization complete.");

}); // End DOMContentLoaded
