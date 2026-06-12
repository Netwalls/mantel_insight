// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AlphaSightIntelligence
 * @dev On-chain verdict storage for the AlphaSight AI autonomous agent system.
 *      Every AI prediction is stored permanently on Mantle Network.
 *      Deployed by the Analyst agent after correlation analysis.
 */
contract AlphaSightIntelligence {

    struct Verdict {
        string signalType;    // "Exit Warning" | "MEV Risk" | "Whale Alert" | "Accumulation"
        uint8 confidence;     // 0-100 confidence score
        uint256 timestamp;    // block.timestamp when verdict was filed
        string pool;          // Affected pool identifier
        address agentId;      // Which agent filed this verdict
        string outcome;       // "pending" | "confirmed" | "wrong"
    }

    Verdict[] public verdicts;
    address public owner;

    // Agent identity addresses (ERC-8004 inspired)
    address public constant WATCHER_AGENT = address(0x1);
    address public constant HUNTER_AGENT = address(0x2);
    address public constant ANALYST_AGENT = address(0x3);

    // Performance tracking per agent
    mapping(address => uint256) public agentConfirmedCount;
    mapping(address => uint256) public agentWrongCount;
    mapping(address => uint256) public agentTotalCount;

    event VerdictStored(
        uint256 indexed id,
        string signalType,
        uint8 confidence,
        string pool,
        address indexed agentId
    );

    event OutcomeUpdated(
        uint256 indexed id,
        string outcome,
        address indexed agentId
    );

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "AlphaSight: Not authorized");
        _;
    }

    /**
     * @dev Store a new AI-generated verdict on-chain.
     * @return id The index of the stored verdict
     */
    function storeVerdict(
        string memory _signalType,
        uint8 _confidence,
        string memory _pool,
        address _agentId
    ) external onlyOwner returns (uint256) {
        require(_confidence <= 100, "AlphaSight: Confidence must be 0-100");
        require(bytes(_signalType).length > 0, "AlphaSight: Signal type required");

        verdicts.push(Verdict({
            signalType: _signalType,
            confidence: _confidence,
            timestamp: block.timestamp,
            pool: _pool,
            agentId: _agentId,
            outcome: "pending"
        }));

        uint256 id = verdicts.length - 1;
        agentTotalCount[_agentId]++;

        emit VerdictStored(id, _signalType, _confidence, _pool, _agentId);
        return id;
    }

    /**
     * @dev Update the outcome of a verdict after it resolves.
     *      This creates a permanent performance record for the agent.
     */
    function updateOutcome(
        uint256 _id,
        string memory _outcome
    ) external onlyOwner {
        require(_id < verdicts.length, "AlphaSight: Invalid verdict ID");

        verdicts[_id].outcome = _outcome;
        address agentId = verdicts[_id].agentId;

        // Update agent performance record
        bytes32 outcomeHash = keccak256(bytes(_outcome));
        if (outcomeHash == keccak256(bytes("confirmed"))) {
            agentConfirmedCount[agentId]++;
        } else if (outcomeHash == keccak256(bytes("wrong"))) {
            agentWrongCount[agentId]++;
        }

        emit OutcomeUpdated(_id, _outcome, agentId);
    }

    /**
     * @dev Retrieve a verdict by ID.
     */
    function getVerdict(
        uint256 _id
    ) external view returns (Verdict memory) {
        require(_id < verdicts.length, "AlphaSight: Invalid verdict ID");
        return verdicts[_id];
    }

    /**
     * @dev Get all verdicts (use with pagination in production).
     */
    function getVerdicts(
        uint256 _offset,
        uint256 _limit
    ) external view returns (Verdict[] memory) {
        uint256 total = verdicts.length;
        if (_offset >= total) return new Verdict[](0);

        uint256 end = _offset + _limit;
        if (end > total) end = total;
        uint256 length = end - _offset;

        Verdict[] memory result = new Verdict[](length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = verdicts[_offset + i];
        }
        return result;
    }

    /**
     * @dev Get agent accuracy as a percentage (0-100).
     */
    function getAgentAccuracy(address _agentId) external view returns (uint256) {
        uint256 confirmed = agentConfirmedCount[_agentId];
        uint256 wrong = agentWrongCount[_agentId];
        uint256 resolved = confirmed + wrong;
        if (resolved == 0) return 0;
        return (confirmed * 100) / resolved;
    }

    /**
     * @dev Returns total number of stored verdicts.
     */
    function totalVerdicts() external view returns (uint256) {
        return verdicts.length;
    }

    /**
     * @dev Transfer contract ownership (for future upgrades).
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "AlphaSight: Zero address");
        owner = _newOwner;
    }
}
