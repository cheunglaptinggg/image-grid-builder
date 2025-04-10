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
    let photoFiles = Array(MAX_PHOTOS).fill(null); // Stores original File objects or null
    let photoImageObjects = Array(MAX_PHOTOS).fill(null); // Stores loaded Image objects or null
    let imageTransforms = Array.from({ length: MAX_PHOTOS }, () => ({
        scale: 1, offsetX: 50, offsetY: 50, dataUrl: null // dataUrl used for individual slot previews
    }));
    let templateFile = null; // Stores the source: File object for custom, URL string for preset
    let templateImageObject = null; // Stores the loaded template Image object

    const previewBgs = Array.from({ length: MAX_PHOTOS }, (_, i) => document.getElementById(`previewBg${i}`));
    const scaleSliders = document.querySelectorAll('.scale-slider');
    const offsetXSliders = document.querySelectorAll('.offset-slider-x');
    const offsetYSliders = document.querySelectorAll('.offset-slider-y');

    // --- Template Presets Definition ---
    const templatePresets = [
        // --- IMPORTANT: Make sure these paths are correct relative to your index.html ---
        { name: "Square Border (10px)", url: "templates/square_border.png", margins: { top: 10, bottom: 10, left: 10, right: 10 } },
        { name: "Portrait Header (140px)", url: "templates/Untitled-2.png", margins: { top: 140, bottom: 0, left: 0, right: 0 } },
        // Add more presets here if needed
        // { name: "Another Template", url: "templates/another.png", margins: { top: 20, bottom: 20, left: 20, right: 20 } },
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
        handlePresetChange(); // Initialize template state based on default selection
    }

    // --- Helper: Load Image ---
     function loadImage(src) {
        return new Promise((resolve, reject) => {
             const img = new Image();
             // Note: crossOrigin = "Anonymous" is often needed if loading *directly* from
             // a different domain *with* CORS headers, but less relevant when using data URLs.
             // Keep commented out unless specific CORS issues arise with a complex setup.
             // img.crossOrigin = "Anonymous";
             img.onload = () => resolve(img);
             img.onerror = (err) => reject(new Error(`Failed to load image object from source: ${src.substring(0, 100)}...`));
             img.src = src; // src will be a data:URL for both presets and uploads
         });
     }

    // --- Helper: Update Individual Slot Preview Background ---
    function updatePreviewBackground(index) {
         const transform = imageTransforms[index];
         const previewBg = previewBgs[index];
         if (previewBg && transform.dataUrl) {
             previewBg.style.backgroundImage = `url(${transform.dataUrl})`;
             previewBg.style.backgroundSize = `${transform.scale * 100}%`;
             previewBg.style.backgroundPosition = `${transform.offsetX}% ${transform.offsetY}%`;
         } else if (previewBg) {
             previewBg.style.backgroundImage = ''; // Clear if no dataUrl
         }
     }

    // --- Helper: Update Full Slot State (UI & Internal) ---
    function setPhotoSlotState(index, file, dataUrl, imgObject) {
        photoFiles[index] = file; // Store original File object or null
        imageTransforms[index].dataUrl = dataUrl; // Store dataUrl for small preview
        photoImageObjects[index] = imgObject; // Store loaded Image object

        const hasImage = !!imgObject;

        // Enable/disable controls
        if (scaleSliders[index]) scaleSliders[index].disabled = !hasImage;
        if (offsetXSliders[index]) offsetXSliders[index].disabled = !hasImage;
        if (offsetYSliders[index]) offsetYSliders[index].disabled = !hasImage;
        if (clearSlotBtns[index]) clearSlotBtns[index].style.display = hasImage ? 'inline-block' : 'none';

        if (hasImage) {
            // Reset transforms visually and internally *only if this is a new image*
            // Check if the dataUrl actually changed or if it was just a transform update
             if (file !== photoFiles[index] || !imageTransforms[index].scale) { // Crude check for new image load
                imageTransforms[index] = { ...imageTransforms[index], scale: 1, offsetX: 50, offsetY: 50 }; // Reset transform, keep dataUrl
                if (scaleSliders[index]) scaleSliders[index].value = 1;
                if (offsetXSliders[index]) offsetXSliders[index].value = 50;
                if (offsetYSliders[index]) offsetYSliders[index].value = 50;
            }
            updatePreviewBackground(index); // Update small preview regardless
        } else {
             // Clear preview and reset transforms state if image is cleared
             updatePreviewBackground(index);
             imageTransforms[index] = { scale: 1, offsetX: 50, offsetY: 50, dataUrl: null };
             if (scaleSliders[index]) scaleSliders[index].value = 1;
             if (offsetXSliders[index]) offsetXSliders[index].value = 50;
             if (offsetYSliders[index]) offsetYSliders[index].value = 50;
        }

        updateGenerateButtonState(); // Check if ready to generate
        drawLivePreview(); // Update the main live preview canvas
    }

    // --- Clear Functions ---
    function clearPhotoSlot(index) {
        // Check if the slot actually has content before proceeding
        if (photoFiles[index] !== null || photoImageObjects[index] !== null) {
            setPhotoSlotState(index, null, null, null);
            statusElem.textContent = `Photo slot ${index + 1} cleared.`;
            drawLivePreview();
        }
    }

    function clearAllPhotoSlots() {
         let cleared = false;
         photoBatchInput.value = ''; // Clear file input selection visually
         for (let i = 0; i < MAX_PHOTOS; i++) {
             if (photoFiles[i] !== null || photoImageObjects[i] !== null) {
                setPhotoSlotState(i, null, null, null);
                cleared = true;
             }
         }
         if (cleared) {
            statusElem.textContent = "All photo slots cleared.";
            drawLivePreview();
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

    // Debounced version for frequent updates (sliders, margins)
    const debouncedDrawLivePreview = debounce(drawLivePreview, 150);

    // Listener for margin changes (only acts if margins are enabled)
    function handleMarginChange() {
        if (!gridMarginTopInput.disabled) {
             debouncedDrawLivePreview();
        }
    }
    gridMarginTopInput.addEventListener('input', handleMarginChange);
    gridMarginBottomInput.addEventListener('input', handleMarginChange);
    gridMarginLeftInput.addEventListener('input', handleMarginChange);
    gridMarginRightInput.addEventListener('input', handleMarginChange);

    // --- Event Handlers ---

    // Batch Photo Upload
    photoBatchInput.addEventListener('change', async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        let filesToProcess = Array.from(files);
        let loadedCount = 0;
        let erroredCount = 0;
        let assignedCount = 0;

        statusElem.textContent = `Processing ${filesToProcess.length} photo(s)...`;
        generateBtn.disabled = true; // Disable while loading

        const processingPromises = [];

        for (const file of filesToProcess) {
            let targetSlotIndex = -1;
            for (let j = 0; j < MAX_PHOTOS; j++) {
                if (photoFiles[j] === null && photoImageObjects[j] === null) { // Find first truly empty slot
                    targetSlotIndex = j;
                    break;
                }
            }

            if (targetSlotIndex !== -1 && assignedCount < MAX_PHOTOS) {
                assignedCount++;
                const currentIndex = targetSlotIndex;

                // Mark slot as pending to prevent re-assignment *during this synchronous loop*
                photoFiles[currentIndex] = 'pending';

                processingPromises.push(new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        try {
                            const dataUrl = e.target.result; // Get data URL (safe origin)
                            const img = await loadImage(dataUrl); // Load Image object from data URL
                            setPhotoSlotState(currentIndex, file, dataUrl, img); // Update state with File, dataUrl, Image
                            loadedCount++;
                            resolve(true);
                        } catch (loadError) {
                            console.error(`Error loading image ${file.name}:`, loadError);
                            // Ensure the slot is fully cleared on error before resolving
                            setPhotoSlotState(currentIndex, null, null, null);
                            erroredCount++;
                            resolve(false);
                        }
                    };
                    reader.onerror = (err) => {
                        console.error(`Error reading file ${file.name}:`, err);
                         // Ensure the slot is fully cleared on error before resolving
                        setPhotoSlotState(currentIndex, null, null, null);
                        erroredCount++;
                        resolve(false);
                    }
                    reader.readAsDataURL(file); // Read the user's file
                }));
            } else if (targetSlotIndex === -1) {
                break; // Stop trying if no more slots
            }
        } // End file loop

        await Promise.all(processingPromises); // Wait for all reads/loads

        let finalStatus = `Processed: Loaded ${loadedCount}, Failed ${erroredCount}.`;
        const excessFiles = files.length - assignedCount;
        if (excessFiles > 0) {
             finalStatus += ` ${excessFiles} file(s) ignored (max ${MAX_PHOTOS} slots).`;
        }
        statusElem.textContent = finalStatus;
        updateGenerateButtonState(); // Re-evaluate button state
        photoBatchInput.value = ''; // Clear input selection *after* processing
    });

    // Clear Individual Slot Button
    clearSlotBtns.forEach(btn => {
         btn.addEventListener('click', (event) => {
            const index = parseInt(event.target.dataset.index, 10);
            clearPhotoSlot(index);
        });
    });

    // Clear All Photos Button
    clearAllPhotosBtn.addEventListener('click', clearAllPhotoSlots);

    // --- Template Selection Handling ---
    templatePresetSelect.addEventListener('change', handlePresetChange);

    async function handlePresetChange() {
        const selectedValue = templatePresetSelect.value;

        // Reset common template state (visuals, loaded object)
        templateImageObject = null;
        selectedTemplatePreviewImg.src = '#';
        selectedTemplatePreviewImg.style.display = 'none';
        liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);

        if (selectedValue === 'custom') {
            // Handle switching TO custom
            customTemplateUploadDiv.style.display = 'block';
            gridMarginsContainer.style.display = 'block';
            setMarginInputs({ top: 0, bottom: 0, left: 0, right: 0 }, false); // Enable margins
            statusElem.textContent = 'Select or upload a custom template PNG.';
            templateFile = null; // Clear preset URL identifier

            // If a custom file *was* previously loaded and is still the active selection, restore it
            const potentialCustomFile = templateInput.files && templateInput.files[0];
            if (potentialCustomFile) {
                // Re-trigger the load logic for the existing custom file
                await loadCustomTemplate(potentialCustomFile);
            } else {
                // No custom file selected, ensure template is truly null
                templateImageObject = null;
                templateFile = null; // Ensure identifier is null
            }

        } else {
            // --- Handle Selecting a Preset ---
            customTemplateUploadDiv.style.display = 'none';
            gridMarginsContainer.style.display = 'block'; // Keep margins visible (but disabled)

            // Clear custom file input visually if user switches *away* from custom
            templateInput.value = '';

            const presetIndex = parseInt(selectedValue, 10);
            const preset = templatePresets[presetIndex];

            if (preset) {
                setMarginInputs(preset.margins, true); // Set preset margins & disable editing
                statusElem.textContent = `Loading preset: ${preset.name}...`;
                generateBtn.disabled = true; // Disable generate while loading template
                templateFile = preset.url; // Store preset URL as identifier

                try {
                    // ** TAINTED CANVAS FIX **
                    // Fetch preset blob, convert to data URL, then load Image object
                    const response = await fetch(preset.url);
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status} for ${preset.url}`);
                    }
                    const imageBlob = await response.blob();

                    const dataUrl = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.onerror = (err) => reject(new Error("Failed to read image blob as data URL."));
                        reader.readAsDataURL(imageBlob);
                    });

                    // Load the Image from the safe data URL
                    templateImageObject = await loadImage(dataUrl);

                    // Update UI
                    selectedTemplatePreviewImg.src = templateImageObject.src; // dataUrl works fine
                    selectedTemplatePreviewImg.style.display = 'block';
                    statusElem.textContent = `Preset template "${preset.name}" loaded.`;
                    drawLivePreview();

                } catch (error) {
                    console.error("Error loading preset template:", error);
                    statusElem.textContent = `Error loading preset: ${error.message}. Check path/file.`;
                    // Reset state fully on error
                    templateImageObject = null;
                    templateFile = null;
                    selectedTemplatePreviewImg.src = '#';
                    selectedTemplatePreviewImg.style.display = 'none';
                    liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
                    setMarginInputs({ top: 0, bottom: 0, left: 0, right: 0 }, true); // Keep disabled
                } finally {
                     generateBtn.disabled = false; // Re-enable button only if generate logic allows
                     updateGenerateButtonState(); // Recalculate true button state
                }
            } else {
                 statusElem.textContent = 'Invalid preset selected.';
                 templateFile = null; // Clear identifier
                 // Keep margins disabled? Or enable? Let's keep disabled.
                 setMarginInputs({ top: 0, bottom: 0, left: 0, right: 0 }, true);
            }
        }
        // Final state check regardless of path
        updateGenerateButtonState();
    }

    // Listener for Custom Template Upload
    templateInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            templatePresetSelect.value = 'custom'; // Ensure dropdown reflects custom state
            await loadCustomTemplate(file); // Use helper function
        } else {
            // File input was cleared by user action
            templatePresetSelect.value = 'custom'; // Ensure custom selected
            handlePresetChange(); // Re-run custom logic (clears template object)
        }
    });

    // Helper function to load a custom template File object
    async function loadCustomTemplate(file) {
        // Reset template state before loading
        templateImageObject = null;
        templateFile = null;
        selectedTemplatePreviewImg.src = '#';
        selectedTemplatePreviewImg.style.display = 'none';
        liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
        customTemplateUploadDiv.style.display = 'block'; // Ensure visible
        gridMarginsContainer.style.display = 'block';  // Ensure visible

        templateFile = file; // Store the File object as the identifier
        const reader = new FileReader();

        // Show pending state
        statusElem.textContent = 'Loading custom template...';
        generateBtn.disabled = true;
        setMarginInputs({ top: 0, bottom: 0, left: 0, right: 0 }, true); // Disable margins while loading

        try {
            const dataUrl = await new Promise((resolve, reject) => {
                 reader.onload = (e) => resolve(e.target.result);
                 reader.onerror = (err) => reject(new Error("Failed to read custom file."));
                 reader.readAsDataURL(file); // Read the custom file
             });

            // Load the image from the data URL (guaranteed same-origin)
            templateImageObject = await loadImage(dataUrl);

            // Update UI on success
            statusElem.textContent = 'Custom template loaded.';
            selectedTemplatePreviewImg.src = templateImageObject.src;
            selectedTemplatePreviewImg.style.display = 'block';
            setMarginInputs({ top: 0, bottom: 0, left: 0, right: 0 }, false); // Reset margins & *enable*
            drawLivePreview();

        } catch (error) {
            console.error("Error processing custom template:", error);
            statusElem.textContent = `Error: ${error.message}. Invalid image file?`;
            templateFile = null; templateImageObject = null; // Reset fully
            selectedTemplatePreviewImg.src = '#'; selectedTemplatePreviewImg.style.display = 'none';
            liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
            setMarginInputs({ top: 0, bottom: 0, left: 0, right: 0 }, false); // Ensure margins are enabled
        } finally {
             updateGenerateButtonState(); // Update button state
        }
    }


    // --- Slider Controls ---
    const debouncedSliderDrawLivePreview = debounce(drawLivePreview, 50); // Debounce slider updates

    function handleSliderChange(event) {
        const index = parseInt(event.target.dataset.index, 10);
        const transformType = event.target.id.replace(/[0-9]/g, ''); // 'scale', 'offsetX', 'offsetY'
        if (imageTransforms[index] && photoImageObjects[index]) { // Only if image exists
            imageTransforms[index][transformType] = parseFloat(event.target.value);
            updatePreviewBackground(index);         // Update individual small preview
            debouncedSliderDrawLivePreview();       // Update combined live preview (debounced)
        }
    }
    scaleSliders.forEach(slider => slider.addEventListener('input', handleSliderChange));
    offsetXSliders.forEach(slider => slider.addEventListener('input', handleSliderChange));
    offsetYSliders.forEach(slider => slider.addEventListener('input', handleSliderChange));


    // --- Update Generate Button State ---
    const updateGenerateButtonState = () => {
         const photosReadyCount = photoImageObjects.filter(img => img !== null).length;
         const templateReady = templateImageObject !== null;

         // Enable only if at least one photo AND a template are fully loaded
         generateBtn.disabled = !(photosReadyCount > 0 && templateReady);

         // Basic status messaging (can be expanded)
         if (!generateBtn.disabled && !statusElem.textContent.startsWith('Error') && !statusElem.textContent.includes('generated')) {
            // statusElem.textContent = 'Ready to generate.';
         } else if (statusElem.textContent.includes('Loading') || statusElem.textContent.includes('Processing')) {
            // Keep loading message
         } else if (statusElem.textContent.includes('Error') || statusElem.textContent.includes('Failed')) {
             // Keep error message
         }
    };


    // --- Live Preview Drawing ---
    function drawLivePreview() {
        if (!templateImageObject) {
             // If no template is loaded, ensure the preview canvas is cleared
             liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
             livePreviewCanvas.width = 1; // Reset to minimal size? Or keep last? Keep for now.
             livePreviewCanvas.height = 1;
             return;
        }

        const templateW = templateImageObject.naturalWidth;
        const templateH = templateImageObject.naturalHeight;

        // Must resize canvas *before* getting context drawing properties or drawing
        if (livePreviewCanvas.width !== templateW) livePreviewCanvas.width = templateW;
        if (livePreviewCanvas.height !== templateH) livePreviewCanvas.height = templateH;

        // Get current margin values from inputs
        const marginTop = parseInt(gridMarginTopInput.value, 10) || 0;
        const marginBottom = parseInt(gridMarginBottomInput.value, 10) || 0;
        const marginLeft = parseInt(gridMarginLeftInput.value, 10) || 0;
        const marginRight = parseInt(gridMarginRightInput.value, 10) || 0;

        const gridAreaX = marginLeft;
        const gridAreaY = marginTop;
        const gridAreaWidth = templateW - marginLeft - marginRight;
        const gridAreaHeight = templateH - marginTop - marginBottom;

        // Clear the canvas for redraw
        liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);

        if (gridAreaWidth <= 0 || gridAreaHeight <= 0) {
            // Optionally draw template with a warning overlay if margins are invalid
            liveCtx.drawImage(templateImageObject, 0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
            console.warn("Invalid grid dimensions for live preview.");
             // Draw a red X or something?
             liveCtx.strokeStyle = 'red';
             liveCtx.lineWidth = 3;
             liveCtx.beginPath();
             liveCtx.moveTo(gridAreaX, gridAreaY);
             liveCtx.lineTo(gridAreaX + gridAreaWidth, gridAreaY + gridAreaHeight);
             liveCtx.moveTo(gridAreaX + gridAreaWidth, gridAreaY);
             liveCtx.lineTo(gridAreaX, gridAreaY + gridAreaHeight);
             liveCtx.stroke();
            return; // Stop drawing if grid invalid
        }


        const quadWidth = gridAreaWidth / 2;
        const quadHeight = gridAreaHeight / 2;

        const drawPositions = [
            { x: gridAreaX, y: gridAreaY },                           // Top-Left
            { x: gridAreaX + quadWidth, y: gridAreaY },               // Top-Right
            { x: gridAreaX, y: gridAreaY + quadHeight },              // Bottom-Left
            { x: gridAreaX + quadWidth, y: gridAreaY + quadHeight }   // Bottom-Right
        ];

        // Draw loaded photos using their current transforms onto live canvas
        photoImageObjects.forEach((img, index) => {
            if (img) { // Only draw if the image object exists
                const transform = imageTransforms[index];
                const pos = drawPositions[index];
                drawImageWithTransform(liveCtx, img, transform, pos.x, pos.y, quadWidth, quadHeight);
            }
        });

        // Draw template overlay last
        liveCtx.drawImage(templateImageObject, 0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
    }


    // --- Main Image Generation on Click ---
    generateBtn.addEventListener('click', () => {
         // Final checks before generating
         const photosLoaded = photoImageObjects.filter(img => img !== null);
         if (photosLoaded.length === 0 || !templateImageObject) {
            statusElem.textContent = 'Error: Need at least one photo and a template loaded.';
            updateGenerateButtonState(); // Update button just in case
            return;
        }

        statusElem.textContent = 'Generating... Please wait.';
        generateBtn.disabled = true; // Disable during generation
        resultImage.src = '#'; // Clear previous result visually
        resultImage.style.display = 'none';
        downloadLink.style.display = 'none';
        downloadLink.href = '#';
        if (mobileSaveHint) mobileSaveHint.style.display = 'none'; // Hide hint

        // Use setTimeout to allow UI to update (show "Generating...")
        setTimeout(() => {
            // Revoke previous object URL to prevent memory leaks
            if (downloadLink.dataset.objectUrl) {
                URL.revokeObjectURL(downloadLink.dataset.objectUrl);
                delete downloadLink.dataset.objectUrl;
            }

            try {
                const templateW = templateImageObject.naturalWidth;
                const templateH = templateImageObject.naturalHeight;

                // Get final margin values from inputs
                const marginTop = parseInt(gridMarginTopInput.value, 10) || 0;
                const marginBottom = parseInt(gridMarginBottomInput.value, 10) || 0;
                const marginLeft = parseInt(gridMarginLeftInput.value, 10) || 0;
                const marginRight = parseInt(gridMarginRightInput.value, 10) || 0;

                const gridAreaX = marginLeft;
                const gridAreaY = marginTop;
                const gridAreaWidth = templateW - marginLeft - marginRight;
                const gridAreaHeight = templateH - marginTop - marginBottom;

                if (gridAreaWidth <= 0 || gridAreaHeight <= 0) {
                    throw new Error(`Invalid grid dimensions. Check margins. Grid Area: ${gridAreaWidth}x${gridAreaHeight}`);
                }

                // Set FINAL canvas size
                canvas.width = templateW;
                canvas.height = templateH;
                ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear final canvas

                const quadWidth = gridAreaWidth / 2;
                const quadHeight = gridAreaHeight / 2;

                const drawPositions = [ // Same positions as live preview
                    { x: gridAreaX, y: gridAreaY },
                    { x: gridAreaX + quadWidth, y: gridAreaY },
                    { x: gridAreaX, y: gridAreaY + quadHeight },
                    { x: gridAreaX + quadWidth, y: gridAreaY + quadHeight }
                ];

                // Draw loaded photos onto final canvas (ctx)
                photoImageObjects.forEach((img, index) => {
                    if (img) {
                        const transform = imageTransforms[index];
                        const pos = drawPositions[index];
                        drawImageWithTransform(ctx, img, transform, pos.x, pos.y, quadWidth, quadHeight);
                    }
                });

                // Draw template overlay last onto final canvas
                ctx.drawImage(templateImageObject, 0, 0, canvas.width, canvas.height);

                // Export final canvas as Blob for download/display
                canvas.toBlob((blob) => {
                    if (!blob) { throw new Error('Canvas could not be converted to Blob.'); }
                    const objectUrl = URL.createObjectURL(blob);

                    // Update result display and download link
                    downloadLink.href = objectUrl;
                    downloadLink.dataset.objectUrl = objectUrl; // Store for revocation
                    downloadLink.style.display = 'inline-block';
                    resultImage.src = objectUrl; // Use Blob URL for result img too
                    resultImage.style.display = 'block';
                    if (mobileSaveHint) mobileSaveHint.style.display = 'block'; // Show mobile hint
                    statusElem.textContent = 'Image generated successfully!';
                    updateGenerateButtonState(); // Allow re-generation (might re-enable button)

                }, 'image/png'); // Specify format

            } catch (error) {
                console.error("Error during final canvas generation:", error);
                statusElem.textContent = `Error generating: ${error.message}`;
                updateGenerateButtonState(); // Re-enable button after error
            }
        }, 50); // End setTimeout
    });

    // --- Core Drawing Function (Used by both Live Preview and Final Generate) ---
    function drawImageWithTransform(targetCtx, img, transform, targetX, targetY, targetW, targetH) {
        // Check for valid dimensions
        if (!img || !targetCtx || targetW <= 0 || targetH <= 0) {
             console.warn("drawImageWithTransform: Invalid parameters.", {img, targetCtx, targetW, targetH});
             return;
         }

        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        const scale = Math.max(transform.scale, 0.1); // Prevent scale 0 or negative
        const offsetXRatio = transform.offsetX / 100;
        const offsetYRatio = transform.offsetY / 100;

        // Calculate the source rectangle dimensions based on scale
        let sourceW = imgWidth / scale;
        let sourceH = imgHeight / scale;

        // Calculate the source rectangle top-left corner based on offset
        let sourceX = (imgWidth - sourceW) * offsetXRatio;
        let sourceY = (imgHeight - sourceH) * offsetYRatio;

        // Aspect Ratio Correction (Fit source rectangle to target aspect ratio)
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

        // Clamp source coordinates/dimensions to be valid and within the image
        sourceX = Math.max(0, Math.min(imgWidth - sourceW, sourceX));
        sourceY = Math.max(0, Math.min(imgHeight - sourceH, sourceY));
        sourceW = Math.max(1, Math.min(imgWidth, sourceW)); // Ensure width > 0 and not > img width
        sourceH = Math.max(1, Math.min(imgHeight, sourceH)); // Ensure height > 0 and not > img height

         // Final check for NaN values before drawing (can happen with extreme scales/calcs)
         if (isNaN(sourceX) || isNaN(sourceY) || isNaN(sourceW) || isNaN(sourceH) ||
             isNaN(targetX) || isNaN(targetY) || isNaN(targetW) || isNaN(targetH)) {
              console.error("drawImageWithTransform: NaN value detected, skipping draw.",
               {sourceX, sourceY, sourceW, sourceH, targetX, targetY, targetW, targetH});
              return;
          }


        targetCtx.drawImage(
            img,       // Source image object
            sourceX,   // Source X coordinate
            sourceY,   // Source Y coordinate
            sourceW,   // Source Width
            sourceH,   // Source Height
            targetX,   // Target X on canvas
            targetY,   // Target Y on canvas
            targetW,   // Target Width on canvas
            targetH    // Target Height on canvas
        );
    }

    // --- Initial Page Setup ---
    populatePresets();         // Fills dropdown, triggers initial handlePresetChange
    updateGenerateButtonState(); // Sets initial button state
    drawLivePreview();         // Initial draw (likely empty until template loads)

}); // End DOMContentLoaded