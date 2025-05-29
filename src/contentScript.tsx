import { createRoot } from "react-dom/client";
import App from "./App";

// Create a container div
const container = document.createElement("div");
container.id = "code-injector-root";
container.style.position = "absolute";
container.style.top = "10px";
container.style.right = "10px";
container.style.zIndex = "9999";
document.body.appendChild(container);

// Mount React app
const root = createRoot(container);
root.render(<App />);
