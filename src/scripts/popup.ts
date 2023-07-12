import { band, modifiers } from './types.js';
import { createSlider, getFrequency, getGain, setFrequency, setGain } from './ui/slider.js';

const presetGains: {
    [preset: string]: number[];
} = {
    'none': [],
    'acoustic': [4, 4, 3, 1, 2, 2, 3, 4, 3, 2],
    'electronic': [4, 3, 1, 0, -2, 3, 1, 2, 4, 5],
    'latin': [4, 3, 0, 0, -1, -1, -1, 0, 3, 4],
    'piano': [3, 2, 0, 3, 3, 1, 3, 4, 3, 3],
    'pop': [-2, -1, 0, 2, 4, 4, 2, 0, -1, -2],
    'rock': [5, 4, 3, 1, 0, -1, 1, 3, 4, 5],
    'bass-boost': [5, 4, 3, 2, 1, 0, 0, 0, 0, 0],
}

const websiteDisplay = document.getElementById('website') as HTMLDivElement;
const songDisplay = document.getElementById('song') as HTMLDivElement;
const closeButton = document.getElementById('close') as HTMLImageElement;
const panel = document.getElementById('panel') as HTMLDivElement;
const resetButton = document.getElementById('reset') as HTMLImageElement;
const monoButton = document.getElementById('mono') as HTMLImageElement;
const swapButton = document.getElementById('swap') as HTMLImageElement;
const presetSelect = document.getElementById('preset') as HTMLSelectElement;

(async () => {
    websiteDisplay.innerText = await sendMessage('get', 'getWebsiteURL');
    songDisplay.innerText = await sendMessage('get', 'getWebsiteTitle');
    setUI(await sendMessage('get', 'getModifiers'));
})();

closeButton.addEventListener('click', () => {
    window.close();
});
panel.addEventListener('click', async (event) => {
    panel.appendChild(createSliderWithUpdater(event.clientX, event.clientY, panel));
    syncBandUI(getBands());
});
resetButton.addEventListener('click', async () => {
    setUI(await sendMessage('modify', 'reset'));
});
monoButton.addEventListener('click', async () => {
    setMono((await sendMessage('modify', 'toggleMono')));
});
swapButton.addEventListener('click', async () => {
    setSwap((await sendMessage('modify', 'toggleSwap')));
});
presetSelect.addEventListener('change', async () => {
    if(presetSelect.value === 'custom')
        return;
    syncBandUI(calculatePresetBands(presetSelect.value));
});

async function sendMessage(type: string, content: string, data?: any) {
    const activeTab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
    return chrome.tabs.sendMessage(activeTab.id!, {
        type: type,
        content: content,
        data: data,
    });
}

function setUI(modifiers: modifiers) {
    setBands(modifiers.bands);
    setMono(modifiers.mono);
    setSwap(modifiers.swap);
    setPresetSelect(modifiers.bands);
}

function setBands(bands: band[]) {
    panel.replaceChildren();
    for(const band of bands) {
        const slider = createSliderWithUpdater(0, 0, panel);
        panel.appendChild(slider);
        setFrequency(slider, band.frequency);
        setGain(slider, band.gain);
    }
}

function setMono(enabled: boolean) {
    monoButton.src = enabled ?
        'assets/ui/mono-enabled.png' :
        'assets/ui/mono-disabled.png';
}

function setSwap(enabled: boolean) {
    swapButton.src = enabled ?
        'assets/ui/swap-enabled.png' :
        'assets/ui/swap-disabled.png';
}

function setPresetSelect(bands: band[]) {
    presetSelect.value = 'custom';
    for(const preset in presetGains)
        if(JSON.stringify(bands) === JSON.stringify(calculatePresetBands(preset))) {
            presetSelect.value = preset;
            break;
    }
}

function getBands() {
    const bands = [];
    for(const slider of panel.children)
        bands.push({
            frequency: getFrequency(slider as HTMLElement),
            gain: getGain(slider as HTMLElement),
        });
    return bands;
}

async function syncBandUI(bands: band[]) {
    const syncedBands = await sendMessage('modify', 'setBands', bands);
    setBands(syncedBands);
    setPresetSelect(syncedBands);
}

function calculatePresetBands(preset: string) {
    const bands: band[] = [];
    presetGains[preset].forEach((gain, index) => {
        bands.push({
            frequency: 32 * 2 ** index,
            gain: gain,
        });
    });
    return bands;
}

function createSliderWithUpdater(x: number, y: number, boundingBox: HTMLElement) {
    const slider = createSlider(x, y, boundingBox);
    slider.addEventListener('change', () => {
        syncBandUI(getBands());
    });
    return slider;
}