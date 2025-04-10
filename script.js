document.addEventListener('DOMContentLoaded', () => {
    // --- Get references ---
    const photoBatchInput = document.getElementById('photoBatchInput');
    const clearAllPhotosBtn = document.getElementById('clearAllPhotosBtn');
    const clearSlotBtns = document.querySelectorAll('.clear-slot-btn');
    const templatePresetSelect = document.getElementById('templatePresets');
    const customTemplateUploadDiv = document.getElementById('customTemplateUpload');
    const templateInput = document.getElementById('template');
    const previewTemplate = document.getElementById('previewTemplate');
    const gridMarginsContainer = document.getElementById('gridMarginsContainer');
    const generateBtn = document.getElementById('generateBtn');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const resultImage = document.getElementById('resultImage');
    const downloadLink = document.getElementById('downloadLink');
    const statusElem = document.getElementById('status');
    const mobileSaveHint = document.getElementById('mobileSaveHint');
    const gridMarginTopInput = document.getElementById('gridMarginTop');
    const gridMarginBottomInput = document.getElementById('gridMarginBottom');
    const gridMarginLeftInput = document.getElementById('gridMarginLeft');
    const gridMarginRightInput = document.getElementById('gridMarginRight');

    const MAX_PHOTOS = 4;
    const photoSlots = document.querySelectorAll('.photo-slot'); // Get all slots
    const scaleSliders = document.querySelectorAll('.scale-slider');
    const offsetXSliders = document.querySelectorAll('.offset-slider-x');
    const offsetYSliders = document.querySelectorAll('.offset-slider-y');
    const previewBgs = Array.from({ length: MAX_PHOTOS }, (_, i) => document.getElementById(`previewBg${i}`));

    // --- State Management ---
    let photoFiles = Array(MAX_PHOTOS).fill(null);
    let photoImageObjects = Array(MAX_PHOTOS).fill(null);
    let imageTransforms = Array.from({ length: MAX_PHOTOS }, () => ({
        scale: 1, offsetX: 50, offsetY: 50, dataUrl: null
    }));
    let templateFile = null; // Can be File object or URL string for presets
    let templateImageObject = null;

    // --- Template Presets Definition ---
    const templatePresets = [
        {
            name: "Portrait Header (140px)",
            url: "templates/Untitled-2.png", // PATH TO YOUR FILE
            margins: { top: 140, bottom: 0, left: 0, right: 0 }
        },
	{
            name: "Portrait Footer (140px)",
            url: "templates/portrait_header_footer.png", // PATH TO YOUR FILE
            margins: { top: 0, bottom: 140, left: 0, right: 0 }
        },
        // Add more presets here as needed
        // { name: "...", url: "templates/...", margins: { ... } }
    ];

    // --- Populate Preset Dropdown ---
    function populatePresets() {
        templatePresets.forEach((preset, index) => {
            const option = document.createElement('option');
            option.value = index.toString(); // Use index as value
            option.textContent = preset.name;
            templatePresetSelect.appendChild(option);
        });
        // Set initial state based on dropdown (default is "custom")
        handlePresetChange();
    }

    // --- Helper Functions ---
    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            // Crucial for loading local preset files without tainting canvas if hosted simply
            // Might not be needed if properly hosted or if using data URLs, but good practice.
            // img.crossOrigin = "Anonymous";
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(new Error(`Failed to load image: ${src.substring(0, 100)}...`));
            img.src = src;
        });
    }

    function updatePreviewBackground(index) {
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

    function setPhotoSlotState(index, file, dataUrl, imgObject) {
        photoFiles[index] = file;
        imageTransforms[index].dataUrl = dataUrl;
        photoImageObjects[index] = imgObject;

        const hasImage = !!imgObject;
        // Enable/disable controls
        scaleSliders[index].disabled = !hasImage;
        offsetXSliders[index].disabled = !hasImage;
        offsetYSliders[index].disabled = !hasImage;
        clearSlotBtns[index].style.display = hasImage ? 'inline-block' : 'none';

        if (hasImage) {
            // Reset transforms visually and internally on new image load
            imageTransforms[index].scale = 1;
            imageTransforms[index].offsetX = 50;
            imageTransforms[index].offsetY = 50;
            scaleSliders[index].value = 1;
            offsetXSliders[index].value = 50;
            offsetYSliders[index].value = 50;
            updatePreviewBackground(index);
        } else {
             // Clear preview and reset transforms if image is cleared
             updatePreviewBackground(index); // Clear background
             imageTransforms[index] = { scale: 1, offsetX: 50, offsetY: 50, dataUrl: null };
             scaleSliders[index].value = 1;
             offsetXSliders[index].value = 50;
             offsetYSliders[index].value = 50;
        }

        updateGenerateButtonState();
    }

    function clearPhotoSlot(index) {
        // Clear file input visually if possible (though tricky with batch)
        // photoBatchInput.value = ''; // This clears ALL selected files in the batch input
        setPhotoSlotState(index, null, null, null);
        statusElem.textContent = `Photo slot ${index + 1} cleared.`;
    }

    function clearAllPhotoSlots() {
         photoBatchInput.value = ''; // Clear the file input selection
         for (let i = 0; i < MAX_PHOTOS; i++) {
             setPhotoSlotState(i, null, null, null);
         }
         statusElem.textContent = "All photo slots cleared.";
    }

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

    // --- Event Handlers ---

    // Batch Photo Upload
    photoBatchInput.addEventListener('change', async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) {
            // No files selected or input cleared
            return;
        }

        let filesToProcess = Array.from(files).slice(0, MAX_PHOTOS); // Limit to 4
        let loadedCount = 0;
        let erroredCount = 0;

        statusElem.textContent = `Loading ${filesToProcess.length} photo(s)...`;
        generateBtn.disabled = true; // Disable while loading

        const processingPromises = []; // Track loading progress

        for (let i = 0; i < MAX_PHOTOS; i++) {
            // Find the next available slot
            let targetSlotIndex = -1;
            for (let j = 0; j < MAX_PHOTOS; j++) {
                if (photoFiles[j] === null) { // Check if slot is empty
                    targetSlotIndex = j;
                    break;
                }
            }

            if (targetSlotIndex !== -1 && filesToProcess.length > 0) {
                const file = filesToProcess.shift(); // Get the next file
                const currentIndex = targetSlotIndex; // Capture index for async context

                processingPromises.push(new Promise(async (resolve) => {
                    try {
                        const reader = new FileReader();
                        reader.onload = async (e) => {
                            try {
                                const dataUrl = e.target.result;
                                const img = await loadImage(dataUrl);
                                setPhotoSlotState(currentIndex, file, dataUrl, img);
                                loadedCount++;
                                resolve(true); // Success
                            } catch (loadError) {
                                console.error(`Error loading image ${file.name}:`, loadError);
                                // Don't set state for this slot, leave it clear or as it was
                                erroredCount++;
                                resolve(false); // Failure
                            }
                        };
                         reader.onerror = (err) => {
                             console.error(`Error reading file ${file.name}:`, err);
                             erroredCount++;
                             resolve(false); // Failure
                         }
                        reader.readAsDataURL(file);

                    } catch (outerError) {
                        console.error(`Error processing file ${file?.name || 'unknown'}:`, outerError);
                        erroredCount++;
                        resolve(false); // Failure
                    }
                 }));
             }
             // Break loop if no more files or no more slots
             if (filesToProcess.length === 0) break;
        }

         // Wait for all files to finish processing (reading and loading)
         await Promise.all(processingPromises);

         // Update status after all processing attempts
         let finalStatus = `Loaded ${loadedCount} photo(s).`;
         if (erroredCount > 0) {
             finalStatus += ` Failed to load ${erroredCount}.`;
         }
         const remainingFiles = files.length - loadedCount - erroredCount;
         if (remainingFiles > 0) {
            finalStatus += ` Ignored ${remainingFiles} extra file(s) (max 4).`;
         }
         statusElem.textContent = finalStatus;
         updateGenerateButtonState();
         // Don't clear photoBatchInput.value here, allows user to see selection
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


    // Template Preset Selection
    templatePresetSelect.addEventListener('change', handlePresetChange);

    async function handlePresetChange() {
        const selectedValue = templatePresetSelect.value;

        // Reset template state
        templateImageObject = null;
        templateFile = null; // Clear file object if switching from custom
        previewTemplate.src = '#';
        previewTemplate.style.display = 'none';
        templateInput.value = ''; // Clear custom file input

        if (selectedValue === 'custom') {
            customTemplateUploadDiv.style.display = 'block';
            gridMarginsContainer.style.display = 'block'; // Show margin inputs
            setMarginInputs({ top: 0, bottom: 0, left: 0, right: 0 }, false); // Enable margins
            statusElem.textContent = 'Upload a custom template PNG.';
        } else {
            customTemplateUploadDiv.style.display = 'none'; // Hide custom upload
            gridMarginsContainer.style.display = 'block'; // Ensure visible

            const presetIndex = parseInt(selectedValue, 10);
            const preset = templatePresets[presetIndex];

            if (preset) {
                setMarginInputs(preset.margins, true); // Set margins and disable editing
                statusElem.textContent = `Loading preset template: ${preset.name}...`;
                generateBtn.disabled = true; // Disable while loading
                try {
                    templateImageObject = await loadImage(preset.url);
                    templateFile = preset.url; // Store URL as identifier
                    previewTemplate.src = templateImageObject.src; // Use loaded src
                    previewTemplate.style.display = 'block';
                    statusElem.textContent = `Preset template "${preset.name}" loaded.`;
                } catch (error) {
                    console.error("Error loading preset template:", error);
                    statusElem.textContent = `Error loading preset: ${error.message}. Please try again or use custom upload.`;
                    templateImageObject = null;
                    setMarginInputs({ top: 0, bottom: 0, left: 0, right: 0 }, true); // Keep disabled on error
                }
            } else {
                 statusElem.textContent = 'Invalid preset selected.';
                 setMarginInputs({ top: 0, bottom: 0, left: 0, right: 0 }, false); // Re-enable if invalid? Maybe keep disabled.
            }
        }
        updateGenerateButtonState();
    }

    // Custom Template Upload
    templateInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        // Automatically switch dropdown to 'custom' if a file is uploaded
        templatePresetSelect.value = 'custom';
        handlePresetChange(); // Apply 'custom' state (show margins, etc.)

        if (file) {
            templateFile = file;
            const reader = new FileReader();
            reader.onload = async (e) => {
                previewTemplate.src = e.target.result;
                previewTemplate.style.display = 'block';
                statusElem.textContent = 'Loading custom template...';
                generateBtn.disabled = true;
                try {
                    templateImageObject = await loadImage(e.target.result);
                    statusElem.textContent = 'Custom template loaded.';
                    setMarginInputs({ // Ensure margins are editable for custom
                        top: parseInt(gridMarginTopInput.value, 10) || 0,
                        bottom: parseInt(gridMarginBottomInput.value, 10) || 0,
                        left: parseInt(gridMarginLeftInput.value, 10) || 0,
                        right: parseInt(gridMarginRightInput.value, 10) || 0
                    }, false);
                } catch (error) {
                    console.error(error);
                    statusElem.textContent = 'Error loading custom template. Please try another PNG.';
                    templateFile = null; templateImageObject = null;
                    previewTemplate.src = '#'; previewTemplate.style.display = 'none';
                } finally {
                     updateGenerateButtonState();
                }
            }
            reader.readAsDataURL(file);
        } else {
            // File input was cleared
            templateFile = null;
            templateImageObject = null;
            previewTemplate.src = '#';
            previewTemplate.style.display = 'none';
             // Only reset status if it wasn't an error message
             if (!statusElem.textContent.includes('Error')) {
                 statusElem.textContent = 'Custom template upload cancelled.';
             }
             updateGenerateButtonState();
        }
    });

    // Slider Controls (Enable/Disable handled by setPhotoSlotState)
    function handleSliderChange(event) {
        const index = parseInt(event.target.dataset.index, 10);
        const transformType = event.target.id.replace(/[0-9]/g, ''); // 'scale', 'offsetX', 'offsetY'
        if (imageTransforms[index] && photoImageObjects[index]) { // Only if image exists
            imageTransforms[index][transformType] = parseFloat(event.target.value);
            updatePreviewBackground(index);
        }
    }
    scaleSliders.forEach(slider => slider.addEventListener('input', handleSliderChange));
    offsetXSliders.forEach(slider => slider.addEventListener('input', handleSliderChange));
    offsetYSliders.forEach(slider => slider.addEventListener('input', handleSliderChange));

    // --- Update Generate Button State ---
    const updateGenerateButtonState = () => {
        const photosReadyCount = photoImageObjects.filter(img => img !== null).length;
        const templateReady = templateImageObject !== null;

        // Require at least one photo and a template
        generateBtn.disabled = !(photosReadyCount > 0 && templateReady);

        // More refined status updates (optional)
        // You can add more logic here based on counts if desired
        if (!statusElem.textContent.includes('Loading') && !statusElem.textContent.includes('Error') && !statusElem.textContent.includes('generate') && !statusElem.textContent.includes('Loaded')) {
             if (photosReadyCount === 0 && !templateReady) {
                statusElem.textContent = 'Upload photos and select a template.';
             } else if (photosReadyCount === 0) {
                 statusElem.textContent = `Template ready. Upload ${MAX_PHOTOS} photos.`;
             } else if (!templateReady) {
                 statusElem.textContent = `${photosReadyCount}/${MAX_PHOTOS} photos ready. Select a template.`;
             } else if (!generateBtn.disabled) {
                  statusElem.textContent = 'Ready to generate.';
             } else if (generateBtn.disabled && photosReadyCount < MAX_PHOTOS){
                  statusElem.textContent = `${photosReadyCount}/${MAX_PHOTOS} photos ready. Template ready. Upload more photos or generate.`
             }
        }
    };

    // --- Main Image Generation Function (Blob download logic kept) ---
    generateBtn.addEventListener('click', () => {
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

                canvas.width = templateW;
                canvas.height = templateH;
                ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear before drawing

                const quadWidth = gridAreaWidth / 2;
                const quadHeight = gridAreaHeight / 2;

                const drawPositions = [
                    { x: gridAreaX, y: gridAreaY },                           // Top-Left
                    { x: gridAreaX + quadWidth, y: gridAreaY },               // Top-Right
                    { x: gridAreaX, y: gridAreaY + quadHeight },              // Bottom-Left
                    { x: gridAreaX + quadWidth, y: gridAreaY + quadHeight }   // Bottom-Right
                 ];

                // Draw photos that are loaded
                photoImageObjects.forEach((img, index) => {
                    if (img) { // Only draw if the image object exists for this slot
                        const transform = imageTransforms[index];
                        const pos = drawPositions[index];
                        drawImageWithTransform(ctx, img, transform, pos.x, pos.y, quadWidth, quadHeight);
                    }
                });

                // Draw template overlay last
                ctx.drawImage(templateImageObject, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        throw new Error('Canvas could not be converted to Blob.');
                    }
                    const objectUrl = URL.createObjectURL(blob);

                    downloadLink.href = objectUrl;
                    downloadLink.dataset.objectUrl = objectUrl;
                    downloadLink.style.display = 'inline-block';
                    resultImage.src = objectUrl;
                    resultImage.style.display = 'block';
                    if (mobileSaveHint) mobileSaveHint.style.display = 'block';

                    statusElem.textContent = 'Image generated successfully!';
                     updateGenerateButtonState();

                }, 'image/png');

            } catch (error) {
                console.error("Error during canvas generation:", error);
                statusElem.textContent = `Error: ${error.message || 'Could not generate image.'}`;
                updateGenerateButtonState(); // Re-enable button after error
            }
        }, 50); // setTimeout
    });

    // --- drawImageWithTransform (Keep as before) ---
    function drawImageWithTransform(ctx, img, transform, targetX, targetY, targetW, targetH) {
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        const scale = transform.scale;
        const offsetXRatio = transform.offsetX / 100;
        const offsetYRatio = transform.offsetY / 100;

        // Calculate the source rectangle dimensions based on scale
        let sourceW = imgWidth / scale;
        let sourceH = imgHeight / scale;

        // Calculate the source rectangle top-left corner based on offset
        // Offset determines how much of the *excess* area (due to zoom) is shifted L/R or U/D
        let sourceX = (imgWidth - sourceW) * offsetXRatio;
        let sourceY = (imgHeight - sourceH) * offsetYRatio;

        // --- Aspect Ratio Correction (Fit source rectangle to target aspect ratio) ---
        const targetAspect = targetW / targetH;
        const sourceAspect = sourceW / sourceH; // Aspect ratio of the *scaled* source area

        if (sourceAspect > targetAspect) {
             // Source is wider than target: Adjust width, keep height
             const newSourceW = sourceH * targetAspect;
             // Re-center the sourceX based on the new width and original offset ratio
             sourceX += (sourceW - newSourceW) * offsetXRatio; // Adjust based on how much width was removed
             sourceW = newSourceW;
        } else if (sourceAspect < targetAspect) {
             // Source is taller than target: Adjust height, keep width
             const newSourceH = sourceW / targetAspect;
             // Re-center the sourceY based on the new height and original offset ratio
             sourceY += (sourceH - newSourceH) * offsetYRatio; // Adjust based on how much height was removed
             sourceH = newSourceH;
        }
        // --- End Aspect Ratio Correction ---

        // Clamp source coordinates to be within the image boundaries
        sourceX = Math.max(0, Math.min(imgWidth - sourceW, sourceX));
        sourceY = Math.max(0, Math.min(imgHeight - sourceH, sourceY));
        // Ensure source width/height are at least minimally positive
        sourceW = Math.max(1, sourceW);
        sourceH = Math.max(1, sourceH);

        ctx.drawImage(
            img,       // The source image
            sourceX,   // Source X
            sourceY,   // Source Y
            sourceW,   // Source Width
            sourceH,   // Source Height
            targetX,   // Target X on canvas
            targetY,   // Target Y on canvas
            targetW,   // Target Width on canvas
            targetH    // Target Height on canvas
        );
    }

    // --- Initial Setup ---
    populatePresets(); // Fill the dropdown
    updateGenerateButtonState(); // Set initial button state
}); // End DOMContentLoaded