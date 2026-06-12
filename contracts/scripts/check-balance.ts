import { ethers } from 'hardhat'

async function main() {
  const [signer] = await ethers.getSigners()
  const bal = await ethers.provider.getBalance(signer.address)
  console.log('Address:', signer.address)
  console.log('Balance:', ethers.formatEther(bal), 'MNT')
}

main().catch((e) => { console.error(e); process.exit(1) })
