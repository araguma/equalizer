// TODO: Prevent hardcoding of values
const radius = 8;
const diameter = radius * 2;
const minFrequency = 32;
const maxFrequency = 16384;

// TODO: Prevent context menu from appearing when deleting a slider
function createSlider(x: number, y: number) {
    const slider = document.createElement('div');
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
    }
    slider.addEventListener('mousedown', (event) => {
        event.preventDefault();
        if(event.button === 0) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        else if(event.button === 2)
        slider.parentElement!.removeChild(slider);
    });
    slider.addEventListener('click', (event) => {
        event.stopPropagation();
    });
    slider.classList.add('slider');
    slider.style.left = `${x - radius}px`;
    slider.style.top = `${y - radius}px`;
    return slider;
}

function getFrequency(slider: HTMLElement) {
    const parent = slider.parentElement!;
    const xOffset = parent.offsetLeft;
    const x = parseInt(slider.style.left) - xOffset;
    return mapExponential(x, 0, parent.offsetWidth - diameter, minFrequency, maxFrequency);
}

function getGain(slider: HTMLElement) {
    const parent = slider.parentElement!;
    const yOffset = parent.offsetTop;
    const y = parseInt(slider.style.top) - yOffset;
    return mapLinear(y, 0, parent.offsetHeight - diameter, 10, -10);
}

function setFrequency(slider: HTMLElement, frequency: number) {
    const parent = slider.parentElement!;
    const xOffset = parent.offsetLeft;
    const x = mapLogarithmic(frequency, minFrequency, maxFrequency, 0, parent.offsetWidth - diameter);
    slider.style.left = `${x + xOffset}px`;
}

function setGain(slider: HTMLElement, gain: number) {
    const parent = slider.parentElement!;
    const yOffset = parent.offsetTop;
    const y = mapLinear(gain, 10, -10, 0, parent.offsetHeight - diameter);
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