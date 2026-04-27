import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { bootstrapWeb3FromApi } from "./web3/chain";

const rootEl = document.getElementById("root")!;

void bootstrapWeb3FromApi().finally(() => {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
