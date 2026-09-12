# PaperForge — Comprehensive Project Documentation

---

## 📌 1. Project Overview & Quick Reference

- **Project Name**: PaperForge
- **Live Production URL**: [https://paperforge.vercel.app/](https://paperforge.vercel.app/)
- **GitHub Repository**: [https://github.com/AniruddhaDisale/paperforge](https://github.com/AniruddhaDisale/paperforge)
- **Deployment Platform**: Vercel (Global Edge Network, SSL/HTTPS enabled, Auto-CI/CD)
- **Primary Technology Stack**:
  - **Framework**: React 19 + TypeScript (Strict mode, ES2023)
  - **Bundler & Dev Server**: Vite 8
  - **PDF Rendering Engine**: PDF.js (`pdfjs-dist` v6.3)
  - **PDF Export & Manipulation Engine**: `pdf-lib` v1.17
  - **Icons**: Lucide React
  - **Styling**: Vanilla CSS Design Tokens (Clean, modern monochromatic UI)
- **Core Philosophy**:
  - **100% Client-Side Processing**: Zero documents are ever uploaded to external servers. All PDF rendering, vector drawing, annotations, and final PDF generation run securely inside the user's browser.

---

## 🛠️ 2. What Was Built (The Journey)

### Initial State
The project started as a raw prototype with:
- Default Vite starter boilerplate and styling (`App.css`).
- Placeholder non-functional thumbnail cards in the sidebar.
- Monolithic `App.tsx` lacking state abstractions.
- Type errors in PDF rendering (`RenderParameters` missing `canvas` in PDF.js v6).
- No actual text, drawing, highlight, shape, image, undo/redo, or PDF export engines.

### Final Production State
We engineered PaperForge into a full-featured, lightweight alternative to Adobe Acrobat and Smallpdf:
1. **Full Annotation & Drawing Suite**: In-place text editing, freehand brush vectors, translucent rectangular highlights, geometric shapes (rectangles, circles, lines, arrows), and images.
2. **Interactive Selection & Manipulation**: 8-handle directional resizing, drag-and-drop repositioning, and key-driven deletion.
3. **Complete Page Management**: Real miniature PDF canvas previews for every page, drag-and-drop page reordering, 90° clockwise/counter-clockwise rotation, page deletion with confirmation, and blank page insertion (A4 / US Letter).
4. **High-Performance Canvas Rendering**: Scaled by `window.devicePixelRatio` for sharp rendering on retina/4K displays, with in-flight render task cancellation.
5. **Multi-Level Undo/Redo Engine**: Snapshot-based history stack supporting hotkeys (`Ctrl+Z`, `Ctrl+Y`).
6. **Real PDF Export Pipeline**: Powered by `pdf-lib`, assembling the final PDF with modified page order, rotations, vector annotations, text with embedded standard fonts, and embedded images.
7. **SEO & Search Engine Discovery**: Title, meta description, keywords, OpenGraph tags, JSON-LD Schema.org WebApplication structured data, `robots.txt`, and `sitemap.xml`.
8. **Cloud Deployment & Google Verification**: Pushed to GitHub, deployed to Vercel, and verified on Google Search Console via automated HTML verification file (`googleff766a4de4a19c05.html`).

---

## 📁 3. Complete File & Architecture Map

Below is a breakdown of every file created and configured in `pdf-editor`:

```
pdf-editor/
├── public/
│   ├── favicon.svg                           # Brand logo icon
│   ├── googleff766a4de4a19c05.html           # Google Search Console domain ownership verification
│   ├── robots.txt                            # Search engine crawler permissions
│   ├── sitemap.xml                           # Search engine sitemap
│   └── sample-test.pdf                       # Built-in sample PDF for instant testing
├── src/
│   ├── types/
│   │   ├── pdf.ts                            # PageModel, DocumentState, PageSize interfaces
│   │   └── editor.ts                         # Text, Draw, Highlight, Shape, Image object unions
│   ├── utils/
│   │   ├── coordinates.ts                    # screenToPdf & pdfToScreen coordinate transforms
│   │   ├── geometry.ts                       # Bounding box math, SVG path generation, 8-handle resize
│   │   └── fileUtils.ts                      # Image-to-PNG normalization & browser download helpers
│   ├── services/
│   │   ├── pdfLoader.ts                      # PDF.js loader, worker URL setup, password exceptions
│   │   ├── pdfRenderer.ts                    # High-DPI canvas rendering pipeline with cancellation
│   │   └── pdfExporter.ts                    # pdf-lib compilation engine (rotations, pages, annotations)
│   ├── hooks/
│   │   ├── usePdfDocument.ts                 # Document state, zoom, rotation, reorder, blank pages
│   │   ├── useEditorHistory.ts               # Snapshot undo/redo history engine
│   │   ├── useKeyboardShortcuts.ts           # Global hotkeys (Ctrl+Z, Ctrl+Y, Delete, Arrows, etc.)
│   │   └── useFileDrop.ts                    # Drag-and-drop workspace listener
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TopBar.tsx                    # Branding, Undo/Redo, Shortcuts, Export button
│   │   │   ├── Workspace.tsx                 # Main viewport, toolbars, empty state, drop overlay
│   │   │   └── BottomBar.tsx                 # Page navigation, zoom in/out, fit-to-width, 100% reset
│   │   ├── sidebar/
│   │   │   ├── PageSidebar.tsx               # Thumbnails container, drag-drop reordering, add page
│   │   │   └── PageThumbnail.tsx             # Live canvas preview, page number, rotate/delete buttons
│   │   ├── toolbar/
│   │   │   ├── EditorToolbar.tsx             # Select, Text, Draw, Highlight, Image, Shape, Delete
│   │   │   └── PropertyBar.tsx               # Dynamic controls for colors, stroke width, font size, etc.
│   │   ├── pdf/
│   │   │   ├── PDFViewer.tsx                 # Coordinates canvas layer and annotation overlay
│   │   │   ├── PDFCanvas.tsx                 # High-DPI PDF.js canvas with render cancellation
│   │   │   └── SelectionOverlay.tsx          # Interaction layer, SVG annotations, handles, drag preview
│   │   ├── editor/
│   │   │   ├── SelectionBox.tsx              # Bounding box with 8 resize handles & delete shortcut
│   │   │   ├── TextAnnotation.tsx            # Inline text editor with font styles and alignment
│   │   │   ├── DrawingLayer.tsx              # SVG vector paths for smooth brush strokes
│   │   │   ├── HighlightAnnotation.tsx       # Translucent rectangle with multiply blend mode
│   │   │   ├── ShapeAnnotation.tsx           # SVG rectangles, circles, lines, and arrows
│   │   │   └── ImageAnnotation.tsx           # Placed image element with aspect-ratio scaling
│   │   ├── dialogs/
│   │   │   ├── ConfirmDialog.tsx             # Generic confirmation modal (page delete, discard edits)
│   │   │   ├── PasswordDialog.tsx            # Password prompt for encrypted PDFs with retry
│   │   │   ├── AddPageDialog.tsx             # Modal to add blank A4/Letter page in portrait/landscape
│   │   │   ├── ShortcutsDialog.tsx           # Visual keyboard shortcuts cheat sheet
│   │   │   └── ExportDialog.tsx              # Export progress and download confirmation modal
│   │   └── common/
│   │       ├── Toast.tsx                     # Non-intrusive floating toast notifications
│   │       └── ColorPicker.tsx               # Curated palette popover with transparent fill support
│   ├── styles/
│   │   └── theme.css                         # Design tokens: monochromatic palette, shadows, borders
│   ├── index.css                             # Global layout, resets, typography, and component styling
│   ├── App.tsx                               # Central orchestration component
│   └── main.tsx                              # React root entry point
├── index.html                                # SEO tags, keywords, OpenGraph, Twitter, JSON-LD Schema
├── vercel.json                               # Vercel SPA routing rewrite configuration
├── package.json                              # Project metadata, dependencies, build/lint scripts
└── tsconfig.app.json                         # TypeScript configuration (strict checks)
```

---

## 🧠 4. Core Technical Solutions

### A. Normalized PDF Coordinate System (`coordinates.ts`)
- PDF documents define measurements in points (72 points = 1 inch), with bottom-left origin in `pdf-lib` and top-left origin in browser DOM.
- We standardized all editor annotations (x, y, width, height) in **unscaled PDF points with top-left origin**.
- When zooming:
  $$\text{screenX} = \text{pdfX} \times \text{zoom}$$
  $$\text{pdfX} = \frac{\text{screenX}}{\text{zoom}}$$
- When exporting with `pdf-lib`:
  $$\text{pdfLibY} = \text{pageHeight} - \text{pdfY} - \text{objectHeight}$$
- **Result**: Annotations never drift or shift when zooming, resizing windows, or exporting.

### B. High-DPI Sharp Rendering (`pdfRenderer.ts`)
- Default HTML canvases on high-density (Retina / 4K) screens become blurry when scaled with CSS.
- We scale internal canvas dimensions using `window.devicePixelRatio` while keeping CSS display dimensions intact, applying a 2D canvas transform matrix.
- When pages change rapidly, obsolete in-flight render tasks are safely cancelled with `renderTask.cancel()` to prevent canvas corruption.

### C. Universal Image Normalization (`fileUtils.ts`)
- `pdf-lib` natively only embeds PNG and JPEG binaries.
- To allow users to insert WebP, SVG, GIF, or other browser-supported formats, our utility draws uploaded images onto an off-screen HTMLCanvas and converts them to standard PNG byte arrays prior to embedding.

---

## 🌐 5. Deployment & Google Search Setup

### Where It Is Hosted
- **Repository**: Hosted publicly on GitHub at `https://github.com/AniruddhaDisale/paperforge`.
- **Hosting Provider**: **Vercel** (Global Edge CDN, automatic HTTPS/SSL, zero server maintenance).
- **Live URL**: `https://paperforge.vercel.app`

### How It Was Deployed
1. Initialized local Git repository inside `D:\Paper Forge\pdf-editor` on branch `main`.
2. Created initial commit with clean production bundle, professional `README.md`, and SEO assets.
3. Connected GitHub remote:
   ```bash
   git remote add origin https://github.com/AniruddhaDisale/paperforge.git
   git push -u origin main
   ```
4. Connected Vercel via GitHub App integration with single-repo permissions (`paperforge`).
5. Vercel auto-detected Vite configuration and generated the production deployment in under 40 seconds.

### Google Search Console Verification
1. Configured Google Search Console property for `https://paperforge.vercel.app/`.
2. Added HTML verification file `public/googleff766a4de4a19c05.html`.
3. Pushed commit to GitHub &rarr; Vercel deployed in 15 seconds.
4. Google successfully verified site ownership.
5. Submitted `sitemap.xml` and requested indexing for the homepage.

---

## 💻 6. How to Run, Test, and Update Going Forward

### Local Development
```powershell
# 1. Navigate to the project directory
cd "D:\Paper Forge\pdf-editor"

# 2. Start Vite development server
npm run dev
# Opens at http://localhost:5173/
```

### Production Build & Linting
```powershell
# Check types and compile production bundle into /dist
npm run build

# Run ESLint validation
npm run lint

# Preview the production build locally
npm run preview
```

### How to Push Updates Live to the Web
Whenever you make changes to the code in the future:
```powershell
cd "D:\Paper Forge\pdf-editor"
git add .
git commit -m "Describe your update here"
git push
```
**That's it!** Vercel listens for changes on your GitHub `main` branch and will automatically build and deploy your updates to `https://paperforge.vercel.app/` within 30 seconds.
