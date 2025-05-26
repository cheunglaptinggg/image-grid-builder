// FINAL script.js for use on GitHub Pages (or any HTTP server)
// Uses FETCH for loading preset templates AND preset backgrounds to avoid canvas tainting.
// Corrects function definition duplications. Includes debugging logs.

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
background: { type: 'image', url: 'templates/BlueSky-bg.png' } // Example background image - MAKE SURE THIS FILE EXISTS!
},
{
             name: "School",
             name: "School",url: null,
margins: { top: 330, bottom: 330, left: 120 , right: 120 },
padding: { top: 20, bottom: 20, left: 20, right: 20 },
background: { type: 'image', url: 'templates/School.png' } 
}
];

// --- Utilities ---
function debounce(func, wait) {
let timeout;
return function executedFunction(...args) {
const later = () => { clearTimeout(timeout); func(...args); };
clearTimeout(timeout); timeout = setTimeout(later, wait);
};
}
function loadImage(src) {
return new Promise((resolve, reject) => {
const img = new Image();
img.onload = () => resolve(img);
img.onerror = (err) => reject(new Error(`Failed image load: ${src.substring(0,100)}...`));
img.src = src;
});
}

// --- UI / State Updates ---
function updatePreviewBackground(index) {
try {
const transform = imageTransforms[index];
const previewBg = previewBgs[index];
// DEBUG: Log details before attempting style update
console.log(`[updatePreviewBackground] Index: ${index}, Found Element: ${!!previewBg}, Has dataUrl: ${!!transform?.dataUrl}, Transform:`, transform);
if (!previewBg) { console.error(`Preview element for index ${index} not found!`); return; }

if (transform && transform.dataUrl) {
previewBg.style.backgroundImage = `url(${transform.dataUrl})`;
previewBg.style.backgroundSize = 'cover';
previewBg.style.backgroundPosition = `${transform.offsetX}% ${transform.offsetY}%`;
} else {
previewBg.style.backgroundImage = '';
}
} catch (error) { console.error(`Error in updatePreviewBackground for index ${index}:`, error); }
}

