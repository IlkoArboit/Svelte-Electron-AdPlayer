import { app, BrowserWindow } from "electron";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.whenReady().then(main);

function main() {
  const window = new BrowserWindow({
    width: 1024,
    height: 768,
    x: 100,
    y: 50,
    frame: false,
    fullscreenable: true,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: false,
      allowDisplayingInsecureContent: true,
      allowRunningInsecureContent: true,
    },
  });

  window.loadFile(join(__dirname, "public/index.html"));
  window.on("ready-to-show", window.show);

  window.webContents.openDevTools();
}
