import { ethers } from 'hardhat'

async function main() {
  console.log('Deploying AlphaSightIntelligence to Mantle Network...')

  const [deployer] = await ethers.getSigners()
  console.log(`Deployer: ${deployer.address}`)

  const balance = await ethers.provider.getBalance(deployer.address)
  console.log(`Balance: ${ethers.formatEther(balance)} MNT`)

  const AlphaSight = await ethers.getContractFactory('AlphaSightIntelligence')
  const contract = await AlphaSight.deploy()

  await contract.waitForDeployment()

  const address = await contract.getAddress()
  console.log(`\n✅ AlphaSightIntelligence deployed to: ${address}`)
  console.log(`\nExplorer: https://explorer.mantle.xyz/address/${address}`)

  // Store a seed verdict to verify the contract works
  console.log('\nStoring seed verdict...')
  const tx = await contract.storeVerdict(
    'Exit Warning',
    85,
    'ETH/USDC',
    '0x0000000000000000000000000000000000000003', // Analyst agent
  )
  const receipt = await tx.wait()
  console.log(`✅ Seed verdict stored: tx ${receipt?.hash}`)

  console.log('\n--- DEPLOYMENT SUMMARY ---')
  console.log(`CONTRACT_ADDRESS=${address}`)
  console.log(`NETWORK=Mantle`)
  console.log(`CHAIN_ID=5000`)
  console.log(`\nAdd CONTRACT_ADDRESS to your backend .env file`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
