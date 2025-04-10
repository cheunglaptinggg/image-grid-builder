// Replace the entire content of your script.js with this

document.addEventListener('DOMContentLoaded', () => {
    // --- Get references ---
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
    // --- State Management ---
    let photoFiles = Array(MAX_PHOTOS).fill(null);
    let photoImageObjects = Array(MAX_PHOTOS).fill(null);
    let imageTransforms = Array.from({ length: MAX_PHOTOS }, () => ({
        scale: 1, offsetX: 50, offsetY: 50, dataUrl: null
    }));
    let templateFile = null; // Source identifier (File obj or preset URL)
    let templateImageObject = null; // Loaded Image obj for the template
    let activeTemplateSettings = null; // Store details of the active template

    const previewBgs = Array.from({ length: MAX_PHOTOS }, (_, i) => document.getElementById(`previewBg${i}`));
    const scaleSliders = document.querySelectorAll('.scale-slider');
    const offsetXSliders = document.querySelectorAll('.offset-slider-x');
    const offsetYSliders = document.querySelectorAll('.offset-slider-y');

    // --- Template Presets Definition ---
    const templatePresets = [
        {
            name: "Square Border (10px)",
            url: "templates/square_border.png",
            margins: { top: 10, bottom: 10, left: 10, right: 10 },
            padding: { top: 0, bottom: 0, left: 0, right: 0 }
        },
        {
            name: "Portrait Header (140px)",
            url: "templates/Untitled-2.png",
            margins: { top: 140, bottom: 0, left: 0, right: 0 },
            padding: { top: 0, bottom: 0, left: 0, right: 0 }
        },
        {
             name: "Dog Inn Special",
             url: "templates/dog_inn_template.png", // Ensure this file exists!
             margins: { top: 65, bottom: 90, left: 15, right: 15 }, // Adjust as needed
             padding: { top: 25, bottom: 25, left: 25, right: 25 }  // Adjust as needed
         },
    ];

    // --- Utility: Debounce ---
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // --- Populate Preset Dropdown ---
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

    // --- Helper: Load Image ---
     function loadImage(src) {
        return new Promise((resolve, reject) => {
             const img = new Image();
             img.onload = () => resolve(img);
             img.onerror = (err) => reject(new Error(`Failed to load image object from source: ${src.substring(0, 100)}...`));
             img.src = src;
         });
     }

    // --- Helper: Update Individual Slot Preview Background ---
    function updatePreviewBackground(index) {
         try {
             const transform = imageTransforms[index];
             const previewBg = previewBgs[index];
             if (!previewBg) {
                 console.warn(`updatePreviewBackground: Could not find previewBg element for index ${index}`);
                 return;
             }
             if (transform && transform.dataUrl) {
                 previewBg.style.backgroundImage = `url(${transform.dataUrl})`;
                 previewBg.style.backgroundSize = `${transform.scale * 100}%`;
                 previewBg.style.backgroundPosition = `${transform.offsetX}% ${transform.offsetY}%`;
                 // console.log(`Updated preview for index ${index}`);
             } else {
                 previewBg.style.backgroundImage = ''; // Clear if no dataUrl
                 // console.log(`Cleared preview for index ${index}`);
             }
         } catch (error) {
             console.error(`Error in updatePreviewBackground for index ${index}:`, error);
         }
     }

    // --- REFINED Helper: Update Full Slot State ---
    function setPhotoSlotState(index, file, dataUrl, imgObject) {
        console.log(`setPhotoSlotState called for index ${index}. Has image: ${!!imgObject}`); // Debugging
        // Always update internal state first
        photoFiles[index] = file;
        imageTransforms[index].dataUrl = dataUrl;
        photoImageObjects[index] = imgObject;

        const hasImage = !!imgObject;

        // Update UI elements based on whether an image is present
        if (scaleSliders[index]) scaleSliders[index].disabled = !hasImage;
        if (offsetXSliders[index]) offsetXSliders[index].disabled = !hasImage;
        if (offsetYSliders[index]) offsetYSliders[index].disabled = !hasImage;
        if (clearSlotBtns[index]) clearSlotBtns[index].style.display = hasImage ? 'inline-block' : 'none';

        if (hasImage) {
            // Simplification: If we successfully loaded an image, reset its transforms in state
            imageTransforms[index].scale = 1;
            imageTransforms[index].offsetX = 50;
            imageTransforms[index].offsetY = 50;
            // Update slider positions visually
            if (scaleSliders[index]) scaleSliders[index].value = 1;
            if (offsetXSliders[index]) offsetXSliders[index].value = 50;
            if (offsetYSliders[index]) offsetYSliders[index].value = 50;
        } else {
             // If clearing the image, ensure transforms in state are also default
             imageTransforms[index].scale = 1;
             imageTransforms[index].offsetX = 50;
             imageTransforms[index].offsetY = 50;
             // Reset slider positions visually (though they'll be disabled)
             if (scaleSliders[index]) scaleSliders[index].value = 1;
             if (offsetXSliders[index]) offsetXSliders[index].value = 50;
             if (offsetYSliders[index]) offsetYSliders[index].value = 50;
        }

        // Always update the small background preview for this slot
        updatePreviewBackground(index);

        // Always update button state and the main live preview canvas
        updateGenerateButtonState();
        drawLivePreview();
    }


    // --- Clear Functions ---
    function clearPhotoSlot(index) {
         if (photoFiles[index] !== null || photoImageObjects[index] !== null) {
            setPhotoSlotState(index, null, null, null); // This now handles redraws
            statusElem.textContent = `Photo slot ${index + 1} cleared.`;
        }
    }

    function clearAllPhotoSlots() {
         let cleared = false;
         photoBatchInput.value = '';
         for (let i = 0; i < MAX_PHOTOS; i++) {
             if (photoFiles[i] !== null || photoImageObjects[i] !== null) {
                // Use setPhotoSlotState to ensure consistent clearing and UI updates
                setPhotoSlotState(i, null, null, null);
                cleared = true;
             }
         }
         if (cleared) {
            statusElem.textContent = "All photo slots cleared.";
            // Redraw is handled by the calls within the loop now
         }
    }

    // --- Margin Input Handling ---
    function setMarginInputs(margins, disable = false) {
        gridMarginTopInput.value = margins.top;
        gridMarginBottomInput.value = margins.bottom;
        gridMarginLeftInput.value = margins.left;
        gridMarginRightInput.value = margins.right;
        gridMarginTopInput.disabled = disable;
        gridMarginBottomInput.disabled = disable;
        gridMarginLeftInput.disabled = disable;
        gridMarginRightInput.disabled = disable;
    }

    const debouncedDrawLivePreview = debounce(drawLivePreview, 150);

    function handleMarginChange() {
        if (!gridMarginTopInput.disabled) {
             if(activeTemplateSettings && activeTemplateSettings.type === 'custom') {
                 activeTemplateSettings.margins = { // Update state if custom
                     top: parseInt(gridMarginTopInput.value, 10) || 0,
                     bottom: parseInt(gridMarginBottomInput.value, 10) || 0,
                     left: parseInt(gridMarginLeftInput.value, 10) || 0,
                     right: parseInt(gridMarginRightInput.value, 10) || 0
                 }
             }
             debouncedDrawLivePreview(); // Redraw preview (debounced)
        }
    }
    gridMarginTopInput.addEventListener('input', handleMarginChange);
    gridMarginBottomInput.addEventListener('input', handleMarginChange);
    gridMarginLeftInput.addEventListener('input', handleMarginChange);
    gridMarginRightInput.addEventListener('input', handleMarginChange);

    // --- Event Handlers ---

    // Batch Photo Upload
    photoBatchInput.addEventListener('change', async (event) => {
         console.log('Batch input change detected.'); // Debug
         const files = event.target.files;
         if (!files || files.length === 0) {
             console.log('No files selected.'); // Debug
             return;
         }

         let filesToProcess = Array.from(files);
         let loadedCount = 0;
         let erroredCount = 0;
         let assignedCount = 0;

         statusElem.textContent = `Processing ${filesToProcess.length} photo(s)...`;
         generateBtn.disabled = true;

         const processingPromises = [];

         console.log(`Attempting to assign ${filesToProcess.length} files.`); // Debug

         for (const file of filesToProcess) {
             let targetSlotIndex = -1;
             for (let j = 0; j < MAX_PHOTOS; j++) {
                 if (photoFiles[j] === null && photoImageObjects[j] === null) {
                     targetSlotIndex = j;
                     break;
                 }
             }
             console.log(`Checking for empty slot. Found index: ${targetSlotIndex}`); // Debug

             if (targetSlotIndex !== -1 && assignedCount < MAX_PHOTOS) {
                 assignedCount++;
                 const currentIndex = targetSlotIndex;
                 console.log(`Assigning "${file.name}" to slot ${currentIndex}`); // Debug
                 photoFiles[currentIndex] = 'pending'; // Mark synchronously

                 processingPromises.push(new Promise((resolve) => {
                     const reader = new FileReader();
                     reader.onload = async (e) => {
                        console.log(`FileReader onload for slot ${currentIndex}`); // Debug
                         try {
                             const dataUrl = e.target.result;
                             const img = await loadImage(dataUrl);
                             console.log(`Image loaded successfully for slot ${currentIndex}`); // Debug
                             setPhotoSlotState(currentIndex, file, dataUrl, img); // Update state
                             loadedCount++;
                             resolve(true);
                         } catch (loadError) {
                             console.error(`Error loading image for slot ${currentIndex}:`, loadError);
                             setPhotoSlotState(currentIndex, null, null, null); // Clear on error
                             erroredCount++;
                             resolve(false);
                         }
                     };
                     reader.onerror = (err) => {
                         console.error(`Error reading file for slot ${currentIndex}:`, err);
                         setPhotoSlotState(currentIndex, null, null, null); // Clear on error
                         erroredCount++;
                         resolve(false);
                     }
                     reader.readAsDataURL(file);
                 }));
             } else if (targetSlotIndex === -1) {
                 console.log('No more empty slots found.'); // Debug
                 break; // Stop trying if no more slots
             } else {
                 console.log(`Skipping file, max assigned: ${assignedCount}`); // Debug
             }
         } // End file loop

        try {
            await Promise.all(processingPromises); // Wait for all reads/loads
            console.log('All photo processing promises settled.'); // Debug
        } catch (error) {
            // Should not happen if individual promises handle errors, but good practice
            console.error('Error awaiting processing promises:', error);
        }


         let finalStatus = `Processed: Loaded ${loadedCount}, Failed ${erroredCount}.`;
         const excessFiles = files.length - assignedCount;
         if (excessFiles > 0) {
              finalStatus += ` ${excessFiles} file(s) ignored (max ${MAX_PHOTOS} slots).`;
         }
         statusElem.textContent = finalStatus;
         updateGenerateButtonState();
         photoBatchInput.value = ''; // Clear input selection *after* processing
         console.log('Batch upload processing complete.'); // Debug
    });

    // Clear buttons
    clearSlotBtns.forEach(btn => btn.addEventListener('click', (event) => clearPhotoSlot(parseInt(event.target.dataset.index, 10))));
    clearAllPhotosBtn.addEventListener('click', clearAllPhotoSlots);

        // --- REVISED Template Selection Handling (Local File Compatibility) ---
    templatePresetSelect.addEventListener('change', handlePresetChange);

    async function handlePresetChange() {
        const selectedValue = templatePresetSelect.value;
        console.log('[handlePresetChange] Started. Selected value:', selectedValue);

        // Reset general template state
        templateImageObject = null;
        activeTemplateSettings = null;
        selectedTemplatePreviewImg.src = '#';
        selectedTemplatePreviewImg.style.display = 'none';
        liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);

        if (selectedValue === 'custom') {
            console.log('[handlePresetChange] Handling CUSTOM selection.');
            customTemplateUploadDiv.style.display = 'block';
            gridMarginsContainer.style.display = 'block';
            setMarginInputs({ top: 0, bottom: 0, left: 0, right: 0 }, false);
            statusElem.textContent = 'Select or upload a custom template PNG.';
            templateFile = null;

            activeTemplateSettings = { type: 'custom', file: null, margins: {top:0, bottom:0, left:0, right:0}, padding: {top:0, bottom:0, left:0, right:0} };

            const potentialCustomFile = templateInput.files && templateInput.files[0];
            if (potentialCustomFile) {
                console.log('[handlePresetChange] Custom file input has a file, reloading.');
                await loadCustomTemplate(potentialCustomFile);
            } else {
                 console.log('[handlePresetChange] Custom file input is empty.');
                 templateImageObject = null; // Ensure cleared
            }

        } else {
             // --- Handle Selecting a Preset (Direct Loading) ---
            console.log('[handlePresetChange] Handling PRESET selection.');
            customTemplateUploadDiv.style.display = 'none';
            gridMarginsContainer.style.display = 'block';
            templateInput.value = ''; // Clear custom file input field

            const presetIndex = parseInt(selectedValue, 10);
            const preset = templatePresets[presetIndex];

            if (preset) {
                console.log('[handlePresetChange] Loading preset:', preset.name, 'from URL:', preset.url);
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
                    // --- MODIFICATION: Load directly from URL, skipping fetch ---
                    // This relies on the browser allowing direct load via src,
                    // but might re-introduce canvas tainting issues on export when using file:///
                    console.log('[handlePresetChange] Attempting direct loadImage:', preset.url);
                    templateImageObject = await loadImage(preset.url); // <--- The direct load call
                    // --- End Modification ---

                    selectedTemplatePreviewImg.src = templateImageObject.src;
                    selectedTemplatePreviewImg.style.display = 'block';
                    statusElem.textContent = `Preset template "${preset.name}" loaded. (Note: Export might fail if run locally via file:///)`; // Add warning
                    console.log('[handlePresetChange] Preset loaded successfully via direct loadImage.');
                    drawLivePreview();

                } catch (error) {
                    console.error("[handlePresetChange] Error loading preset:", error);
                    statusElem.textContent = `Error loading preset: ${error.message}. Check path/file exists.`;
                    templateImageObject = null; activeTemplateSettings = null;
                    selectedTemplatePreviewImg.src = '#'; selectedTemplatePreviewImg.style.display = 'none';
                    liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
                    setMarginInputs({ top: 0, bottom: 0, left: 0, right: 0 }, true);
                } finally {
                     updateGenerateButtonState(); // Update button state
                }
            } else { // Invalid preset index somehow
                 console.warn('[handlePresetChange] Invalid preset index selected:', selectedValue);
                 statusElem.textContent = 'Invalid preset selected.';
                 templateFile = null; activeTemplateSettings = null;
                 setMarginInputs({ top: 0, bottom: 0, left: 0, right: 0 }, true);
            }
        }
        updateGenerateButtonState(); // Ensure button state updated after all paths
        console.log('[handlePresetChange] Finished.');
    }

    // --- Custom Template Upload function remains the same ---
    // async function loadCustomTemplate(file) { ... }

    // --- The rest of your script.js remains unchanged ---
    // ... (Keep all other functions: loadCustomTemplate, populatePresets, loadImage, debounce, etc.) ...
    // ... (Keep all event listeners: templateInput, sliders, batch upload, clear buttons, generateBtn) ...
    // ... (Keep drawing functions: drawLivePreview, drawImageWithTransform, getCurrentTemplateSettings) ...
    // ... (Keep initial setup calls) ...

    // Listener for Custom Template Upload Input
    templateInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        console.log('[templateInput change] File selected:', file ? file.name : 'None');
        if (file) {
            // Ensure dropdown shows 'custom' since a file was chosen
            if (templatePresetSelect.value !== 'custom') {
                templatePresetSelect.value = 'custom';
                 // Setting the value might trigger 'change' again, but loadCustomTemplate handles resets
            }
            await loadCustomTemplate(file); // Load the selected file
        } else {
            // User cleared the file input (e.g., cancelled selection)
            // Ensure dropdown is 'custom' and run the 'custom' path logic which will clear the state
            templatePresetSelect.value = 'custom';
            handlePresetChange();
        }
    });

    // Helper function to load a custom template File object
    async function loadCustomTemplate(file) {
        console.log('[loadCustomTemplate] Starting for file:', file.name);
        // Reset state specific to template loading
        templateImageObject = null;
        selectedTemplatePreviewImg.src = '#'; selectedTemplatePreviewImg.style.display = 'none';
        liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
        customTemplateUploadDiv.style.display = 'block'; // Ensure UI is visible
        gridMarginsContainer.style.display = 'block';

        templateFile = file; // Store the File object as the identifier

        statusElem.textContent = 'Loading custom template...';
        generateBtn.disabled = true;
        setMarginInputs({ top: 0, bottom: 0, left: 0, right: 0 }, true); // Disable margins during load

        try {
            const dataUrl = await new Promise((resolve, reject) => {
                 const reader = new FileReader();
                 reader.onload = (e) => resolve(e.target.result);
                 reader.onerror = (err) => reject(new Error("Failed to read custom file."));
                 reader.readAsDataURL(file); // Read the custom file
             });
            templateImageObject = await loadImage(dataUrl); // Load from dataURL

            // Set active settings for the loaded custom template
            activeTemplateSettings = {
                 type: 'custom',
                 file: file,
                 margins: { top: 0, bottom: 0, left: 0, right: 0 }, // Initial margins
                 padding: { top: 0, bottom: 0, left: 0, right: 0 }  // Default no padding
             };

            statusElem.textContent = 'Custom template loaded.';
            selectedTemplatePreviewImg.src = templateImageObject.src;
            selectedTemplatePreviewImg.style.display = 'block';
            setMarginInputs(activeTemplateSettings.margins, false); // Reset margins & *enable*
            console.log('[loadCustomTemplate] Success.');
            drawLivePreview(); // Draw preview now

        } catch (error) {
            console.error("[loadCustomTemplate] Error:", error);
            statusElem.textContent = `Error: ${error.message}. Invalid image?`;
            templateFile = null; templateImageObject = null; activeTemplateSettings = null; // Reset fully
            selectedTemplatePreviewImg.src = '#'; selectedTemplatePreviewImg.style.display = 'none';
            liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
            setMarginInputs({ top: 0, bottom: 0, left: 0, right: 0 }, false); // Ensure margins enabled after error
        } finally {
             updateGenerateButtonState(); // Update button state
        }
    }


    // --- Slider Controls ---
    const debouncedSliderDrawLivePreview = debounce(drawLivePreview, 50);
    function handleSliderChange(event) {
        const index = parseInt(event.target.dataset.index, 10);
        const transformType = event.target.id.replace(/[0-9]/g, '');
        if (imageTransforms[index] && photoImageObjects[index]) {
            imageTransforms[index][transformType] = parseFloat(event.target.value);
            updatePreviewBackground(index);
            debouncedSliderDrawLivePreview();
        }
    }
    scaleSliders.forEach(slider => slider.addEventListener('input', handleSliderChange));
    offsetXSliders.forEach(slider => slider.addEventListener('input', handleSliderChange));
    offsetYSliders.forEach(slider => slider.addEventListener('input', handleSliderChange));


    // --- Update Generate Button State ---
    const updateGenerateButtonState = () => {
         const photosReadyCount = photoImageObjects.filter(img => img !== null).length;
         const templateReady = templateImageObject !== null;
         const newState = !(photosReadyCount > 0 && templateReady);
         if (generateBtn.disabled !== newState) {
            generateBtn.disabled = newState;
             // console.log('Generate button state changed to:', newState ? 'disabled' : 'enabled'); // Debug
         }
    };


    // --- Get Current Template Settings Helper ---
    function getCurrentTemplateSettings() {
        let margins = { top: 0, bottom: 0, left: 0, right: 0 };
        let padding = { top: 0, bottom: 0, left: 0, right: 0 };

        if (activeTemplateSettings?.type === 'preset') {
             margins = { ...activeTemplateSettings.margins };
             padding = { ...(activeTemplateSettings.padding || { top: 0, bottom: 0, left: 0, right: 0 }) };
        } else if (activeTemplateSettings?.type === 'custom') {
             margins = { // Read from inputs for custom
                 top: parseInt(gridMarginTopInput.value, 10) || 0,
                 bottom: parseInt(gridMarginBottomInput.value, 10) || 0,
                 left: parseInt(gridMarginLeftInput.value, 10) || 0,
                 right: parseInt(gridMarginRightInput.value, 10) || 0
             };
             padding = { ...(activeTemplateSettings.padding || { top: 0, bottom: 0, left: 0, right: 0 }) }; // Use default if not set
        } else {
             // Default if activeTemplateSettings is null (e.g., initial load error)
             console.warn("getCurrentTemplateSettings: activeTemplateSettings is null or invalid.");
        }
        return { margins, padding };
    }


    // --- Live Preview Drawing ---
    function drawLivePreview() {
        // console.log("drawLivePreview called"); // Debug
        if (!templateImageObject) {
             // console.log("drawLivePreview: No template loaded, clearing."); // Debug
             liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
             return;
        }

        const templateW = templateImageObject.naturalWidth;
        const templateH = templateImageObject.naturalHeight;

        if (livePreviewCanvas.width !== templateW) livePreviewCanvas.width = templateW;
        if (livePreviewCanvas.height !== templateH) livePreviewCanvas.height = templateH;

        const { margins, padding } = getCurrentTemplateSettings();

        const gridAreaX = margins.left; const gridAreaY = margins.top;
        const gridAreaWidth = templateW - margins.left - margins.right;
        const gridAreaHeight = templateH - margins.top - margins.bottom;

        liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);

        if (gridAreaWidth <= 0 || gridAreaHeight <= 0) {
            liveCtx.drawImage(templateImageObject, 0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
            console.warn("drawLivePreview: Invalid grid dimensions.");
            liveCtx.strokeStyle = 'rgba(255,0,0,0.7)'; liveCtx.lineWidth = 4;
            liveCtx.strokeRect(gridAreaX, gridAreaY, gridAreaWidth, gridAreaHeight);
            return;
        }

        const quadWidth = gridAreaWidth / 2; const quadHeight = gridAreaHeight / 2;
        const baseDrawPositions = [
            { x: gridAreaX, y: gridAreaY }, { x: gridAreaX + quadWidth, y: gridAreaY },
            { x: gridAreaX, y: gridAreaY + quadHeight }, { x: gridAreaX + quadWidth, y: gridAreaY + quadHeight }
        ];

        photoImageObjects.forEach((img, index) => {
            if (img) {
                const transform = imageTransforms[index];
                const basePos = baseDrawPositions[index];
                const drawX = basePos.x + padding.left; const drawY = basePos.y + padding.top;
                const drawW = quadWidth - padding.left - padding.right;
                const drawH = quadHeight - padding.top - padding.bottom;
                if (drawW > 0 && drawH > 0) {
                    drawImageWithTransform(liveCtx, img, transform, drawX, drawY, drawW, drawH);
                }
            }
        });
        liveCtx.drawImage(templateImageObject, 0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
        // console.log("drawLivePreview finished."); // Debug
    }


    // --- Main Image Generation on Click ---
    generateBtn.addEventListener('click', () => {
        // ... (Implementation remains the same - uses getCurrentTemplateSettings) ...
          const photosLoaded = photoImageObjects.filter(img => img !== null);
         if (photosLoaded.length === 0 || !templateImageObject) {
            statusElem.textContent = 'Error: Need at least one photo and a template loaded.';
            updateGenerateButtonState(); return;
        }
        statusElem.textContent = 'Generating... Please wait.';
        generateBtn.disabled = true;
        resultImage.src = '#'; resultImage.style.display = 'none';
        downloadLink.style.display = 'none'; downloadLink.href = '#';
        if (mobileSaveHint) mobileSaveHint.style.display = 'none';
        setTimeout(() => {
            if (downloadLink.dataset.objectUrl) { URL.revokeObjectURL(downloadLink.dataset.objectUrl); delete downloadLink.dataset.objectUrl; }
            try {
                const templateW = templateImageObject.naturalWidth; const templateH = templateImageObject.naturalHeight;
                const { margins, padding } = getCurrentTemplateSettings(); // Use helper
                const gridAreaX = margins.left; const gridAreaY = margins.top;
                const gridAreaWidth = templateW - margins.left - margins.right;
                const gridAreaHeight = templateH - margins.top - margins.bottom;
                if (gridAreaWidth <= 0 || gridAreaHeight <= 0) { throw new Error(`Invalid grid dimensions. Grid Area: ${gridAreaWidth}x${gridAreaHeight}`); }
                canvas.width = templateW; canvas.height = templateH;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const quadWidth = gridAreaWidth / 2; const quadHeight = gridAreaHeight / 2;
                const baseDrawPositions = [ { x: gridAreaX, y: gridAreaY }, { x: gridAreaX + quadWidth, y: gridAreaY }, { x: gridAreaX, y: gridAreaY + quadHeight }, { x: gridAreaX + quadWidth, y: gridAreaY + quadHeight } ];
                photoImageObjects.forEach((img, index) => { // Draw with padding
                    if (img) {
                        const transform = imageTransforms[index]; const basePos = baseDrawPositions[index];
                        const drawX = basePos.x + padding.left; const drawY = basePos.y + padding.top;
                        const drawW = quadWidth - padding.left - padding.right; const drawH = quadHeight - padding.top - padding.bottom;
                        if (drawW > 0 && drawH > 0) { drawImageWithTransform(ctx, img, transform, drawX, drawY, drawW, drawH); }
                    }
                });
                ctx.drawImage(templateImageObject, 0, 0, canvas.width, canvas.height); // Draw template
                canvas.toBlob((blob) => { // Export blob
                    if (!blob) throw new Error('Canvas could not be converted to Blob.');
                    const objectUrl = URL.createObjectURL(blob);
                    downloadLink.href = objectUrl; downloadLink.dataset.objectUrl = objectUrl; downloadLink.style.display = 'inline-block';
                    resultImage.src = objectUrl; resultImage.style.display = 'block';
                    if (mobileSaveHint) mobileSaveHint.style.display = 'block';
                    statusElem.textContent = 'Image generated successfully!';
                    updateGenerateButtonState();
                }, 'image/png');
            } catch (error) {
                console.error("Error during final canvas generation:", error); statusElem.textContent = `Error generating: ${error.message}`; updateGenerateButtonState();
            }
        }, 50);
    });

    // --- Core Drawing Function ---
    function drawImageWithTransform(targetCtx, img, transform, targetX, targetY, targetW, targetH) {
       // ... (Implementation remains the same) ...
         if (!img || !targetCtx || targetW <= 0 || targetH <= 0) { return; }
         const imgWidth = img.naturalWidth; const imgHeight = img.naturalHeight;
         const scale = Math.max(transform.scale, 0.1);
         const offsetXRatio = transform.offsetX / 100; const offsetYRatio = transform.offsetY / 100;
         let sourceW = imgWidth / scale; let sourceH = imgHeight / scale;
         let sourceX = (imgWidth - sourceW) * offsetXRatio; let sourceY = (imgHeight - sourceH) * offsetYRatio;
         const targetAspect = targetW / targetH; const sourceAspect = sourceW / sourceH;
         if (sourceAspect > targetAspect) { const newSourceW = sourceH * targetAspect; sourceX += (sourceW - newSourceW) * offsetXRatio; sourceW = newSourceW;
         } else if (sourceAspect < targetAspect) { const newSourceH = sourceW / targetAspect; sourceY += (sourceH - newSourceH) * offsetYRatio; sourceH = newSourceH; }
         sourceX = Math.max(0, Math.min(imgWidth - sourceW, sourceX)); sourceY = Math.max(0, Math.min(imgHeight - sourceH, sourceY));
         sourceW = Math.max(1, Math.min(imgWidth, sourceW)); sourceH = Math.max(1, Math.min(imgHeight, sourceH));
         if (isNaN(sourceX) || isNaN(sourceY) || isNaN(sourceW) || isNaN(sourceH) || isNaN(targetX) || isNaN(targetY) || isNaN(targetW) || isNaN(targetH)) { console.error("drawImageWithTransform: NaN value detected", {sourceX, sourceY, sourceW, sourceH, targetX, targetY, targetW, targetH}); return; }
         targetCtx.drawImage(img, sourceX, sourceY, sourceW, sourceH, targetX, targetY, targetW, targetH);
    }

    // --- Initial Page Setup ---
    console.log("DOM Loaded. Initializing...");
    populatePresets();         // Fills dropdown, triggers initial handlePresetChange
    // updateGenerateButtonState is called within handlePresetChange now
    // drawLivePreview is called within handlePresetChange now
    console.log("Initialization complete.");

}); // End DOMContentLoaded