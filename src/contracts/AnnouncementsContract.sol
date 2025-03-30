
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./CommunitiesContract.sol";

/**
 * @title CryptoBlast Announcements Contract
 * @dev Manages announcements and payments for community postings
 */
contract CryptoBlastAnnouncements {
    address public owner;
    uint256 public announcementCount;
    uint256 public platformFeePercentage;
    CryptoBlastCommunities public communitiesContract;
    
    enum AnnouncementStatus { DRAFT, PENDING_VALIDATION, VALIDATION_FAILED, PUBLISHED }
    enum PaymentStatus { PENDING, PAID, FAILED }
    
    struct Announcement {
        uint256 id;
        address creator;
        string title;
        string content;
        string ctaText;
        string ctaUrl;
        string mediaUrl;
        AnnouncementStatus status;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    struct Payment {
        uint256 id;
        uint256 announcementId;
        address payer;
        uint256 amount;
        PaymentStatus status;
        bytes32 transactionHash;
        uint256 timestamp;
    }
    
    // Mapping from announcement ID to Announcement
    mapping(uint256 => Announcement) public announcements;
    
    // Mapping from announcement ID to selected communities
    mapping(uint256 => uint256[]) public announcementCommunities;
    
    // Mapping from announcement ID to payment
    mapping(uint256 => Payment) public payments;
    
    // Events
    event AnnouncementCreated(uint256 indexed id, address indexed creator);
    event AnnouncementStatusChanged(uint256 indexed id, AnnouncementStatus status);
    event PaymentProcessed(uint256 indexed announcementId, uint256 amount, address payer);
    event CommunitiesSelected(uint256 indexed announcementId, uint256[] communityIds);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyAnnouncementCreator(uint256 _announcementId) {
        require(announcements[_announcementId].creator == msg.sender, "Only announcement creator can call this function");
        _;
    }
    
    constructor(address _communitiesContractAddress) {
        owner = msg.sender;
        announcementCount = 0;
        platformFeePercentage = 5; // 5% platform fee
        communitiesContract = CryptoBlastCommunities(_communitiesContractAddress);
    }
    
    /**
     * @dev Creates a new announcement
     * @param _title Title of the announcement
     * @param _content Content of the announcement
     * @param _ctaText Call-to-action text (optional)
     * @param _ctaUrl Call-to-action URL (optional)
     * @param _mediaUrl Media URL (optional)
     */
    function createAnnouncement(
        string memory _title,
        string memory _content,
        string memory _ctaText,
        string memory _ctaUrl,
        string memory _mediaUrl
    ) external {
        announcementCount++;
        
        announcements[announcementCount] = Announcement({
            id: announcementCount,
            creator: msg.sender,
            title: _title,
            content: _content,
            ctaText: _ctaText,
            ctaUrl: _ctaUrl,
            mediaUrl: _mediaUrl,
            status: AnnouncementStatus.DRAFT,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        emit AnnouncementCreated(announcementCount, msg.sender);
    }
    
    /**
     * @dev Selects communities for an announcement
     * @param _announcementId ID of the announcement
     * @param _communityIds Array of community IDs to select
     */
    function selectCommunities(uint256 _announcementId, uint256[] memory _communityIds) external onlyAnnouncementCreator(_announcementId) {
        require(announcements[_announcementId].status == AnnouncementStatus.DRAFT, "Announcement must be in DRAFT status");
        
        for (uint i = 0; i < _communityIds.length; i++) {
            uint256 communityId = _communityIds[i];
            (,,,,,,bool approved,) = communitiesContract.communities(communityId);
            require(approved, "Selected community is not approved");
            announcementCommunities[_announcementId].push(communityId);
        }
        
        announcements[_announcementId].status = AnnouncementStatus.PENDING_VALIDATION;
        announcements[_announcementId].updatedAt = block.timestamp;
        
        emit CommunitiesSelected(_announcementId, _communityIds);
        emit AnnouncementStatusChanged(_announcementId, AnnouncementStatus.PENDING_VALIDATION);
    }
    
    /**
     * @dev Processes payment for an announcement
     * @param _announcementId ID of the announcement
     * @param _transactionHash Transaction hash for the payment
     */
    function processPayment(uint256 _announcementId, bytes32 _transactionHash) external payable onlyAnnouncementCreator(_announcementId) {
        require(announcements[_announcementId].status == AnnouncementStatus.PENDING_VALIDATION, "Announcement must be in PENDING_VALIDATION status");
        
        uint256 totalCost = 0;
        uint256[] memory communities = announcementCommunities[_announcementId];
        
        // Calculate total cost based on selected communities
        for (uint i = 0; i < communities.length; i++) {
            (,,,, uint256 price,,) = communitiesContract.communities(communities[i]);
            totalCost += price;
        }
        
        require(msg.value >= totalCost, "Insufficient payment amount");
        
        // Create payment record
        payments[_announcementId] = Payment({
            id: _announcementId,
            announcementId: _announcementId,
            payer: msg.sender,
            amount: msg.value,
            status: PaymentStatus.PAID,
            transactionHash: _transactionHash,
            timestamp: block.timestamp
        });
        
        announcements[_announcementId].updatedAt = block.timestamp;
        
        emit PaymentProcessed(_announcementId, msg.value, msg.sender);
    }
    
    /**
     * @dev Validates an announcement (admin only)
     * @param _announcementId ID of the announcement
     * @param _approved Whether the announcement is approved
     */
    function validateAnnouncement(uint256 _announcementId, bool _approved) external onlyOwner {
        require(announcements[_announcementId].status == AnnouncementStatus.PENDING_VALIDATION, "Announcement must be in PENDING_VALIDATION status");
        require(payments[_announcementId].status == PaymentStatus.PAID, "Payment must be complete");
        
        if (_approved) {
            announcements[_announcementId].status = AnnouncementStatus.PUBLISHED;
        } else {
            announcements[_announcementId].status = AnnouncementStatus.VALIDATION_FAILED;
        }
        
        announcements[_announcementId].updatedAt = block.timestamp;
        
        emit AnnouncementStatusChanged(_announcementId, announcements[_announcementId].status);
    }
    
    /**
     * @dev Gets announcement details
     * @param _announcementId ID of the announcement
     */
    function getAnnouncement(uint256 _announcementId) external view returns (
        uint256 id,
        address creator,
        string memory title,
        string memory content,
        AnnouncementStatus status,
        uint256 createdAt,
        uint256 updatedAt
    ) {
        Announcement memory announcement = announcements[_announcementId];
        return (
            announcement.id,
            announcement.creator,
            announcement.title,
            announcement.content,
            announcement.status,
            announcement.createdAt,
            announcement.updatedAt
        );
    }
    
    /**
     * @dev Sets the platform fee percentage
     * @param _feePercentage New platform fee percentage
     */
    function setPlatformFee(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 20, "Fee percentage too high");
        platformFeePercentage = _feePercentage;
    }
    
    /**
     * @dev Withdraws platform fees to the owner
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Transfer failed");
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
