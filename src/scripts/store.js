import { writable } from "svelte/store";

let adsCollection = 0;
let currentAdIndex = 0;
let nextAdIndex = 0;
let ads = [];

export let currentAdIndexStore = writable(currentAdIndex);
export let nextAdIndexStore = writable(nextAdIndex);
export let adsStore = writable(ads);
export let adsCollectionStore = writable(adsCollection);
