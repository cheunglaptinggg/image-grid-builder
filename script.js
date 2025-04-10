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
    let activeTemplateSettings = null; // NEW: Store details of the active template (preset obj or custom info)

    const previewBgs = Array.from({ length: MAX_PHOTOS }, (_, i) => document.getElementById(`previewBg${i}`));
    const scaleSliders = document.querySelectorAll('.scale-slider');
    const offsetXSliders = document.querySelectorAll('.offset-slider-x');
    const offsetYSliders = document.querySelectorAll('.offset-slider-y');

    // --- Template Presets Definition ---
    const templatePresets = [
        // Standard Presets
        {
            name: "Dog Inn Cloud (140px)",
            url: "templates/Untitled-2.png",
            margins: { top: 140, bottom: 0, left: 0, right: 0 },
            padding: { top: 0, bottom: 0, left: 0, right: 0 } // Default padding
        },
         // --- NEW DOG INN TEMPLATE ---
         // Note: Adjust margin/padding values below based on visual testing! These are estimates.
        {
             name: "Dog Inn Chalk",
             url: "templates/dog_inn_template.png", // Ensure this file exists!
             margins: { top: 65, bottom: 90, left: 15, right: 15 }, // Space around the 2x2 grid
             padding: { top: 25, bottom: 25, left: 25, right: 25 }  // Padding *inside* each quadrant for the photo
         },
        // Add more presets here if needed
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
             img.onload = () => resolve(img);
             img.onerror = (err) => reject(new Error(`Failed to load image object from source: ${src.substring(0, 100)}...`));
             img.src = src;
         });
     }

    // --- Helper: Update Individual Slot Preview Background ---
    function updatePreviewBackground(index) {
        // ... (implementation remains the same) ...
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

    // --- Helper: Update Full Slot State ---
    function setPhotoSlotState(index, file, dataUrl, imgObject) {
        // ... (implementation remains the same) ...
        photoFiles[index] = file;
        imageTransforms[index].dataUrl = dataUrl;
        photoImageObjects[index] = imgObject;

        const hasImage = !!imgObject;
        if (scaleSliders[index]) scaleSliders[index].disabled = !hasImage;
        if (offsetXSliders[index]) offsetXSliders[index].disabled = !hasImage;
        if (offsetYSliders[index]) offsetYSliders[index].disabled = !hasImage;
        if (clearSlotBtns[index]) clearSlotBtns[index].style.display = hasImage ? 'inline-block' : 'none';

        if (hasImage) {
             // Only reset transforms fully if it's detected as a *new* image load
            if (file !== photoFiles[index] || !imageTransforms[index].scale) {
                imageTransforms[index] = { ...imageTransforms[index], scale: 1, offsetX: 50, offsetY: 50 };
                if (scaleSliders[index]) scaleSliders[index].value = 1;
                if (offsetXSliders[index]) offsetXSliders[index].value = 50;
                if (offsetYSliders[index]) offsetYSliders[index].value = 50;
            }
            updatePreviewBackground(index);
        } else {
             updatePreviewBackground(index);
             imageTransforms[index] = { scale: 1, offsetX: 50, offsetY: 50, dataUrl: null };
             if (scaleSliders[index]) scaleSliders[index].value = 1;
             if (offsetXSliders[index]) offsetXSliders[index].value = 50;
             if (offsetYSliders[index]) offsetYSliders[index].value = 50;
        }

        updateGenerateButtonState();
        drawLivePreview();
    }


    // --- Clear Functions ---
    function clearPhotoSlot(index) {
         if (photoFiles[index] !== null || photoImageObjects[index] !== nu