# PaperForge

> **Edit. Annotate. Transform.**  
> A fast, lightweight, and 100% private browser-based PDF editor.

PaperForge is a modern PDF editing web application that runs entirely in your browser. All PDF rendering, vector drawing, annotations, page manipulation, and exports happen locally without uploading sensitive files to external servers.

---

## ✨ Features

- **🔒 100% Client-Side Privacy**: Your documents never leave your machine. Zero server uploads.
- **📄 High-DPI Sharp Rendering**: Canvas rendering scaled with `devicePixelRatio` for crystal-clear viewing at every zoom level.
- **✍️ Full Annotation Suite**:
  - **Text Tool**: Click-to-place text boxes, in-place editing, customizable fonts (Helvetica, Times Roman, Courier), font size, color, bold, italic, and alignment.
  - **Freehand Draw**: Smooth vector brush strokes with customizable stroke thickness and colors.
  - **Highlight Tool**: Translucent highlight boxes with multiply blend mode so text stays legible.
  - **Shape Tool**: Rectangles, circles/ellipses, lines, and arrows with stroke and fill customization.
  - **Image Insertion**: Place PNG, JPEG, and WebP images on any page with aspect-ratio scaling.
- **📑 Complete Page Management**:
  - **Real PDF Thumbnails**: Live miniature canvas previews of every document page.
  - **Page Reordering**: Intuitive drag-and-drop page ordering.
  - **Rotation**: Rotate individual pages 90° clockwise or counter-clockwise.
  - **Page Deletion**: Delete pages safely with confirmation dialogs.
  - **Add Blank Pages**: Insert blank A4 or US Letter pages in Portrait or Landscape.
- **↩️ Multi-Level History (Undo / Redo)**: Snapshot history stack with keyboard shortcuts (`Ctrl+Z`, `Ctrl+Y`).
- **🔍 Precision Coordinates**: Normalized PDF point coordinate system ensuring perfect alignment across all zoom levels and window sizes.
- **💾 Real PDF Export**: Powered by `pdf-lib`, assembling modified pages, rotations, vector annotations, text, and embedded images into a standard downloadable PDF.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite 8](https://vite.dev/)
- **PDF Rendering**: [PDF.js (pdfjs-dist)](https://mozilla.github.io/pdf.js/)
- **PDF Generation & Manipulation**: [pdf-lib](https://pdf-lib.js.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Vanilla CSS Design Tokens (Clean, modern monochromatic UI)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18+ recommended)
- `npm` or `pnpm`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/paperforge.git
   cd paperforge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. Build for production:
   ```bash
   npm run build
   ```

---

## 🌐 Deploy to Vercel

PaperForge is ready for 1-click deployment on [Vercel](https://vercel.com/):

1. Push this repository to GitHub.
2. Go to **[vercel.com/new](https://vercel.com/new)**.
3. Import your `paperforge` repository.
4. Click **Deploy**. Vercel will detect Vite and build the site automatically.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl` / `⌘` + `Z` | Undo |
| `Ctrl` / `⌘` + `Y` or `⌘` + `Shift` + `Z` | Redo |
| `Delete` / `Backspace` | Delete selected annotation |
| `←` / `→` | Previous / Next page |
| `Escape` | Deselect / switch to Select tool |
| `Ctrl` / `⌘` + `S` | Export edited PDF |
| `?` | Show keyboard shortcuts modal |

---

## 📄 License

MIT License. Open source and free to use.
