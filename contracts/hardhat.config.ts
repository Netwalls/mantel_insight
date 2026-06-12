import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import * as dotenv from 'dotenv'
dotenv.config()

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    mantle: {
      url: process.env.MANTLE_RPC_URL || 'https://rpc.mantle.xyz',
      chainId: 5000,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
    mantleTestnet: {
      url: process.env.MANTLE_TESTNET_RPC_URL || 'https://rpc.sepolia.mantle.xyz',
      chainId: 5003,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
    hardhat: {
      chainId: 31337,
    },
  },
  etherscan: {
    apiKey: {
      mantle: 'placeholder', // Mantle uses its own explorer
    },
    customChains: [
      {
        network: 'mantle',
        chainId: 5000,
        urls: {
          apiURL: 'https://explorer.mantle.xyz/api',
          browserURL: 'https://explorer.mantle.xyz',
        },
      },
    ],
  },
}

export default config
