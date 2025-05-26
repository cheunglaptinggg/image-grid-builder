// FINAL script.js for use on GitHub Pages (or any HTTP server)
// Uses FETCH for loading preset templates AND preset backgrounds to avoid canvas tainting.
// Corrects function definition duplications. Includes debugging logs.
// Fixes handling of preset.url === null and ensures templatePresetSelect listener is present.

document.addEventListener('DOMContentLoaded', () => {
    // --- Get references --- (Ensure all these IDs match your HTML)
    const photoBatchInput = document.getElementById('photoBatchInput');
    const clearAllPhotosBtn = document.getElementById('clearAllPhotosBtn');
    const clearSlotBtns = document.querySelectorAll('.clear-slot-btn');
    const previewBgs = Array.from({ length: 4 }, (_, i) => document.getElementById(`previewBg${i}`));
    const scaleSliders = document.querySelectorAll('.scale-slider');
    const offsetXSliders = document.querySelectorAll('.offset-slider-x');
    const offsetYSliders = document.querySelectorAll('.offset-slider-y');
    const templatePresetSelect = document.getElementById('templatePresets'); // Ensure this ID is correct
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

    // --- Template Presets Definition --- (Using user's last provided version)
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
             name: "School", url: null, // This is key for background-only
             margins: { top: 330, bottom: 330, left: 120 , right: 120 },
             padding: { top: 20, bottom: 20, left: 20, right: 20 },
             background: { type: 'image', url: 'templates/School.png' }
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
    // *** THIS IS THE CRITICAL LISTENER FOR THE DROPDOWN ***
    if (templatePresetSelect) { // Add a null check for safety
        templatePresetSelect.addEventListener('change', handlePresetChange);
    } else {
        console.error("ERROR: templatePresetSelect element not found in HTML!");
    }
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

    // Helper to MANUALLY load background image
    async function loadManualBackgroundImage(file) { /* ... */ }
    // Helper to load PRESET background image (using fetch)
    async function loadPresetBackgroundImage(url) { /* ... */ }
    // Helper to clear background image state
    function clearBackgroundImageState(clearInput = true) { /* ... */ }


    // --- ** CORRECTED Template Loading (FETCH METHOD with robust null URL check) ** ---
    async function handlePresetChange() {
        const selectedValue = templatePresetSelect.value;
        console.log('[handlePresetChange (Fetch)] Started. Selected value:', selectedValue);
        templateImageObject = null; activeTemplateSettings = null;
        selectedTemplatePreviewImg.src = '#'; selectedTemplatePreviewImg.style.display = 'none';
        liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
        resetManualBackgroundControls();

        if (selectedValue === 'custom') {
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
                templateFile = preset.url; // Can be null

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
                        const response = await fetch(preset.url);
                        if (!response.ok) { throw new Error(`Fetch fail ${response.status} TPL: ${preset.url}`); }
                        const imageBlob = await response.blob();
                        const dataUrl = await new Promise((resolve, reject) => { const r=new FileReader(); r.onloadend=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(imageBlob); });
                        templateLoadPromise = loadImage(dataUrl);
                    } catch(error) {
                        console.error("Preset TPL fetch/load err:", error); statusElem.textContent=`Err TPL: ${error.message}`;
                        templateImageObject = null;
                        templateLoadPromise = Promise.resolve(null);
                    }
                } else {
                    console.log('[handlePresetChange (Fetch)] No valid template URL for this preset. Skipping template load.');
                    templateImageObject = null;
                    if(selectedTemplatePreviewImg) { selectedTemplatePreviewImg.src = '#'; selectedTemplatePreviewImg.style.display = 'none'; }
                    templateLoadPromise = Promise.resolve(null);
                }

                let backgroundLoadPromise = Promise.resolve(true);
                if (activeTemplateSettings.background?.type === 'image' && activeTemplateSettings.background.url) {
                     console.log('Preset has image background, starting load:', activeTemplateSettings.background.url);
                     backgroundLoadPromise = loadPresetBackgroundImage(activeTemplateSettings.background.url);
                     disableManualBackgroundControls();
                 } else if (activeTemplateSettings.background?.type === 'color') {
                      console.log('Preset has color background:', activeTemplateSettings.background.value);
                      backgroundType = 'color'; backgroundColor = activeTemplateSettings.background.value || '#FFFFFF';
                      if (document.getElementById('bgTypeColor')) document.getElementById('bgTypeColor').checked = true;
                      if (bgColorPicker) bgColorPicker.value = backgroundColor;
                      disableManualBackgroundControls();
                 }

                try {
                    console.log("Awaiting template and potential background load...");
                    const [loadedTemplate] = await Promise.all([templateLoadPromise, backgroundLoadPromise]);
                    templateImageObject = loadedTemplate;

                    console.log("All loading finished. TPL:", !!templateImageObject, "BG:", !!backgroundImageObject);

                    if (templateImageObject) {
                        selectedTemplatePreviewImg.src = templateImageObject.src;
                        selectedTemplatePreviewImg.style.display = 'block';
                    }
                    if (!templateImageObject && activeTemplateSettings.background) { statusElem.textContent = `Preset "${preset.name}" (BG Only) loaded.`; }
                    else if (templateImageObject && activeTemplateSettings.background) { statusElem.textContent = `Preset "${preset.name}" & BG loaded.`; }
                    else if (templateImageObject) { statusElem.textContent = `Preset "${preset.name}" loaded.`; }
                    else { statusElem.textContent = `Preset "${preset.name}" (no content) selected.`; }
                    drawLivePreview();
                } catch (error) {
                     console.error("Error awaiting image loads:", error); statusElem.textContent = `Error during load: ${error.message}`;
                     templateImageObject = null; backgroundImageObject = null; activeTemplateSettings = null;
                     resetManualBackgroundControls(); drawLivePreview();
                } finally {
                    updateGenerateButtonState();
                }
            } else { statusElem.textContent='Invalid preset.'; templateFile=null; activeTemplateSettings=null; setMarginInputs({top:0,bottom:0,left:0,right:0},true); updateGenerateButtonState();}
        }
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
    function drawLivePreview() { /* ... same as before ... */ }
    generateBtn.addEventListener('click', () => { /* ... same as before ... */ });
    function drawImageCover(targetCtx, img, targetX, targetY, targetW, targetH, offsetXPercent = 50, offsetYPercent = 50, zoomScale = 1) { /* ... same as before ... */ }

    // --- Initial Page Setup ---
    function populatePresets() {
        console.log("Populating presets...");
        if (templatePresetSelect && !templatePresetSelect.querySelector('option[value="custom"]')) { // Add null check
            console.log("Adding custom option...");
            const customOption = document.createElement('option'); customOption.value = 'custom'; customOption.textContent = '-- Custom Upload --';
            templatePresetSelect.insertBefore(customOption, templatePresetSelect.firstChild);
        } else if (templatePresetSelect) { console.log("Custom option already exists or templatePresetSelect is null."); }
        else { console.error("populatePresets: templatePresetSelect element not found!"); return; } // Exit if select not found

        templatePresets.forEach((preset, index) => { const option = document.createElement('option'); option.value = index.toString(); option.textContent = preset.name; templatePresetSelect.appendChild(option); console.log(`Added preset option: ${preset.name}`); });
        console.log("Calling initial handlePresetChange from populatePresets...");
        handlePresetChange(); // Initialize
    }
    console.log("DOM Loaded. Initializing...");
    populatePresets(); // This is the one and only call
    console.log("Initialization complete.");

}); // End DOMContentLoaded
