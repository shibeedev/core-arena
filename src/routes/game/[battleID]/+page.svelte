<script>
    import { slide } from 'svelte/transition';
    import { onMount, onDestroy } from 'svelte';
    import { ethers } from "ethers";
    import config from "$lib/config.js";
    import { emitBetweenText } from '$lib/index.js';
    import { walletState, checkExistingConnection} from '$lib/wallet.js';
    import { goto } from '$app/navigation';
    let provider, signer, userAddress = "";
    import { fade } from 'svelte/transition'; 
    import { page } from '$app/stores';

    let winner, winnerAddress, receipt, attributes, challenger, defender, endPopUp = false;
    let challengerAddress ="loading";
    let defenderAddress  ="loading";
    let stake = "loading";
    let Phaser;
    let CardGameScene;
    let game;
    let gameData,data;
    let gameEnd = false;



    $: battleID = $page.params.battleID;


    async function createGameScene() {
        const Phaser = (await import('phaser')).default;
        
        return class CardGameScene extends Phaser.Scene {
            constructor() {
                super({ key: 'CardGameScene' });
                this.characters = [[], []];
                this.statsTexts = [[], []];
                this.containers = [[], []];
                this.isAnimating = false;
                this.actionQueue = [];
                this.pendingWinningTeam = null;
                this.baseWidth = 1280;
                this.baseHeight = 720;
                this.isFirstAction = true;
            }
            init(data) {
                this.gameData = data.gameData;
                this.configUrl = data.configUrl;
                this.time.timeScale = gameSpeedMultiplier;
            }

            create() {
                const bg = this.add.image(0, 0, 'background');
                bg.setOrigin(0, 0);
                bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
                
              
                this.gameData.attributeInfo.forEach(attr => {
                    this.anims.create({
                        key: `${attr.name}-fly`,
                        frames: this.anims.generateFrameNumbers(`sprite-${attr.name}`, {
                            frames: [4, 5, 6, 7]
                        }),
                        frameRate: 12,
                        repeat: -1
                    });

             
                    this.anims.create({
                        key: `${attr.name}-hit`,
                        frames: this.anims.generateFrameNumbers(`sprite-${attr.name}`, {
                            frames: [0, 1, 2, 3]
                        }),
                        frameRate: 10,
                        repeat: 0
                    });
                });
          
                this.anims.create({
                    key: 'buff-atk-anim',
                    frames: this.anims.generateFrameNumbers('buff-atk', { start: 0, end: 8 }),
                    frameRate: 12,
                    repeat: 0
                });

                this.anims.create({
                    key: 'debuff-atk-anim',
                    frames: this.anims.generateFrameNumbers('debuff-atk', { start: 0, end: 8 }),
                    frameRate: 12,
                    repeat: 0
                });

                this.anims.create({
                    key: 'buff-res-anim',
                    frames: this.anims.generateFrameNumbers('buff-res', { start: 0, end: 8 }),
                    frameRate: 12,
                    repeat: 0
                });

                this.anims.create({
                    key: 'debuff-res-anim',
                    frames: this.anims.generateFrameNumbers('debuff-res', { start: 0, end: 8 }),
                    frameRate: 12,
                    repeat: 0
                });

                this.anims.create({
                    key: 'buff-maxhp-anim',
                    frames: this.anims.generateFrameNumbers('buff-maxhp', { start: 0, end: 8 }),
                    frameRate: 16,
                    repeat: 0
                });

                this.anims.create({
                    key: 'debuff-maxhp-anim',
                    frames: this.anims.generateFrameNumbers('debuff-maxhp', { start: 0, end: 8 }),
                    frameRate: 16,
                    repeat: 0
                });

                this.anims.create({
                    key: 'heal-anim',
                    frames: this.anims.generateFrameNumbers('heal', { start: 0, end: 8 }),
                    frameRate: 12,
                    repeat: 0
                });
                ////////// Create Passive Effects ////////////
                this.anims.create({
                    key: 'stun-effect',
                    frames: this.anims.generateFrameNumbers('stun', { start: 0, end: 3 }),
                    frameRate: 12,
                    repeat: -1 
                });

                this.initializeCharacters();
                this.processReceipt(this.game.receipt);
                //dispatch event to know the game is ready
                window.dispatchEvent(new CustomEvent('game-scene-ready'));
            }

            initializeCharacters() {
                this.previousStats = {
                    team1: this.gameData.challenger.map(char => ({ hp: char.hp || 1000, maxHP: char.maxHP || 1000, atk: char.atk || 50, res: char.res || 0.5 })),
                    team2: this.gameData.defender.map(char => ({ hp: char.hp || 1000, maxHP: char.maxHP || 1000, atk: char.atk || 50, res: char.res || 0.5 }))
                };
                const team0Positions = [
                    { x: this.cameras.main.width * 0.2, y: this.cameras.main.height * 0.25 },
                    { x: this.cameras.main.width * 0.5, y: this.cameras.main.height * 0.25 },
                    { x: this.cameras.main.width * 0.8, y: this.cameras.main.height * 0.25 }
                ];

                const team1Positions = [
                    { x: this.cameras.main.width * 0.2, y: this.cameras.main.height * 0.75 },
                    { x: this.cameras.main.width * 0.5, y: this.cameras.main.height * 0.75 },
                    { x: this.cameras.main.width * 0.8, y: this.cameras.main.height * 0.75 }
                ];

                for (let pos = 0; pos < 3; pos++) {
                    this.characters[0][pos] = this.createCharacter(
                        team0Positions[pos].x,
                        team0Positions[pos].y,
                        0,
                        pos
                    );

                    this.characters[1][pos] = this.createCharacter(
                        team1Positions[pos].x,
                        team1Positions[pos].y,
                        1,
                        pos
                    );
                }
            }

            createCharacter(x, y, team, position) {
                const container = this.add.container(x, y);
                this.containers[team][position] = container;

                const character = this.physics.add.image(0, 0, 'character');
                character.team = team;
                character.position = position;

                const characterImage = this.add.image(0, 0, `charater${team}${position}`);
                characterImage.setOrigin(0.5);


                const faintedOverlay = this.add.image(0, 0, 'fainted');
                faintedOverlay.setOrigin(0.5);
                faintedOverlay.visible = false;

                
                const scale = Math.min(
                    this.cameras.main.width / this.baseWidth,
                    this.cameras.main.height / this.baseHeight
                ) * 0.75;

                character.setScale(scale);

                characterImage.displayWidth = character.height * scale * 0.6;
                characterImage.displayHeight = character.height * scale * 0.6;

                faintedOverlay.displayWidth = characterImage.displayWidth;
                faintedOverlay.displayHeight = characterImage.displayHeight;
                    
                characterImage.setPosition(0, -character.height * scale * 0.1);
                faintedOverlay.setPosition(0, -character.height * scale * 0.1);


                const barWidth = 150 * scale;
                const barHeight = 20 * scale;
                const barX = -barWidth / 2;
                const barY = -character.height * scale / 2 - barHeight - 5;

                const hpBarBg = this.add.rectangle(
                    barX, 
                    barY + barHeight/2,
                    barWidth,
                    barHeight,
                    0x333333
                );

                const hpBarFg = this.add.rectangle(
                    barX,
                    barY + barHeight/2,
                    barWidth,
                    barHeight,
                    0x00ff00
                );
        
                hpBarBg.setOrigin(0, -10.5);
                hpBarFg.setOrigin(0,  -10.5);

                
                character.setCollideWorldBounds(true);
                character.setBounce(0.2);
                character.setDamping(true);
                character.setDrag(0.95);
                
                character.setInteractive();
                character.on('pointerover', () => {
                    character.setTint(0x00ff00);
                    characterImage.setTint(0x00ff00);
                });
                character.on('pointerout', () => {
                    character.clearTint();
                    characterImage.clearTint();
                });

                // Add click event to show selected character details /////////////////////
                character.on('pointerdown', () => {
                    selectedCharacter = { team: team, position: position };
                    
                    const characterData = team === 0 
                        ? this.gameData.challenger[position] 
                        : this.gameData.defender[position];
                    
                    const stats = team === 0 
                        ? this.previousStats.team1[position] 
                        : this.previousStats.team2[position];
                    
                    const { hp, maxHP, atk, res } = stats;

                    // Get character's skills with descriptions from attributeInfo
                    const skillsWithDescriptions = characterData.attributes.map(attributeName => {
                        const attributeInfo = this.gameData.attributeInfo.find(attr => attr.name === attributeName);
                        return attributeInfo ? attributeInfo.des : "Unknown";
                    });
                    
                    // Set the popup data and display it
                    characterPopupData = {
                        collection: characterData.collection,
                        name: `${(team === 0 ? this.gameData.challenger[position] : this.gameData.defender[position]).id || position + 1}`,
                        hp: hp,
                        maxHp: maxHP,
                        atk: atk,
                        res: res,
                        skills: characterData.attributes,
                        skillDescriptions: skillsWithDescriptions,
                        team: team,
                        position: position
                    };
                    
                    showCharacterPopup = true;
                });
                //////////////////////////////
                const offsetAtk = -80 * scale; 
                const offsetRes = 5 * scale;   
                const offsetHp = -40 * scale;  
                const offsetY1 = 60 * scale;  
                const offsetY2 = 90 * scale;
                const offsetY3 = 90 * scale;

                const fontSizeHp = this.getScaledTextSize(13);
                const fontSizeAtk = this.getScaledTextSize(11);
                const fontSizeRes = this.getScaledTextSize(11);
                
                const hpText = this.add.text(offsetHp, offsetY1, '', { fontSize: `${fontSizeHp}px`, fill: '#674F1E', fontStyle:"bold"});
                const atkText = this.add.text(offsetAtk, offsetY2, '', { fontSize: `${fontSizeAtk}px`, fill: '#674F1E', fontStyle:"bold"});
                const resText = this.add.text(offsetRes, offsetY3, '', { fontSize: `${fontSizeRes}px`, fill: '#674F1E', fontStyle:"bold"});

                hpText.setText(`${Math.floor(1000)}/${1000}`);
                atkText.setText(`ATK:${50}`);
                resText.setText(`RES:${(0.5 * 100).toFixed(0)}%`);
                container.add([character, hpBarBg, hpBarFg, atkText, resText, characterImage,hpText,faintedOverlay]);
                    
                this.statsTexts[team][position] = {
                    hp: hpText,
                    atk: atkText,
                    res: resText,
                    hpBar: hpBarFg,
                    hpBarBg: hpBarBg,
                    maxWidth: barWidth, 
                    characterImage: characterImage,
                    faintedOverlay: faintedOverlay
                };

                character.container = container;
                container.character = character;
                
                return character;
            }

            ///////////// Passive effects ///////////////
            createPassive(effectName, container) {
                const scale = Math.min(
                    this.cameras.main.width / this.baseWidth,
                    this.cameras.main.height / this.baseHeight
                );
                
                // Create passive effect animation sprite
                const passiveSprite = this.add.sprite(0, -container.character.height * scale / 2 - this.resizeXY(-10), effectName);
                passiveSprite.setScale(scale);
                passiveSprite.play(`${effectName}-effect`);
                
                // Add to container (in front of character)
                container.add(passiveSprite);
                
                // ADD: Tag the sprite so we can find it later for cleanup
                passiveSprite.passiveEffect = true;
                passiveSprite.effectName = effectName;
            }

            displayPassiveApplied(team1stats, team2stats) {
                // Step 1: Clear ALL passive animations
                this.clearAllPassiveAnimations();
                
                // Step 2: Create animations for current effects from receipt
                team1stats.forEach((stats, pos) => {
                    if (stats.passiveApplied) {
                        stats.passiveApplied.forEach(effect => {
                            if (effect.duration > 0) {
                                this.createPassive(effect.effect, this.containers[0][pos]);
                            }
                        });
                    }
                });
                
                team2stats.forEach((stats, pos) => {
                    if (stats.passiveApplied) {
                        stats.passiveApplied.forEach(effect => {
                            if (effect.duration > 0) {
                                this.createPassive(effect.effect, this.containers[1][pos]);
                            }
                        });
                    }
                });
            }

            clearAllPassiveAnimations() {
                // Find and destroy all passive effect sprites in all containers
                for (let team = 0; team < 2; team++) {
                    for (let pos = 0; pos < 3; pos++) {
                        const container = this.containers[team][pos];
                        if (container) {
                            // Get all children in the container
                            const childrenToRemove = [];
                            container.list.forEach(child => {
                                // Check if this child is a passive effect sprite
                                if (child.passiveEffect === true) {
                                    childrenToRemove.push(child);
                                }
                            });
                            
                            // Remove all passive effect sprites
                            childrenToRemove.forEach(child => {
                                container.remove(child);
                                child.destroy();
                            });
                        }
                    }
                }
            }

            ///////////// Hight Light Character ///////////////

            highlightCharacter(character,attribute) {
                character.setTint(0xffff00);
                const container = character.container;
                
                if (!container.originalY) {
                    container.originalY = container.y;
                }

                const scale = Math.min(
                    this.cameras.main.width / this.baseWidth,
                    this.cameras.main.height / this.baseHeight
                );

                const moveAmount = container.y < this.cameras.main.height / 2 ? 50*scale  : -50*scale;
                
                if (attribute) {
                    const style = {
                        fontSize: `${this.getScaledTextSize(32)}px`,
                        fontFamily: 'Arial',
                        fontWeight: 'bold',
                        fill: '#FFD700', 
                        stroke: '#000000',
                        strokeThickness: 6,
                        dropShadow: true,
                        dropShadowColor: '#000000',
                        dropShadowBlur: 4,
                        dropShadowAngle: Math.PI / 6,
                        dropShadowDistance: 6
                    };

                    const attributeText = this.add.text(
                        container.x,
                        container.y - (container.y < this.cameras.main.height / 2 ? -moveAmount * 3: -moveAmount * 3),
                        attribute.toUpperCase() + '!',
                        style
                    );
                    attributeText.setOrigin(0.5);
                    
                    this.tweens.add({
                        targets: attributeText,
                        scaleX: 1.5,
                        scaleY: 1.5,
                        alpha: 0,
                        duration: 3000,
                        ease: 'Power2',
                        onComplete: () => {
                            attributeText.destroy();
                        }
                    });

                    this.tweens.add({
                        targets: attributeText,
                        x: container.x - 5,
                        yoyo: true,
                        repeat: 4,
                        duration: 50,
                        ease: 'Power0'
                    });
                }


                this.tweens.add({
                    targets: container,
                    y: container.originalY + moveAmount,
                    duration: 300,
                    ease: 'Power2'
                });
            }

            resetHighlight(character) {
                character.clearTint();
                
                this.tweens.add({
                    targets: character.container,
                    y: character.container.originalY,
                    duration: 300,
                    ease: 'Power2'
                });
            }

            ///////////// Create shoot/buff animation ///////////////
            createProjectile(fromX, fromY, toX, toY, attributeName) {
                return new Promise((resolve) => {
                    const projectile = this.physics.add.sprite(fromX, fromY, `sprite-${attributeName}`);
                    const scale = Math.min(
                        this.cameras.main.width / this.baseWidth,
                        this.cameras.main.height / this.baseHeight
                    ) * 1;
                    projectile.setScale(scale);
                    
                    const angle = Phaser.Math.Angle.Between(fromX, fromY, toX, toY);
                    const velocity = 1250 * Math.min(
                        this.cameras.main.width / this.baseWidth,
                        this.cameras.main.height / this.baseHeight
                    );
                    
                    projectile.setVelocity(
                        Math.cos(angle) * velocity,
                        Math.sin(angle) * velocity
                    );
                    projectile.setRotation(angle);
                    
        
                    projectile.play(`${attributeName}-fly`);
                    const targetZone = this.add.circle(toX, toY, 20 * scale);
                    this.physics.add.existing(targetZone, true);
                            
                    this.physics.add.overlap(projectile, targetZone, () => {
                        projectile.setVelocity(0, 0);
                        projectile.play(`${attributeName}-hit`);
                        targetZone.destroy();
                        
                        projectile.on('animationcomplete', () => {
                            projectile.destroy();
                            resolve();
                        });
                    });
                    
                    this.time.delayedCall(4000/ gameSpeedMultiplier, () => {
                        if (projectile.active) {
                            projectile.destroy();
                            targetZone.destroy();
                            resolve();
                        }
                    });
                });
            }

            createBuffEffect(x, y, spriteKey, animKey) {
                return new Promise((resolve) => {
                    const buffSprite = this.add.sprite(x, y, spriteKey)
                        .setScale(
                            Math.min(
                                this.cameras.main.width / this.baseWidth,
                                this.cameras.main.height / this.baseHeight
                            )
                        );

                    buffSprite.play(animKey);

                    buffSprite.on('animationcomplete', () => {
                        buffSprite.destroy();
                        resolve();
                    });
                });
            }

            ///////////// Proccess skills ///////////////
            async processAction(action) {
                const actorData = action.actor || action.Actor;
                const sourceTeam = actorData.team;
                const sourcePos = actorData.position;
                const activeCharacter = this.characters[sourceTeam][sourcePos];
                const attribute = actorData.attribute; 

                this.highlightCharacter(activeCharacter, attribute);
                await this.dealDamage(action.damage, sourceTeam, sourcePos, attribute);
                await new Promise(resolve => this.time.delayedCall(300/ gameSpeedMultiplier, resolve));

                await this.processAttackChanges(action.attackChange, sourceTeam, sourcePos, attribute);
                await this.processHPChanges(action.hpChange, sourceTeam, sourcePos, attribute);
                await this.processResistanceChanges(action.resistanceChange, sourceTeam, sourcePos, attribute);
                await this.processHealing(action.healing, sourceTeam, sourcePos, attribute);

                await this.updateStats(action.finalStats.team1, action.finalStats.team2);
                await new Promise(resolve => this.time.delayedCall(800/ gameSpeedMultiplier, resolve));

                this.resetHighlight(activeCharacter);
                
                // ADD: Check and display passive effects after each action
                this.displayPassiveApplied(action.finalStats.team1, action.finalStats.team2);

                await new Promise(resolve => this.time.delayedCall(800/ gameSpeedMultiplier, resolve));

                this.isAnimating = false;
                
                if (this.actionQueue.length === 0 && this.pendingWinningTeam !== null) {
                    this.showGameEnd(this.pendingWinningTeam);
                }
            }

            async dealDamage(damage, sourceTeam, sourcePos, attribute) {
                if (!damage || !damage.targets) return;

                const animationPromises = damage.targets.map(target => {
                    if (target.value !== 0) {
                        const sourceChar = this.characters[sourceTeam][sourcePos];
                        const targetChar = this.characters[target.team][target.position];
                        return new Promise(async (resolve, reject) => {
                            await this.createProjectile(
                                sourceChar.container.x,
                                sourceChar.container.y,
                                targetChar.container.x,
                                targetChar.container.y,
                                attribute
                            );
                            
                            await new Promise(resolve => {
                                this.showFloatingText(
                                    targetChar.container.x + this.resizeXY(50),
                                    targetChar.container.y +this.resizeXY(50),
                                    target.value.toFixed(2),
                                    0xff0000
                                );

                                this.tweens.add({
                                    targets: targetChar.container,
                                    x: targetChar.container.x + this.resizeXY(10),
                                    duration: 50,
                                    yoyo: true,
                                    repeat: 3
                                });

                                targetChar.setTint(0xff0000);
                                this.time.delayedCall(200/ gameSpeedMultiplier, () => {
                                    targetChar.clearTint();
                                    resolve();
                                });
                            })

                            resolve();
                        });
                    }
                    return Promise.resolve();
                });
                await Promise.all(animationPromises);
            }

            async processAttackChanges(attackChange, sourceTeam, sourcePos, attribute) {
                if (!attackChange || !attackChange.targets) return;
                const animationPromises = attackChange.targets.map(target => {
                if (target.value !== 0) {
                    const targetChar = this.characters[target.team][target.position];
                    return new Promise(async (resolve, reject) => {
                        const animKey = target.value > 0 ? 'buff-atk-anim' : 'debuff-atk-anim';
                        const spriteKey = target.value > 0 ? 'buff-atk' : 'debuff-atk';
                        
                        await this.createBuffEffect(
                            targetChar.container.x,
                            targetChar.container.y,
                            spriteKey,
                            animKey
                        );

                        await new Promise(resolve => {
                            this.showFloatingText(
                                targetChar.container.x - this.resizeXY(100),
                                targetChar.container.y,
                                `ATK ${target.value > 0 ? '+' : ''}${target.value}`,
                                0xffff00
                            );

                            targetChar.setTint(0xffff00);
                            this.time.delayedCall(200/ gameSpeedMultiplier, () => {
                            targetChar.clearTint();
                            resolve();
                            });
                        });

                        resolve();
                    });
                }
                return Promise.resolve();
            });

                await Promise.all(animationPromises);
            }

            async processHPChanges(hpChange, sourceTeam, sourcePos, attribute) {
                if (!hpChange || !hpChange.targets) return;

                const animationPromises = hpChange.targets.map(target => {
                    if (target.value !== 0) {
                        const sourceChar = this.characters[sourceTeam][sourcePos];
                        const targetChar = this.characters[target.team][target.position];
                    
                        return new Promise(async (resolve, reject) => {

                            const animKey = target.value > 0 ? 'buff-maxhp-anim' : 'debuff-maxhp-anim';
                            const spriteKey = target.value > 0 ? 'buff-maxhp' : 'debuff-maxhp';

                            await this.createBuffEffect(
                                targetChar.container.x,
                                targetChar.container.y,
                                spriteKey,
                                animKey
                            );
                            await new Promise(resolve => {
                                this.showFloatingText(
                                    targetChar.x - this.resizeXY(100),
                                    targetChar.y - this.resizeXY(100),
                                    `HP ${target.value > 0 ? '+' : ''}${target.value}`,
                                    0x00ff00
                                );

                                targetChar.setTint(0x00ff00);
                                this.time.delayedCall(200/ gameSpeedMultiplier, () => {
                                    targetChar.clearTint();
                                    resolve();
                                });
                            })

                            resolve();
                        });
                    }
                    return Promise.resolve();
                });

                await Promise.all(animationPromises);
            }

            async processResistanceChanges(resistanceChange, sourceTeam, sourcePos, attribute) {
                if (!resistanceChange || !resistanceChange.targets) return;

                const animationPromises = resistanceChange.targets.map(target => {
                    if (target.value !== 0) {
                        const sourceChar = this.characters[sourceTeam][sourcePos];
                        const targetChar = this.characters[target.team][target.position];

                        return new Promise(async (resolve, reject) => {
                            const animKey = target.value > 0 ? 'buff-res-anim' : 'debuff-res-anim';
                            const spriteKey = target.value > 0 ? 'buff-res' : 'debuff-res';

                            await this.createBuffEffect(
                                targetChar.container.x,
                                targetChar.container.y,
                                spriteKey,
                                animKey
                            );
                            await new Promise(resolve => {
                                this.showFloatingText(
                                    targetChar.container.x + this.resizeXY(100),
                                    targetChar.container.y - this.resizeXY(10),
                                    `RES ${target.value > 0 ? '+' : ''}${(target.value * 100).toFixed(0)}%`,
                                    0x00ffff
                                );

                                targetChar.setTint(0x00ffff);
                                this.time.delayedCall(200/ gameSpeedMultiplier, () => {
                                    targetChar.clearTint();
                                    resolve();
                                });
                            })

                            resolve();
                        });
                    }
                    return Promise.resolve();
                });

                await Promise.all(animationPromises);
            }

            async processHealing(healing, sourceTeam, sourcePos, attribute) {
                if (!healing || !healing.targets) return;

                const animationPromises = healing.targets.map(target => {
                    if (target.value !== 0) {
                        const sourceChar = this.characters[sourceTeam][sourcePos];
                        const targetChar = this.characters[target.team][target.position];
                        const animKey =  'heal-anim' ;
                        const spriteKey =  'heal';

                        return new Promise(async (resolve, reject) => {
                            await this.createBuffEffect(
                                targetChar.container.x,
                                targetChar.container.y,
                                spriteKey,
                                animKey
                            );

                            await new Promise(resolve => {
                                this.showFloatingText(
                                    targetChar.container.x - this.resizeXY(50),
                                    targetChar.container.y - this.resizeXY(50),
                                    `HP${target.value > 0 ? '+' : ''}${target.value.toFixed(2)}`,
                                    0x00ff00
                                );

                                targetChar.setTint(0x00ff00);
                                this.time.delayedCall(200/ gameSpeedMultiplier, () => {
                                    targetChar.clearTint();
                                    resolve();
                                });
                            })

                            resolve();
                        });
                    }
                    return Promise.resolve();
                });

                await Promise.all(animationPromises);
            }

            showFloatingText(x, y, text, color) {
                const fontSize = this.getScaledTextSize(20);
                const style = { 
                    fontSize: `${fontSize}px`, 
                    fill: `#${color.toString(16).padStart(6, '0')}` ,
                    fontStyle: 'bold',
                    stroke: '#000000',         
                    strokeThickness: 3
                };

                const scale = Math.min(
                    this.cameras.main.width / this.baseWidth,
                    this.cameras.main.height / this.baseHeight
                );
                const floatingText = this.add.text(x, y, text, style);
                floatingText.setOrigin(0.5);
                
                this.tweens.add({
                    targets: floatingText,
                    y: y - 50* scale,
                    alpha: 0,
                    duration: 1500,
                    onComplete: () => floatingText.destroy()
                });
            }

            update() {
                if (!this.isAnimating && this.actionQueue.length > 0) {
                    const nextAction = this.actionQueue.shift();
                    this.actionQueue = this.actionQueue;
                    this.isAnimating = true;
                    this.processAction(nextAction);
                }
            }

            processReceipt(receipt) {
                const [winningTeam, turns] = receipt;
                this.pendingWinningTeam = winningTeam;

                for (const turn of turns) {
                    for (const action of turn.receipts) {
                        this.actionQueue.push(action);
                    }
                }
            }

            blinkText(textObject, isIncrease) {
                const color = isIncrease ? '#00FF00' : '#FF0000';
                const originalColor = '#674F1E';
                const blinkCount = 3;
                let count = 0;

                const blink = () => {
                    if (count >= blinkCount * 2) {
                        textObject.setColor(originalColor);
                        return;
                    }

                    textObject.setColor(count % 2 === 0 ? color : originalColor);
                    count++;
                    this.time.delayedCall(100/ gameSpeedMultiplier, blink);
                };

                blink();
            }
            async updateStats(team1stats, team2stats) {
                team1stats.forEach((stats, pos) => {
                    const { hp, maxHP, atk, res } = stats;
                    const texts = this.statsTexts[0][pos];
                    const prevStats = this.previousStats.team1[pos];

                    texts.hp.setText(`${Math.floor(hp)}/${maxHP}`);
                    if (!this.isFirstAction && atk !== prevStats.atk) {
                        this.blinkText(texts.atk, atk > prevStats.atk);
                    }
                    texts.atk.setText(`ATK: ${atk}`);

                    if (!this.isFirstAction && res !== prevStats.res) {
                        this.blinkText(texts.res, res > prevStats.res);
                    }
                    texts.res.setText(`RES: ${(res * 100).toFixed(0)}%`);
                    
                    const healthPercentage = hp / maxHP;
                    texts.hpBar.width = texts.maxWidth * healthPercentage;

                    texts.faintedOverlay.visible = hp <= 0;
                    
                    const color = healthPercentage > 0.5 ? 0x00ff00 : 
                                healthPercentage > 0.25 ? 0xffff00 : 0xff0000;
                    texts.hpBar.setFillStyle(color);

                    
                    this.previousStats.team1[pos] = { hp, maxHP, atk, res };

                });

                team2stats.forEach((stats, pos) => {
                    const { hp, maxHP, atk, res } = stats;
                    const texts = this.statsTexts[1][pos];
                    const prevStats = this.previousStats.team2[pos];

                    
                    texts.hp.setText(`${Math.floor(hp)}/${maxHP}`);
                    if (!this.isFirstAction && atk !== prevStats.atk) {
                        this.blinkText(texts.atk, atk > prevStats.atk);
                    }
                    texts.atk.setText(`ATK:${atk}`);

                    if (!this.isFirstAction && res !== prevStats.res) {
                        this.blinkText(texts.res, res > prevStats.res);
                    }
                    texts.res.setText(`RES:${(res * 100).toFixed(0)}%`);
                    
                    const healthPercentage = hp / maxHP;
                    texts.hpBar.width = texts.maxWidth * healthPercentage;

                    texts.faintedOverlay.visible = hp <= 0; 
                    const color = healthPercentage > 0.5 ? 0x00ff00 : 
                                healthPercentage > 0.25 ? 0xffff00 : 0xff0000;
                    texts.hpBar.setFillStyle(color);
                    this.previousStats.team2[pos] = { hp, maxHP, atk, res };

                });
               

                //For popup selected characters/////////////////////////
                // Update all popup character via events
                for (let team = 0; team <= 1; team++) {
                    const statsArray = team === 0 ? team1stats : team2stats;
                    for (let pos = 0; pos < statsArray.length; pos++) {
                        const stats = statsArray[pos];
                        if (stats) {
                            const { hp, maxHP, atk, res } = stats;
                            const characterData = team === 0 ? this.gameData.challenger[pos] : this.gameData.defender[pos];
                            // Dispatch event with updated stats
                            window.dispatchEvent(new CustomEvent('character-stats-updated', {
                                detail: {
                                    collection: characterData.collection,
                                    name: characterData.id || pos + 1,
                                    hp: hp,
                                    maxHp: maxHP,
                                    atk: atk,
                                    res: res,
                                    skills: (team === 0 ? this.gameData.challenger[pos] : this.gameData.defender[pos]).attributes,
                                    skillDescriptions: (team === 0 ? this.gameData.challenger[pos] : this.gameData.defender[pos]).attributes.map(attributeName => {
                                        const attributeInfo = this.gameData.attributeInfo.find(attr => attr.name === attributeName);
                                        return attributeInfo ? attributeInfo.des : "Unknown";
                                    }),
                                    team: team,
                                    position: pos
                                }
                            }));
                        }
                    }
                }
                ///////////////////////////////////
                this.isFirstAction = false;
            }

            resizeXY(number){
                const scale = Math.min(this.cameras.main.width / this.baseWidth, this.cameras.main.height / this.baseHeight);
                return number*scale;
            }

            getScaledTextSize(baseSize) {
                const scale = Math.min(
                    this.cameras.main.width / this.baseWidth,
                    this.cameras.main.height / this.baseHeight
                );
                return Math.round(baseSize * scale);
            }

            showGameEnd(winningTeam) {
                gameEnd = true;
                this.clearAllPassiveAnimations(); // ADD: Cleanup animations
                
                if(winner === 1){
                    winnerAddress = challengerAddress
                } else if(winner == 2){
                    winnerAddress = defenderAddress
                } else if(winner === -1){
                    winnerAddress = "tie"
                }
            }
        }
    }

    async function createPreloadScene() {
        const Phaser = (await import('phaser')).default;
        
        return class PreloadScene extends Phaser.Scene {
            constructor() {
                super({ key: 'PreloadScene' });
            }

            preload() {
                const progressBar = this.add.graphics();
                const progressBox = this.add.graphics();
                const width = this.cameras.main.width;
                const height = this.cameras.main.height;
                
                progressBox.fillStyle(0x222222, 0.8);
                progressBox.fillRect(width / 4, height / 2 - 30, width / 2, 50);

                const loadingText = this.add.text(width / 2, height / 2, '0%', {
                    fontFamily: 'Arial',
                    fontSize: '32px',
                    color: '#ffffff'
                });
                loadingText.setOrigin(0.5);
                //assign to use later when load complete
                this.progressBar = progressBar;
                this.loadingText = loadingText;
                this.progressBox = progressBox;

                this.load.on('progress', (value) => {
                    const cappedProgress = value * 0.95; // Cap at 90%
                    progressBar.clear();
                    progressBar.fillStyle(0x00ff00, 1);
                    progressBar.fillRect(width / 4 + 10, height / 2 - 20, (width / 2 - 20) * cappedProgress, 30);
                    loadingText.setText(Math.floor(cappedProgress * 100) + '%');
                });


                this.load.crossOrigin = 'anonymous';
                this.load.setCORS('anonymous');
                this.load.image('background', '/game/elements/bg1.webp');
                this.load.image('fainted', '/game/elements/fainted.png');

              
                
                this.load.image('character', '/game/elements/cardContainer.svg', { 
                    frameWidth: 200, 
                    frameHeight: 268 
                });

                this.game.gameData.attributeInfo.forEach(attr => {
                    this.load.spritesheet(
                        `sprite-${attr.name}`, 
                        `/game/skills/${attr.sprite}`, 
                        { frameWidth: 150, frameHeight: 150 }
                    );
                });

                this.load.spritesheet('heal', '/game/skills/heal.png', { 
                    frameWidth: 150, 
                    frameHeight: 150
                });
                this.load.spritesheet('buff-atk', '/game/skills/buffAtk.png', { 
                    frameWidth: 150, 
                    frameHeight: 150
                });
                this.load.spritesheet('debuff-atk', '/game/skills/debuffAtk.png', { 
                    frameWidth: 150, 
                    frameHeight: 150
                });
                this.load.spritesheet('buff-res', '/game/skills/buffRes.png', { 
                    frameWidth: 150, 
                    frameHeight: 150
                });
                this.load.spritesheet('debuff-res', '/game/skills/debuffRes.png', { 
                    frameWidth: 150, 
                    frameHeight: 150
                });
                this.load.spritesheet('buff-maxhp', '/game/skills/buffMaxhp.png', { 
                    frameWidth: 150, 
                    frameHeight: 150
                });
                this.load.spritesheet('debuff-maxhp', '/game/skills/debuffMaxhp.png', { 
                    frameWidth: 150, 
                    frameHeight: 150
                });
                

                //////////////// Load Passive Effect /////////////////////
                this.load.spritesheet('stun', '/game/passiveEffects/stun.png', { 
                    frameWidth: 150, 
                    frameHeight: 150
                });

                // Load player NFT images
                const nftPromises = [
                    this.preloadNFTManually('charater00', `${this.game.configUrl}/game/cdn/nft/${this.game.gameData.challenger[0].collection}/${this.game.gameData.challenger[0].id}`),
                    this.preloadNFTManually('charater01', `${this.game.configUrl}/game/cdn/nft/${this.game.gameData.challenger[1].collection}/${this.game.gameData.challenger[1].id}`),
                    this.preloadNFTManually('charater02', `${this.game.configUrl}/game/cdn/nft/${this.game.gameData.challenger[2].collection}/${this.game.gameData.challenger[2].id}`),
                    this.preloadNFTManually('charater10', `${this.game.configUrl}/game/cdn/nft/${this.game.gameData.defender[0].collection}/${this.game.gameData.defender[0].id}`),
                    this.preloadNFTManually('charater11', `${this.game.configUrl}/game/cdn/nft/${this.game.gameData.defender[1].collection}/${this.game.gameData.defender[1].id}`),
                    this.preloadNFTManually('charater12', `${this.game.configUrl}/game/cdn/nft/${this.game.gameData.defender[2].collection}/${this.game.gameData.defender[2].id}`)
                ];
                /*
                    this.load.on('fileprogress', (file) => {
                        console.log(`Loading: ${file.key} - Started at ${Date.now()}`);
                    });
                    this.load.on('filecomplete', (key, type, data) => {
                        console.log(`Completed: ${key} - Size: ${data?.size || 'unknown'}`);
                    });
                */
                //Complete load
                this.load.on('complete', async () => {                    
                    await Promise.all(nftPromises);                    
                    // Show 100%
                    this.progressBar.clear();
                    this.progressBar.fillStyle(0x00ff00, 1);
                    this.progressBar.fillRect(this.cameras.main.width / 4 + 10, this.cameras.main.height / 2 - 20, 
                                            (this.cameras.main.width / 2 - 20), 30);
                    this.loadingText.setText('100%');
                    

                    this.progressBar.destroy();
                    this.progressBox.destroy();
                    this.loadingText.destroy();
                    
                    this.scene.start('CardGameScene', {
                        gameData: this.game.gameData,
                        configUrl: this.game.configUrl
                    });
                });
            }

            preloadNFTManually(key, url) {
                return new Promise((resolve, reject) => {
                    const startTime = Date.now();                    
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    
                    img.onload = () => {    
                        const duration = Date.now() - startTime;
                        this.textures.addImage(key, img);
                        resolve();
                    };
                    
                    img.onerror = (error) => {
                        reject(error);
                    };
                    
                    img.src = url;
                });
            }

        }
    }

    let gameContainer;

    
    //Game Speed//////////////////////////////
    let gameSpeedMultiplier = 1.3;
    let gameSpeedText = "1x";
    let speedButtonDisplay = false;
    function toggleGameSpeed() {
        if (gameSpeedMultiplier === 1.3) {
            gameSpeedMultiplier = 2;
            gameSpeedText = "2x";
        } else if (gameSpeedMultiplier === 2) {
            gameSpeedMultiplier = 3;
            gameSpeedText = "3x";
        } else {
            gameSpeedMultiplier = 1.3;
            gameSpeedText = "1x";
        }
        
        // Update the game's time scale
        if (game && game.scene.scenes) {
            game.scene.scenes.forEach(scene => {
            scene.time.timeScale = gameSpeedMultiplier;
            
            // Update animation speeds
            if (scene.anims && scene.anims.anims && scene.anims.anims.entries) {
                Object.values(scene.anims.anims.entries).forEach(anim => {
                    // Store original frameRate if not already stored
                    if (!anim.originalFrameRate) {
                        anim.originalFrameRate = anim.frameRate;
                    }
                    // Update frameRate based on speed multiplier
                    anim.frameRate = anim.originalFrameRate * gameSpeedMultiplier;
                });
            }
            
            // Update physics velocities if needed
            if (scene.physics && scene.physics.world) {
                scene.physics.world.timeScale = 1 / gameSpeedMultiplier;
            }
        });
    }
    }
    /////////////////////////////////////////

    //Popup selected character//////////////////////////
    let selectedCharacter = { team: -1, position: -1 };
    let showCharacterPopup = false;
    let characterPopupData = {
        collection:"",
        name: "",
        hp: 0,
        maxHp: 0,
        atk: 0,
        res: 0,
        skills: [],
        team: 0,
        position: 0
    };
    
    function closeCharacterPopup() {
        showCharacterPopup = false;
        selectedCharacter = { team: -1, position: -1 };
    }

    ///////////////////////////////////////////
    let unsubWallet;
    onMount(async () => {
        //connect wallet//////
        unsubWallet = walletState.subscribe(state => {
            provider = state.provider;
            signer = state.signer;
            userAddress = state.address;
        });

        const connectionResult = await checkExistingConnection();
        
        // If user has wallet connected, wait for wallet to be ready
        if (connectionResult.success) {
            const walletReady = new Promise(resolve => {
                const currentState = walletState;
                // Check if already connected
                walletState.subscribe(state => {
                    if (state.isConnected && state.signer) {
                        resolve();
                    }
                });
            });
            await walletReady;
        }
        // If no wallet connection, proceed without waiting

        const response = await fetch(config.rpcUrl, {
            method: "POST",
            body: JSON.stringify({
                method: "getSpecificBattleInfo",
                params: {
                    battleID: battleID  // Now only passing battleID
                }
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });


        if (response.ok) {
            const responseBody = await response.json();
            gameData = responseBody.payload.data[1].info;
            winner = gameData.winner;
            stake = gameData.stake;
            stake = stake;
            receipt = [gameData.winner, gameData.receipt]; 
            challenger = gameData.challenger;
            defender = gameData.defender;
            challengerAddress = gameData.caddress;
            defenderAddress = gameData.daddress

        } else {
            const responseBody = await response.json();

            if (responseBody.error && responseBody.error.message) {
                throw new Error(responseBody.error.message);
            }
        }

        await (async () => {
            try {
                Phaser = (await import('phaser')).default;
                CardGameScene = await createGameScene();
                const PreloadScene = await createPreloadScene();
                
                const configGame = {
                    type: Phaser.AUTO,
                    parent: 'game-container',
                    scale: {
                        mode: Phaser.Scale.FIT,
                        autoCenter: Phaser.Scale.CENTER_BOTH,
                        width: 1280,
                        height: 720,
                        max: {
                            width: 1920,
                            height: 1080
                        }
                    },
                    physics: {
                        default: 'arcade',
                        arcade: {
                            gravity: { y: 0 },
                            debug: false
                        }
                    },
                    scene: []
                };

                game = new Phaser.Game(configGame);

                game.gameData = gameData;
                game.configUrl = config.rpcUrl;
                game.receipt = receipt;

                game.scene.add('PreloadScene', PreloadScene);
                game.scene.add('CardGameScene', CardGameScene);
                            
                game.events.once('ready', () => {
                    game.scene.start('PreloadScene');  
                });

                const container = document.getElementById('game-container');
                if (container) {
                    const windowWidth = container.clientWidth;
                    const windowHeight = container.clientHeight;
                    const aspectRatio = 16 / 9;

                    let gameWidth = windowWidth;
                    let gameHeight = windowWidth / aspectRatio;

                    if (gameHeight > windowHeight) {
                        gameHeight = windowHeight;
                        gameWidth = windowHeight * aspectRatio;
                    }

                    game.scale.resize(gameWidth, gameHeight);
                }

                return () => {
                    if (game) {
                        game.destroy(true);
                    }
                };
            } catch (error) {
                console.error('Error initializing game:', error);
            }
        })()

        // Add event listener for character selection from the game ////////////////
        const handleCharacterSelect = (event) => {
            characterPopupData = event.detail;
            showCharacterPopup = true;
            selectedCharacter = { 
                team: event.detail.team, 
                position: event.detail.position 
            };
        };

        const handleStatsUpdate = (event) => {
            if (showCharacterPopup && 
                selectedCharacter.team === event.detail.team && 
                selectedCharacter.position === event.detail.position) {
                characterPopupData = event.detail;
            }
        };
        window.addEventListener('game-scene-ready', () => {
            speedButtonDisplay = true;
        });
        window.addEventListener('character-selected', handleCharacterSelect);
        window.addEventListener('character-stats-updated', handleStatsUpdate);
        ////////////////////////////////////
        
        //Clean up function, only call when Svelte component destroyed
        return () => {
            // Cleanup event listeners when component is destroyed
            window.removeEventListener('game-scene-ready', () => {});
            window.removeEventListener('character-selected', handleCharacterSelect);
            window.removeEventListener('character-stats-updated', handleStatsUpdate);
            if (game) {
                game.destroy(true);
            }
        };
    });

    onDestroy(() => {
        if (unsubWallet) unsubWallet();
    });
</script>
<div class="relative flex flex-col w-full min-h-screen font-Hoves bg-black text-white overflow-hidden">
    <div class="flex relative w-[100vw] h-[45vw] m-auto bg-cover rounded-md text-[1vw] bg-yellow-500">
        <div class="absolute flex w-[10vw] h-full z-10">
        </div>
        <img class="absolute h-full z-10 left-[8vw]" alt="chain" src="/game/elements/chain.svg"/>

        <div class="absolute flex flex-col z-30 left-[4vw] h-full justify-between py-[2vw]">
            <div class="flex flex-col justify-center items-center bg-darkStone w-[12vw] h-[5vw] border-[0.2vw] border-lightStone rounded-md">
                <span class="text-[0.9vw] text-[#C7A869]">
                    Attacker
                </span>
                <span class="text-[1.1vw] font-semibold">
                    {emitBetweenText(challengerAddress, 10)}
                </span>
            </div>
            <div class="flex flex-col justify-center items-center relative h-[8.5vw] left-[-0.5vw] z-10">
                <span class="z-[20] text-[#C7A869]">
                    Stake
                </span>
                <div class="flex items-center gap-[0.5vw] z-[20]">
                    <span class="text-[1.3vw] font-semibold">{stake}</span>
                    <img class="h-[1.3vw]" alt="CORE" src="/CORE.png"/>
                </div>
                <img class="absolute h-[8.5vw]" alt="stake board container" src="/game/elements/sampleStakeBoard.svg"/>
            </div> 
            <div class="flex flex-col justify-center items-center bg-darkStone w-[12vw] h-[5vw] border-[0.2vw] border-lightStone rounded-md">
                <span class="text-[0.9vw] text-[#C7A869]">
                    Defender
                </span>
                <span class="text-[1.1vw] font-semibold">
                    {emitBetweenText(defenderAddress, 10)}
                </span>
            </div>        
        </div>
        <div class="flex relative self-center h-full w-full" id="game-container" bind:this={gameContainer}>
            {#if speedButtonDisplay}
                <button class="absolute flex items-center top-[1vw] right-[10vw] z-20 bg-darkStone border-[0.2vw] border-lightStone rounded-md px-[1vw] py-[0.5vw] text-[1vw] hover:bg-gray-700 flex items-center gap-[0.5vw]" on:click={toggleGameSpeed}>
                    <img class="h-[1.1vw]" alt="Speed" src="/game/elements/toggleSpeed.svg"/>
                    <span>{gameSpeedText}</span>
                </button>
            {/if}

             {#if gameEnd === true}
                <div class="absolute flex justify-center items-center z-20 h-full w-full bg-black bg-opacity-70" in:fade={{ duration: 300 }}>
                    <div class="flex flex-col justify-center items-center w-[40vw] h-[15vw] bg-darkStone self-center  border-[0.2vw] border-lightStone rounded-md">
                        {#if (userAddress === challengerAddress || userAddress === defenderAddress) && userAddress === winnerAddress && winner!==-1}
                            <img alt="You Win" class="h-[5vw]" src="/game/elements/youWin.svg"/>
                            <div class="flex items-center gap-[0.5vw]">
                                <span class="text-[2vw] font-semibold text-green">+ {stake}</span>
                                <img class="h-[2vw]" alt="CORE" src="/CORE.png"/>
                            </div>
                            <div class="flex gap-[1vw] text-[1.1vw] font-semibold mt-[1vw]">
                                <button class="flex items-center gap-[0.5vw] text-white bg-[#236E11] hover:bg-greenHover py-[0.2vw] px-[1vw] rounded-md" on:click={()=>{location.reload()}}>
                                    <span>Replay<span/>
                                    <img class="h-[1.1vw] inline" alt="Replay" src="/game/elements/reload.svg"/>
                                </button>
                                <button class="flex items-center text-white bg-red-600 hover:bg-red-800 py-[0.2vw] px-[1vw] rounded-md" on:click={()=>{window.location.href = './'}}>
                                    <span>Exit<span/>
                                    <img class="h-[1.1vw] inline" alt="Exit" src="/game/elements/exit.svg"/>
                                </button>
                            </div>
                        {:else if (userAddress === challengerAddress || userAddress === defenderAddress) && userAddress !== winnerAddress && winner!==-1 }    
                            <img alt="You Lose" class="h-[5vw]" src="/game/elements/youLose.svg"/>
                            <div class="flex items-center gap-[0.5vw]">
                                <span class="text-[2vw] font-semibold text-red-500">- {stake}</span>
                                <img class="h-[2vw]" alt="CORE" src="/CORE.png"/>
                            </div> 
                            <div class="flex gap-[1vw] text-[1.1vw] font-semibold mt-[1vw]">
                                <button class="flex items-center gap-[0.5vw] text-white bg-[#236E11] hover:bg-greenHover py-[0.2vw] px-[1vw] rounded-md" on:click={()=>{location.reload()}}>
                                    <span>Replay<span/>
                                    <img class="h-[1.1vw] inline" alt="Replay" src="/game/elements/reload.svg"/>
                                </button>
                                <button class="flex items-center text-white bg-red-600 hover:bg-red-800 py-[0.2vw] px-[1vw] rounded-md" on:click={()=>{window.location.href = './'}}>
                                    <span>Exit<span/>
                                    <img class="h-[1.1vw] inline" alt="Exit" src="/game/elements/exit.svg"/>
                                </button>
                            </div>
                            

                        {:else if (userAddress === challengerAddress || userAddress === defenderAddress) && winner ===-1 }    
                            <span></span>
                            <div class="flex items-center gap-[0.5vw]">
                                <span class="text-[2vw] font-semibold text-white">+ 0</span>
                                <img class="h-[2vw]" alt="CORE" src="/CORE.png"/>
                            </div> 
                            <div class="flex gap-[1vw] text-[1.1vw] font-semibold mt-[1vw]">
                                <button class="flex items-center gap-[0.5vw] text-white bg-[#236E11] hover:bg-greenHover py-[0.2vw] px-[1vw] rounded-md" on:click={()=>{location.reload()}}>
                                    <span>Replay<span/>
                                    <img class="h-[1.1vw] inline" alt="Replay" src="/game/elements/reload.svg"/>
                                </button>
                                <button class="flex items-center text-white bg-red-600 hover:bg-red-800 py-[0.2vw] px-[1vw] rounded-md" on:click={()=>{window.location.href = './'}}>
                                    <span>Exit<span/>
                                    <img class="h-[1.1vw] inline" alt="Exit" src="/game/elements/exit.svg"/>
                                </button>
                            </div>
                        
                        {:else if (userAddress !== challengerAddress || userAddress !== defenderAddress)}
                            <!-- Default case for users without wallet connection -->
                            <div class="text-[2vw] font-semibold text-white">
                                Winner: {winner === 1 ? emitBetweenText(challengerAddress, 10) : emitBetweenText(defenderAddress, 10)}
                            </div>
                            <div class="flex items-center gap-[0.5vw]">
                                <span class="text-[1.3vw] font-normal text-white">Winning stake: {stake}</span>
                                <img class="h-[1.3vw]" alt="CORE" src="/CORE.png"/>
                            </div>
                            <div class="flex gap-[1vw] text-[1.1vw] font-semibold mt-[1vw]">
                                <button class="flex items-center gap-[0.5vw] text-white bg-[#236E11] hover:bg-greenHover py-[0.2vw] px-[1vw] rounded-md" on:click={()=>{location.reload()}}>
                                    <span>Replay<span/>
                                    <img class="h-[1.1vw] inline" alt="Replay" src="/game/elements/reload.svg"/>
                                </button>
                                <button class="flex items-center text-white bg-red-600 hover:bg-red-800 py-[0.2vw] px-[1vw] rounded-md" on:click={()=>{window.location.href = './'}}>
                                    <span>Exit<span/>
                                    <img class="h-[1.1vw] inline" alt="Exit" src="/game/elements/exit.svg"/>
                                </button>
                            </div>
                        {/if}
                    </div>
                </div>
             {/if}
        </div>
        <!-- Popup selected character -->
        {#if showCharacterPopup}
            <div class="absolute flex left-0 top-0 w-[18vw] h-full z-30 bg-black bg-opacity-80 text-white" transition:fade={{ duration: 200 }}>
                <div class="flex flex-col h-full w-full relative px-[0.5vw]">
                    <!-- Close button -->
                    <button 
                        class="absolute right-[0.5vw] flex self-end mb-[2vw]"
                        on:click={() => showCharacterPopup = false}
                    >
                        <img alt="close" class='h-[2vw]' src="/game/elements/closeRed.svg"/>
                    </button>
                    <!-- Character image and basic info -->
                    <div class="flex flex-col items-center mb-[0.5vw] mt-[3vw]">
                        <div class="w-[10vw] h-[10vw] bg-darkStone border-[0.2vw] border-lightStone rounded-md overflow-hidden mb-[1vw]">
                            <div class="w-[10vw] h-[10vw] bg-darkStone border-[0.2vw] border-lightStone rounded-md overflow-hidden mb-[1vw]">
                                <img 
                                    class="w-full h-full object-cover" 
                                    alt="Character" 
                                    src={`${config.rpcUrl}/game/cdn/nft/${characterPopupData.team === 0 
                                        ? gameData.challenger[characterPopupData.position].collection 
                                        : gameData.defender[characterPopupData.position].collection}/${characterPopupData.team === 0 
                                        ? gameData.challenger[characterPopupData.position].id 
                                        : gameData.defender[characterPopupData.position].id}`}
                                    onerror="this.onerror=null; this.src='/game/elements/character-placeholder.svg';"
                                />
                            </div>
                        </div>
                        <div class="text-[1.5vw] font-semibold text-[#C7A869]">
                            #{characterPopupData.name}
                        </div>
                        {#if characterPopupData.collection !== ""}
                            <div class="flex text-[0.8vw] gap-[0.2vw]" in:slide={{ duration: 300 }}>
                                <span class="text-darkGray">
                                    Collection:
                                </span>
                                <span class="">
                                    {emitBetweenText(characterPopupData.collection,10)}
                                </span>
                            </div>
                            <button class="underline text-[0.85vw]" in:slide={{ duration: 300 }} 
                            on:click={()=>{window.open(`${config.blockExplorerUrls}/nft/${characterPopupData.collection}/${characterPopupData.name}`, "_blank")}}>
                                View this NFT on explorer
                            </button>
                        {/if}
                    </div>
                    
                    <!-- HP Container -->
                    <div class="w-full mb-[0.5vw]">
                        <!-- HP bar -->
                        <div class="flex justify-center w-full h-[2vw] bg-darkStone border-[0.1vw] border-lightStone rounded-md overflow-hidden relative">
                            <div class="absolute inset-0 transition-all duration-500 ease-out" 
                                    style="width: {(characterPopupData.hp / characterPopupData.maxHp * 100)}%; 
                                        background-color: {characterPopupData.hp > characterPopupData.maxHp * 0.5 ? '#22c55e' : 
                                                            characterPopupData.hp > characterPopupData.maxHp * 0.25 ? '#eab308' : '#ef4444'}">
                            </div>
                            {#if characterPopupData.hp}
                                <div class="absolute flex w-fit self-center">
                                    {characterPopupData.hp}/{characterPopupData.maxHp}
                                </div>
                            {:else}
                                <div class="absolute flex w-fit self-center">
                                    Loading
                                </div>
                            {/if} 
                        </div>
                    </div>
                    
                    <!-- Stats -->
                    <div class="grid grid-cols-2 gap-[1vw] mb-[0.3vw]">
                        <div class="flex gap-[1vw] items-center justify-center p-[0.2vw]">
                            <span class="text-[1vw]">{characterPopupData.atk}</span>
                            <img class="h-[1vw] ml-[0.3vw]" alt="ATK" src="/game/elements/atkIcon.svg"/>
                        </div>
                        <div class="flex gap-[1vw] items-center justify-center p-[0.2vw]">
                            <span class="text-[1vw]">{(characterPopupData.res * 100).toFixed(0)}%</span>
                            <img class="h-[1vw] ml-[0.3vw]" alt="RES" src="/game/elements/defIcon.svg"/>
                        </div>
                    </div>
                    
                    <!-- Skills -->
                    <div class="flex flex-col flex-grow">
                        <div class="text-[1.2vw] font-semibold text-[#C7A869]">Skills</div>
                        <div class="flex flex-col max-h-[21vw] min-h-[21vw] rounded-md overflow-y-scroll hide-scrollbar gap-[0.6vw] bg-black border-[0.1vw] border-lightStone p-[0.3vw]">
                            {#each characterPopupData.skills as skill, i}
                                <div class="flex flex-col w-full text-left bg-darkStone border-[0.1vw] border-lightStone rounded-md p-[1vw]">
                                    <div class="text-[1vw] font-semibold text-[#C7A869]">{skill}</div>
                                    {#if characterPopupData.skillDescriptions && characterPopupData.skillDescriptions[i]}
                                        <div class="text-[0.7vw] text-gray-300 my-[0.3vw]">
                                            Appearance rate per turn: {(100/characterPopupData.skills.length).toFixed(2)} %
                                        </div>
                                        <div class="text-[0.8vw] text-white">
                                            {characterPopupData.skillDescriptions[i]}
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>