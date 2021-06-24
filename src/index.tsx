import React from "react";
import ReactDOM from "react-dom";
import theme from "theme";
import App from "App";
import { Web3Provider } from "@ethersproject/providers";
import { Web3ReactProvider, createWeb3ReactRoot } from "@web3-react/core";
import { ThemeProvider } from "theme-ui";
import { BrowserRouter } from "react-router-dom";
import { CHAIN_ID } from "config";
import {
  Alfajores,
  ContractKitProvider,
  Mainnet,
} from "@celo-tools/use-contractkit";
import { ChainId } from "@ubeswap/sdk";

import "@celo-tools/use-contractkit/lib/styles.css";
import "index.css";

declare global {
  interface Window {
    // TODO no-any
    genZKSnarkProofAndWitness: any;
  }
}

export const NetworkContextName = "NETWORK";

function getLibrary(provider: any): Web3Provider {
  const library = new Web3Provider(provider);
  library.pollingInterval = 15000;
  return library;
}

const Web3ProviderNetwork = createWeb3ReactRoot(NetworkContextName);

ReactDOM.render(
  <React.StrictMode>
    <Web3ReactProvider getLibrary={getLibrary}>
      <Web3ProviderNetwork getLibrary={getLibrary}>
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
      </Web3ProviderNetwork>
    </Web3ReactProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
