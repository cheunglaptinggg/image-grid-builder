
// FINAL script.js for use on GitHub Pages (or any HTTP server)
// Uses FETCH for loading preset templates AND preset backgrounds to avoid canvas tainting.
// Includes check for null preset.url. Retains debugging logs.

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
             // No explicit background for this one
         },
        {
             name: "Easter", url: "templates/2025Easter.png",
             margins: { top: 100, bottom: 100, left: 35, right: 35 }, // Updated from your last script
             padding: { top: 20, bottom: 20, left: 25, right: 25 }, // Updated from your last script
             background: { type: 'color', value: '#B7C8DC'}
         },
        
        {
             name: "Blue Sky", url: "templates/BlueSky-top.png",
             margins: { top: 350, bottom: 80, left: 65 , right: 65 },
             padding: { top: 50, bottom: 50, left: 50, right: 50 },
             background: { type: 'image', url: 'templates/BlueSky-bg.png' } // Example background image - MAKE SURE THIS FILE EXISTS!
         },

        {
            name: "School",
            url: null, // Explicitly null for no overlay template
            margins: { top: 330, bottom: 330, left: 100, right: 100 },
            padding: { top: 20, bottom: 20, left: 20, right: 20 },
            background: { type: 'image', url: 'templates/School.png' } // Ensure this exists
        }

    ];

    // --- Utilities ---
    function debounce(func, wait) { /* ... same as before ... */ }
    function loadImage(src) { /* ... same as before ... */ }

    // --- UI / State Updates ---
    function updatePreviewBackground(index) { /* ... same as before ... */ }
    function setPhotoSlotState(index, file, dataUrl, imgObject) { /* ... same as before, includes logging ... */ }
    function clearPhotoSlot(index) { /* ... same as before ... */ }
    function clearAllPhotoSlots() { /* ... same as before ... */ }
    function setMarginInputs(margins, disable = false) { /* ... same as before ... */ }
    const debouncedDrawLivePreview = debounce(drawLivePreview, 150);
    function handleMarginChange() { /* ... same as before ... */ }

    // --- Event Listeners ---
    photoBatchInput.addEventListener('change', async (event) => { /* ... same as before, includes logging ... */ });
    clearSlotBtns.forEach(btn => btn.addEventListener('click', (event) => clearPhotoSlot(parseInt(event.target.dataset.index, 10))));
    clearAllPhotosBtn.addEventListener('click', clearAllPhotoSlots);
    templatePresetSelect.addEventListener('change', handlePresetChange); // Defined below
    templateInput.addEventListener('change', async (event) => { /* ... same as before ... */ });
    scaleSliders.forEach(slider => slider.addEventListener('input', handleSliderChange));
    offsetXSliders.forEach(slider => slider.addEventListener('input', handleSliderChange));
    offsetYSliders.forEach(slider => slider.addEventListener('input', handleSliderChange));
    gridMarginTopInput.addEventListener('input', handleMarginChange);
    gridMarginBottomInput.addEventListener('input', handleMarginChange);
    gridMarginLeftInput.addEventListener('input', handleMarginChange);
    gridMarginRightInput.addEventListener('input', handleMarginChange);

    // Background Listeners (same as before)
    bgTypeRadios.forEach(radio => { /* ... */ });
    const debouncedBgColorDraw = debounce(drawLivePreview, 100);
    bgColorPicker.addEventListener('input', (event) => { /* ... */ });
    bgImageInput.addEventListener('change', async (event) => { /* ... */ });
    clearBgImageBtn.addEventListener('click', () => { /* ... */ });

    // Helper to MANUALLY load background image (same as before)
    async function loadManualBackgroundImage(file) { /* ... */ }
    // Helper to load PRESET background image (using fetch - same as before)
    async function loadPresetBackgroundImage(url) { /* ... */ }
    // Helper to clear background image state (same as before)
    function clearBackgroundImageState(clearInput = true) { /* ... */ }


    // --- ** Template Loading (FETCH METHOD with null URL check) ** ---
    async function handlePresetChange() {
        const selectedValue = templatePresetSelect.value;
        console.log('[handlePresetChange (Fetch)] Started. Selected value:', selectedValue);
        templateImageObject = null; activeTemplateSettings = null; selectedTemplatePreviewImg.src = '#'; selectedTemplatePreviewImg.style.display = 'none'; liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
        resetManualBackgroundControls(); // Reset/enable manual BG

        if (selectedValue === 'custom') {
            console.log('[handlePresetChange (Fetch)] Custom selected.');
            customTemplateUploadDiv.style.display = 'block'; gridMarginsContainer.style.display = 'block';
            const currentMargins = { top: parseInt(gridMarginTopInput.value,10)||0, bottom: parseInt(gridMarginBottomInput.value,10)||0, left: parseInt(gridMarginLeftInput.value,10)||0, right: parseInt(gridMarginRightInput.value,10)||0 };
            setMarginInputs(currentMargins, false);
            statusElem.textContent = 'Upload custom template or select preset.'; templateFile = null;
            activeTemplateSettings = { type: 'custom', file: null, margins: currentMargins, padding: {top:0, bottom:0, left:0, right:0}, background: null };
            const potentialCustomFile = templateInput.files && templateInput.files[0];
            if (potentialCustomFile) { await loadCustomTemplate(potentialCustomFile); }
            else { templateImageObject = null; drawLivePreview(); } // Draw default bg

        } else {
            // --- Handle Preset ---
            console.log('[handlePresetChange (Fetch)] Preset selected.');
            customTemplateUploadDiv.style.display = 'none'; gridMarginsContainer.style.display = 'block'; templateInput.value = '';
            const presetIndex = parseInt(selectedValue, 10); const preset = templatePresets[presetIndex];

            if (preset) {
                console.log('[handlePresetChange (Fetch)] Loading preset:', preset.name);
                setMarginInputs(preset.margins, true); // Set margin inputs visually FIRST
                statusElem.textContent = `Loading ${preset.name}...`; generateBtn.disabled = true;
                templateFile = preset.url; // Store original URL (can be null)

                activeTemplateSettings = { // Initialize state object SECOND
                     type: 'preset', url: preset.url,
                     margins: { ...preset.margins },
                     padding: { ...(preset.padding || { top:0, bottom:0, left:0, right:0 }) }, // Ensure padding exists
                     background: preset.background ? { ...preset.background } : null
                };

                let templateLoadPromise;
                if (preset.url) { // *** CHECK IF preset.url EXISTS before fetching ***
                    try {
                        console.log('[handlePresetChange (Fetch)] Fetching TPL:', preset.url);
                        const response = await fetch(preset.url);
                        if (!response.ok) { throw new Error(`Fetch fail ${response.status} TPL: ${preset.url}`); }
                        const imageBlob = await response.blob();
                        const dataUrl = await new Promise((resolve, reject) => { const r=new FileReader(); r.onloadend=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(imageBlob); });
                        templateLoadPromise = loadImage(dataUrl);
                    } catch(error) {
                        console.error("Preset TPL fetch/load err:", error); statusElem.textContent=`Err TPL: ${error.message}`;
                        templateImageObject = null; // Ensure it's null on failure
                        templateLoadPromise = Promise.resolve(null); // Resolve with null so Promise.all doesn't break
                    }
                } else {
                    console.log('[handlePresetChange (Fetch)] No template URL for this preset. Skipping template load.');
                    templateImageObject = null; // Explicitly set to null
                    if(selectedTemplatePreviewImg) { selectedTemplatePreviewImg.src = '#'; selectedTemplatePreviewImg.style.display = 'none'; }
                    templateLoadPromise = Promise.resolve(null); // Resolve with null
                }


                let backgroundLoadPromise = Promise.resolve(true); // Default
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

                // Wait for BOTH loads
                try {
                    console.log("Awaiting template and potential background load...");
                    const [loadedTemplate] = await Promise.all([templateLoadPromise, backgroundLoadPromise]);
                    templateImageObject = loadedTemplate; // Assign loaded template (can be null)

                    console.log("All loading finished. TPL:", !!templateImageObject, "BG:", !!backgroundImageObject);

                    if (templateImageObject) {
                        selectedTemplatePreviewImg.src = templateImageObject.src;
                        selectedTemplatePreviewImg.style.display = 'block';
                    }
                    // Update status based on what was loaded
                    if (!templateImageObject && activeTemplateSettings.background) {
                        statusElem.textContent = `Preset "${preset.name}" (Background Only) loaded.`;
                    } else if (templateImageObject && activeTemplateSettings.background) {
                        statusElem.textContent = `Preset "${preset.name}" & BG loaded.`;
                    } else if (templateImageObject) {
                        statusElem.textContent = `Preset "${preset.name}" loaded.`;
                    } else { // No template, no preset BG
                        statusElem.textContent = `Preset "${preset.name}" (no content) selected. Choose manual options.`;
                    }
                    drawLivePreview(); // Draw everything now
                } catch (error) {
                     console.error("Error awaiting image loads:", error); statusElem.textContent = `Error during load: ${error.message}`;
                     templateImageObject = null; backgroundImageObject = null; activeTemplateSettings = null;
                     resetManualBackgroundControls(); drawLivePreview(); // Redraw blank
                } finally {
                    updateGenerateButtonState();
                }

            } else { statusElem.textContent='Invalid preset.'; templateFile=null; activeTemplateSettings=null; setMarginInputs({top:0,bottom:0,left:0,right:0},true); updateGenerateButtonState();}
        } // end else (preset handling)

        updateGenerateButtonState(); // Final update outside if/else
        //console.log('[handlePresetChange (Fetch)] Finished.');
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
        if (!templatePresetSelect.querySelector('option[value="custom"]')) {
            console.log("Adding custom option...");
            const customOption = document.createElement('option'); customOption.value = 'custom'; customOption.textContent = '-- Custom Upload --';
            templatePresetSelect.insertBefore(customOption, templatePresetSelect.firstChild);
        } else { console.log("Custom option already exists."); }
        templatePresets.forEach((preset, index) => { const option = document.createElement('option'); option.value = index.toString(); option.textContent = preset.name; templatePresetSelect.appendChild(option); console.log(`Added preset option: ${preset.name}`); });
        console.log("Calling initial handlePresetChange...");
        handlePresetChange(); // Initialize
    }
    console.log("DOM Loaded. Initializing...");
    populatePresets();
    console.log("Initialization complete.");

}); // End DOMContentLoaded
