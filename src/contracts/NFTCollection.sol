// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFTCollection is ERC721, ERC721Enumerable {
  string[] public tokenURIs;
  // mapping(string=>string) public tokenURIs;
  mapping(string => bool) public _tokenURIExists;
  mapping(uint => string) public _tokenIdToTokenURI;

  // new features
  // change safeMint, keep the status URI(database api) here 
  // mapping(uint => string) public _tokenURIToUSD;
  // mapping(uint => bool) public _tokenURIToColdChain;

    struct Con {
    string URI;
    string img;
    uint256 id;
    string USD;
    bool coldChain;
  }

  Con[] public cons;

  constructor() 
    ERC721("mTC Collection", "mTC") 
  {
  }

  function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override(ERC721, ERC721Enumerable) {
    super._beforeTokenTransfer(from, to, tokenId);
  }

  function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
    return super.supportsInterface(interfaceId);
  }

  function tokenURI(uint256 tokenId) public override view returns (string memory) {
    require(_exists(tokenId), 'ERC721Metadata: URI query for nonexistent token');
    return _tokenIdToTokenURI[tokenId];
  }



// _safeMint(address to, uint256 tokenId, bytes _data)
// _safeTransfer(address from, address to, uint256 tokenId, bytes _data)
  function safeMint(string memory _tokenURI,string memory _img,string memory _useByDate,bool coldChain) public {
    require(!_tokenURIExists[_tokenURI], 'The token URI should be unique');
    tokenURIs.push(_tokenURI);    
    uint _id = tokenURIs.length;
    _tokenIdToTokenURI[_id] = _tokenURI;
    _safeMint(msg.sender, _id);
    _tokenURIExists[_tokenURI] = true;

    Con memory newCon =Con(_tokenURI,_img, _id, _useByDate, coldChain);
    cons.push(newCon);

  }

  function updateColdChain(uint id,bool newColdChain) public{
    require(ownerOf(id) == msg.sender);
        Con storage con = cons[id-1];
        con.coldChain=newColdChain;
  }

  // Getters
  function getCons() public view returns (Con[] memory) {
    return cons;
  }
}