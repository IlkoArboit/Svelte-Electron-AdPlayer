<script>
  import { adsStore, currentAdIndexStore } from "./scripts/store.js";
  import { initializeDatabase, fetchAds } from "./scripts/scripts";
  import { onMount } from "svelte";

  let currentPlayerId = "player1";
  $: currentAdURL = "";

  $: nextAdURL = "";
  onMount(async () => {
    await initializeDatabase();
    $adsStore = await fetchAds();
    startPlayback();
    adsChecking();
  });

  //The `adsChecking()` function in the provided code snippet sets up an interval using `setInterval()` that runs a callback function every 10 seconds (10000 milliseconds).
  function adsChecking() {
    setInterval(() => {
      console.log("Checking ads for changes");
      fetchAds();
    }, 10000);
  }

  //The `setAdStyle(ad)` function in the provided code snippet is responsible for setting the style of the player element based on the ad's properties.
  function setAdStyle(ad) {
    let player = document.getElementById("player1");
    if (player.classList.contains("hidden")) {
      player = document.getElementById("player2");
    }
    if (ad.fill_screen) {
      player.style.objectFit = "fill";
    } else {
      player.style.objectFit = "contain";
    }
  }

  //The `playAd` function in the provided code snippet is responsible for displaying and transitioning between two ads on two different players (`player1` and `player2`).
  function playAd(currentAd, nextAd) {
    const player1 = document.getElementById("player1");
    const player2 = document.getElementById("player2");

    if (currentAd.type === "video") {
      player1.innerHTML = `<video src="${currentAd.url}" autoplay></video>`;
    } else {
      player1.innerHTML = `<img src="${currentAd.url}">`;
    }
    currentAdURL = currentAd.url;
    setAdStyle(currentAd);

    if (nextAd.type === "video") {
      player2.innerHTML = `<video src="${nextAd.url}" preload="auto"></video>`;
    } else {
      player2.innerHTML = `<img src="${nextAd.url}">`;
    }
    nextAdURL = nextAd.url;
    setAdStyle(currentAd);

    setTimeout(() => {
      if (currentPlayerId === "player1") {
        player1.classList.add("hidden");
        player2.classList.remove("hidden");
      } else {
        player1.classList.remove("hidden");
        player2.classList.add("hidden");
      }
    }, currentAd.length);
  }

  //The `startPlayback()` function is responsible for initiating the playback of ads in a loop.
  function startPlayback() {
    $adsStore;
    $currentAdIndexStore;
    if ($adsStore.length > 0) {
      const currentAd = $adsStore[$currentAdIndexStore];
      const nextAdIndex = ($currentAdIndexStore + 1) % $adsStore.length;
      const nextAd = $adsStore[nextAdIndex];

      playAd(currentAd, nextAd);

      setTimeout(() => {
        currentAdIndexStore.set(nextAdIndex);
        startPlayback();
      }, currentAd.length);
    }
  }
</script>

<main>
  <!-- svelte-ignore a11y-media-has-caption -->
  <!-- svelte-ignore missing-declaration -->
  <video
    id="player1"
    class="player"
    src={currentAdURL}
    autoplay
    preload="auto"
  />
  <!-- svelte-ignore a11y-media-has-caption -->
  <!-- svelte-ignore missing-declaration -->
  <video
    id="player2"
    class="player hidden"
    src={currentAdURL}
    autoplay
    preload="auto"
  />
</main>

<style>
  main {
    width: 100%;
    height: 100%;
    background-color: black;
  }

  .player {
    width: 100%;
    height: 100%;
  }

  .hidden {
    display: none;
  }
</style>