function setPhotoSlotState(index, file, dataUrl, imgObject) {
console.log(`[setPhotoSlotState] Index: ${index}, File: ${file?.name}, Has dataUrl: ${!!dataUrl}, Has imgObject: ${!!imgObject}`);
photoFiles[index] = file;
imageTransforms[index].dataUrl = dataUrl; // ** Assign dataUrl FIRST **
photoImageObjects[index] = imgObject;

const hasImage = !!imgObject;
// Update Controls
if (scaleSliders[index]) scaleSliders[index].disabled = !hasImage;
if (offsetXSliders[index]) offsetXSliders[index].disabled = !hasImage;
if (offsetYSliders[index]) offsetYSliders[index].disabled = !hasImage;
if (clearSlotBtns[index]) clearSlotBtns[index].style.display = hasImage ? 'inline-block' : 'none';

// Reset Transforms state if image present
if (hasImage) {
imageTransforms[index].scale = 1; imageTransforms[index].offsetX = 50; imageTransforms[index].offsetY = 50;
if (scaleSliders[index]) scaleSliders[index].value = 1;
if (offsetXSliders[index]) offsetXSliders[index].value = 50;
if (offsetYSliders[index]) offsetYSliders[index].value = 50;
} else { // Clear transforms if no image
imageTransforms[index].scale = 1; imageTransforms[index].offsetX = 50; imageTransforms[index].offsetY = 50;
if (scaleSliders[index]) scaleSliders[index].value = 1;
if (offsetXSliders[index]) offsetXSliders[index].value = 50;
if (offsetYSliders[index]) offsetYSliders[index].value = 50;
}

// ** Update the preview background AFTER state is set **
updatePreviewBackground(index);
updateGenerateButtonState();
drawLivePreview(); // Update main preview
console.log(`[setPhotoSlotState] Completed for index ${index}.`);
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
console.log('Batch input change detected.'); // DEBUG
const files = event.target.files; if (!files || files.length === 0) return;
let filesToProcess = Array.from(files); let loadedCount = 0; let erroredCount = 0; let assignedCount = 0;
statusElem.textContent = `Processing ${filesToProcess.length}...`; generateBtn.disabled = true;
const processingPromises = [];

console.log(`Attempting to assign ${filesToProcess.length} files.`); // DEBUG
for (const file of filesToProcess) {
let targetSlotIndex = -1; for (let j=0; j<MAX_PHOTOS; j++) { if (photoFiles[j] === null && photoImageObjects[j] === null) { targetSlotIndex = j; break; } }
console.log(`Checking for empty slot. Found index: ${targetSlotIndex}`); // DEBUG

if (targetSlotIndex !== -1 && assignedCount < MAX_PHOTOS) {
assignedCount++; const currentIndex = targetSlotIndex;
console.log(`Assigning "${file?.name || 'Unknown File'}" to slot ${currentIndex}`); // DEBUG
photoFiles[currentIndex] = 'pending'; // Mark synchronously

processingPromises.push(new Promise((resolve) => {
const reader = new FileReader();
reader.onload = async (e) => {
const dataUrl = e.target.result; // Get dataUrl here
console.log(`[FileReader onload] Index ${currentIndex}, dataUrl obtained (length ${dataUrl?.length})`); // DEBUG
if(!dataUrl) {
console.error(`[FileReader onload] FileReader failed for ${file?.name}, no dataUrl.`);
setPhotoSlotState(currentIndex, null, null, null); // Clear slot
erroredCount++;
resolve(false);
return;
}
try {
const img = await loadImage(dataUrl);
console.log(`[loadImage success] Index ${currentIndex}`); // DEBUG
setPhotoSlotState(currentIndex, file, dataUrl, img); // Update state
loadedCount++;
resolve(true);
} catch (loadError) {
console.error(`[loadImage error] Index ${currentIndex}:`, loadError);
setPhotoSlotState(currentIndex, null, null, null); // Clear slot on error
erroredCount++;
resolve(false);
}
};
reader.onerror = (err) => {
console.error(`[FileReader onerror] Index ${currentIndex}:`, err);
setPhotoSlotState(currentIndex, null, null, null); // Clear slot on error
erroredCount++;
resolve(false);
}
reader.readAsDataURL(file);
}));
} else if (targetSlotIndex === -1) { console.log('No more empty slots found.'); break; }
else { console.log(`Skipping file, max assigned: ${assignedCount}`); }
} // End file loop

try { await Promise.all(processingPromises); console.log('All photo processing promises settled.'); }
catch (error) { console.error('Error awaiting processing promises:', error); }

let finalStatus = `Processed: Loaded ${loadedCount}, Failed ${erroredCount}.`; const excessFiles = files.length - assignedCount; if (excessFiles > 0) { finalStatus += ` ${excessFiles} ignored (max ${MAX_PHOTOS}).`; }
statusElem.textContent = finalStatus; updateGenerateButtonState(); photoBatchInput.value = '';
console.log('Batch upload processing complete.');
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
if(activeTemplateSettings?.background) return;
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
if (backgroundImagePreviewUrl) URL.revokeObjectURL(backgroundImagePreviewUrl);
backgroundImagePreviewUrl = URL.createObjectURL(previewBlob);
bgImagePreview.src = backgroundImagePreviewUrl; bgImagePreview.style.display = 'inline-block'; clearBgImageBtn.style.display = 'inline-block';
statusElem.textContent = 'Background loaded.'; drawLivePreview();
} catch (error) { console.error("Bg load err:", error); statusElem.textContent = `Err bg: ${error.message}`; clearBackgroundImageState(); drawLivePreview(true); }
finally { updateGenerateButtonState(); }
}

// Helper to load PRESET background image (using fetch)
async function loadPresetBackgroundImage(url) {
clearBackgroundImageState(false); backgroundImageFile = url;
statusElem.textContent = 'Loading preset background...'; generateBtn.disabled = true;
try {
const response = await fetch(url); if (!response.ok) { throw new Error(`Fetch fail: ${response.status} for BG ${url}`); }
const imageBlob = await response.blob();
const dataUrl = await new Promise((resolve, reject) => { const r=new FileReader(); r.onloadend=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(imageBlob); });
backgroundImageObject = await loadImage(dataUrl);
if (backgroundImagePreviewUrl) URL.revokeObjectURL(backgroundImagePreviewUrl);
backgroundImagePreviewUrl = URL.createObjectURL(imageBlob);
bgImagePreview.src = backgroundImagePreviewUrl; bgImagePreview.style.display = 'inline-block';
clearBgImageBtn.style.display = 'none';
return true; // Success
} catch (error) { console.error("Preset BG load err:", error); statusElem.textContent = `Err preset BG: ${error.message}`; clearBackgroundImageState(); throw error; }
}

