# barcodetech (1999) Barcode Scanner

A mobile-first barcode scanner MVP that runs as a static website. It scans EAN-13, EAN-8, UPC-A and Code 128 with the ZXing browser library, keeps a local scan history, exports CSV, and validates EAN/UPC check digits.

## Run locally

Open `index.html` directly to inspect the interface and use manual check-digit validation. Camera access requires a secure context: use HTTPS or `localhost`. For a local server, from this folder run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`. The browser may ask for camera permission after you press **เริ่มสแกน**.

## Deploy to GitHub Pages

1. Create a new, empty GitHub repository for this project. Do not select a template that adds conflicting project files.
2. Upload the files in this folder to the repository root (`index.html`, `styles.css`, `app.js`, and this README).
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select your publishing branch (usually `main`) and the `/ (root)` folder, then save.
6. Wait for GitHub Pages to finish publishing, then open the HTTPS URL shown in Pages settings. Grant the site camera permission when prompted.

GitHub Pages serves HTTPS, which is required for camera access. Keep the required `index.html` at the repository root for this setup.

## Privacy and storage

The app has no application server and sends no barcode or history data to one. Camera frames are processed in the browser by ZXing. Scan history is stored in this browser's local storage (up to the latest 200 scans). Clearing browser site data removes it. Google Fonts and the pinned ZXing script are loaded from third-party CDNs; those services receive normal network requests, but the app does not send them the scanned values.

CSV cells are quoted and escaped, and barcode values are kept as text so leading zeroes are retained. When opening a CSV in spreadsheet software, import the barcode column as **Text** if the spreadsheet auto-converts values.

## Test checklist

- [ ] Open the site on a phone over its GitHub Pages HTTPS address.
- [ ] Start scanning and allow camera access; verify the rear camera is selected where available.
- [ ] Scan one EAN-13, EAN-8, UPC-A, and Code 128 barcode; confirm value and format appear.
- [ ] Confirm a detected value can be copied and is added once to local history.
- [ ] Reload the page; confirm history remains on that device and browser.
- [ ] Remove one history row, then export CSV and check barcode values with leading zeros.
- [ ] Clear all history and confirm the empty state returns.
- [ ] Check valid examples: `4006381333931` (EAN-13), `96385074` (EAN-8), `036000291452` (UPC-A).
- [ ] Check invalid check digits, non-numeric input, and unsupported input lengths.
- [ ] Switch to check-digit calculation and try `400638133393` (EAN-13 base), `9638507` (EAN-8 base), and `03600029145` (UPC-A base); verify the completed codes are shown.
- [ ] Deny camera permission and confirm the helpful permission state appears.
- [ ] Open on a non-HTTPS host (other than localhost) and confirm the HTTPS requirement appears.
- [ ] Turn off the network before loading to confirm the external ZXing dependency is unavailable and the error state is helpful.

## Notes

- This MVP is client-side only and intentionally has no account, shared company history, or server sync.
- Barcode recognition depends on camera quality, lighting, focus, and the browser. Test with the actual devices and labels used by your team.
- Library: [`@zxing/browser`](https://github.com/zxing-js/browser), loaded as a pinned UMD script (`0.1.5`).
