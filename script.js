// Replace the entire content of your script.js with this

document.addEventListener('DOMContentLoaded', () => {
    // --- Get references --- (Keep all existing references) ---
    const photoBatchInput = document.getElementById('photoBatchInput');
    const clearAllPhotosBtn = document.getElementById('clearAllPhotosBtn');
    const clearSlotBtns = document.querySelectorAll('.clear-slot-btn');
    const templatePresetSelect = document.getElementById('templatePresets');
    const customTemplateUploadDiv = document.getElementById('customTemplateUpload');
    const templateInput = document.getElementById('template');
    const selectedTemplatePreviewImg = document.getElementById('selectedTemplatePreviewImg');
    const gridMarginsContainer = document.getElementById('gridMarginsContainer');
    const generateBtn = document.getElementById('generateBtn');
    const canvas = document.getElementById('canvas'); // Final output canvas
    const ctx = canvas.getContext('2d');
    const livePreviewCanvas = document.getElementById('livePreviewCanvas'); // Live Preview
    const liveCtx = livePreviewCanvas.getContext('2d');                     // Live Preview context
    const resultImage = document.getElementById('resultImage');
    const downloadLink = document.getElementById('downloadLink');
    const statusElem = document.getElementById('status');
    const mobileSaveHint = document.getElementById('mobileSaveHint');
    const gridMarginTopInput = document.getElementById('gridMarginTop');
    const gridMarginBottomInput = document.getElementById('gridMarginBottom');
    const gridMarginLeftInput = document.getElementById('gridMarginLeft');
    const gridMarginRightInput = document.getElementById('gridMarginRight');

    const MAX_PHOTOS = 4;
    // --- State Management --- (Keep existing state vars) ---
    let photoFiles = Array(MAX_PHOTOS).fill(null);
    let photoImageObjects = Array(MAX_PHOTOS).fill(null);
    let imageTransforms = Array.from({ length: MAX_PHOTOS }, () => ({
        scale: 1, offsetX: 50, offsetY: 50, dataUrl: null
    }));
    let templateFile = null;
    let templateImageObject = null;
    let activeTemplateSettings = null;

    const previewBgs = Array.from({ length: MAX_PHOTOS }, (_, i) => document.getElementById(`previewBg${i}`));
    const scaleSliders = document.querySelectorAll('.scale-slider');
    const offsetXSliders = document.querySelectorAll('.offset-slider-x');
    const offsetYSliders = document.querySelectorAll('.offset-slider-y');

    // --- Template Presets Definition --- (Keep existing presets) ---
     const templatePresets = [
        {
            name: "Square Border (10px)", url: "templates/square_border.png",
            margins: { top: 10, bottom: 10, left: 10, right: 10 },
            padding: { top: 0, bottom: 0, left: 0, right: 0 }
        },
        {
            name: "Dog Inn Cloud (140px)", url: "templates/Untitled-2.png",
            margins: { top: 140, bottom: 0, left: 0, right: 0 },
            padding: { top: 0, bottom: 0, left: 0, right: 0 }
        },
        {
             name: "Dog Inn Chalk", url: "templates/dog_inn_template.png",
             margins: { top: 18, bottom: 245, left: 15, right: 15 },
             padding: { top: 20, bottom: 20, left: 20, right: 20 }
         },
    ];


    // --- Utilities --- (Keep debounce, loadImage) ---
    function debounce(func, wait) { /* ... as before ... */
        let timeout;
        return function executedFunction(...args) {
            const later = () => { clearTimeout(timeout); func(...args); };
            clearTimeout(timeout); timeout = setTimeout(later, wait);
        };
     }
     function loadImage(src) { /* ... as before ... */
        return new Promise((resolve, reject) => {
             const img = new Image();
             img.onload = () => resolve(img);
             img.onerror = (err) => reject(new Error(`Failed image load: ${src.substring(0,100)}`));
             img.src = src;
         });
     }

    // --- UI / State Updates --- (Keep updatePreviewBackground, setPhotoSlotState, clear funcs, setMarginInputs, handleMarginChange ) ---
    function updatePreviewBackground(index) { /* ... as before ... */
          try {
             const transform = imageTransforms[index]; const previewBg = previewBgs[index];
             if (!previewBg) return;
             if (transform && transform.dataUrl) {
                 previewBg.style.backgroundImage = `url(${transform.dataUrl})`;
                 // --- Adjust preview for cover ---
                 // We can't perfectly mimic the canvas crop in background-image,
                 // but `cover` with background-position based on sliders is the closest visual cue.
                 previewBg.style.backgroundSize = 'cover'; // Use cover for the small preview
                 previewBg.style.backgroundPosition = `${transform.offsetX}% ${transform.offsetY}%`; // Use offsets for panning cue
             } else { previewBg.style.backgroundImage = ''; }
         } catch (error) { console.error(`Error updatePreviewBg ${index}:`, error); }
    }
    function setPhotoSlotState(index, file, dataUrl, imgObject) { /* ... as before ... */
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
    function clearPhotoSlot(index) { /* ... as before ... */
        if (photoFiles[index] !== null || photoImageObjects[index] !== null) { setPhotoSlotState(index, null, null, null); statusElem.textContent = `Slot ${index+1} cleared.`; }
    }
    function clearAllPhotoSlots() { /* ... as before ... */
         let cleared = false; photoBatchInput.value = '';
         for (let i=0; i<MAX_PHOTOS; i++) { if (photoFiles[i]!==null || photoImageObjects[i]!==null) { setPhotoSlotState(i,null,null,null); cleared=true; } }
         if(cleared) { statusElem.textContent = "Slots cleared."; }
    }
    function setMarginInputs(margins, disable = false) { /* ... as before ... */
        gridMarginTopInput.value=margins.top; gridMarginBottomInput.value=margins.bottom; gridMarginLeftInput.value=margins.left; gridMarginRightInput.value=margins.right;
        gridMarginTopInput.disabled=disable; gridMarginBottomInput.disabled=disable; gridMarginLeftInput.disabled=disable; gridMarginRightInput.disabled=disable;
    }
    const debouncedDrawLivePreview = debounce(drawLivePreview, 150);
    function handleMarginChange() { /* ... as before ... */
        if (!gridMarginTopInput.disabled) {
             if(activeTemplateSettings?.type === 'custom') { activeTemplateSettings.margins = { top: parseInt(gridMarginTopInput.value,10)||0, bottom: parseInt(gridMarginBottomInput.value,10)||0, left: parseInt(gridMarginLeftInput.value,10)||0, right: parseInt(gridMarginRightInput.value,10)||0 } }
             debouncedDrawLivePreview();
        }
    }

    // --- Event Listeners --- (Keep batch upload, clear buttons, template dropdown change, custom upload change, sliders) ---
    photoBatchInput.addEventListener('change', async (event) => { /* ... as before ... */
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
    templatePresetSelect.addEventListener('change', handlePresetChange);
    templateInput.addEventListener('change', async (event) => { /* ... as before ... */
        const file = event.target.files[0];
        if (file) { if (templatePresetSelect.value !== 'custom') { templatePresetSelect.value = 'custom'; } await loadCustomTemplate(file); }
        else { templatePresetSelect.value = 'custom'; handlePresetChange(); } // Clear if no file selected
    });
    scaleSliders.forEach(slider => slider.addEventListener('input', handleSliderChange));
    offsetXSliders.forEach(slider => slider.addEventListener('input', handleSliderChange));
    offsetYSliders.forEach(slider => slider.addEventListener('input', handleSliderChange));

 // --- CORRECT Template Selection Handling (Using Fetch for Data URL - FOR SERVER USE) ---
    templatePresetSelect.addEventListener('change', handlePresetChange);

    async function handlePresetChange() {
        const selectedValue = templatePresetSelect.value;
        console.log('[handlePresetChange (Fetch Method)] Started. Selected value:', selectedValue);

        // Reset general template state
        templateImageObject = null;
        activeTemplateSettings = null;
        selectedTemplatePreviewImg.src = '#';
        selectedTemplatePreviewImg.style.display = 'none';
        liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);

        if (selectedValue === 'custom') {
            console.log('[handlePresetChange (Fetch Method)] Handling CUSTOM selection.');
            customTemplateUploadDiv.style.display = 'block';
            gridMarginsContainer.style.display = 'block';
            setMarginInputs({ top: 0, bottom: 0, left: 0, right: 0 }, false);
            statusElem.textContent = 'Select or upload a custom template PNG.';
            templateFile = null;

            activeTemplateSettings = { type: 'custom', file: null, margins: {top:0, bottom:0, left:0, right:0}, padding: {top:0, bottom:0, left:0, right:0} };

            const potentialCustomFile = templateInput.files && templateInput.files[0];
            if (potentialCustomFile) {
                console.log('[handlePresetChange (Fetch Method)] Custom file input has a file, reloading.');
                await loadCustomTemplate(potentialCustomFile);
            } else {
                 console.log('[handlePresetChange (Fetch Method)] Custom file input is empty.');
                 templateImageObject = null; // Ensure cleared
            }

        } else {
             // --- Handle Selecting a Preset (Fetch -> Data URL) ---
            console.log('[handlePresetChange (Fetch Method)] Handling PRESET selection.');
            customTemplateUploadDiv.style.display = 'none';
            gridMarginsContainer.style.display = 'block';
            templateInput.value = ''; // Clear custom file input field visually

            const presetIndex = parseInt(selectedValue, 10);
            const preset = templatePresets[presetIndex];

            if (preset) {
                console.log('[handlePresetChange (Fetch Method)] Loading preset:', preset.name, 'from URL:', preset.url);
                setMarginInputs(preset.margins, true); // Use preset margins, disable editing
                statusElem.textContent = `Loading preset: ${preset.name}...`;
                generateBtn.disabled = true;
                templateFile = preset.url; // Store preset URL as identifier

                activeTemplateSettings = { // Store active settings
                     type: 'preset', url: preset.url,
                     margins: { ...preset.margins },
                     padding: { ...(preset.padding || { top: 0, bottom: 0, left: 0, right: 0 }) }
                };

                try {
                    // ** Fetch preset blob, convert to data URL, then load Image object **
                    console.log('[handlePresetChange (Fetch Method)] Attempting fetch for:', preset.url);
                    const response = await fetch(preset.url); // FETCH THE PRESET
                    console.log('[handlePresetChange (Fetch Method)] Fetch response status:', response.status);
                    if (!response.ok) { throw new Error(`Fetch failed! Status: ${response.status} for ${preset.url}. Check path.`); } // Check fetch status
                    const imageBlob = await response.blob(); // Get data as blob
                    console.log('[handlePresetChange (Fetch Method)] Blob created.');

                    const dataUrl = await new Promise((resolve, reject) => { // Convert blob to dataURL
                        const reader = new FileReader();
                        reader.onloadend = () => { console.log('[handlePresetChange (Fetch Method)] FileReader read blob.'); resolve(reader.result); };
                        reader.onerror = (err) => reject(new Error("Failed to read image blob as data URL."));
                        reader.readAsDataURL(imageBlob);
                    });
                    console.log('[handlePresetChange (Fetch Method)] Data URL created.');

                    // Load the Image from the safe data URL
                    templateImageObject = await loadImage(dataUrl);
                    console.log('[handlePresetChange (Fetch Method)] Image loaded from Data URL.');

                    // Update UI
                    selectedTemplatePreviewImg.src = templateImageObject.src; selectedTemplatePreviewImg.style.display = 'block';
                    statusElem.textContent = `Preset template "${preset.name}" loaded.`;
                    drawLivePreview();

                } catch (error) { // Catch fetch, blob, reader, or loadImage errors
                    console.error("[handlePresetChange (Fetch Method)] Error loading preset:", error);
                    statusElem.textContent = `Error loading preset: ${error.message}.`;
                    templateImageObject = null; activeTemplateSettings = null; // Reset fully
                    selectedTemplatePreviewImg.src = '#'; selectedTemplatePreviewImg.style.display = 'none';
                    liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height); setMarginInputs({ top: 0, bottom: 0, left: 0, right: 0 }, true);
                } finally {
                     updateGenerateButtonState(); // Update button state after loading attempt
                }
            } else { console.warn('[handlePresetChange] Invalid preset index selected:', selectedValue); statusElem.textContent = 'Invalid preset selected.'; templateFile = null; activeTemplateSettings = null; setMarginInputs({ top: 0, bottom: 0, left: 0, right: 0 }, true); }
        }
        // Final state check regardless of path
        updateGenerateButtonState();
        console.log('[handlePresetChange (Fetch Method)] Finished.');
    }
    // --- Keep the rest of the script.js file exactly the same ---
    // ... (loadCustomTemplate, other helpers, event listeners, drawing functions, etc.) ...
     async function loadCustomTemplate(file) { /* ... as before ... */
          templateImageObject = null; selectedTemplatePreviewImg.src = '#'; selectedTemplatePreviewImg.style.display = 'none';
          liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
          customTemplateUploadDiv.style.display = 'block'; gridMarginsContainer.style.display = 'block';
          templateFile = file;
          statusElem.textContent = 'Loading custom...'; generateBtn.disabled = true;
          setMarginInputs({ top: 0, bottom: 0, left: 0, right: 0 }, true);
          try {
            const dataUrl = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = (e) => resolve(e.target.result); r.onerror = (err) => reject(new Error("File read fail.")); r.readAsDataURL(file); });
            templateImageObject = await loadImage(dataUrl);
            activeTemplateSettings = { type: 'custom', file: file, margins: { top: 0, bottom: 0, left: 0, right: 0 }, padding: { top: 0, bottom: 0, left: 0, right: 0 } };
            statusElem.textContent = 'Custom loaded.'; selectedTemplatePreviewImg.src = templateImageObject.src; selectedTemplatePreviewImg.style.display = 'block';
            setMarginInputs(activeTemplateSettings.margins, false); drawLivePreview();
          } catch (error) { console.error("Custom load err:", error); statusElem.textContent = `Error: ${error.message}.`; templateFile=null; templateImageObject=null; activeTemplateSettings=null; selectedTemplatePreviewImg.src='#'; selectedTemplatePreviewImg.style.display='none'; liveCtx.clearRect(0,0,livePreviewCanvas.width,livePreviewCanvas.height); setMarginInputs({top:0,bottom:0,left:0,right:0}, false); }
          finally { updateGenerateButtonState(); }
     }

    // --- Slider handler --- (Keep existing) ---
    const debouncedSliderDrawLivePreview = debounce(drawLivePreview, 50);
    function handleSliderChange(event) { /* ... as before ... */
        const index = parseInt(event.target.dataset.index, 10); const transformType = event.target.id.replace(/[0-9]/g, '');
        if (imageTransforms[index] && photoImageObjects[index]) { imageTransforms[index][transformType] = parseFloat(event.target.value); updatePreviewBackground(index); debouncedSliderDrawLivePreview(); }
    }

    // --- Generate Button State --- (Keep existing) ---
    const updateGenerateButtonState = () => { /* ... as before ... */
          const photosReadyCount = photoImageObjects.filter(img => img !== null).length;
         const templateReady = templateImageObject !== null;
         const newState = !(photosReadyCount > 0 && templateReady);
         if (generateBtn.disabled !== newState) { generateBtn.disabled = newState; }
     };

    // --- Get Settings Helper --- (Keep existing) ---
    function getCurrentTemplateSettings() { /* ... as before ... */
        let margins = { top: 0, bottom: 0, left: 0, right: 0 }; let padding = { top: 0, bottom: 0, left: 0, right: 0 };
        if (activeTemplateSettings?.type === 'preset') { margins = { ...activeTemplateSettings.margins }; padding = { ...(activeTemplateSettings.padding || { top: 0, bottom: 0, left: 0, right: 0 }) }; }
        else if (activeTemplateSettings?.type === 'custom') { margins = { top: parseInt(gridMarginTopInput.value,10)||0, bottom: parseInt(gridMarginBottomInput.value,10)||0, left: parseInt(gridMarginLeftInput.value,10)||0, right: parseInt(gridMarginRightInput.value,10)||0 }; padding = { ...(activeTemplateSettings.padding || { top: 0, bottom: 0, left: 0, right: 0 }) }; }
        return { margins, padding };
     }

    // --- Live Preview Drawing ---
    function drawLivePreview() {
        if (!templateImageObject) {
             liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height); return;
        }
        const templateW = templateImageObject.naturalWidth; const templateH = templateImageObject.naturalHeight;
        if (livePreviewCanvas.width !== templateW) livePreviewCanvas.width = templateW;
        if (livePreviewCanvas.height !== templateH) livePreviewCanvas.height = templateH;

        const { margins, padding } = getCurrentTemplateSettings();
        const gridAreaX = margins.left; const gridAreaY = margins.top;
        const gridAreaWidth = templateW - margins.left - margins.right;
        const gridAreaHeight = templateH - margins.top - margins.bottom;

        // *** NEW: Fill background white first ***
        liveCtx.fillStyle = '#FFFFFF';
        liveCtx.fillRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);

        if (gridAreaWidth <= 0 || gridAreaHeight <= 0) { /* ... draw template and warning as before ... */
            liveCtx.drawImage(templateImageObject, 0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
            console.warn("drawLivePreview: Invalid grid dimensions."); liveCtx.strokeStyle = 'rgba(255,0,0,0.7)'; liveCtx.lineWidth = 4; liveCtx.strokeRect(gridAreaX, gridAreaY, gridAreaWidth, gridAreaHeight); return;
        }

        const quadWidth = gridAreaWidth / 2; const quadHeight = gridAreaHeight / 2;
        const baseDrawPositions = [ { x: gridAreaX, y: gridAreaY }, { x: gridAreaX + quadWidth, y: gridAreaY }, { x: gridAreaX, y: gridAreaY + quadHeight }, { x: gridAreaX + quadWidth, y: gridAreaY + quadHeight } ];

        photoImageObjects.forEach((img, index) => {
            if (img) {
                const transform = imageTransforms[index]; const basePos = baseDrawPositions[index];
                const drawX = basePos.x + padding.left; const drawY = basePos.y + padding.top;
                const drawW = quadWidth - padding.left - padding.right; const drawH = quadHeight - padding.top - padding.bottom;
                if (drawW > 0 && drawH > 0) {
                    // *** Use NEW drawing function ***
                    drawImageCover(liveCtx, img, drawX, drawY, drawW, drawH, transform.offsetX, transform.offsetY, transform.scale);
                }
            }
        });
        liveCtx.drawImage(templateImageObject, 0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
    }


    // --- Main Image Generation on Click ---
    generateBtn.addEventListener('click', () => {
         const photosLoaded = photoImageObjects.filter(img => img !== null);
         if (photosLoaded.length === 0 || !templateImageObject) { /* ... error handling as before ... */
             statusElem.textContent='Error: Need photo(s) & template.'; updateGenerateButtonState(); return;
         }
         statusElem.textContent='Generating...'; generateBtn.disabled=true;
         resultImage.src='#'; resultImage.style.display='none'; downloadLink.style.display='none'; downloadLink.href='#'; if(mobileSaveHint) mobileSaveHint.style.display='none';

        setTimeout(() => {
            if (downloadLink.dataset.objectUrl) { URL.revokeObjectURL(downloadLink.dataset.objectUrl); delete downloadLink.dataset.objectUrl; }
            try {
                const templateW = templateImageObject.naturalWidth; const templateH = templateImageObject.naturalHeight;
                const { margins, padding } = getCurrentTemplateSettings();
                const gridAreaX=margins.left; const gridAreaY=margins.top; const gridAreaWidth=templateW-margins.left-margins.right; const gridAreaHeight=templateH-margins.top-margins.bottom;
                if (gridAreaWidth<=0 || gridAreaHeight<=0) { throw new Error(`Invalid grid: ${gridAreaWidth}x${gridAreaHeight}`); }

                canvas.width=templateW; canvas.height=templateH;

                // *** NEW: Fill FINAL background white first ***
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const quadWidth=gridAreaWidth/2; const quadHeight=gridAreaHeight/2;
                const baseDrawPositions=[ {x:gridAreaX,y:gridAreaY}, {x:gridAreaX+quadWidth,y:gridAreaY}, {x:gridAreaX,y:gridAreaY+quadHeight}, {x:gridAreaX+quadWidth,y:gridAreaY+quadHeight} ];

                photoImageObjects.forEach((img, index) => {
                    if (img) {
                        const transform = imageTransforms[index]; const basePos = baseDrawPositions[index];
                        const drawX=basePos.x+padding.left; const drawY=basePos.y+padding.top; const drawW=quadWidth-padding.left-padding.right; const drawH=quadHeight-padding.top-padding.bottom;
                        if (drawW > 0 && drawH > 0) {
                             // *** Use NEW drawing function on FINAL context ***
                             drawImageCover(ctx, img, drawX, drawY, drawW, drawH, transform.offsetX, transform.offsetY, transform.scale);
                        }
                    }
                });
                ctx.drawImage(templateImageObject, 0, 0, canvas.width, canvas.height); // Draw template overlay

                // *** NEW: Export as JPEG with quality ***
                canvas.toBlob((blob) => {
                    if (!blob) throw new Error('Canvas blob conversion failed.');
                    const objectUrl = URL.createObjectURL(blob);
                    downloadLink.href = objectUrl; downloadLink.dataset.objectUrl = objectUrl; downloadLink.style.display = 'inline-block';
                    resultImage.src = objectUrl; resultImage.style.display = 'block';
                    if (mobileSaveHint) mobileSaveHint.style.display = 'block';
                    statusElem.textContent = 'Image generated!';
                    updateGenerateButtonState();
                }, 'image/jpeg', 0.9); // <--- Set MIME type to JPEG and quality (0.9 = 90%)

            } catch (error) { console.error("Generate err:", error); statusElem.textContent = `Error: ${error.message}`; updateGenerateButtonState(); }
        }, 50);
    });


        // --- *** REVISED CORE DRAWING FUNCTION: drawImageCover (Using Clip) *** ---
    /**
     * Draws an image scaled uniformly to cover the target area using clipping.
     * Allows zooming and panning within the covered image.
     * targetCtx: The canvas context to draw on.
     * img: The Image object to draw.
     * targetX, targetY, targetW, targetH: The rectangle area on the canvas to fill.
     * offsetXPercent, offsetYPercent: Panning offset (0-100) from user slider.
     * zoomScale: Zoom factor (1 = cover fit, > 1 zooms in) from user slider.
     */
    function drawImageCover(targetCtx, img, targetX, targetY, targetW, targetH, offsetXPercent = 50, offsetYPercent = 50, zoomScale = 1) {
        if (!img || !targetCtx || targetW <= 0 || targetH <= 0 || img.naturalWidth === 0 || img.naturalHeight === 0) {
            console.warn("drawImageCover: Invalid parameters or image not fully loaded.");
            return; // Validate input, including image dimensions
        }

        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        const imgRatio = imgWidth / imgHeight;
        const targetRatio = targetW / targetH;

        // --- 1. Calculate Scale to Cover ---
        let scale = 1;
        if (imgRatio > targetRatio) {
            // Image is wider than target -> fit height, width will overflow
            scale = targetH / imgHeight;
        } else {
            // Image is taller than target (or same ratio) -> fit width, height will overflow
            scale = targetW / imgWidth;
        }

        // --- 2. Apply Zoom ---
        // Ensure zoom is at least 1 (no zooming out beyond 'cover')
        const finalScale = scale * Math.max(1, zoomScale);

        // Dimensions of the (potentially zoomed) scaled image
        const scaledImgW = imgWidth * finalScale;
        const scaledImgH = imgHeight * finalScale;

        // --- 3. Calculate Top-Left Position with Panning ---
        // Determine how much the scaled image overflows the target area
        const overflowX = scaledImgW - targetW;
        const overflowY = scaledImgH - targetH;

        // Calculate the drawing coordinates (top-left of the *scaled* image)
        // Offset percentage determines how much of the overflow is pushed off-screen
        // 0% offset = left/top edge aligned with target edge
        // 50% offset = centered
        // 100% offset = right/bottom edge aligned with target edge
        const drawX = targetX - (overflowX * (offsetXPercent / 100));
        const drawY = targetY - (overflowY * (offsetYPercent / 100));

        // --- 4. Apply Clipping and Draw ---
        targetCtx.save(); // Save context state (important!)
        try {
            // Create a clipping path matching the target rectangle
            targetCtx.beginPath();
            targetCtx.rect(targetX, targetY, targetW, targetH);
            targetCtx.clip(); // Apply the clip

            // Draw the *entire source image*, scaled and positioned correctly.
            // The clipping path will ensure only the part inside the target rectangle is rendered.
            if (isNaN(drawX) || isNaN(drawY) || isNaN(scaledImgW) || isNaN(scaledImgH) || scaledImgW <= 0 || scaledImgH <= 0 ) {
                 console.error("drawImageCover: Invalid draw parameters detected just before drawImage", {drawX, drawY, scaledImgW, scaledImgH});
             } else {
                targetCtx.drawImage(
                    img,        // Source Image object
                    0, 0,       // Source rectangle corner (use whole image)
                    imgWidth,   // Source rectangle width (use whole image)
                    imgHeight,  // Source rectangle height (use whole image)
                    drawX,      // Destination X position on canvas
                    drawY,      // Destination Y position on canvas
                    scaledImgW, // Destination width (scaled size)
                    scaledImgH  // Destination height (scaled size)
                );
            }

        } catch (e) {
            console.error("Error during drawImageCover clipping/drawing:", e);
        } finally {
            targetCtx.restore(); // Restore context state (remove clip, etc.)
        }
    }

    // --- Make sure the rest of the script.js remains unchanged ---
    // Remove the *definition* of the old `drawImageWithTransform` if it's still there.
    // All the *calls* to `drawImageCover` in `drawLivePreview` and the generate button listener are already correct.
    // All other functions and event listeners should be kept as they were in the previous full script.

    // --- Old drawing function (can be removed or kept for reference) ---
    // function drawImageWithTransform(targetCtx, img, transform, targetX, targetY, targetW, targetH) { ... }
// --- Populate Preset Dropdown ---  // It should have a comment like this above it
function populatePresets() {
    templatePresets.forEach((preset, index) => {
        const option = document.createElement('option');
        option.value = index.toString();
        option.textContent = preset.name;
        templatePresetSelect.appendChild(option);
    });
    // IMPORTANT: Call handlePresetChange AFTER dropdown is populated
    handlePresetChange(); // Initialize template state based on default selection ('custom')
}

    // --- Initial Page Setup ---
    console.log("DOM Loaded. Initializing...");
    populatePresets();         // Calls initial handlePresetChange
    // Initial update/draw calls are now handled within template loading functions
    console.log("Initialization complete.");

}); // End DOMContentLoaded