// Helper to clear background image state
function clearBackgroundImageState(clearInput = true) {
if (backgroundImagePreviewUrl) { URL.revokeObjectURL(backgroundImagePreviewUrl); }
backgroundImageFile = null; backgroundImageObject = null; backgroundImagePreviewUrl = null;
if(bgImagePreview) { bgImagePreview.src = '#'; bgImagePreview.style.display = 'none'; }
if(clearBgImageBtn) clearBgImageBtn.style.display = 'none';
if (clearInput && bgImageInput) { bgImageInput.value = ''; }
}

// --- ** CORRECTED Template Loading (FETCH METHOD) ** ---
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
statusElem.textContent = `Loading ${preset.name}...`; generateBtn.disabled = true; templateFile = preset.url;
activeTemplateSettings = { // Initialize state object SECOND
type: 'preset', url: preset.url,
margins: { ...preset.margins },
padding: { ...(preset.padding || { top:0, bottom:0, left:0, right:0 }) }, // Ensure padding exists
background: preset.background ? { ...preset.background } : null
};

let templateLoadPromise = null;
let backgroundLoadPromise = Promise.resolve(true); // Default

// Start Template Load
try {
console.log('[handlePresetChange (Fetch)] Fetching TPL:', preset.url);
const response = await fetch(preset.url); if (!response.ok) { throw new Error(`Fetch fail ${response.status} TPL: ${preset.url}`); }
const imageBlob = await response.blob();
const dataUrl = await new Promise((resolve, reject) => { const r=new FileReader(); r.onloadend=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(imageBlob); });
templateLoadPromise = loadImage(dataUrl);
} catch(error) { console.error("Preset TPL fetch/load err:", error); statusElem.textContent=`Err TPL: ${error.message}`; templateImageObject = null; activeTemplateSettings = null; resetManualBackgroundControls(); updateGenerateButtonState(); return; }

// Start Background Load IF specified
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
[templateImageObject] = await Promise.all([templateLoadPromise, backgroundLoadPromise]);
console.log("All loading finished. TPL:", !!templateImageObject, "BG:", !!backgroundImageObject);
if (!templateImageObject) throw new Error("Template image failed to load after await.");
selectedTemplatePreviewImg.src = templateImageObject.src; selectedTemplatePreviewImg.style.display = 'block';
statusElem.textContent = activeTemplateSettings.background ? `Preset "${preset.name}" & BG loaded.` : `Preset "${preset.name}" loaded.`;
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

async function loadCustomTemplate(file) {
templateImageObject = null; selectedTemplatePreviewImg.src = '#'; selectedTemplatePreviewImg.style.display = 'none'; liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
customTemplateUploadDiv.style.display = 'block'; gridMarginsContainer.style.display = 'block';
templateFile = file;
statusElem.textContent = 'Loading custom...'; generateBtn.disabled = true; setMarginInputs({ top: 0, bottom: 0, left: 0, right: 0 }, true);
resetManualBackgroundControls();

try {
const dataUrl = await new Promise((resolve, reject) => { const r=new FileReader(); r.onload=(e)=>resolve(e.target.result); r.onerror=reject; r.readAsDataURL(file); });
templateImageObject = await loadImage(dataUrl);
const currentMargins = { top: parseInt(gridMarginTopInput.value,10)||0, bottom: parseInt(gridMarginBottomInput.value,10)||0, left: parseInt(gridMarginLeftInput.value,10)||0, right: parseInt(gridMarginRightInput.value,10)||0 };
activeTemplateSettings = { type: 'custom', file: file, margins: currentMargins, padding: {top:0, bottom:0, left:0, right:0}, background: null };
statusElem.textContent = 'Custom loaded.'; selectedTemplatePreviewImg.src = templateImageObject.src; selectedTemplatePreviewImg.style.display = 'block';
setMarginInputs(activeTemplateSettings.margins, false);
drawLivePreview();
} catch (error) { console.error("Custom load err:", error); statusElem.textContent = `Error: ${error.message}.`; templateFile=null; templateImageObject=null; activeTemplateSettings=null; selectedTemplatePreviewImg.src='#'; selectedTemplatePreviewImg.style.display='none'; liveCtx.clearRect(0,0,livePreviewCanvas.width,livePreviewCanvas.height); setMarginInputs({top:0,bottom:0,left:0,right:0}, false); resetManualBackgroundControls();}
finally { updateGenerateButtonState(); }
}

