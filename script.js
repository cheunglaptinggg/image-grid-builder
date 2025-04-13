// FINAL script.js for use on GitHub Pages (or any HTTP server)
// Uses FETCH for loading preset templates AND preset backgrounds to avoid canvas tainting.

document.addEventListener('DOMContentLoaded', () => {
    // --- Get references ---
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
             name: "Blue Chalk (Image BG)", url: "templates/dog_inn_template.png", // The main template
             margins: { top: 18, bottom: 245, left: 15, right: 15 }, // Adjust if needed
             padding: { top: 20, bottom: 20, left: 20, right: 20 } // Adjust if needed
         },
        {
             name: "Easter (Image BG)", url: "templates/2025Easter.png", // The main template
             margins: { top: 18, bottom: 245, left: 15, right: 15 }, // Adjust if needed
             padding: { top: 20, bottom: 20, left: 20, right: 20 }, // Adjust if needed
             background: { type: 'color', value: '#B7C8DC'}
         },
    ];

    // --- Utilities ---
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => { clearTimeout(timeout); func(...args); };
            clearTimeout(timeout); timeout = setTimeout(later, wait);
        };
     }
     function loadImage(src) { // src will be a data:URL from fetch or FileReader
        return new Promise((resolve, reject) => {
             const img = new Image();
             img.onload = () => resolve(img);
             img.onerror = (err) => reject(new Error(`Failed image load: ${src.substring(0,100)}`));
             img.src = src;
         });
     }

    // --- UI / State Updates ---
    function updatePreviewBackground(index) {
          try {
             const transform = imageTransforms[index]; const previewBg = previewBgs[index];
             if (!previewBg) return;
             if (transform && transform.dataUrl) {
                 previewBg.style.backgroundImage = `url(${transform.dataUrl})`;
                 previewBg.style.backgroundSize = 'cover';
                 previewBg.style.backgroundPosition = `${transform.offsetX}% ${transform.offsetY}%`;
             } else { previewBg.style.backgroundImage = ''; }
         } catch (error) { console.error(`Error updatePreviewBg ${index}:`, error); }
    }
    function setPhotoSlotState(index, file, dataUrl, imgObject) {
         photoFiles[index] = file; imageTransforms[index].dataUrl = dataUrl; photoImageObjects[index] = imgObject;
         const hasImage = !!imgObject;
         if (scaleSliders[index]) scaleSliders[index].disabled = !hasImage;
         if (offsetXSliders[index]) offsetXSliders[index].disabled = !hasImage;
         if (offsetYSliders[index]) offsetYSliders[index].disabled = !hasImage;
         if (clearSlotBtns[index]) clearSlotBtns[index].style.display = hasImage ? 'inline-block' : 'none';
         if (hasImage) {
            imageTransforms[index].scale = 1; imageTransforms[index].offsetX = 50; imageTransforms[index].offsetY = 50;
            if (scaleSliders[index]) scaleSliders[index].value = 1;
            if (offsetXSliders[index]) offsetXSliders[index].value = 50;
            if (offsetYSliders[index]) offsetYSliders[index].value = 50;
         } else {
             imageTransforms[index].scale = 1; imageTransforms[index].offsetX = 50; imageTransforms[index].offsetY = 50;
             if (scaleSliders[index]) scaleSliders[index].value = 1;
             if (offsetXSliders[index]) offsetXSliders[index].value = 50;
             if (offsetYSliders[index]) offsetYSliders[index].value = 50;
         }
         updatePreviewBackground(index); updateGenerateButtonState(); drawLivePreview();
    }
    function clearPhotoSlot(index) {
        if (photoFiles[index] !== null || photoImageObjects[index] !== null) { setPhotoSlotState(index, null, null, null); statusElem.textContent = `Slot ${index+1} cleared.`; }
    }
    function clearAllPhotoSlots() {
         let cleared = false; photoBatchInput.value = '';
         for (let i=0; i<MAX_PHOTOS; i++) { if (photoFiles[i]!==null || photoImageObjects[i]!==null) { setPhotoSlotState(i,null,null,null); cleared=true; } }
         if(cleared) { statusElem.textContent = "Slots cleared."; }
    }
    function setMarginInputs(margins, disable = false) {
        gridMarginTopInput.value=margins.top; gridMarginBottomInput.value=margins.bottom; gridMarginLeftInput.value=margins.left; gridMarginRightInput.value=margins.right;
        gridMarginTopInput.disabled=disable; gridMarginBottomInput.disabled=disable; gridMarginLeftInput.disabled=disable; gridMarginRightInput.disabled=disable;
    }
    const debouncedDrawLivePreview = debounce(drawLivePreview, 150);
    function handleMarginChange() {
        if (!gridMarginTopInput.disabled) {
             if(activeTemplateSettings?.type === 'custom') { activeTemplateSettings.margins = { top: parseInt(gridMarginTopInput.value,10)||0, bottom: parseInt(gridMarginBottomInput.value,10)||0, left: parseInt(gridMarginLeftInput.value,10)||0, right: parseInt(gridMarginRightInput.value,10)||0 } }
             debouncedDrawLivePreview();
        }
    }

    // --- Event Listeners ---
    photoBatchInput.addEventListener('change', async (event) => {
          const files = event.target.files; if (!files || files.length === 0) return;
         let filesToProcess = Array.from(files); let loadedCount = 0; let erroredCount = 0; let assignedCount = 0;
         statusElem.textContent = `Processing ${filesToProcess.length}...`; generateBtn.disabled = true;
         const processingPromises = [];
         for (const file of filesToProcess) {
             let targetSlotIndex = -1; for (let j=0; j<MAX_PHOTOS; j++) { if (photoFiles[j] === null && photoImageObjects[j] === null) { targetSlotIndex = j; break; } }
             if (targetSlotIndex !== -1 && assignedCount < MAX_PHOTOS) {
                 assignedCount++; const currentIndex = targetSlotIndex; photoFiles[currentIndex] = 'pending';
                 processingPromises.push(new Promise((resolve) => {
                     const reader = new FileReader();
                     reader.onload = async (e) => { try { const dataUrl = e.target.result; const img = await loadImage(dataUrl); setPhotoSlotState(currentIndex, file, dataUrl, img); loadedCount++; resolve(true); } catch (loadError) { console.error(`Err load img ${currentIndex}:`, loadError); setPhotoSlotState(currentIndex, null, null, null); erroredCount++; resolve(false); } };
                     reader.onerror = (err) => { console.error(`Err read file ${currentIndex}:`, err); setPhotoSlotState(currentIndex, null, null, null); erroredCount++; resolve(false); }
                     reader.readAsDataURL(file);
                 }));
             } else if (targetSlotIndex === -1) { break; }
         }
         try { await Promise.all(processingPromises); } catch (error) { console.error('Err awaiting promises:', error); }
         let finalStatus = `Processed: Loaded ${loadedCount}, Failed ${erroredCount}.`; const excessFiles = files.length - assignedCount; if (excessFiles > 0) { finalStatus += ` ${excessFiles} ignored (max ${MAX_PHOTOS}).`; }
         statusElem.textContent = finalStatus; updateGenerateButtonState(); photoBatchInput.value = '';
    });
    clearSlotBtns.forEach(btn => btn.addEventListener('click', (event) => clearPhotoSlot(parseInt(event.target.dataset.index, 10))));
    clearAllPhotosBtn.addEventListener('click', clearAllPhotoSlots);
    templatePresetSelect.addEventListener('change', handlePresetChange); // Defined below
    templateInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) { if (templatePresetSelect.value !== 'custom') { templatePresetSelect.value = 'custom'; } await loadCustomTemplate(file); }
        else { templatePresetSelect.value = 'custom'; handlePresetChange(); }
    });
    scaleSliders.forEach(slider => slider.addEventListener('input', handleSliderChange));
    offsetXSliders.forEach(slider => slider.addEventListener('input', handleSliderChange));
    offsetYSliders.forEach(slider => slider.addEventListener('input', handleSliderChange));
    gridMarginTopInput.addEventListener('input', handleMarginChange);
    gridMarginBottomInput.addEventListener('input', handleMarginChange);
    gridMarginLeftInput.addEventListener('input', handleMarginChange);
    gridMarginRightInput.addEventListener('input', handleMarginChange);

    // Background Listeners
    bgTypeRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            if(activeTemplateSettings?.background) return; // Ignore if preset controls bg
            backgroundType = event.target.value;
            if (backgroundType === 'color') { bgImageSettingDiv.style.display = 'none'; bgColorSettingDiv.style.display = 'flex'; clearBackgroundImageState(); drawLivePreview(); }
            else { bgColorSettingDiv.style.display = 'none'; bgImageSettingDiv.style.display = 'block'; if (backgroundImageObject) { drawLivePreview(); } else { drawLivePreview(true); } }
        });
    });
    const debouncedBgColorDraw = debounce(drawLivePreview, 100);
    bgColorPicker.addEventListener('input', (event) => {
         if(activeTemplateSettings?.background?.type === 'color' || bgColorPicker.disabled) return;
        backgroundColor = event.target.value;
        if (backgroundType === 'color') { debouncedBgColorDraw(); }
    });
    bgImageInput.addEventListener('change', async (event) => {
        if(activeTemplateSettings?.background?.type === 'image' || bgImageInput.disabled) return;
        const file = event.target.files[0]; if (!file) return;
        await loadManualBackgroundImage(file);
    });
    clearBgImageBtn.addEventListener('click', () => {
         if(activeTemplateSettings?.background?.type === 'image' || clearBgImageBtn.disabled) return;
         clearBackgroundImageState(); drawLivePreview(true); statusElem.textContent = 'Background image cleared.'; updateGenerateButtonState();
    });

    // Helper to MANUALLY load background image
    async function loadManualBackgroundImage(file) {
        clearBackgroundImageState(false); backgroundImageFile = file;
        statusElem.textContent = 'Loading background...'; generateBtn.disabled = true;
        try {
            const dataUrl = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload=e=>resolve(e.target.result); r.onerror=reject; r.readAsDataURL(file); });
            backgroundImageObject = await loadImage(dataUrl);
            const previewBlob = await (await fetch(dataUrl)).blob();
            backgroundImagePreviewUrl = URL.createObjectURL(previewBlob);
            bgImagePreview.src = backgroundImagePreviewUrl; bgImagePreview.style.display = 'inline-block'; clearBgImageBtn.style.display = 'inline-block';
            statusElem.textContent = 'Background loaded.'; drawLivePreview();
        } catch (error) { console.error("Bg load err:", error); statusElem.textContent = `Err bg: ${error.message}`; clearBackgroundImageState(); drawLivePreview(true); }
        finally { updateGenerateButtonState(); }
    }

    // Helper to load PRESET background image (using fetch)
    async function loadPresetBackgroundImage(url) {
        clearBackgroundImageState(false); backgroundImageFile = url; // Store URL identifier
        statusElem.textContent = 'Loading preset background...'; generateBtn.disabled = true;
        try {
            // Fetch preset background
            const response = await fetch(url); if (!response.ok) { throw new Error(`Fetch fail: ${response.status} for BG ${url}`); }
            const imageBlob = await response.blob();
            const dataUrl = await new Promise((resolve, reject) => { const r=new FileReader(); r.onloadend=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(imageBlob); });
            backgroundImageObject = await loadImage(dataUrl); // Load Image from dataURL

            // Update preview using the Blob to avoid re-fetching if needed later
            if (backgroundImagePreviewUrl) URL.revokeObjectURL(backgroundImagePreviewUrl);
            backgroundImagePreviewUrl = URL.createObjectURL(imageBlob); // Use blob for preview
            bgImagePreview.src = backgroundImagePreviewUrl; bgImagePreview.style.display = 'inline-block';
            clearBgImageBtn.style.display = 'none'; // Hide manual clear button for presets

            statusElem.textContent = 'Preset background loaded.';
            // Don't call drawLivePreview here, wait for Promise.all in handlePresetChange
            return true; // Indicate success

        } catch (error) { console.error("Preset BG load err:", error); statusElem.textContent = `Err preset BG: ${error.message}`; clearBackgroundImageState(); throw error; } // Rethrow to be caught by Promise.all
        // finally { updateGenerateButtonState(); } // State updated after Promise.all
    }

    // Helper to clear background image state
    function clearBackgroundImageState(clearInput = true) {
        if (backgroundImagePreviewUrl) { URL.revokeObjectURL(backgroundImagePreviewUrl); /*console.log("Revoked bg preview URL")*/; }
        backgroundImageFile = null; backgroundImageObject = null; backgroundImagePreviewUrl = null;
        bgImagePreview.src = '#'; bgImagePreview.style.display = 'none'; clearBgImageBtn.style.display = 'none';
        if (clearInput && bgImageInput) { bgImageInput.value = ''; }
    }

    // --- Template Loading (Using FETCH Method) ---
    async function handlePresetChange() {
        const selectedValue = templatePresetSelect.value;
        console.log('[handlePresetChange (Fetch)] Started. Selected value:', selectedValue);
        templateImageObject = null; activeTemplateSettings = null; selectedTemplatePreviewImg.src = '#'; selectedTemplatePreviewImg.style.display = 'none'; liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
        resetManualBackgroundControls(); // Start with manual BG enabled

        if (selectedValue === 'custom') {
            console.log('[handlePresetChange (Fetch)] Custom selected.');
            customTemplateUploadDiv.style.display = 'block'; gridMarginsContainer.style.display = 'block'; setMarginInputs({ top: 0, bottom: 0, left: 0, right: 0 }, false);
            statusElem.textContent = 'Upload custom template or select preset.'; templateFile = null;
            activeTemplateSettings = { type: 'custom', file: null, margins: {top:0, bottom:0, left:0, right:0}, padding: {top:0, bottom:0, left:0, right:0}, background: null };
            const potentialCustomFile = templateInput.files && templateInput.files[0];
            if (potentialCustomFile) { await loadCustomTemplate(potentialCustomFile); } else { templateImageObject = null; drawLivePreview(); } // Draw default bg if no file
        } else {
            console.log('[handlePresetChange (Fetch)] Preset selected.');
            customTemplateUploadDiv.style.display = 'none'; gridMarginsContainer.style.display = 'block'; templateInput.value = '';
            const presetIndex = parseInt(selectedValue, 10); const preset = templatePresets[presetIndex];
            if (preset) {
                console.log('[handlePresetChange (Fetch)] Loading preset:', preset.name);
                setMarginInputs(preset.margins, true); statusElem.textContent = `Loading ${preset.name}...`; generateBtn.disabled = true; templateFile = preset.url;
                activeTemplateSettings = { type: 'preset', url: preset.url, margins: { ...preset.margins }, padding: { ...(preset.padding || {}) }, background: preset.background ? { ...preset.background } : null };

                let templateLoadPromise = null;
                let backgroundLoadPromise = Promise.resolve(true); // Default to resolved for Promise.all

                // Start Template Load (Fetch -> DataURL -> LoadImage)
                try {
                    console.log('[handlePresetChange (Fetch)] Fetching TPL:', preset.url);
                    const response = await fetch(preset.url); if (!response.ok) { throw new Error(`Fetch fail ${response.status} TPL: ${preset.url}`); }
                    const imageBlob = await response.blob();
                    const dataUrl = await new Promise((resolve, reject) => { const r=new FileReader(); r.onloadend=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(imageBlob); });
                    templateLoadPromise = loadImage(dataUrl); // Assign promise
                } catch(error) { console.error("Preset TPL fetch/load err:", error); statusElem.textContent=`Err TPL: ${error.message}`; templateImageObject = null; activeTemplateSettings = null; updateGenerateButtonState(); return; }

                 // Start Background Load IF specified
                if (activeTemplateSettings.background?.type === 'image') {
                     console.log('Preset has image background, starting load:', activeTemplateSettings.background.url);
                     backgroundLoadPromise = loadPresetBackgroundImage(activeTemplateSettings.background.url); // Assign promise from helper
                     disableManualBackgroundControls();
                 } else if (activeTemplateSettings.background?.type === 'color') {
                      console.log('Preset has color background:', activeTemplateSettings.background.value);
                      backgroundType = 'color'; backgroundColor = activeTemplateSettings.background.value;
                      document.getElementById('bgTypeColor').checked = true; bgColorPicker.value = backgroundColor;
                      disableManualBackgroundControls();
                      // Background is ready, no async load needed
                 } else {
                     // No preset background, ensure manual controls enabled (already done by reset)
                 }

                // Wait for BOTH template and (potentially) background image
                try {
                    console.log("Awaiting template and potential background load...");
                    [templateImageObject] = await Promise.all([templateLoadPromise, backgroundLoadPromise]); // backgroundLoadPromise resolves immediately if no bg image needed
                    console.log("All loading finished. Template Obj:", !!templateImageObject, "BG Obj:", !!backgroundImageObject);
                    selectedTemplatePreviewImg.src = templateImageObject.src; selectedTemplatePreviewImg.style.display = 'block';
                    // Update status based on whether BG was also loaded
                    if (activeTemplateSettings.background) { statusElem.textContent = `Preset "${preset.name}" and background loaded.`; }
                    else { statusElem.textContent = `Preset "${preset.name}" loaded.`; }
                    drawLivePreview(); // Draw everything now
                } catch (error) {
                     console.error("Error awaiting image loads:", error);
                     // Status was likely set by the failing load function
                     templateImageObject = null; backgroundImageObject = null; activeTemplateSettings = null;
                     resetManualBackgroundControls(); // Re-enable controls on error
                     drawLivePreview(true); // Draw white BG
                } finally {
                    updateGenerateButtonState();
                }

            } else { /* Invalid preset index */ statusElem.textContent='Invalid preset.'; templateFile=null; activeTemplateSettings=null; setMarginInputs({top:0,bottom:0,left:0,right:0},true); }
        }
        updateGenerateButtonState(); console.log('[handlePresetChange (Fetch)] Finished.');
    }

    async function loadCustomTemplate(file) {
         templateImageObject = null; selectedTemplatePreviewImg.src = '#'; selectedTemplatePreviewImg.style.display = 'none'; liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
         customTemplateUploadDiv.style.display = 'block'; gridMarginsContainer.style.display = 'block';
         templateFile = file;
         statusElem.textContent = 'Loading custom...'; generateBtn.disabled = true; setMarginInputs({ top: 0, bottom: 0, left: 0, right: 0 }, true);
         resetManualBackgroundControls(); // Ensure manual BG controls active

         try {
            const dataUrl = await new Promise((resolve, reject) => { const r=new FileReader(); r.onload=(e)=>resolve(e.target.result); r.onerror=reject; r.readAsDataURL(file); });
            templateImageObject = await loadImage(dataUrl);
            activeTemplateSettings = { type: 'custom', file: file, margins: {top:0, bottom:0, left:0, right:0}, padding: {top:0, bottom:0, left:0, right:0}, background: null };
            statusElem.textContent = 'Custom loaded.'; selectedTemplatePreviewImg.src = templateImageObject.src; selectedTemplatePreviewImg.style.display = 'block';
            setMarginInputs(activeTemplateSettings.margins, false); // Enable margin edits
            drawLivePreview(); // Draw with default/manual background initially
         } catch (error) { console.error("Custom load err:", error); statusElem.textContent = `Error: ${error.message}.`; templateFile=null; templateImageObject=null; activeTemplateSettings=null; selectedTemplatePreviewImg.src='#'; selectedTemplatePreviewImg.style.display='none'; liveCtx.clearRect(0,0,livePreviewCanvas.width,livePreviewCanvas.height); setMarginInputs({top:0,bottom:0,left:0,right:0}, false); resetManualBackgroundControls();}
         finally { updateGenerateButtonState(); }
     }

     // Helpers to manage background control states
     function disableManualBackgroundControls() { bgTypeRadios.forEach(r=>r.disabled=true); bgColorPicker.disabled=true; bgImageInput.disabled=true; clearBgImageBtn.disabled=true; bgColorSettingDiv.style.opacity=0.6; bgImageSettingDiv.style.opacity=0.6; bgColorSettingDiv.style.cursor='not-allowed'; bgImageSettingDiv.style.cursor='not-allowed'; }
     function enableManualBackgroundControls() { bgTypeRadios.forEach(r=>r.disabled=false); bgColorPicker.disabled=false; bgImageInput.disabled=false; clearBgImageBtn.disabled=false; bgColorSettingDiv.style.opacity=1; bgImageSettingDiv.style.opacity=1; bgColorSettingDiv.style.cursor='default'; bgImageSettingDiv.style.cursor='default'; }
     function resetManualBackgroundControls() { console.log("Resetting manual BG controls."); enableManualBackgroundControls(); backgroundType = 'color'; backgroundColor = '#FFFFFF'; if(document.getElementById('bgTypeColor')) document.getElementById('bgTypeColor').checked = true; if(bgColorPicker) bgColorPicker.value = backgroundColor; if(bgImageSettingDiv) bgImageSettingDiv.style.display = 'none'; if(bgColorSettingDiv) bgColorSettingDiv.style.display = 'flex'; clearBackgroundImageState(); }


    // --- Slider handler ---
    const debouncedSliderDrawLivePreview = debounce(drawLivePreview, 50);
    function handleSliderChange(event) {
        const index = parseInt(event.target.dataset.index, 10); const transformType = event.target.id.replace(/[0-9]/g, '');
        if (imageTransforms[index] && photoImageObjects[index]) { imageTransforms[index][transformType] = parseFloat(event.target.value); updatePreviewBackground(index); debouncedSliderDrawLivePreview(); }
    }

    // --- Generate Button State ---
    const updateGenerateButtonState = () => {
          const photosReadyCount = photoImageObjects.filter(img => img !== null).length;
         const templateReady = templateImageObject !== null;
         const newState = !(photosReadyCount > 0 && templateReady); // Still require template for generation
         if (generateBtn.disabled !== newState) { generateBtn.disabled = newState; }
     };

    // --- Get Settings Helper ---
    function getCurrentSettings() {
        let margins = { top: 0, bottom: 0, left: 0, right: 0 }; let padding = { top: 0, bottom: 0, left: 0, right: 0 };
        let bg = { type: backgroundType, colorValue: backgroundColor, imageObject: backgroundImageObject };
        if (activeTemplateSettings?.type === 'preset') {
            margins = { ...activeTemplateSettings.margins }; padding = { ...(activeTemplateSettings.padding || { top:0,bottom:0,left:0,right:0 }) };
            if(activeTemplateSettings.background) {
                 if(activeTemplateSettings.background.type === 'color') { bg = { type: 'color', colorValue: activeTemplateSettings.background.value, imageObject: null }; }
                 else if (activeTemplateSettings.background.type === 'image') { bg = { type: 'image', colorValue: '#FFFFFF', imageObject: backgroundImageObject }; }
            }
        } else if (activeTemplateSettings?.type === 'custom') { margins = { top: parseInt(gridMarginTopInput.value,10)||0, bottom: parseInt(gridMarginBottomInput.value,10)||0, left: parseInt(gridMarginLeftInput.value,10)||0, right: parseInt(gridMarginRightInput.value,10)||0 }; padding = { ...(activeTemplateSettings.padding || { top:0,bottom:0,left:0,right:0 }) }; }
        return { margins, padding, background: bg };
     }

    // --- Live Preview Drawing ---
    function drawLivePreview() {
        const templateReady = !!templateImageObject;
        let canvasW = 1000, canvasH = 1000;
        if(templateReady) { canvasW = templateImageObject.naturalWidth; canvasH = templateImageObject.naturalHeight; }
        else if (backgroundImageObject && backgroundType === 'image') { canvasW = backgroundImageObject.naturalWidth; canvasH = backgroundImageObject.naturalHeight; }
        if (livePreviewCanvas.width !== canvasW) livePreviewCanvas.width = canvasW; if (livePreviewCanvas.height !== canvasH) livePreviewCanvas.height = canvasH;

        const { margins, padding, background } = getCurrentSettings();
        // Draw Background
        if (background.type === 'image' && background.imageObject) { drawImageCover(liveCtx, background.imageObject, 0, 0, canvasW, canvasH); }
        else { liveCtx.fillStyle = background.colorValue || '#FFFFFF'; liveCtx.fillRect(0, 0, canvasW, canvasH); }
        // Draw Grid & Photos (Only if template ready)
        if(templateReady) {
            const gridAreaX=margins.left; const gridAreaY=margins.top; const gridAreaWidth=canvasW-margins.left-margins.right; const gridAreaHeight=canvasH-margins.top-margins.bottom;
            if (gridAreaWidth<=0 || gridAreaHeight<=0) { liveCtx.drawImage(templateImageObject, 0, 0, canvasW, canvasH); console.warn("Preview Invalid grid"); /*...*/ return; }
            const quadW=gridAreaWidth/2; const quadH=gridAreaHeight/2; const basePos = [ { x:gridAreaX,y:gridAreaY}, {x:gridAreaX+quadW,y:gridAreaY}, {x:gridAreaX,y:gridAreaY+quadH}, {x:gridAreaX+quadW,y:gridAreaY+quadH} ];
            photoImageObjects.forEach((img,i)=>{ if(img){ const t=imageTransforms[i]; const p=basePos[i]; const dX=p.x+padding.left; const dY=p.y+padding.top; const dW=quadW-padding.left-padding.right; const dH=quadH-padding.top-padding.bottom; if(dW>0 && dH>0) drawImageCover(liveCtx,img,dX,dY,dW,dH,t.offsetX,t.offsetY,t.scale); } });
            liveCtx.drawImage(templateImageObject, 0, 0, canvasW, canvasH);
        }
    }

    // --- Main Image Generation ---
    generateBtn.addEventListener('click', () => {
         const photosLoaded = photoImageObjects.filter(img => img !== null);
         const mustHaveTemplateCheck = photosLoaded.length > 0 && templateImageObject;
         if (!mustHaveTemplateCheck) { statusElem.textContent = 'Error: Need photo(s) & template.'; updateGenerateButtonState(); return; }
         statusElem.textContent='Generating...'; generateBtn.disabled=true;
         resultImage.src='#'; resultImage.style.display='none'; downloadLink.style.display='none'; downloadLink.href='#'; if(mobileSaveHint) mobileSaveHint.style.display='none';
         if (downloadLink.dataset.objectUrl) { URL.revokeObjectURL(downloadLink.dataset.objectUrl); delete downloadLink.dataset.objectUrl; }

        setTimeout(async () => {
            try {
                let finalW=1000, finalH=1000; if(templateImageObject){ finalW=templateImageObject.naturalWidth; finalH=templateImageObject.naturalHeight; } else { throw new Error("Template missing."); }
                canvas.width=finalW; canvas.height=finalH;
                const { margins, padding, background } = getCurrentSettings();
                // Fill BG
                if (background.type === 'image' && background.imageObject) { drawImageCover(ctx, background.imageObject, 0, 0, canvas.width, canvas.height); }
                else { ctx.fillStyle = background.colorValue || '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
                // Draw Photos/Template
                const gridAreaX=margins.left; const gridAreaY=margins.top; const gridAreaWidth=finalW-margins.left-margins.right; const gridAreaHeight=finalH-margins.top-margins.bottom;
                if (gridAreaWidth<=0 || gridAreaHeight<=0) { throw new Error(`Invalid grid: ${gridAreaWidth}x${gridAreaHeight}`); }
                const quadW=gridAreaWidth/2; const quadH=gridAreaHeight/2; const basePos=[ {x:gridAreaX,y:gridAreaY}, {x:gridAreaX+quadW,y:gridAreaY}, {x:gridAreaX,y:gridAreaY+quadH}, {x:gridAreaX+quadW,y:gridAreaY+quadH} ];
                photoImageObjects.forEach((img,i)=>{ if(img){ const t=imageTransforms[i]; const p=basePos[i]; const dX=p.x+padding.left; const dY=p.y+padding.top; const dW=quadW-padding.left-padding.right; const dH=quadH-padding.top-padding.bottom; if(dW>0&&dH>0) drawImageCover(ctx,img,dX,dY,dW,dH,t.offsetX,t.offsetY,t.scale); } });
                ctx.drawImage(templateImageObject, 0, 0, canvas.width, canvas.height);
                // Export JPEG
                canvas.toBlob((blob) => { if (!blob) throw new Error('Blob fail.'); const objectUrl = URL.createObjectURL(blob); downloadLink.href = objectUrl; downloadLink.dataset.objectUrl = objectUrl; downloadLink.style.display = 'inline-block'; resultImage.src = objectUrl; resultImage.style.display = 'block'; if (mobileSaveHint) mobileSaveHint.style.display = 'block'; statusElem.textContent = 'Generated!'; updateGenerateButtonState(); }, 'image/jpeg', 0.9);
            } catch (error) { console.error("Generate err:", error); statusElem.textContent = `Error: ${error.message}`; updateGenerateButtonState(); }
        }, 50);
    });

    // --- Core Drawing Function ---
    function drawImageCover(targetCtx, img, targetX, targetY, targetW, targetH, offsetXPercent = 50, offsetYPercent = 50, zoomScale = 1) {
        if (!img || !targetCtx || targetW <= 0 || targetH <= 0 || img.naturalWidth === 0 || img.naturalHeight === 0) { console.warn("Draw invalid params"); return; }
        const imgWidth = img.naturalWidth; const imgHeight = img.naturalHeight; const imgRatio = imgWidth / imgHeight; const targetRatio = targetW / targetH;
        let scale = 1; if (imgRatio > targetRatio) { scale = targetH / imgHeight; } else { scale = targetW / imgWidth; }
        const finalScale = scale * Math.max(1, zoomScale);
        const scaledImgW = imgWidth * finalScale; const scaledImgH = imgHeight * finalScale;
        const overflowX = scaledImgW - targetW; const overflowY = scaledImgH - targetH;
        const drawX = targetX - (overflowX * (offsetXPercent / 100)); const drawY = targetY - (overflowY * (offsetYPercent / 100));
        targetCtx.save();
        try {
            targetCtx.beginPath(); targetCtx.rect(targetX, targetY, targetW, targetH); targetCtx.clip();
            if (isNaN(drawX) || isNaN(drawY) || isNaN(scaledImgW) || isNaN(scaledImgH) || scaledImgW <= 0 || scaledImgH <= 0 ) { console.error("Draw NaN", {drawX, drawY, scaledImgW, scaledImgH}); }
            else { targetCtx.drawImage( img, 0, 0, imgWidth, imgHeight, drawX, drawY, scaledImgW, scaledImgH ); }
        } catch (e) { console.error("Draw err:", e); }
        finally { targetCtx.restore(); }
    }

    // --- Initial Page Setup ---
    function populatePresets() {
        // Check if "Custom Upload" option exists, add if not (fallback)
        if (!templatePresetSelect.querySelector('option[value="custom"]')) {
             const customOption = document.createElement('option');
             customOption.value = 'custom';
             customOption.textContent = '-- Custom Upload --';
             templatePresetSelect.insertBefore(customOption, templatePresetSelect.firstChild);
        }
        templatePresets.forEach((preset, index) => { const option = document.createElement('option'); option.value = index.toString(); option.textContent = preset.name; templatePresetSelect.appendChild(option); });
        handlePresetChange(); // Initialize
    }
    console.log("DOM Loaded. Initializing...");
    populatePresets();
    console.log("Initialization complete.");

}); // End DOMContentLoaded