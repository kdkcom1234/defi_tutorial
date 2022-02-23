pragma solidity ^0.5.0;

import "./DappToken.sol";
import "./DaiToken.sol";

// 예시 로직은 Mock Dai 토큰을 예치하면, Dapp 토큰을 같은 비율로 지급하는 형태
contract TokenFarm {
  // All code goes here ...
  string public name = "Dapp Token Farm";
  address public owner;
  DappToken public dappToken;
  DaiToken public daiToken;

  address[] public stakers;
  mapping(address => uint) public stakingBalance;
  mapping(address => bool) public hasStaked;  // 스테이킹 한적이 있는지 
  mapping(address => bool) public isStaking;  // 현재 스테이킹 상태인지

  constructor(DappToken _dappToken, DaiToken _daiToken) public {
    dappToken = _dappToken;
    daiToken = _daiToken;
    owner = msg.sender; // deploy한 address가 owner가 됨
  }

  // Stakes Tokens (Deposit)
  function stakeTokens(uint _amount) public {
    // Require amount greater than 0
    require(_amount > 0, "amount cannot be 0");

    // Trasnfer Mock Dai tokens to this contract for staking
    daiToken.transferFrom(msg.sender, address(this), _amount);

    // Update staking balance
    stakingBalance[msg.sender] = stakingBalance[msg.sender] + _amount;

    // Add user to stakers array *only* if they haven't staked already
    if(!hasStaked[msg.sender]) {
      stakers.push(msg.sender);
    }    

    // Update staking status
    isStaking[msg.sender] = true;
    hasStaked[msg.sender] = true;    
  }

  // Unstaking Tokens (Withdraw)
  function unstakeTokens() public {
      // Fetch staking balance
      uint balance = stakingBalance[msg.sender];

      // Require amount greater than 0
      require(balance > 0, "staking balance cannot be 0");

      // Transfer Mock Dai tokens to investor for unstaking
      daiToken.transfer(msg.sender, balance);


      // Reset staking balance
      stakingBalance[msg.sender] = 0;

      // Update staking status
      isStaking[msg.sender] = false;
  }  

  // Issuing Tokens
  function issueTokens() public {
    // Only owner can call this function
    require(msg.sender == owner, "caller must be the owner");

    // Issue tokens to all stakers
    for (uint i=0; i<stakers.length; i++) {
      address recipient = stakers[i];
      uint balance = stakingBalance[recipient];

      // 예시로직) 예치한 수량과 동일 수량으로 토큰 지급
      if(balance > 0) {
        dappToken.transfer(recipient, balance);
      }      
    }
  }
}