// Helpers to manage background control states
function disableManualBackgroundControls() { bgTypeRadios.forEach(r=>r.disabled=true); bgColorPicker.disabled=true; bgImageInput.disabled=true; if(clearBgImageBtn) clearBgImageBtn.disabled=true; if(bgColorSettingDiv) {bgColorSettingDiv.style.opacity=0.6; bgColorSettingDiv.style.cursor='not-allowed';} if(bgImageSettingDiv) {bgImageSettingDiv.style.opacity=0.6; bgImageSettingDiv.style.cursor='not-allowed';} }
function enableManualBackgroundControls() { bgTypeRadios.forEach(r=>r.disabled=false); bgColorPicker.disabled=false; bgImageInput.disabled=false; if(clearBgImageBtn) clearBgImageBtn.disabled=false; if(bgColorSettingDiv) {bgColorSettingDiv.style.opacity=1; bgColorSettingDiv.style.cursor='default';} if(bgImageSettingDiv) {bgImageSettingDiv.style.opacity=1; bgImageSettingDiv.style.cursor='default';} }
function resetManualBackgroundControls() { /*console.log("Resetting manual BG controls.");*/ enableManualBackgroundControls(); backgroundType = 'color'; backgroundColor = '#FFFFFF'; if(document.getElementById('bgTypeColor')) document.getElementById('bgTypeColor').checked = true; if(bgColorPicker) bgColorPicker.value = backgroundColor; if(bgImageSettingDiv) bgImageSettingDiv.style.display = 'none'; if(bgColorSettingDiv) bgColorSettingDiv.style.display = 'flex'; clearBackgroundImageState(); }


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
const newState = !(photosReadyCount > 0 && templateReady);
if (generateBtn.disabled !== newState) { generateBtn.disabled = newState; }
};

