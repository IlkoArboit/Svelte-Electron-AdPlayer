# Advertising Player with Electron.js and Svelte.js

This project is an advertising player built with **Electron.js** and **Svelte.js**. It allows for continuous (loop) playback of ads, including images and videos, and is designed to function offline after downloading the ads.

## Features

- **Fullscreen and Frameless Window Mode**: Allows the user to toggle between fullscreen view and a borderless window.
- **Gapless Playback**: Ads are played continuously without black screens in between.
- **Local Download**: Ads are downloaded locally before playback, ensuring they work offline.
- **Backend Query**: The player queries a backend every 10 seconds to obtain the list of ads, updating them if changes are detected.
- **Ad Styles**: Supports displaying ads either filling the entire player space or maintaining their aspect ratio.

## Technologies Used

- [Electron.js](https://www.electronjs.org/)
- [Svelte](https://svelte.dev)
- [LokiDB](https://github.com/techfort/LokiJS)

## Installation

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your system. You can verify this by running:

node -v

### Steps to Install

1.  Clone this repository:

    git clone https://github.com/IlkoArboit/Svelte-Electron-AdPlayer.git
    cd advertising-player

2.  Install the necessary dependencies:

    npm install

3.  Set your backend data Endpoint to http://localhost:3001/getMediaData:

    The application recieves the following data structure for each ad.

    ```
    [
        {
        "type": "image" | "video",
        "url": "string",
        "length": "number (ms)",
        "position": "number",
        "fill_screen": "boolean",
        "from_date": "YYYY-MM-DD HH:mm:ss",
        "to_date": "YYYY-MM-DD HH:mm:ss",
        "updated_at": "YYYY-MM-DD HH:mm:ss"
        }
    ]

    ```

4.  Start the application:

    npm run dev

## Usage

Once the application is running, the player will start displaying ads in a loop. The ads will be loaded from the specified backend, and any new or updated ads will be automatically downloaded.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

If you have any questions or suggestions, feel free to reach out to me at [ilkoarboit@gmail.comm].
