# Core Arena
Core Arena is a PvP game where players can form squads with any ERC-721 NFT, unleash unique auto-generated skills from each NFT trait, and battle others for staked $CORE.

* Website: https://corearena.xyz/
* Twitter: https://x.com/corearena_xyz

![Battle](/app/static/screenshot2.png)
![Create a match](/app/static/screenshot1.png)

# New updates since last Core Global Gaming Hackathon
🔥 Quest system: daily quest & event quest
🔥 NFT reward store
🔥 Bot modes
🔥 Gamification UI
🔥 New type of skills
🔥 Performance boost: 80% faster battle processing
Roadmap and details of upcoming updates at: https://corearena.xyz/docs/vision/

# Contract on Core Mainet:
* Contract Core Arena: https://scan.coredao.org/address/0x8eF331267028660A38cCd5dd08d9C862e8fBDc56
* Contract minting NFT for demo: https://scan.coredao.org/address/0xa2C7b5aD89FAF313fD734c1B810583A765048A8b

# Material:
* Demo video: https://youtu.be/N4CM4wZ_6V0
* Website: https://corearena.xyz/
* Full detail submission on Dorahack: https://dorahacks.io/buidl/23763/
* Core Arena Deck: https://docs.google.com/presentation/d/1HOwnLSlCWy-WF1xQ4ppbAZUv7oxR5juXjEd72xXTzLk/edit?usp=sharing

# How to run
* Navigate to the folder/app directory
* Run npm install to install dependencies
* Execute npm run dev and visit http://localhost:5173/

# Utilizing Core chain
* Use $CORE as stake for each battle, winner takes $CORE from loser
* Utilizing Core chain's fast transaction speed with low gas fees ensures seamless and efficient interactions such as instantly creating matches and challenging others, greatly enhancing the gaming experience.

# Technical Workflow
* User chooses 3 NFTs then stakes $CORE to contract to create struct with unique battleID in contract
* Backend verifies on-chain data and creates a queue with that battleID and the NFT squad user chose
* Other user who joins that battleID must deposit the same amount of money to contract and choose 3 NFTs to battle
* After verifying on-chain, backend processes battle and returns the signature to address who won to withdraw the stake (the contract nonce prevents signature reuse and has rule that only defender or attacker can withdraw money)

# Team
*  Quan Nguyen: Full-Stack Developer – Leads backend architecture and smart contract implementation.
*  Duc Nguyen: Smart Contract Developer – Focuses on smart contract optimization and security.
*  FreakCdev: Front-End Developer & Graphic Designer - Create user interface and game assets

# Contact
**justlearning1235@gmail.com** or **hello.corearena@gmail.com**

