// FINAL script.js for use on GitHub Pages (or any HTTP server)
// Includes more robust handling for background-only templates and photo display.

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
        {
             name: "Blue Chalk", url: "templates/dog_inn_template.png",
             margins: { top: 18, bottom: 245, left: 15, right: 15 },
             padding: { top: 20, bottom: 20, left: 20, right: 20 }
         },
        {
             name: "Easter", url: "templates/2025Easter.png",
             margins: { top: 205, bottom: 205, left: 75, right: 75 },
             padding: { top: 95, bottom: 105, left: 60, right: 60 },
             background: { type: 'color', value: '#B7C8DC'}
         },
        {
             name: "Blue Sky", url: "templates/BlueSky-top.png",
             margins: { top: 350, bottom: 80, left: 65 , right: 65 },
             padding: { top: 50, bottom: 50, left: 50, right: 50 },
             background: { type: 'image', url: 'templates/BlueSky-bg.png' }
         },
        {
             name: "School", url: null, // Explicitly null for no overlay template
             margins: { top: 330, bottom: 330, left: 120 , right: 120 },
             padding: { top: 20, bottom: 20, left: 20, right: 20 },
             background: { type: 'image', url: 'templates/School.png' } // Ensure School.png exists
         }
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
    async function handlePresetChange() {
        const selectedValue = templatePresetSelect.value;
        console.log('[handlePresetChange (Fetch)] Started. Selected value:', selectedValue);
        templateImageObject = null; activeTemplateSettings = null;
        selectedTemplatePreviewImg.src = '#'; selectedTemplatePreviewImg.style.display = 'none';
        liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
        resetManualBackgroundControls();

        if (selectedValue === 'custom') {
            // ... (custom handling as before) ...
            console.log('[handlePresetChange (Fetch)] Custom selected.');
            customTemplateUploadDiv.style.display = 'block'; gridMarginsContainer.style.display = 'block';
            const currentMargins = { top: parseInt(gridMarginTopInput.value,10)||0, bottom: parseInt(gridMarginBottomInput.value,10)||0, left: parseInt(gridMarginLeftInput.value,10)||0, right: parseInt(gridMarginRightInput.value,10)||0 };
            setMarginInputs(currentMargins, false);
            statusElem.textContent = 'Upload custom template or select preset.'; templateFile = null;
            activeTemplateSettings = { type: 'custom', file: null, margins: currentMargins, padding: {top:0, bottom:0, left:0, right:0}, background: null };
            const potentialCustomFile = templateInput.files && templateInput.files[0];
            if (potentialCustomFile) { await loadCustomTemplate(potentialCustomFile); }
            else { templateImageObject = null; drawLivePreview(); }
        } else {
            // --- Handle Preset ---
            console.log('[handlePresetChange (Fetch)] Preset selected.');
            customTemplateUploadDiv.style.display = 'none'; gridMarginsContainer.style.display = 'block'; templateInput.value = '';
            const presetIndex = parseInt(selectedValue, 10); const preset = templatePresets[presetIndex];

            if (preset) {
                console.log('[handlePresetChange (Fetch)] Loading preset:', preset.name);
                setMarginInputs(preset.margins, true);
                statusElem.textContent = `Loading ${preset.name}...`; generateBtn.disabled = true;
                templateFile = preset.url; // Store original URL (can be null)

                activeTemplateSettings = {
                     type: 'preset', url: preset.url,
                     margins: { ...preset.margins },
                     padding: { ...(preset.padding || { top:0, bottom:0, left:0, right:0 }) },
                     background: preset.background ? { ...preset.background } : null
                };

                let templateLoadPromise;
                if (preset.url && typeof preset.url === 'string' && preset.url.trim() !== '') {
                    try {
                        console.log('[handlePresetChange (Fetch)] Fetching TPL:', preset.url);
                        const response = await fetch(preset.url); if (!response.ok) { throw new Error(`Fetch fail ${response.status} TPL: ${preset.url}`); }
                        const imageBlob = await response.blob();
                        const dataUrl = await new Promise((resolve, reject) => { const r=new FileReader(); r.onloadend=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(imageBlob); });
                        templateLoadPromise = loadImage(dataUrl);
                    } catch(error) {
                        console.error("Preset TPL fetch/load err:", error); statusElem.textContent=`Err TPL: ${error.message}`;
                        templateImageObject = null; templateLoadPromise = Promise.resolve(null);
                    }
                } else {
                    console.log('[handlePresetChange (Fetch)] No valid template URL for this preset. Overlay template will be null.');
                    templateImageObject = null;
                    if(selectedTemplatePreviewImg) { selectedTemplatePreviewImg.src = '#'; selectedTemplatePreviewImg.style.display = 'none'; }
                    templateLoadPromise = Promise.resolve(null);
                }

                let backgroundLoadPromise = Promise.resolve(true); // Assume background is ready or not needed
                if (activeTemplateSettings.background?.type === 'image' && activeTemplateSettings.background.url) {
                     console.log('Preset has image background, starting load:', activeTemplateSettings.background.url);
                     backgroundLoadPromise = loadPresetBackgroundImage(activeTemplateSettings.background.url); // This returns a promise
                     disableManualBackgroundControls();
                 } else if (activeTemplateSettings.background?.type === 'color') {
                      console.log('Preset has color background:', activeTemplateSettings.background.value);
                      backgroundType = 'color'; backgroundColor = activeTemplateSettings.background.value || '#FFFFFF';
                      if (document.getElementById('bgTypeColor')) document.getElementById('bgTypeColor').checked = true;
                      if (bgColorPicker) bgColorPicker.value = backgroundColor;
                      disableManualBackgroundControls();
                 } // Else: no preset background, manual controls are active via resetManualBackgroundControls

                // Wait for BOTH main template (if any) and background (if any)
                try {
                    console.log("Awaiting template and potential background load promises...");
                    const [loadedTemplateResult] = await Promise.all([templateLoadPromise, backgroundLoadPromise]);
                    // templateImageObject will be null if preset.url was null or loading failed
                    templateImageObject = loadedTemplateResult;

                    console.log("All preset loading finished. Template Image Object:", !!templateImageObject, "Background Image Object:", !!backgroundImageObject);

                    if (templateImageObject) {
                        selectedTemplatePreviewImg.src = templateImageObject.src;
                        selectedTemplatePreviewImg.style.display = 'block';
                    }
                    // Update status message
                    if (!templateImageObject && activeTemplateSettings.background) { statusElem.textContent = `Preset "${preset.name}" (Background Only) loaded.`; }
                    else if (templateImageObject && activeTemplateSettings.background) { statusElem.textContent = `Preset "${preset.name}" & BG loaded.`; }
                    else if (templateImageObject) { statusElem.textContent = `Preset "${preset.name}" loaded.`; }
                    else { statusElem.textContent = `Preset "${preset.name}" selected (no overlay/BG). Choose manual options.`; } // Should ideally not happen if preset defines BG

                    drawLivePreview(); // Draw everything now
                } catch (error) { // Catch errors from Promise.all or if loadImage rethrows
                     console.error("Error awaiting preset image/background loads:", error); statusElem.textContent = `Error during preset load: ${error.message}`;
                     templateImageObject = null; backgroundImageObject = null; // Ensure reset on critical error
                     activeTemplateSettings = null; // Also reset settings
                     resetManualBackgroundControls(); drawLivePreview();
                } finally {
                    updateGenerateButtonState();
                }
            } else { /* Invalid preset index handling */ statusElem.textContent='Invalid preset.'; templateFile=null; activeTemplateSettings=null; setMarginInputs({top:0,bottom:0,left:0,right:0},true); updateGenerateButtonState();}
        } // end else (preset handling)
        updateGenerateButtonState();
    } // END OF handlePresetChange

    async function loadCustomTemplate(file) { /* ... same as before ... */ }
    function disableManualBackgroundControls() { /* ... same as before ... */ }
    function enableManualBackgroundControls() { /* ... same as before ... */ }
    function resetManualBackgroundControls() { /* ... same as before ... */ }
    const debouncedSliderDrawLivePreview = debounce(drawLivePreview, 50);
    function handleSliderChange(event) { /* ... same as before ... */ }
    const updateGenerateButtonState = () => { /* ... same as before ... */ };
    function getCurrentSettings() { /* ... same as before ... */ }


    // --- ** REFINED Live Preview Drawing ** ---
    function drawLivePreview() {
        console.log("[drawLivePreview] Called. Active Template Settings:", activeTemplateSettings); // DEBUG
        let canvasW = 1000, canvasH = 1000; // Fallback default size

        // Determine canvas size: Priority to template, then BG image, then fallback
        if(templateImageObject) {
            canvasW = templateImageObject.naturalWidth;
            canvasH = templateImageObject.naturalHeight;
            console.log(`[drawLivePreview] Sizing by template: ${canvasW}x${canvasH}`);
        } else if (backgroundImageObject && backgroundType === 'image') {
            canvasW = backgroundImageObject.naturalWidth;
            canvasH = backgroundImageObject.naturalHeight;
            console.log(`[drawLivePreview] Sizing by BG image: ${canvasW}x${canvasH}`);
        } else {
            console.log(`[drawLivePreview] Using fallback size: ${canvasW}x${canvasH}`);
        }

        if (livePreviewCanvas.width !== canvasW) livePreviewCanvas.width = canvasW;
        if (livePreviewCanvas.height !== canvasH) livePreviewCanvas.height = canvasH;

        const { margins, padding, background } = getCurrentSettings();
        console.log("[drawLivePreview] Current Settings for Drawing - Margins:", margins, "Padding:", padding, "Background:", background); // DEBUG

        // --- 1. Draw Background ---
        if (background.type === 'image' && background.imageObject) {
             console.log("[drawLivePreview] Drawing image background.");
             drawImageCover(liveCtx, background.imageObject, 0, 0, canvasW, canvasH);
        } else { // Default to color (either preset color or manual color)
             liveCtx.fillStyle = background.colorValue || '#FFFFFF'; // Fallback to white
             console.log("[drawLivePreview] Drawing color background:", liveCtx.fillStyle);
             liveCtx.fillRect(0, 0, canvasW, canvasH);
        }

        // --- 2. Draw Grid & Photos ---
        // Photos are drawn relative to the canvas size and margins/padding,
        // even if there's no overlay template.
        const gridAreaX = margins.left;
        const gridAreaY = margins.top;
        const gridAreaWidth = canvasW - margins.left - margins.right;
        const gridAreaHeight = canvasH - margins.top - margins.bottom;

        console.log(`[drawLivePreview] Grid Area for photos: X:${gridAreaX} Y:${gridAreaY} W:${gridAreaWidth} H:${gridAreaHeight}`); // DEBUG

        if (gridAreaWidth <= 0 || gridAreaHeight <= 0) {
            console.warn("[drawLivePreview] Invalid grid dimensions for photos. Photos not drawn.");
            // If template exists, draw it to show the error source.
            if(templateImageObject) liveCtx.drawImage(templateImageObject, 0, 0, canvasW, canvasH);
            return; // Don't draw photos if grid is invalid
        }

        const quadWidth = gridAreaWidth / 2; const quadHeight = gridAreaHeight / 2;
        const baseDrawPositions = [ { x: gridAreaX, y: gridAreaY }, { x: gridAreaX + quadWidth, y: gridAreaY }, { x: gridAreaX, y: gridAreaY + quadHeight }, { x: gridAreaX + quadWidth, y: gridAreaY + quadHeight } ];

        photoImageObjects.forEach((img, index) => {
            if (img) {
                const transform = imageTransforms[index]; const basePos = baseDrawPositions[index];
                const drawX = basePos.x + padding.left; const drawY = basePos.y + padding.top;
                const drawW = quadWidth - padding.left - padding.right; const drawH = quadHeight - padding.top - padding.bottom;
                 console.log(`[drawLivePreview] Photo ${index + 1} draw params: dX:${drawX} dY:${drawY} dW:${drawW} dH:${drawH}`); // DEBUG
                if(drawW > 0 && drawH > 0) {
                    drawImageCover(liveCtx, img, drawX, drawY, drawW, drawH, transform.offsetX, transform.offsetY, transform.scale);
                } else {
                     console.warn(`[drawLivePreview] Skipping photo ${index + 1}, invalid dimensions after padding.`);
                }
            }
        });

        // --- 3. Draw Template Overlay (Only if template is loaded) ---
        if(templateImageObject) {
            console.log("[drawLivePreview] Drawing template overlay.");
            liveCtx.drawImage(templateImageObject, 0, 0, canvasW, canvasH);
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
