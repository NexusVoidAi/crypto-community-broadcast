
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CryptoBlast Communities Contract
 * @dev Manages community registration and membership on the blockchain
 */
contract CryptoBlastCommunities {
    address public owner;
    uint256 public communityCount;
    
    struct Community {
        uint256 id;
        string name;
        string platform;
        address owner;
        uint256 pricePerAnnouncement;
        uint256 reach;
        bool approved;
        uint256 createdAt;
    }
    
    // Mapping from community ID to Community
    mapping(uint256 => Community) public communities;
    
    // Mapping from community ID to members
    mapping(uint256 => address[]) public communityMembers;
    
    // Mapping to track if an address is a member of a community
    mapping(uint256 => mapping(address => bool)) public isMember;
    
    // Events
    event CommunityCreated(uint256 indexed id, string name, address indexed owner);
    event CommunityApproved(uint256 indexed id);
    event MemberJoined(uint256 indexed communityId, address indexed member);
    event PriceUpdated(uint256 indexed communityId, uint256 newPrice);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyCommunityOwner(uint256 _communityId) {
        require(communities[_communityId].owner == msg.sender, "Only community owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        communityCount = 0;
    }
    
    /**
     * @dev Creates a new community
     * @param _name Name of the community
     * @param _platform Platform of the community (e.g., "TELEGRAM", "DISCORD")
     * @param _pricePerAnnouncement Price per announcement in the community (in wei)
     * @param _reach Estimated reach of the community
     */
    function createCommunity(
        string memory _name,
        string memory _platform,
        uint256 _pricePerAnnouncement,
        uint256 _reach
    ) external {
        communityCount++;
        
        communities[communityCount] = Community({
            id: communityCount,
            name: _name,
            platform: _platform,
            owner: msg.sender,
            pricePerAnnouncement: _pricePerAnnouncement,
            reach: _reach,
            approved: false,
            createdAt: block.timestamp
        });
        
        emit CommunityCreated(communityCount, _name, msg.sender);
    }
    
    /**
     * @dev Approves a community
     * @param _communityId ID of the community to approve
     */
    function approveCommunity(uint256 _communityId) external onlyOwner {
        require(_communityId <= communityCount, "Community does not exist");
        require(!communities[_communityId].approved, "Community already approved");
        
        communities[_communityId].approved = true;
        
        emit CommunityApproved(_communityId);
    }
    
    /**
     * @dev Updates the price per announcement for a community
     * @param _communityId ID of the community
     * @param _newPrice New price per announcement (in wei)
     */
    function updatePrice(uint256 _communityId, uint256 _newPrice) external onlyCommunityOwner(_communityId) {
        communities[_communityId].pricePerAnnouncement = _newPrice;
        
        emit PriceUpdated(_communityId, _newPrice);
    }
    
    /**
     * @dev Allows a user to join a community
     * @param _communityId ID of the community to join
     */
    function joinCommunity(uint256 _communityId) external {
        require(_communityId <= communityCount, "Community does not exist");
        require(communities[_communityId].approved, "Community not approved yet");
        require(!isMember[_communityId][msg.sender], "Already a member");
        
        communityMembers[_communityId].push(msg.sender);
        isMember[_communityId][msg.sender] = true;
        
        emit MemberJoined(_communityId, msg.sender);
    }
    
    /**
     * @dev Gets the number of members in a community
     * @param _communityId ID of the community
     * @return Number of members
     */
    function getMemberCount(uint256 _communityId) external view returns (uint256) {
        return communityMembers[_communityId].length;
    }
    
    /**
     * @dev Transfers ownership of the contract
     * @param _newOwner Address of the new owner
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }
}
