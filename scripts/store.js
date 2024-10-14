import { writable } from "svelte/store";

let adsCollection = 0;
let currentAdIndex = 0;
let nextAdIndex = 0;

export let currentAdIndexStore = writable(currentAdIndex);
export let nextAdIndexStore = writable(nextAdIndex);
export let adsCollectionStore = writable(adsCollection);
