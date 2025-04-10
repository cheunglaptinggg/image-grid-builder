document.addEventListener('DOMContentLoaded', () => {
    // --- Get references ---
    // ... (keep previous references for photos, slots, sliders, main canvas etc.)
    const photoBatchInput = document.getElementById('photoBatchInput');
    const clearAllPhotosBtn = document.getElementById('clearAllPhotosBtn');
    const clearSlotBtns = document.querySelectorAll('.clear-slot-btn');
    const templatePresetSelect = document.getElementById('templatePresets');
    const customTemplateUploadDiv = document.getElementById('customTemplateUpload');
    const templateInput = document.getElementById('template');
    const selectedTemplatePreviewImg = document.getElementById('selectedTemplatePreviewImg'); // New
    // const previewTemplate = document.getElementById('previewTemplate'); // Old larger preview - removed from use
    const gridMarginsContainer = document.getElementById('gridMarginsContainer');
    const generateBtn = document.getElementById('generateBtn');
    const canvas = document.getElementById('canvas'); // Final output canvas
    const ctx = canvas.getContext('2d');
    const livePreviewCanvas = document.getElementById('livePreviewCanvas'); // New Live Preview
    const liveCtx = livePreviewCanvas.getContext('2d');                     // New Live Preview context
    const resultImage = document.getElementById('resultImage');
    const downloadLink = document.getElementById('downloadLink');
    const statusElem = document.getElementById('status');
    const mobileSaveHint = document.getElementById('mobileSaveHint');
    const gridMarginTopInput = document.getElementById('gridMarginTop');
    const gridMarginBottomInput = document.getElementById('gridMarginBottom');
    const gridMarginLeftInput = document.getElementById('gridMarginLeft');
    const gridMarginRightInput = document.getElementById('gridMarginRight');

    const MAX_PHOTOS = 4;
    // ... (keep existing state variables: photoFiles, photoImageObjects, imageTransforms, templateFile, templateImageObject)
    let photoFiles = Array(MAX_PHOTOS).fill(null);
    let photoImageObjects = Array(MAX_PHOTOS).fill(null);
    let imageTransforms = Array.from({ length: MAX_PHOTOS }, () => ({
        scale: 1, offsetX: 50, offsetY: 50, dataUrl: null
    }));
    let templateFile = null;
    let templateImageObject = null;


    const previewBgs = Array.from({ length: MAX_PHOTOS }, (_, i) => document.getElementById(`previewBg${i}`));
    const scaleSliders = document.querySelectorAll('.scale-slider');
    const offsetXSliders = document.querySelectorAll('.offset-slider-x');
    const offsetYSliders = document.querySelectorAll('.offset-slider-y');


    // --- Template Presets Definition (Same as before) ---
    const templatePresets = [
        { name: "Square Border (10px)", url: "templates/square_border.png", margins: { top: 10, bottom: 10, left: 10, right: 10 } },
        { name: "Portrait Header/Footer (50px)", url: "templates/Untitled-2.png", margins: { top: 140, bottom: 0, left: 0, right: 0 } },
        // Add more presets here
    ];

    // --- Utility: Debounce --- (Recommended for performance)
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


    // --- Populate Preset Dropdown (Same as before) ---
    function populatePresets() {
        templatePresets.forEach((preset, index) => {
            const option = document.createElement('option');
            option.value = index.toString();
            option.textContent = preset.name;
            templatePresetSelect.appendChild(option);
        });
        handlePresetChange(); // Initialize template state
    }

    // --- Helper Functions (Keep loadImage, updatePreviewBackground) ---
     function loadImage(src) { /* ... same ... */
        return new Promise((resolve, reject) => {
             const img = new Image();
             img.onload = () => resolve(img);
             img.onerror = (err) => reject(new Error(`Failed to load image: ${src.substring(0, 100)}...`));
             img.src = src;
         });
     }
    function updatePreviewBackground(index) { /* ... same ... */
         const transform = imageTransforms[index];
         const previewBg = previewBgs[index];
         if (previewBg && transform.dataUrl) {
             previewBg.style.backgroundImage = `url(${transform.dataUrl})`;
             previewBg.style.backgroundSize = `${transform.scale * 100}%`;
             previewBg.style.backgroundPosition = `${transform.offsetX}% ${transform.offsetY}%`;
         } else if (previewBg) {
             previewBg.style.backgroundImage = '';
         }
     }

    // --- Update Slot State (triggers live preview update) ---
    function setPhotoSlotState(index, file, dataUrl, imgObject) {
        photoFiles[index] = file;
        imageTransforms[index].dataUrl = dataUrl;
        photoImageObjects[index] = imgObject;

        const hasImage = !!imgObject;
        // Enable/disable controls
        if (scaleSliders[index]) scaleSliders[index].disabled = !hasImage;
        if (offsetXSliders[index]) offsetXSliders[index].disabled = !hasImage;
        if (offsetYSliders[index]) offsetYSliders[index].disabled = !hasImage;
        if (clearSlotBtns[index]) clearSlotBtns[index].style.display = hasImage ? 'inline-block' : 'none';

        if (hasImage) {
            // Reset transforms visually and internally on new image load
            imageTransforms[index] = { ...imageTransforms[index], scale: 1, offsetX: 50, offsetY: 50 }; // Keep dataUrl if needed
            if (scaleSliders[index]) scaleSliders[index].value = 1;
            if (offsetXSliders[index]) offsetXSliders[index].value = 50;
            if (offsetYSliders[index]) offsetYSliders[index].value = 50;
            updatePreviewBackground(index);
        } else {
             // Clear preview and reset transforms if image is cleared
             updatePreviewBackground(index);
             imageTransforms[index] = { scale: 1, offsetX: 50, offsetY: 50, dataUrl: null };
             if (scaleSliders[index]) scaleSliders[index].value = 1;
             if (offsetXSliders[index]) offsetXSliders[index].value = 50;
             if (offsetYSliders[index]) offsetYSliders[index].value = 50;
        }

        updateGenerateButtonState();
        drawLivePreview(); // Update live preview when photo state changes
    }

    // --- Clear Functions (triggers live preview update) ---
    function clearPhotoSlot(index) {
        setPhotoSlotState(index, null, null, null);
        statusElem.textContent = `Photo slot ${index + 1} cleared.`;
        drawLivePreview(); // Update live preview
    }

    function clearAllPhotoSlots() {
         photoBatchInput.value = '';
         for (let i = 0; i < MAX_PHOTOS; i++) {
             if (photoFiles[i] !== null) { // Only clear if not already empty
                setPhotoSlotState(i, null, null, null);
             }
         }
         statusElem.textContent = "All photo slots cleared.";
         drawLivePreview(); // Update live preview
    }

    // --- Margin Input Handling (triggers live preview update) ---
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

    const debouncedDrawLivePreview = debounce(drawLivePreview, 150); // Debounce frequent updates

    function handleMarginChange() {
        if (!gridMarginTopInput.disabled) { // Only update if custom template active
             debouncedDrawLivePreview();
        }
    }
    gridMarginTopInput.addEventListener('input', handleMarginChange);
    gridMarginBottomInput.addEventListener('input', handleMarginChange);
    gridMarginLeftInput.addEventListener('input', handleMarginChange);
    gridMarginRightInput.addEventListener('input', handleMarginChange);


    // --- Event Handlers ---

    // --- FIX: Batch Photo Upload ---
    photoBatchInput.addEventListener('change', async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        let filesToProcess = Array.from(files); // Take all selected initially
        let loadedCount = 0;
        let erroredCount = 0;
        let assignedCount = 0;

        statusElem.textContent = `Processing ${filesToProcess.length} photo(s)...`;
        generateBtn.disabled = true;

        const processingPromises = [];

        // Iterate through the files selected by the user
        for (const file of filesToProcess) {
            // Find the first available empty slot
            let targetSlotIndex = -1;
            for (let j = 0; j < MAX_PHOTOS; j++) {
                if (photoFiles[j] === null) { // Check if slot is truly empty
                    targetSlotIndex = j;
                    break; // Found an empty slot
                }
            }

            // If an empty slot is found AND we haven't assigned MAX_PHOTOS yet
            if (targetSlotIndex !== -1 && assignedCount < MAX_PHOTOS) {
                assignedCount++;
                const currentIndex = targetSlotIndex; // Capture index

                // Temporarily mark slot as 'pending' to prevent re-assignment in this loop run
                photoFiles[currentIndex] = 'pending';

                processingPromises.push(new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        try {
                            const dataUrl = e.target.result;
                            const img = await loadImage(dataUrl);
                            // Pass the original File object back
                            setPhotoSlotState(currentIndex, file, dataUrl, img);
                            loadedCount++;
                            resolve(true);
                        } catch (loadError) {
                            console.error(`Error loading image ${file.name}:`, loadError);
                            clearPhotoSlot(currentIndex); // Clear the failed slot
                            erroredCount++;
                            resolve(false);
                        }
                    };
                    reader.onerror = (err) => {
                        console.error(`Error reading file ${file.name}:`, err);
                        clearPhotoSlot(currentIndex); // Clear the failed slot
                        erroredCount++;
                        resolve(false);
                    }
                    reader.readAsDataURL(file);
                }));
            } else if (targetSlotIndex === -1) {
                // No more empty slots, stop trying to assign files
                break;
            }
        } // End loop through files

        // Wait for all reading/loading operations
        await Promise.all(processingPromises);

        let finalStatus = `Processed: Loaded ${loadedCount}, Failed ${erroredCount}.`;
        const excessFiles = files.length - assignedCount;
        if (excessFiles > 0) {
             finalStatus += ` ${excessFiles} file(s) ignored (max ${MAX_PHOTOS} slots filled).`;
        }
        statusElem.textContent = finalStatus;
        updateGenerateButtonState();
        // Clear the input value *after* processing so user can select same files again if needed
        photoBatchInput.value = '';
    });

    // Clear buttons (same as before, rely on clearPhotoSlot)
    clearSlotBtns.forEach(btn => { /* ... same ... */
         btn.addEventListener('click', (event) => {
            const index = parseInt(event.target.dataset.index, 10);
            clearPhotoSlot(index);
        });
    });
    clearAllPhotosBtn.addEventListener('click', clearAllPhotoSlots); /* ... same ... */


    // --- Template Handling (updates template preview and live preview) ---
    templatePresetSelect.addEventListener('change', handlePresetChange);

    async function handlePresetChange() {
        const selectedValue = templatePresetSelect.value;

        // Reset template state visually and internally
        templateImageObject = null;
        templateFile = null;
        selectedTemplatePreviewImg.src = '#'; // Clear small preview
        selectedTemplatePreviewImg.style.display = 'none';
        templateInput.value = ''; // Clear custom file input visually

        if (selectedValue === 'custom') {
            customTemplateUploadDiv.style.display = 'block';
            gridMarginsContainer.style.display = 'block';
            setMarginInputs({ top: 0, bottom: 0, left: 0, right: 0 }, false);
            statusElem.textContent = 'Upload a custom template PNG.';
            // Don't draw live preview until template is actually loaded
            liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height); // Clear live preview
        } else {
            customTemplateUploadDiv.style.display = 'none';
            gridMarginsContainer.style.display = 'block';

            const presetIndex = parseInt(selectedValue, 10);
            const preset = templatePresets[presetIndex];

            if (preset) {
                setMarginInputs(preset.margins, true);
                statusElem.textContent = `Loading preset template: ${preset.name}...`;
                generateBtn.disabled = true;
                try {
                    templateImageObject = await loadImage(preset.url);
                    templateFile = preset.url;
                    selectedTemplatePreviewImg.src = templateImageObject.src; // Update small preview
                    selectedTemplatePreviewImg.style.display = 'block';
                    statusElem.textContent = `Preset template "${preset.name}" loaded.`;
                    drawLivePreview(); // Update live preview with new template
                } catch (error) {
                    console.error("Error loading preset template:", error);
                    statusElem.textContent = `Error loading preset: ${error.message}.`;
                    templateImageObject = null;
                    liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height); // Clear live preview
                    setMarginInputs({ top: 0, bottom: 0, left: 0, right: 0 }, true); // Keep disabled
                }
            } else {
                 statusElem.textContent = 'Invalid preset selected.';
                 liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height); // Clear live preview
            }
        }
        updateGenerateButtonState();
    }

    // Custom Template Upload (updates template preview and live preview)
    templateInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        templatePresetSelect.value = 'custom'; // Switch dropdown
        // We don't call handlePresetChange here, manage state directly

        // Reset template state first
        templateImageObject = null;
        templateFile = null;
        selectedTemplatePreviewImg.src = '#';
        selectedTemplatePreviewImg.style.display = 'none';
        liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height); // Clear live preview
        customTemplateUploadDiv.style.display = 'block';
        gridMarginsContainer.style.display = 'block';


        if (file) {
            templateFile = file; // Store the File object
            const reader = new FileReader();
            reader.onload = async (e) => {
                // Keep selectedTemplatePreviewImg src as # until loaded? Or use data URL? Let's use dataURL for instant preview.
                // selectedTemplatePreviewImg.src = e.target.result; // Show data URL in small preview
                // selectedTemplatePreviewImg.style.display = 'block';
                statusElem.textContent = 'Loading custom template...';
                generateBtn.disabled = true;
                try {
                    templateImageObject = await loadImage(e.target.result);
                    statusElem.textContent = 'Custom template loaded.';
                    selectedTemplatePreviewImg.src = templateImageObject.src; // Show final loaded img src
                    selectedTemplatePreviewImg.style.display = 'block';
                    setMarginInputs({ // Reset margins to 0 for new custom template and enable
                        top: 0, bottom: 0, left: 0, right: 0
                    }, false);
                    drawLivePreview(); // Draw live preview with new template
                } catch (error) {
                    console.error(error);
                    statusElem.textContent = 'Error loading custom template. Please try another PNG.';
                    templateFile = null; templateImageObject = null;
                    selectedTemplatePreviewImg.src = '#'; selectedTemplatePreviewImg.style.display = 'none';
                    liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
                } finally {
                     updateGenerateButtonState();
                }
            }
            reader.readAsDataURL(file);
        } else {
            templateFile = null;
            templateImageObject = null;
             if (!statusElem.textContent.includes('Error')) {
                 statusElem.textContent = 'Custom template upload cancelled.';
             }
             updateGenerateButtonState();
        }
    });

    // --- Slider Controls (Use debounced live preview update) ---
    const debouncedSliderDrawLivePreview = debounce(drawLivePreview, 50); // Faster debounce for sliders?

    function handleSliderChange(event) {
        const index = parseInt(event.target.dataset.index, 10);
        const transformType = event.target.id.replace(/[0-9]/g, '');
        if (imageTransforms[index] && photoImageObjects[index]) {
            imageTransforms[index][transformType] = parseFloat(event.target.value);
            updatePreviewBackground(index); // Update individual small preview
            debouncedSliderDrawLivePreview(); // Update combined live preview (debounced)
        }
    }
    scaleSliders.forEach(slider => slider.addEventListener('input', handleSliderChange));
    offsetXSliders.forEach(slider => slider.addEventListener('input', handleSliderChange));
    offsetYSliders.forEach(slider => slider.addEventListener('input', handleSliderChange));


    // --- Update Generate Button State (Logic mostly the same) ---
    const updateGenerateButtonState = () => { /* ... same validation logic ... */
         const photosReadyCount = photoImageObjects.filter(img => img !== null).length;
         const templateReady = templateImageObject !== null;
         generateBtn.disabled = !(photosReadyCount > 0 && templateReady);
         // ... (optional refined status updates) ...
    };


    // --- Live Preview Drawing Function ---
    function drawLivePreview() {
        if (!templateImageObject) {
             liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
             return; // No template, can't draw preview
        }

        const templateW = templateImageObject.naturalWidth;
        const templateH = templateImageObject.naturalHeight;

        // Use current margin values from inputs
        const marginTop = parseInt(gridMarginTopInput.value, 10) || 0;
        const marginBottom = parseInt(gridMarginBottomInput.value, 10) || 0;
        const marginLeft = parseInt(gridMarginLeftInput.value, 10) || 0;
        const marginRight = parseInt(gridMarginRightInput.value, 10) || 0;

        const gridAreaX = marginLeft;
        const gridAreaY = marginTop;
        const gridAreaWidth = templateW - marginLeft - marginRight;
        const gridAreaHeight = templateH - marginTop - marginBottom;

        if (gridAreaWidth <= 0 || gridAreaHeight <= 0) {
            // Draw template but indicate error? Or just clear? Let's clear for now.
            liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
            console.warn("Invalid grid dimensions for live preview.");
            return;
        }

        // Resize canvas *before* drawing
        livePreviewCanvas.width = templateW;
        livePreviewCanvas.height = templateH;

        liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);

        const quadWidth = gridAreaWidth / 2;
        const quadHeight = gridAreaHeight / 2;

        const drawPositions = [ /* ... same as generate ... */
            { x: gridAreaX, y: gridAreaY },
            { x: gridAreaX + quadWidth, y: gridAreaY },
            { x: gridAreaX, y: gridAreaY + quadHeight },
            { x: gridAreaX + quadWidth, y: gridAreaY + quadHeight }
        ];

        // Draw photos currently loaded using their current transforms
        photoImageObjects.forEach((img, index) => {
            if (img) {
                const transform = imageTransforms[index];
                const pos = drawPositions[index];
                // Use the SAME drawing function as the final generate
                drawImageWithTransform(liveCtx, img, transform, pos.x, pos.y, quadWidth, quadHeight);
            }
        });

        // Draw template overlay last
        liveCtx.drawImage(templateImageObject, 0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
    }


    // --- Main Image Generation Function (No changes needed here, uses same logic) ---
    generateBtn.addEventListener('click', () => { /* ... same as previous version ... */
          // Check if *at least one* photo is loaded
         const photosLoaded = photoImageObjects.filter(img => img !== null);
         if (photosLoaded.length === 0 || !templateImageObject) {
            statusElem.textContent = 'Error: Need at least one photo and a template loaded.';
            updateGenerateButtonState();
            return;
        }

        statusElem.textContent = 'Generating... Please wait.';
        generateBtn.disabled = true;
        resultImage.src = '#';
        resultImage.style.display = 'none';
        downloadLink.style.display = 'none';
        downloadLink.href = '#';
        if (mobileSaveHint) mobileSaveHint.style.display = 'none';


        setTimeout(() => {
            if (downloadLink.dataset.objectUrl) {
                URL.revokeObjectURL(downloadLink.dataset.objectUrl);
                delete downloadLink.dataset.objectUrl;
            }

            try {
                const templateW = templateImageObject.naturalWidth;
                const templateH = templateImageObject.naturalHeight;

                // Use values from inputs (will be disabled if preset is active)
                const marginTop = parseInt(gridMarginTopInput.value, 10) || 0;
                const marginBottom = parseInt(gridMarginBottomInput.value, 10) || 0;
                const marginLeft = parseInt(gridMarginLeftInput.value, 10) || 0;
                const marginRight = parseInt(gridMarginRightInput.value, 10) || 0;

                const gridAreaX = marginLeft;
                const gridAreaY = marginTop;
                const gridAreaWidth = templateW - marginLeft - marginRight;
                const gridAreaHeight = templateH - marginTop - marginBottom;

                if (gridAreaWidth <= 0 || gridAreaHeight <= 0) {
                    throw new Error(`Invalid grid dimensions calculated. Check margins. Grid Area: ${gridAreaWidth}x${gridAreaHeight}`);
                }

                canvas.width = templateW; // Set final canvas size
                canvas.height = templateH;
                ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear final canvas

                const quadWidth = gridAreaWidth / 2;
                const quadHeight = gridAreaHeight / 2;

                const drawPositions = [ /* ... same positions ... */
                    { x: gridAreaX, y: gridAreaY },
                    { x: gridAreaX + quadWidth, y: gridAreaY },
                    { x: gridAreaX, y: gridAreaY + quadHeight },
                    { x: gridAreaX + quadWidth, y: gridAreaY + quadHeight }
                ];

                // Draw photos that are loaded onto final canvas
                photoImageObjects.forEach((img, index) => {
                    if (img) {
                        const transform = imageTransforms[index];
                        const pos = drawPositions[index];
                        drawImageWithTransform(ctx, img, transform, pos.x, pos.y, quadWidth, quadHeight); // Draw on final ctx
                    }
                });

                // Draw template overlay last onto final canvas
                ctx.drawImage(templateImageObject, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (!blob) { throw new Error('Canvas could not be converted to Blob.'); }
                    const objectUrl = URL.createObjectURL(blob);
                    downloadLink.href = objectUrl;
                    downloadLink.dataset.objectUrl = objectUrl;
                    downloadLink.style.display = 'inline-block';
                    resultImage.src = objectUrl;
                    resultImage.style.display = 'block';
                    if (mobileSaveHint) mobileSaveHint.style.display = 'block';
                    statusElem.textContent = 'Image generated successfully!';
                    updateGenerateButtonState(); // Allow re-generation
                }, 'image/png');

            } catch (error) {
                console.error("Error during canvas generation:", error);
                statusElem.textContent = `Error: ${error.message || 'Could not generate image.'}`;
                updateGenerateButtonState(); // Re-enable button after error
            }
        }, 50); // setTimeout
    });

    // --- drawImageWithTransform (Keep as before, ensures consistent drawing) ---
    function drawImageWithTransform(targetCtx, img, transform, targetX, targetY, targetW, targetH) {
        // ... (Same implementation as before) ...
         const imgWidth = img.naturalWidth;
         const imgHeight = img.naturalHeight;
         const scale = transform.scale;
         const offsetXRatio = transform.offsetX / 100;
         const offsetYRatio = transform.offsetY / 100;
         let sourceW = imgWidth / scale;
         let sourceH = imgHeight / scale;
         let sourceX = (imgWidth - sourceW) * offsetXRatio;
         let sourceY = (imgHeight - sourceH) * offsetYRatio;
         const targetAspect = targetW / targetH;
         const sourceAspect = sourceW / sourceH;

         if (sourceAspect > targetAspect) {
             const newSourceW = sourceH * targetAspect;
             sourceX += (sourceW - newSourceW) * offsetXRatio;
             sourceW = newSourceW;
         } else if (sourceAspect < targetAspect) {
             const newSourceH = sourceW / targetAspect;
             sourceY += (sourceH - newSourceH) * offsetYRatio;
             sourceH = newSourceH;
         }
         sourceX = Math.max(0, Math.min(imgWidth - sourceW, sourceX));
         sourceY = Math.max(0, Math.min(imgHeight - sourceH, sourceY));
         sourceW = Math.max(1, sourceW);
         sourceH = Math.max(1, sourceH);

         targetCtx.drawImage(img, sourceX, sourceY, sourceW, sourceH, targetX, targetY, targetW, targetH);
    }

    // --- Initial Setup ---
    populatePresets(); // Fills dropdown and initializes template state
    updateGenerateButtonState(); // Set initial button state
    // Initial draw of live preview (will likely be empty until template loads)
    drawLivePreview();

}); // End DOMContentLoaded