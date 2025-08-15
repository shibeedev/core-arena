export const onboardingFlows = {
  newUser: [
    {
      title: 'Welcome to the NFT Arena',
      description: '',
      targetElement: 'all',
      manualNext: true,
      toolkitPos: [45, 18],
      isShowToolTip: true,
      showWhen: (gameState, events) => true,
      completeWhen: (gameState, events) => {false}
    },
    {
      title: 'Before battle, you need to get yourself an NFT',
      description: '',
      targetElement: 'showQuickMintElement',
      manualNext: false,
      toolkitPos: [10, 20],
      isShowToolTip: true,
      showWhen: () => true,
      completeWhen: (gameState, events) => events.clickedButtons.has('doneMintGenerate-button')
    },
    {
      title: 'Visit the Training room',
      description: 'Let\'s test the power of your NFT',
      targetElement: 'training-button',
      manualNext: false,
      toolkitPos: [10, 10],
      isShowToolTip: true,
      showWhen: () => true,
      completeWhen: (gameState, events) => events.clickedButtons.has('training-button') || gameState.navigation === 'trainingRoom'
    },
    {
      title: 'No show',
      description: 'No show',
      targetElement: 'training-fight-button',
      manualNext: false,
      toolkitPos: [50, 10],
      isShowToolTip: false,
      showWhen: (gameState) => gameState.navigation === 'trainingRoom',
      completeWhen: (gameState, events) => events.clickedButtons.has('training-fight-button') || events.openedPopups.has('training-popup')
    },
    {
      title: 'Choose your NFT squad',
      description: 'You can choose duplicate NFTs to fill all 3 slots',
      targetElement: "choose-squad",
      manualNext: false,
      toolkitPos: [50, 10],
      isShowToolTip: true,
      autoNextStep: false,
      timeOutNextStep: 2000,
      showWhen: (gameState, events) => events.openedPopups.has('training-popup'),
      completeWhen: (gameState) => gameState.squad.filter(s => s.id).length >= 3
    },
    {
      title: 'None',
      description: 'None',
      targetElement: 'training-challenge-button',
      manualNext: false,
      autoNextStep: false,
      timeOutNextStep: 2000,
      showWhen: (gameState) => gameState.squad.filter(s => s.id).length >= 3,
      completeWhen: (gameState, events) => events.clickedButtons.has('training-challenge-button')
    },
    {
      title: 'wait battle loading to proceed next',
      description: '',
      targetElement: 'allTrainingRoomBattle',
      manualNext: true,
      toolkitPos: [50, 10],
      isShowToolTip: false,
      autoNextStep: false,
      timeOutNextStep: 2000,
      showWhen: (gameState, events) => true,
      completeWhen: (gameState, events) => gameState.finishLoadTrainingBattle
    },
    {
      title: 'You can click on characters to view their skills',
      description: '',
      targetElement: 'game-container',
      manualNext: false,
      toolkitPos: [50, 10],
      isShowToolTip: true,
      autoNextStep: true,
      timeOutNextStep: 8000,
      showWhen: (gameState, events) => true,
      completeWhen: (gameState, events) => gameState.navigation ==="hall"
    },
    {
      title: 'Each turn, NFT randomly perform 1 skill it has',
      description: 'NFTs with more skills → less predictable skill activation per turn. NFTs with fewer skills → more predictable skill activation. Thats how we ballance the game',
      targetElement: 'game-container',
      manualNext: false,
      toolkitPos: [45, 18],
      isShowToolTip: true,
      autoNextStep: true,
      timeOutNextStep: 8000,
      showWhen: (gameState, events) => true,
      completeWhen: (gameState, events) => gameState.navigation ==="hall"
    },
    {
      title: 'Speed up the battle',
      description: 'Click on this button to Speed up the battle',
      targetElement: 'toggle-speed',
      manualNext: false,
      toolkitPos: [60, 10],
      isShowToolTip: true,
      autoNextStep: true,
      timeOutNextStep: 10000,
      showWhen: (gameState, events) => true,
      completeWhen: (gameState, events) => events.clickedButtons.has('toggleGameSpeed') || gameState.navigation ==="hall"
    },
    {
      title: 'wait',
      description: '',
      targetElement: 'allGame',
      manualNext: false,
      toolkitPos: [45, 18],
      isShowToolTip: false,
      showWhen: (gameState, events) => true,
      completeWhen: (gameState, events) => gameState.gameEnd || events.openedPopups.has('show-game-end') || gameState.navigation ==="pvpMode" || gameState.navigation ==="hall" ,
    },
    {
      title: 'hit close button',
      description: '',
      targetElement: 'exit-training',
      manualNext: false,
      toolkitPos: [45, 18],
      isShowToolTip: false,
      autoNextStep: false,
      timeOutNextStep: 10000,
      showWhen: (gameState, events) => true,
      completeWhen: (gameState, events) => events.clickedButtons.has('exit-training') || gameState.navigation ==="pvpMode" || gameState.navigation ==="hall"
    },
    {
      title: 'Lets learn to battle other players',
      description: 'Click on PvP Mode',
      targetElement: 'pvp-button',
      manualNext: false,
      toolkitPos: [45, 26],
      isShowToolTip: true,
      autoNextStep: false,
      showWhen: (gameState, events) => true,
      completeWhen: (gameState, events) => events.clickedButtons.has('pvp-button') && gameState.navigation === 'pvpMode'
    },
    {
      title: 'Show PvP',
      description: '',
      targetElement: '',
      manualNext: false,
      toolkitPos: [50, 10],
      isShowToolTip: false,
      showWhen: (gameState, events) => true,
      completeWhen: (gameState, events) => events.clickedButtons.has('done-pvpOnboard') && gameState.navigation === 'pvpMode'
    },
    {
      title: 'End',
      description: '',
      targetElement: 'none',
      manualNext: false,
      toolkitPos: [50, 10],
      isShowToolTip: false,
      showWhen: (gameState, events) => true,
      completeWhen: (gameState, events) => {true}
    },
  ]
};