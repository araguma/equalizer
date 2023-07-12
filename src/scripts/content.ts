// Duplicate modifiers type declaration here because content scripts can't be modules   
type modifiers = {
    mono: boolean;
    swap: boolean;
    bands: {
        frequency: number;
        gain: number;
    }[];
};

let audioContext: AudioContext | null = null;
const mediaElementSourceMap: Map<HTMLMediaElement, MediaElementAudioSourceNode> = new Map();
let modifiers: modifiers = {
    mono: false,
    swap: false,
    bands: [],
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch(message.type) {
        case 'modify':
            handleModifyMessage(message, sendResponse);
            break;
        case 'get':
            handleGetMessage(message, sendResponse);
            break;
    }
});

function handleModifyMessage(message: any, sendResponse: (response: any) => void) {
    switch(message.content) {
        case 'reset':
            modifiers.mono = false;
            modifiers.swap = false;
            modifiers.bands = [];
            sendResponse(modifiers);
            break;
        case 'toggleMono':
            modifiers.mono = !modifiers.mono;
            sendResponse(modifiers.mono);
            break;
        case 'toggleSwap':
            modifiers.swap = !modifiers.swap;
            sendResponse(modifiers.swap);
            break;
        case 'setBands':
            modifiers.bands = message.data;
            sendResponse(modifiers.bands);
            break;
    }
    updateEqualizerChain(modifiers);
}

function handleGetMessage(message: any, sendResponse: (response: any) => void) {
    switch(message.content) {
        case 'getModifiers':
            sendResponse(modifiers);
            break;
        case 'getWebsiteURL':
            sendResponse(window.location.hostname);
            break;
        case 'getWebsiteTitle':
            sendResponse(document.title);
            break;
    }
}

function updateEqualizerChain(modifiers: modifiers) {
    audioContext = audioContext ?? new AudioContext();
    audioContext.resume();
    const equalizerChain = createEqualizerChain(audioContext, modifiers);
    const mediaElements = document.querySelectorAll<HTMLMediaElement>('video, audio');
    for(const mediaElement of mediaElements) {
        const mediaElementSource = mediaElementSourceMap.has(mediaElement) ?
            mediaElementSourceMap.get(mediaElement) as MediaElementAudioSourceNode:
            audioContext.createMediaElementSource(mediaElement);
        mediaElementSourceMap.set(mediaElement, mediaElementSource);
        mediaElementSource.disconnect();
        mediaElementSource.connect(equalizerChain.head);
    }
    equalizerChain.tail.connect(audioContext.destination);
}

function createEqualizerChain(audioContext: AudioContext, modifiers: modifiers) {
    const equalizerChain: {
        head: AudioNode;
        tail: AudioNode;
    }[] = [createPlaceholderChain(audioContext)];
    if(modifiers.mono)
        equalizerChain.push(createMonoChain(audioContext));
    if(modifiers.swap && !modifiers.mono)
        equalizerChain.push(createSwapChain(audioContext));
    if(modifiers.bands.length > 0)
        equalizerChain.push(createBandChain(audioContext, modifiers.bands));
    for(let i = 0; i < equalizerChain.length - 1; i ++)
        equalizerChain[i].tail.connect(equalizerChain[i + 1].head);
    return {
        head: equalizerChain[0].head,
        tail: equalizerChain[equalizerChain.length - 1].tail,
    };
}

function createPlaceholderChain(audioContext: AudioContext) {
    const gain = audioContext.createGain();
    return {
        head: gain,
        tail: gain,
    }
}

function createMonoChain(audioContext: AudioContext) {
    const merger = audioContext.createChannelMerger(1);
    return {
        head: merger,
        tail: merger,
    }
}

function createSwapChain(audioContext: AudioContext) {
    const splitter = audioContext.createChannelSplitter(2);
    const merger = audioContext.createChannelMerger(2);
    splitter.connect(merger, 0, 1);
    splitter.connect(merger, 1, 0);
    return {
        head: splitter,
        tail: merger,
    }
}

function createBandChain(audioContext: AudioContext, bands: modifiers['bands']) {
    const bandChain = [];
    for(const band of bands) {
        const filter = audioContext.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = band.frequency;
        filter.gain.value = band.gain;
        bandChain.push(filter);
    }
    for(let i = 0; i < bandChain.length - 1; i ++)
        bandChain[i].connect(bandChain[i + 1]);
    return {
        head: bandChain[0],
        tail: bandChain[bandChain.length - 1],
    }
}