// Duplicate modifiers type here because it is not possible to import types in content scripts.
type modifiers = {
    mono: boolean;
    swap: boolean;
    bands: {
        frequency: number;
        gain: number;
    }[];
};

const audioContext = new AudioContext();
const mediaElementSourceMap: Map<HTMLMediaElement, MediaElementAudioSourceNode> = new Map();
let modifiers: modifiers = {
    mono: false,
    swap: false,
    bands: [],
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch(message.type) {
        case 'reset':
            modifiers.mono = false;
            modifiers.swap = false;
            modifiers.bands = [];
            break;
        case 'toggleMono':
            modifiers.mono = !modifiers.mono;
            break;
        case 'toggleSwap':
            modifiers.swap = !modifiers.swap;
            break;
        case 'setBands':
            modifiers.bands = message.bands;
            break;
    }
    sendResponse(modifiers);
    
    audioContext.resume();
    const equalizerChain = createEqualizerChain(audioContext, modifiers);
    const mediaElements = document.querySelectorAll<HTMLMediaElement>('video, audio');
    for(const mediaElement of mediaElements) {
        const mediaElementSource = mediaElementSourceMap.has(mediaElement) ?
            mediaElementSourceMap.get(mediaElement) as MediaElementAudioSourceNode:
            audioContext.createMediaElementSource(mediaElement);
        mediaElementSource.disconnect();
        mediaElementSource.connect(equalizerChain.head);
        mediaElementSourceMap.set(mediaElement, mediaElementSource);
    }
    equalizerChain.tail.connect(audioContext.destination);
});

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