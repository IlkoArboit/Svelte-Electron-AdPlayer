import Loki from "lokijs";
const db = new Loki("ads.db");
import { adsCollectionStore } from "./store";
import { get } from "svelte/store";

/**
 * The function initializes a database collection for ads, ensuring uniqueness based on the "id" field.
 */
function initializeDatabase() {
  adsCollectionStore.set(db.getCollection("ads"));
  if (!get(adsCollectionStore)) {
    adsCollectionStore.set(db.addCollection("ads", { unique: ["id"] }));
  }
}

/**
 * The function `saveOrUpdateAd` checks if an ad already exists in a collection and either updates it
 * or inserts it accordingly.
 * @param ad - The `ad` parameter in the `saveOrUpdateAd` function represents an advertisement object
 * that contains information about an ad.
 * This function is responsible for either updating an existing ad in the `adsCollection` or inserting
 * a new ad if
 */
function saveOrUpdateAd(ad) {
  let existingAd = get(adsCollectionStore).findOne({ id: ad.id });
  if (existingAd) {
    adsCollectionStore.update((value) => {
      value.update(Object.assign(existingAd, ad));
      return value;
    });
  } else {
    adsCollectionStore.update((value) => {
      value.insert(ad);
      return value;
    });
  }
}

/**
 * The `downloadFile` function downloads a file from a specified URL and saves it to a destination
 * using Node.js.
 * @param dest - The `dest` parameter in the `downloadFile` function is the destination path where the
 * downloaded file will be saved.
 * @param callback - The `callback` parameter in the `downloadFile` function is a function that will be
 * called once the file download is complete. It is used to handle any further actions that need to be
 * taken after the file has been successfully downloaded.
 */
async function downloadFile(url, dest, callback) {
  const file = fs.createWriteStream(dest);
  https.get(url, (response) => {
    response.pipe(file);
    file.on("finish", () => {
      file.close(callback);
    });
  });
}
