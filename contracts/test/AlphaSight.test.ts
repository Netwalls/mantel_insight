import { ethers } from 'hardhat'
import { expect } from 'chai'

describe('AlphaSightIntelligence', () => {
  let contract: any
  let owner: any
  let other: any
  const ANALYST_AGENT = '0x0000000000000000000000000000000000000003'

  beforeEach(async () => {
    ;[owner, other] = await ethers.getSigners()
    const Factory = await ethers.getContractFactory('AlphaSightIntelligence')
    contract = await Factory.deploy()
  })

  it('deploys with correct owner', async () => {
    expect(await contract.owner()).to.equal(owner.address)
  })

  it('stores a verdict and emits event', async () => {
    const tx = await contract.storeVerdict('Exit Warning', 87, 'ETH/USDC', ANALYST_AGENT)
    const receipt = await tx.wait()

    expect(await contract.totalVerdicts()).to.equal(1)

    const verdict = await contract.getVerdict(0)
    expect(verdict.signalType).to.equal('Exit Warning')
    expect(verdict.confidence).to.equal(87)
    expect(verdict.pool).to.equal('ETH/USDC')
    expect(verdict.outcome).to.equal('pending')
  })

  it('updates verdict outcome', async () => {
    await contract.storeVerdict('MEV Risk', 92, 'MNT/USDC', ANALYST_AGENT)
    await contract.updateOutcome(0, 'confirmed')

    const verdict = await contract.getVerdict(0)
    expect(verdict.outcome).to.equal('confirmed')
  })

  it('tracks agent accuracy', async () => {
    await contract.storeVerdict('Whale Alert', 75, 'ETH/MNT', ANALYST_AGENT)
    await contract.storeVerdict('Accumulation', 68, 'MNT/USDC', ANALYST_AGENT)

    await contract.updateOutcome(0, 'confirmed')
    await contract.updateOutcome(1, 'wrong')

    const accuracy = await contract.getAgentAccuracy(ANALYST_AGENT)
    expect(accuracy).to.equal(50) // 1 confirmed / 2 resolved = 50%
  })

  it('reverts on invalid confidence', async () => {
    await expect(
      contract.storeVerdict('Exit Warning', 101, 'ETH/USDC', ANALYST_AGENT),
    ).to.be.revertedWith('AlphaSight: Confidence must be 0-100')
  })

  it('reverts when non-owner calls', async () => {
    await expect(
      contract.connect(other).storeVerdict('Exit Warning', 80, 'ETH/USDC', ANALYST_AGENT),
    ).to.be.revertedWith('AlphaSight: Not authorized')
  })

  it('paginates verdicts correctly', async () => {
    for (let i = 0; i < 5; i++) {
      await contract.storeVerdict(`Signal ${i}`, 70 + i, 'ETH/USDC', ANALYST_AGENT)
    }

    const page1 = await contract.getVerdicts(0, 3)
    expect(page1.length).to.equal(3)

    const page2 = await contract.getVerdicts(3, 3)
    expect(page2.length).to.equal(2)
  })
})
