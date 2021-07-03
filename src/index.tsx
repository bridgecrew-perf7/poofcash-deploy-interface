import React from "react";
import ReactDOM from "react-dom";
import theme from "theme";
import App from "App";
import { ThemeProvider } from "theme-ui";
import { BrowserRouter } from "react-router-dom";
import { CHAIN_ID } from "config";
import {
  Alfajores,
  ContractKitProvider,
  Mainnet,
} from "@ubeswap/use-contractkit";
import { ChainId } from "@ubeswap/sdk";

import "@ubeswap/use-contractkit/lib/styles.css";
import "index.css";

declare global {
  interface Window {
    // TODO no-any
    genZKSnarkProofAndWitness: any;
  }
}

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <ContractKitProvider
          dappName="Poof.cash deployer"
          dappDescription="dApp for deploying the Poof smart contracts"
          dappUrl={window.location.href.slice(
            0,
            window.location.href.length - 1
          )}
          networks={[CHAIN_ID === ChainId.MAINNET ? Mainnet : Alfajores]}
        >
          <App />
        </ContractKitProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
