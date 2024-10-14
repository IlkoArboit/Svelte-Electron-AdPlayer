<script>
</script>

<main>
  <!-- svelte-ignore a11y-media-has-caption -->
  <!-- svelte-ignore missing-declaration -->
  <video id="player1" class="player" {src} autoplay controls></video>
  <!-- svelte-ignore a11y-media-has-caption -->
  <!-- svelte-ignore missing-declaration -->
  <video id="player2" class="player hidden" {src} autoplay controls></video>
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
