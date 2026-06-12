import { ethers } from 'hardhat'

async function main() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mantle.xyz')
  const latest = await provider.getBlockNumber()
  console.log('Latest mainnet block:', latest)

  const seen = new Set<string>()
  const wallets: string[] = []

  // Known DEX routers — skip these
  const ROUTERS = new Set([
    '0xeaee7ee68874218c3558b40063c42b82d3e7232a',
    '0x319b69888b0d11cec22caa5034e25fffbdc88421',
    '0x8cfe327cec66d1c090dd72bd0ff11d690c33a2eb',
    '0x95fc37a27a2f68e3a647cdc081f2706619480207',
  ])

  for (let b = latest; b > latest - 5 && wallets.length < 7; b--) {
    const block = await provider.getBlock(b, true)
    if (!block?.transactions) continue
    for (const tx of block.transactions as any[]) {
      if (!tx.from || seen.has(tx.from)) continue
      if (ROUTERS.has(tx.from.toLowerCase())) continue
      seen.add(tx.from)
      wallets.push(tx.from)
      console.log(tx.from)
      if (wallets.length >= 7) break
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
