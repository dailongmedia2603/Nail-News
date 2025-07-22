import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import 'quill/dist/quill.snow.css'; // Add Quill editor styles

createRoot(document.getElementById("root")!).render(<App />);