// --- Get Settings Helper ---
function getCurrentSettings() {
let margins = { top: 0, bottom: 0, left: 0, right: 0 }; let padding = { top: 0, bottom: 0, left: 0, right: 0 };
let bg = { type: backgroundType, colorValue: backgroundColor, imageObject: backgroundImageObject };
if (activeTemplateSettings) {
margins = { ...activeTemplateSettings.margins }; padding = { ...(activeTemplateSettings.padding || { top:0, bottom:0, left:0, right:0 }) };
if(activeTemplateSettings.background) {
if(activeTemplateSettings.background.type === 'color') { bg = { type: 'color', colorValue: activeTemplateSettings.background.value || '#FFFFFF', imageObject: null }; }
else if (activeTemplateSettings.background.type === 'image') { bg = { type: 'image', colorValue: '#FFFFFF', imageObject: backgroundImageObject }; }
} else if (activeTemplateSettings.type === 'custom') {
margins = { top: parseInt(gridMarginTopInput.value,10)||0, bottom: parseInt(gridMarginBottomInput.value,10)||0, left: parseInt(gridMarginLeftInput.value,10)||0, right: parseInt(gridMarginRightInput.value,10)||0 };
activeTemplateSettings.margins = margins;
}
} else { console.warn("getCurrentSettings: activeTemplateSettings is null."); }
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
// Draw Grid & Photos
if(templateReady) {
const gridAreaX=margins.left; const gridAreaY=margins.top; const gridAreaWidth=canvasW-margins.left-margins.right; const gridAreaHeight=canvasH-margins.top-margins.bottom;
if (gridAreaWidth<=0 || gridAreaHeight<=0) { liveCtx.drawImage(templateImageObject, 0, 0, canvasW, canvasH); console.warn("Preview Invalid grid"); liveCtx.strokeStyle='rgba(255,0,0,0.7)'; liveCtx.lineWidth=4; liveCtx.strokeRect(gridAreaX,gridAreaY,gridAreaWidth,gridAreaHeight); return; }
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

// --- *** UPDATED CORE DRAWING FUNCTION: drawImageCover (Revised Panning) *** ---
/**
    * Draws an image scaled uniformly to cover the target area using clipping.
    * offsetX/Y sliders now control which part of the source image is centered.
    */
function drawImageCover(targetCtx, img, targetX, targetY, targetW, targetH, offsetXPercent = 50, offsetYPercent = 50, zoomScale = 1) {
if (!img || !targetCtx || targetW <= 0 || targetH <= 0 || img.naturalWidth === 0 || img.naturalHeight === 0) {
console.warn("drawImageCover: Invalid parameters or image."); return;
}

const imgWidth = img.naturalWidth;
const imgHeight = img.naturalHeight;
const imgRatio = imgWidth / imgHeight;
const targetRatio = targetW / targetH;

// --- 1. Calculate Scale to Cover ---
let baseScale = 1;
if (imgRatio > targetRatio) { // Image wider than target -> fit height
baseScale = targetH / imgHeight;
} else { // Image taller than target -> fit width
baseScale = targetW / imgWidth;
}

// --- 2. Apply Zoom ---
const finalScale = baseScale * Math.max(1, zoomScale);
const scaledImgW = imgWidth * finalScale;
const scaledImgH = imgHeight * finalScale;

// --- 3. Calculate Draw Position Based on Offset % ---
// Calculate the minimum X/Y draw coordinates (when image edge aligns with target edge)
const minDrawX = targetX + targetW - scaledImgW;
const minDrawY = targetY + targetH - scaledImgH;
// Calculate the maximum X/Y draw coordinates (top/left edges aligned)
const maxDrawX = targetX;
const maxDrawY = targetY;

// Determine the draw position using linear interpolation based on the offset sliders
// 0% -> maxDraw (top/left edge)
// 100% -> minDraw (bottom/right edge)
// Ensure we don't go beyond calculated min/max if image is smaller than target after scaling (shouldn't happen with zoom >= 1)
let drawX = maxDrawX + (minDrawX - maxDrawX) * (offsetXPercent / 100);
let drawY = maxDrawY + (minDrawY - maxDrawY) * (offsetYPercent / 100);

// Ensure draw positions are valid numbers
if (isNaN(drawX)) drawX = targetX + (targetW - scaledImgW) / 2; // Center fallback for X
if (isNaN(drawY)) drawY = targetY + (targetH - scaledImgH) / 2; // Center fallback for Y


// --- 4. Apply Clipping and Draw ---
targetCtx.save();
try {
targetCtx.beginPath();
targetCtx.rect(targetX, targetY, targetW, targetH); // Clip to the target area
targetCtx.clip();

if (isNaN(scaledImgW) || isNaN(scaledImgH) || scaledImgW <= 0 || scaledImgH <= 0 ) {
console.error("drawImageCover: Invalid scaled dimensions.", {scaledImgW, scaledImgH});
} else {
// Draw the entire source image, scaled, at the calculated position
targetCtx.drawImage(
img,
0, 0, imgWidth, imgHeight, // Source rect (full image)
drawX, drawY,           // Calculated Destination position
scaledImgW, scaledImgH   // Calculated Destination size
);
}
} catch (e) { console.error("Draw err:", e); }
finally { targetCtx.restore(); } // Remove clip
}
// --- Initial Page Setup ---
function populatePresets() {
console.log("Populating presets..."); // DEBUG
// Ensure custom option exists
if (!templatePresetSelect.querySelector('option[value="custom"]')) {
console.log("Adding custom option..."); // DEBUG
const customOption = document.createElement('option');
customOption.value = 'custom';
customOption.textContent = '-- Custom Upload --';
templatePresetSelect.insertBefore(customOption, templatePresetSelect.firstChild);
} else {
console.log("Custom option already exists."); // DEBUG
}
// Add presets from array
templatePresets.forEach((preset, index) => {
const option = document.createElement('option');
option.value = index.toString();
option.textContent = preset.name;
templatePresetSelect.appendChild(option);
console.log(`Added preset option: ${preset.name}`); // DEBUG
});
console.log("Calling initial handlePresetChange..."); // DEBUG
handlePresetChange(); // Initialize
}
console.log("DOM Loaded. Initializing...");
populatePresets();
console.log("Initialization complete.");

}); // End DOMContentLoaded
