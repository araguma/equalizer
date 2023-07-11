export type modifiers = {
    mono: boolean;
    swap: boolean;
    bands: band[];
}

export type band = {
    frequency: number;
    gain: number;
};