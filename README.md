# Kinetic Technical Suite

A high-performance, strictly client-side developer toolset designed for precision, flow, and privacy. 

Built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**, Kinetic Technical Suite provides robust tools for everyday developer tasks without ever sending your data to a server.

## 🚀 Features

### 1. Markdown Editor
- **Real-time Preview**: GitHub-flavored markdown rendering with `remark-gfm`.
- **Toolbar Support**: Quick formatting for bold, italic, strikethrough, code blocks, and more.
- **Visual Capture Export**: High-fidelity PDF export using `html2canvas` visual rendering.
- **Mermaid Diagrams**: Native support for flowchart, sequence, and Gantt charts with inline error handling.
- **Local Persistence**: Drafts are kept in-memory or exported manually; no data leaves your device.

### 2. JSON Formatter
- **Beautify**: Clean up messy JSON with adjustable indentation and key sorting.
- **Precision Validation**: Real-time linting and error reporting.
- **Local-Only**: Entirely client-side processing for sensitive data.

### 3. File Converters
- **MD/Word → PDF**: High-fidelity visual transformation using `mammoth` and `html2canvas`.
- **PDF → Word**: Text extraction and structural rebuilding using `pdfjs-dist` and `docx`.
- **Offline Reliability**: Uses local Web Workers for PDF processing, ensuring stability behind firewalls.

### 4. VS Code Shortcuts
- **Comprehensive Database**: Over 60 essential shortcuts categorized by workflow (Navigation, Editing, Debugging, etc.).
- **Smart Filtering**: Instant search and category-based filtering.

### 5. Diff Checker
- **Side-by-Side Comparison**: Semantic highlighting for code and text differences.

---

## 🎨 Design System: Ethereal Arcade
Kinetic uses a custom design system focused on:
- **Tonal Layering**: Deep surface levels for reduced eye strain.
- **Glassmorphism**: Subtle translucency and blur effects.
- **Dynamic Interaction**: Fluid micro-animations and hover states.
- **Responsive Layout**: Seamless transition between Desktop and Tablet views.

---

## 📂 Project Structure

```text
kinetic-technical-suite/
├── src/
│   ├── components/       # Reusable UI components (Layout, Sidebar, TopNav)
│   ├── data/             # Static datasets (Shortcuts, icons)
│   ├── pages/            # Feature views (Editor, Converters, Dashboard)
│   ├── lib/              # Utility functions and shared logic
│   ├── App.tsx           # Route definitions & Theme Context
│   └── main.tsx          # Application entry point
├── public/               # Static assets
└── index.html            # Main HTML template
```

---

## 🛠️ Installation & Tech Stack

**Prerequisites:** Node.js 18+

1. Clone the repository
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`
4. Build for production: `npm run build`

**Key Libraries:**
- `react-markdown` / `remark-gfm`
- `mermaid`
- `jspdf` / `html2canvas`
- `pdfjs-dist`
- `docx` / `mammoth`
- `lucide-react`
- `motion` (Framer Motion)

---

## 📜 License

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)**. 

---

Made with ❤️ by [Aravind](https://aravind-sagar.github.io/)
