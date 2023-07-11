import { band, modifiers } from 'types';
import { createSlider, getFrequency, getGain, setFrequency, setGain } from './ui/slider.js';

const presetFrequencies = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384];
const presetGains: {
    [preset: string]: number[];
} = {
    'none': [],
    'bass-boost': [6, 5, 4, 3, 2, 1, 0, 0, 0, 0],
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
    setUI(await sendMessage('get', 'getModifiers'));
    websiteDisplay.innerText = await sendMessage('get', 'getWebsiteURL');
    songDisplay.innerText = await sendMessage('get', 'getWebsiteTitle');
})();

closeButton.addEventListener('click', () => {
    window.close();
});
panel.addEventListener('click', (event) => {
    panel.appendChild(createSliderWithUpdater(event.clientX, event.clientY));
    sendMessage('modify', 'setBands', getBands());
});
resetButton.addEventListener('click', async () => {
    setUI(await sendMessage('modify', 'reset'));
});
monoButton.addEventListener('click', async () => {
    setMono((await sendMessage('modify', 'toggleMono')).mono);
});
swapButton.addEventListener('click', async () => {
    setSwap((await sendMessage('modify', 'toggleSwap')).swap);
});
presetSelect.addEventListener('change', async () => {
    const bands: band[] = [];
    presetGains[presetSelect.value].forEach((gain, index) => {
        bands.push({
            frequency: presetFrequencies[index],
            gain: gain,
        });
    });
    setBands((await sendMessage('modify', 'setBands', bands)).bands);
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
    setMono(modifiers.mono);
    setSwap(modifiers.swap);
    setBands(modifiers.bands);
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

function setBands(bands: band[]) {
    panel.replaceChildren();
    for(const band of bands) {
        const slider = createSliderWithUpdater(0, 0);
        panel.appendChild(slider);
        setFrequency(slider, band.frequency);
        setGain(slider, band.gain);
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

function createSliderWithUpdater(x: number, y: number) {
    const slider = createSlider(x, y);
    slider.addEventListener('mouseup', () => {
        sendMessage('modify', 'setBands', getBands());
    });
    return slider;
}