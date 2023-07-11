import config from '../config.js';

function createSlider(x: number, y: number, boundingBox: HTMLElement, diameter = 16) {
    const slider = document.createElement('div');
    const changeEvent = new Event('change');
    const radius = diameter / 2;
    const handleMouseMove = (event: MouseEvent) => {
        const parent = slider.parentElement!;
        const xMin = parent.offsetLeft;
        const yMin = parent.offsetTop;
        const xMax = xMin + parent.offsetWidth - diameter;
        const yMax = yMin + parent.offsetHeight - diameter;
        slider.style.left = `${contain(event.clientX - radius, xMin, xMax)}px`;
        slider.style.top = `${contain(event.clientY - radius, yMin, yMax)}px`;
    }
    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        slider.dispatchEvent(changeEvent);
    }
    slider.addEventListener('mousedown', (event) => {
        event.preventDefault();
        if(event.button === 0) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
    });
    slider.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        slider.parentElement!.removeChild(slider);
        slider.dispatchEvent(changeEvent);
    });
    slider.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    const xMin = boundingBox.offsetLeft;
    const yMin = boundingBox.offsetTop;
    const xMax = xMin + boundingBox.offsetWidth - diameter;
    const yMax = yMin + boundingBox.offsetHeight - diameter;
    slider.classList.add('slider');
    slider.style.left = `${contain(x - radius, xMin, xMax)}px`
    slider.style.top = `${contain(y - radius, yMin, yMax)}px`;
    slider.style.width = `${diameter}px`;
    slider.style.height = `${diameter}px`;
    return slider;
}

function getFrequency(slider: HTMLElement) {
    const parent = slider.parentElement!;
    const xOffset = parent.offsetLeft;
    const diameter = parseInt(slider.style.width);
    const x = parseInt(slider.style.left) - xOffset;
    return mapExponential(x, 0, parent.offsetWidth - diameter, config.minFrequency, config.maxFrequency);
}

function getGain(slider: HTMLElement) {
    const parent = slider.parentElement!;
    const yOffset = parent.offsetTop;
    const diameter = parseInt(slider.style.height);
    const y = parseInt(slider.style.top) - yOffset;
    return mapLinear(y, 0, parent.offsetHeight - diameter, config.maxGain, config.minGain);
}

function setFrequency(slider: HTMLElement, frequency: number) {
    const parent = slider.parentElement!;
    const xOffset = parent.offsetLeft;
    const diameter = parseInt(slider.style.width);
    const x = mapLogarithmic(frequency, config.minFrequency, config.maxFrequency, 0, parent.offsetWidth - diameter);
    slider.style.left = `${x + xOffset}px`;
}

function setGain(slider: HTMLElement, gain: number) {
    const parent = slider.parentElement!;
    const yOffset = parent.offsetTop;
    const diameter = parseInt(slider.style.height);
    const y = mapLinear(gain, config.maxGain, config.minGain, 0, parent.offsetHeight - diameter);
    slider.style.top = `${y + yOffset}px`;
}

function contain(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function mapLinear(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

function mapExponential(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
    return Math.pow(outMax / outMin, (value - inMin) / (inMax - inMin)) * outMin;
}

function mapLogarithmic(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
    return Math.log(value / inMin) / Math.log(inMax / inMin) * (outMax - outMin) + outMin;
}

export {
    createSlider,
    getFrequency,
    getGain,
    setFrequency,
    setGain,
};