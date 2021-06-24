import alfajoresActions from "actions/actions.alfajores.json";
import mainnetActions from "actions/actions.mainnet.json";

type ChainIdType = 42220 | 44787;

export const CHAIN_ID: ChainIdType =
  process.env.REACT_APP_CHAIN_ID === "42220" ? 42220 : 44787;

export const NETWORK_NAME =
  process.env.REACT_APP_CHAIN_ID === "42220" ? "Mainnet" : "Alfajores";

export const ACTIONS =
  process.env.REACT_APP_CHAIN_ID === "42220"
    ? mainnetActions
    : alfajoresActions;

export const BLOCKSCOUT_URL =
  CHAIN_ID === 42220
    ? "https://explorer.celo.org"
    : "https://alfajores-blockscout.celo-testnet.org";
