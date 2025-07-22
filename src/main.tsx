import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import 'quill/dist/quill.snow.css';
import './i18n'; // Initialize i18next

createRoot(document.getElementById("root")!).render(<App />);