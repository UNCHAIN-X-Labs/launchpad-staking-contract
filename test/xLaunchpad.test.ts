import { ethers, network }from 'hardhat';
import { mine } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from 'chai';
import { ZeroAddress, parseEther } from 'ethers';
import { ERC20, LaunchpadStaking, SampleERC20 } from '../typechain-types';

type MiningMultiplierParams = {
    refundOption: bigint;
    multiplier: bigint;
}

describe("X-Launchpad", () => {
    let xLaunchpad: LaunchpadStaking;
    let xLaunchpadCA: string;
    let rewardToken: SampleERC20;
    let rewardTokenCA: string;
    let stakingToken: ERC20;
    let stakingTokenCA: string;
    let owner: HardhatEthersSigner;
    let other: HardhatEthersSigner;
    let user: HardhatEthersSigner;
    let collector: HardhatEthersSigner;

    const mintAmount = parseEther("10000000000");
    const dailyMiningSupply = parseEther("300000");
    const miningPeriod = 30;
    const bonusMiningSupply = dailyMiningSupply * BigInt(miningPeriod) * BigInt(20850) / BigInt(1000);
    const totalMiningSupply = dailyMiningSupply * BigInt(miningPeriod) + bonusMiningSupply;
    const minedBlockPerDay = 28800;
    const totalRewardPerBlock = dailyMiningSupply / BigInt(minedBlockPerDay);
    const startMiningBlock = 1000;
    const endMiningBlock = 1000 + minedBlockPerDay * miningPeriod - 1;
    const miningMultiplierParams: MiningMultiplierParams[] = [
        { refundOption: BigInt(100), multiplier: BigInt(1000) },
        { refundOption: BigInt(99), multiplier: BigInt(1050) },
        { refundOption: BigInt(98), multiplier: BigInt(1103) },
        { refundOption: BigInt(97), multiplier: BigInt(1159) },
        { refundOption: BigInt(96), multiplier: BigInt(1218) },
        { refundOption: BigInt(95), multiplier: BigInt(1280) },
        { refundOption: BigInt(94), multiplier: BigInt(1345) },
        { refundOption: BigInt(93), multiplier: BigInt(1413) },
        { refundOption: BigInt(92), multiplier: BigInt(1484) },
        { refundOption: BigInt(91), multiplier: BigInt(1558) },
        { refundOption: BigInt(90), multiplier: BigInt(1635) },
        { refundOption: BigInt(89), multiplier: BigInt(1715) },
        { refundOption: BigInt(88), multiplier: BigInt(1798) },
        { refundOption: BigInt(87), multiplier: BigInt(1884) },
        { refundOption: BigInt(86), multiplier: BigInt(1973) },
        { refundOption: BigInt(85), multiplier: BigInt(2065) },
        { refundOption: BigInt(84), multiplier: BigInt(2160) },
        { refundOption: BigInt(83), multiplier: BigInt(2258) },
        { refundOption: BigInt(82), multiplier: BigInt(2359) },
        { refundOption: BigInt(81), multiplier: BigInt(2463) },
        { refundOption: BigInt(80), multiplier: BigInt(2570) },
        { refundOption: BigInt(79), multiplier: BigInt(2680) },
        { refundOption: BigInt(78), multiplier: BigInt(2793) },
        { refundOption: BigInt(77), multiplier: BigInt(2909) },
        { refundOption: BigInt(76), multiplier: BigInt(3028) },
        { refundOption: BigInt(75), multiplier: BigInt(3150) },
        { refundOption: BigInt(74), multiplier: BigInt(3275) },
        { refundOption: BigInt(73), multiplier: BigInt(3403) },
        { refundOption: BigInt(72), multiplier: BigInt(3534) }, 
        { refundOption: BigInt(71), multiplier: BigInt(3668) },
        { refundOption: BigInt(70), multiplier: BigInt(3805) },
        { refundOption: BigInt(69), multiplier: BigInt(3945) },
        { refundOption: BigInt(68), multiplier: BigInt(4088) },
        { refundOption: BigInt(67), multiplier: BigInt(4234) },
        { refundOption: BigInt(66), multiplier: BigInt(4383) },
        { refundOption: BigInt(65), multiplier: BigInt(4535) },
        { refundOption: BigInt(64), multiplier: BigInt(4690) },
        { refundOption: BigInt(63), multiplier: BigInt(4848) },
        { refundOption: BigInt(62), multiplier: BigInt(5009) },
        { refundOption: BigInt(61), multiplier: BigInt(5173) },
        { refundOption: BigInt(60), multiplier: BigInt(5340) },
        { refundOption: BigInt(59), multiplier: BigInt(5510) }, 
        { refundOption: BigInt(58), multiplier: BigInt(5683) },
        { refundOption: BigInt(57), multiplier: BigInt(5859) },
        { refundOption: BigInt(56), multiplier: BigInt(6038) },
        { refundOption: BigInt(55), multiplier: BigInt(6220) },
        { refundOption: BigInt(54), multiplier: BigInt(6405) },
        { refundOption: BigInt(53), multiplier: BigInt(6593) },
        { refundOption: BigInt(52), multiplier: BigInt(6784) },
        { refundOption: BigInt(51), multiplier: BigInt(6978) },
        { refundOption: BigInt(50), multiplier: BigInt(7175) },
        { refundOption: BigInt(49), multiplier: BigInt(7375) }, 
        { refundOption: BigInt(48), multiplier: BigInt(7578) }, 
        { refundOption: BigInt(47), multiplier: BigInt(7784) },  
        { refundOption: BigInt(46), multiplier: BigInt(7993) },   
        { refundOption: BigInt(45), multiplier: BigInt(8205) },
        { refundOption: BigInt(44), multiplier: BigInt(8420) },
        { refundOption: BigInt(43), multiplier: BigInt(8638) },
        { refundOption: BigInt(42), multiplier: BigInt(8859) },
        { refundOption: BigInt(41), multiplier: BigInt(9083) },
        { refundOption: BigInt(40), multiplier: BigInt(9310) },
        { refundOption: BigInt(39), multiplier: BigInt(9540) },
        { refundOption: BigInt(38), multiplier: BigInt(9773) },
        { refundOption: BigInt(37), multiplier: BigInt(10009) },
        { refundOption: BigInt(36), multiplier: BigInt(10248) },
        { refundOption: BigInt(35), multiplier: BigInt(10490) },
        { refundOption: BigInt(34), multiplier: BigInt(10735) }, 
        { refundOption: BigInt(33), multiplier: BigInt(10983) },
        { refundOption: BigInt(32), multiplier: BigInt(11234) },
        { refundOption: BigInt(31), multiplier: BigInt(11488) },
        { refundOption: BigInt(30), multiplier: BigInt(11745) },
        { refundOption: BigInt(29), multiplier: BigInt(12005) },
        { refundOption: BigInt(28), multiplier: BigInt(12268) },
        { refundOption: BigInt(27), multiplier: BigInt(12534) },
        { refundOption: BigInt(26), multiplier: BigInt(12803) },
        { refundOption: BigInt(25), multiplier: BigInt(13075) },
        { refundOption: BigInt(24), multiplier: BigInt(13350) },
        { refundOption: BigInt(23), multiplier: BigInt(13628) },
        { refundOption: BigInt(22), multiplier: BigInt(13909) },
        { refundOption: BigInt(21), multiplier: BigInt(14193) },
        { refundOption: BigInt(20), multiplier: BigInt(14480) }, 
        { refundOption: BigInt(19), multiplier: BigInt(14770) },
        { refundOption: BigInt(18), multiplier: BigInt(15063) },
        { refundOption: BigInt(17), multiplier: BigInt(15359) },
        { refundOption: BigInt(16), multiplier: BigInt(15658) },
        { refundOption: BigInt(15), multiplier: BigInt(15960) },
        { refundOption: BigInt(14), multiplier: BigInt(16265) }, 
        { refundOption: BigInt(13), multiplier: BigInt(16573) },
        { refundOption: BigInt(12), multiplier: BigInt(16884) },
        { refundOption: BigInt(11), multiplier: BigInt(17198) },
        { refundOption: BigInt(10), multiplier: BigInt(17515) },
        { refundOption: BigInt(9), multiplier: BigInt(17835) },
        { refundOption: BigInt(8), multiplier: BigInt(18158) },
        { refundOption: BigInt(7), multiplier: BigInt(18484) },
        { refundOption: BigInt(6), multiplier: BigInt(18813) },
        { refundOption: BigInt(5), multiplier: BigInt(19145) },
        { refundOption: BigInt(4), multiplier: BigInt(19480) },
        { refundOption: BigInt(3), multiplier: BigInt(19818) },
        { refundOption: BigInt(2), multiplier: BigInt(20159) },
        { refundOption: BigInt(1), multiplier: BigInt(20503) },
        { refundOption: BigInt(0), multiplier: BigInt(20850) },
    ];
    const countLimit = 10;
    const startClaimBlock = endMiningBlock + 1;
    const cycle = 30 * minedBlockPerDay;

    const claimSchedule = {
        countLimit: countLimit,
        startBlock: startClaimBlock,
        cycle: cycle
    };

    // // Transfer native token
    // const userEtherBalance = await ethers.provider.getBalance(user) - parseEther("1");
    // await user.sendTransaction({
    //     to: other.address,
    //     value: userEtherBalance
    // });

    beforeEach(async () => {
        // Reset hardhat network
        await network.provider.send("hardhat_reset");

        const signer = await ethers.getSigners();
        owner = signer[0];
        other = signer[1];
        user = signer[3];
        collector = signer[4];
        
        const RToken = await ethers.getContractFactory("SampleERC20");
        rewardToken = await RToken.deploy("REWARD-TOKEN", "RT", mintAmount);
        rewardTokenCA = await rewardToken.getAddress();

        const StakingToken = await ethers.getContractFactory("SampleERC20");
        stakingToken = await StakingToken.deploy("STAKING-TOKEN", "ST", mintAmount);
        stakingTokenCA = await stakingToken.getAddress();

        const XLaunchpad = await ethers.getContractFactory("LaunchpadStaking");
        xLaunchpad = await XLaunchpad.deploy(rewardTokenCA, collector.address);
        xLaunchpadCA = await xLaunchpad.getAddress();

        await rewardToken.transfer(xLaunchpadCA, totalMiningSupply);
    });
    
    describe("Initialize", () => {
        it("rewardToken is not zero address", async () => {
            await xLaunchpad.initialize({
                miningStartBlock: startMiningBlock,
                miningEndBlock: endMiningBlock,
                bonusSupply: bonusMiningSupply,
                poolList: [
                    {
                        stakingToken: stakingTokenCA,
                        allocation: parseEther("100000") / BigInt(minedBlockPerDay)
                    },
                    {
                        stakingToken: ZeroAddress,
                        allocation: parseEther("100000") / BigInt(minedBlockPerDay)
                    },
                    {
                        stakingToken: user.address,
                        allocation: parseEther("100000") / BigInt(minedBlockPerDay)
                    },
                ],
                miningMultipliers: miningMultiplierParams,
                claimSchedule: claimSchedule
            })
            expect(await xLaunchpad.rewardToken()).to.be.equal(rewardTokenCA);
        }); 
    });
    
    describe("Setting configurations", () => {
        describe("Set pause/unpause", () => {
            it("Only execute by owner", async () => {
                await expect(xLaunchpad.connect(other).pause()).to.be.revertedWithCustomError(xLaunchpad, 'OwnableUnauthorizedAccount').withArgs(other.address);
                await expect(xLaunchpad.connect(other).unpause()).to.be.revertedWithCustomError(xLaunchpad, 'OwnableUnauthorizedAccount').withArgs(other.address);
                await expect(xLaunchpad.pause()).to.not.be.reverted;
                await expect(xLaunchpad.unpause()).to.not.be.reverted;
            });

            it("Should be pause when not paused", async () => {
                await expect(xLaunchpad.pause()).to.not.be.reverted;
                await expect(xLaunchpad.pause()).to.be.revertedWithCustomError(xLaunchpad, 'EnforcedPause');
                await expect(xLaunchpad.unpause()).to.not.be.reverted;
                await expect(xLaunchpad.pause()).to.not.be.reverted;

            });

            it("Should be unpause after pause", async () => {
                await expect(xLaunchpad.unpause()).to.be.revertedWithCustomError(xLaunchpad, 'ExpectedPause');
                await expect(xLaunchpad.pause()).to.not.be.reverted;
                await expect(xLaunchpad.unpause()).to.not.be.reverted;
            });
        });
        
        describe("Set miningPeriod", () => {
            it("Only execute by owner", async () => {
                await expect(xLaunchpad.connect(other).setMiningPeriod(startMiningBlock, endMiningBlock)).to.be.revertedWithCustomError(xLaunchpad, 'OwnableUnauthorizedAccount').withArgs(other.address);
                await expect(xLaunchpad.setMiningPeriod(startMiningBlock, endMiningBlock)).to.not.be.reverted;
            });

            it("Should be execute before start mining", async () => {
                const inputStartBlock = await ethers.provider.getBlockNumber() + 2;
                await expect(xLaunchpad.setMiningPeriod(inputStartBlock, endMiningBlock)).to.not.be.reverted;
                await expect(xLaunchpad.setMiningPeriod(startMiningBlock, endMiningBlock)).to.be.revertedWithCustomError(xLaunchpad, 'OverTheDeadline').withArgs(inputStartBlock - 1);
            });

            it("Should be set startBlock greater than currentBlock", async () => {
                // When input startBlock is equal to executed block.
                const inputStartBlock = await ethers.provider.getBlockNumber() + 1;
                await expect(xLaunchpad.setMiningPeriod(inputStartBlock, 0)).to.be.revertedWithCustomError(xLaunchpad, 'BelowStandard').withArgs(inputStartBlock + 1, inputStartBlock);

                // When input startBlock is less than executed block.
                const inputStartBlock2 = await ethers.provider.getBlockNumber();
                await expect(xLaunchpad.setMiningPeriod(inputStartBlock2, 0)).to.be.revertedWithCustomError(xLaunchpad, 'BelowStandard').withArgs(inputStartBlock2 + 2, inputStartBlock);
            });

            it("Should be endBlock is greater than startBlock", async () => {
                // When input endBlock is equal to startBlock.
                await expect(xLaunchpad.setMiningPeriod(100, 100)).to.be.revertedWithCustomError(xLaunchpad, 'BelowStandard').withArgs(100 + 1, 100);

                // When input endBlock is less than startBlock.
                await expect(xLaunchpad.setMiningPeriod(100, 99)).to.be.revertedWithCustomError(xLaunchpad, 'BelowStandard').withArgs(100 + 1, 99);
            });
        });

        describe("Set bonusRewardSupply", () => {
            it("Only execute by owner", async () => {
                await xLaunchpad.setMiningPeriod(startMiningBlock, endMiningBlock);
                await expect(xLaunchpad.connect(other).setBonusRewardSupply(bonusMiningSupply)).to.be.revertedWithCustomError(xLaunchpad, 'OwnableUnauthorizedAccount').withArgs(other.address);
                await expect(xLaunchpad.setBonusRewardSupply(bonusMiningSupply)).to.not.be.reverted;
            });

            it("Should be execute before start mining", async () => {
                await expect(xLaunchpad.setBonusRewardSupply(bonusMiningSupply)).to.be.revertedWithCustomError(xLaunchpad, 'OverTheDeadline').withArgs(0);
                await xLaunchpad.setMiningPeriod(startMiningBlock, endMiningBlock);
                await expect(xLaunchpad.setBonusRewardSupply(bonusMiningSupply)).to.not.be.reverted;
            });

            it("Can't set greater than totalMiningRewards", async () => {
                const poolConfig = { 
                    stakingToken: stakingTokenCA,
                    allocation: totalRewardPerBlock
                }
                await xLaunchpad.setMiningPeriod(startMiningBlock, endMiningBlock);
                await xLaunchpad.setPool(poolConfig);
                const maxValue = await rewardToken.balanceOf(xLaunchpadCA) - (await xLaunchpad.totalMiningRewards() - await xLaunchpad.bonusRewardSupply());

                await expect(xLaunchpad.setBonusRewardSupply(bonusMiningSupply + BigInt(1*1e18))).to.be.revertedWithCustomError(xLaunchpad, 'OverTheLimit').withArgs(maxValue, bonusMiningSupply + BigInt(1*1e18));
                expect(await xLaunchpad.setBonusRewardSupply(bonusMiningSupply)).to.not.be.reverted;
                expect(await xLaunchpad.bonusRewardSupply()).to.be.equal(bonusMiningSupply);
            })
        });
        
        describe("Set bonusMiningMultipliers", () => {
            it("Only execute by owner", async () => {
                await expect(xLaunchpad.connect(other).setBonusMiningMultiplierBatch(miningMultiplierParams)).to.be.revertedWithCustomError(xLaunchpad, 'OwnableUnauthorizedAccount').withArgs(other.address);
                await expect(xLaunchpad.setBonusMiningMultiplierBatch(miningMultiplierParams)).to.not.be.reverted;
            });

            it("Refund options range from 0 to 100", async () => {
                const invalidParam = {
                    refundOption: 101,
                    multiplier: 1000
                }
                await expect(xLaunchpad.setBonusMiningMultiplier(invalidParam)).to.be.revertedWithCustomError(xLaunchpad, 'OutOfRange').withArgs(0, 100, invalidParam.refundOption);
            });
        });

        describe("Set claim schedule", () => {
            it("Only execute by owner", async () => {
                const currentBlockNumber = await ethers.provider.getBlockNumber();
                const startBlock = currentBlockNumber + 10;
                await expect(xLaunchpad.connect(other).setClaimSchedule(claimSchedule)).to.be.revertedWithCustomError(xLaunchpad, 'OwnableUnauthorizedAccount').withArgs(other.address);
                await expect(xLaunchpad.setClaimSchedule(claimSchedule)).to.not.be.reverted;
            });
    
            it("Should be execute before start claim schedule", async () => {
                const currentBlockNumber = await ethers.provider.getBlockNumber();
                const startBlock = currentBlockNumber + 10;
                const params = {
                    countLimit: countLimit,
                    startBlock: startBlock,
                    cycle: cycle
                }
                await xLaunchpad.setClaimSchedule(params);
    
                await expect(xLaunchpad.setClaimSchedule(params)).to.not.be.reverted;
                await mine(10);
                await expect(xLaunchpad.setClaimSchedule(params)).to.be.revertedWithCustomError(xLaunchpad, 'OverTheDeadline').withArgs(startBlock - 1);
            });
    
            it("Should be equal expected blocks", async () => {
                await xLaunchpad.setClaimSchedule(claimSchedule);
    
                for(let i = 0; i < countLimit; i++) {
                    const expectedBlock = i == 0 ? startClaimBlock : startClaimBlock + cycle * i;
                    expect(await xLaunchpad.claimableBlock(i + 1)).to.be.equal(expectedBlock);
                }
            });
        });
    });

    describe("Setting pools", () => {
        const allocation = dailyMiningSupply / BigInt(minedBlockPerDay);
        let poolConfig = {
            stakingToken: "",
            allocation: BigInt(0)
        };
        
        beforeEach(async () => {
            await xLaunchpad.setMiningPeriod(startMiningBlock, endMiningBlock);
            await xLaunchpad.setBonusMiningMultiplierBatch(miningMultiplierParams);
            await xLaunchpad.setBonusRewardSupply(bonusMiningSupply);
            poolConfig = {
                stakingToken: stakingTokenCA,
                allocation: allocation
            }
        })

        it("Only execute by owner", async () => {
            await expect(xLaunchpad.connect(other).setPool(poolConfig)).to.be.revertedWithCustomError(xLaunchpad, 'OwnableUnauthorizedAccount').withArgs(other.address);
            await expect(xLaunchpad.setPool(poolConfig)).to.not.be.reverted;
        });

        it("Should be execute before start mining", async () => {
            await expect(xLaunchpad.setPool(poolConfig)).to.not.be.reverted;
            await mine(endMiningBlock - startMiningBlock);
            await expect(xLaunchpad.setPool(poolConfig)).to.be.revertedWithCustomError(xLaunchpad, 'OverTheDeadline').withArgs(startMiningBlock - 1);
        });
        
        it("Should be not exceed rewards than balance", async () => {
            const exceedAllocation = allocation + BigInt(1);
            const maxValue = (await rewardToken.balanceOf(xLaunchpadCA) - ((await xLaunchpad.totalAllocationPerBlock() - (await xLaunchpad.pools(stakingTokenCA)).allocation) * BigInt(endMiningBlock - startMiningBlock + 1) + bonusMiningSupply)) / BigInt(endMiningBlock - startMiningBlock + 1);
            await expect(xLaunchpad.setPool({
                stakingToken: stakingTokenCA,
                allocation: exceedAllocation
            })).to.be.revertedWithCustomError(xLaunchpad, 'OverTheLimit').withArgs(maxValue, exceedAllocation);
        });

        it("Should be update totalAllocationPerBlock", async () => {
            const allocation1 = parseEther("30000") / BigInt(minedBlockPerDay);
            const allocation2 = parseEther("20000") / BigInt(minedBlockPerDay);

            await xLaunchpad.setPool({
                stakingToken: stakingTokenCA,
                allocation: allocation1
            });
            expect(await xLaunchpad.totalAllocationPerBlock()).to.be.equal(allocation1);

            await xLaunchpad.setPool({
                stakingToken: ZeroAddress,
                allocation: allocation2
            });
            expect(await xLaunchpad.totalAllocationPerBlock()).to.be.equal(allocation1 + allocation2);
        });
        
    });
    
    describe("Deposit", () => {
        beforeEach(async () => {
            const allocation1 = parseEther("30000") / BigInt(minedBlockPerDay);
            const allocation2 = parseEther("20000") / BigInt(minedBlockPerDay);

            await xLaunchpad.setMiningPeriod(startMiningBlock, endMiningBlock);
            await xLaunchpad.setBonusMiningMultiplierBatch(miningMultiplierParams);
            await xLaunchpad.setBonusRewardSupply(bonusMiningSupply);
            await xLaunchpad.setPool({
                stakingToken: stakingTokenCA,
                allocation: allocation1
            });
            await xLaunchpad.setPool({
                stakingToken: ZeroAddress,
                allocation: allocation2
            });
            await stakingToken.transfer(user.address, BigInt(10000 * 1e18));
            await stakingToken.connect(user).approve(xLaunchpadCA, BigInt(10000 * 1e18));
        });

        it("Should be deposit when only mining period", async () => {
            const depositParams = {
                token: stakingTokenCA,
                amount: parseEther("10000"),
                refundOption: BigInt(100)
            };

            // execute before start mining
            await expect(xLaunchpad.connect(user).deposit(depositParams)).to.be.revertedWithCustomError(xLaunchpad, 'InvalidPeriod').withArgs(startMiningBlock, endMiningBlock);

            // exexute after end mining
            await mine(endMiningBlock - await ethers.provider.getBlockNumber());
            await expect(xLaunchpad.connect(user).deposit(depositParams)).to.be.revertedWithCustomError(xLaunchpad, 'InvalidPeriod').withArgs(startMiningBlock, endMiningBlock);
        });

        it("Should be deposit to active pool", async () => {
            const depositParams = {
                token: rewardTokenCA,
                amount: parseEther("10000"),
                refundOption: BigInt(100)
            };

            await mine(startMiningBlock - await ethers.provider.getBlockNumber());
            await expect(xLaunchpad.connect(user).deposit(depositParams)).to.be.revertedWithCustomError(xLaunchpad, 'InvalidPool').withArgs(rewardTokenCA);
        });

        it("Should be increase deposit", async () => {
            const depositParams = {
                token: stakingTokenCA,
                amount: parseEther("10000"),
                refundOption: BigInt(100)
            };

            await mine(startMiningBlock - await ethers.provider.getBlockNumber());
            await xLaunchpad.connect(user).deposit(depositParams);

            // add deposit
            await stakingToken.transfer(user.address, BigInt(10000 * 1e18));
            await stakingToken.connect(user).approve(xLaunchpadCA, BigInt(10000 * 1e18));
            await xLaunchpad.connect(user).deposit(depositParams);

            const depositInfo = await xLaunchpad.depositInfo(user.address, stakingTokenCA, 100);
            const deposit = depositInfo[0];
            const expectedValue = parseEther("20000");

            expect(deposit).to.be.equal(expectedValue);
        });
    });

    describe("Adjust deposit refund option", () => {
        beforeEach(async () => {
            const allocation1 = parseEther("30000") / BigInt(minedBlockPerDay);
            const allocation2 = parseEther("20000") / BigInt(minedBlockPerDay);
            const depositParams = {
                token: stakingTokenCA,
                amount: parseEther("10000"),
                refundOption: BigInt(50)
            };

            await xLaunchpad.setMiningPeriod(startMiningBlock, endMiningBlock);
            await xLaunchpad.setBonusMiningMultiplierBatch(miningMultiplierParams);
            await xLaunchpad.setBonusRewardSupply(bonusMiningSupply);
            await xLaunchpad.setPool({
                stakingToken: stakingTokenCA,
                allocation: allocation1
            });
            await xLaunchpad.setPool({
                stakingToken: ZeroAddress,
                allocation: allocation2
            });
            await stakingToken.transfer(user.address, BigInt(10000 * 1e18));
            await stakingToken.connect(user).approve(xLaunchpadCA, BigInt(10000 * 1e18));

            await mine(startMiningBlock - await ethers.provider.getBlockNumber());
            await xLaunchpad.connect(user).deposit(depositParams);
        });

        it("Should be adjust to upward options", async () => {
            const adjustParams = {
                token: stakingTokenCA,
                currentOption: 50,
                replacementOption: 60
            }
            await expect(xLaunchpad.connect(user).adjustDeposit(adjustParams)).to.be.revertedWithCustomError(xLaunchpad, 'OutOfRange').withArgs(0, 49, 60);
        });


        it("Should be adjust refund option", async () => {
            const adjustParams = {
                token: stakingTokenCA,
                currentOption: 50,
                replacementOption: 40
            }
            await expect(xLaunchpad.connect(user).adjustDeposit(adjustParams)).to.not.be.reverted;

            expect((await xLaunchpad.depositInfo(user.address, stakingTokenCA, 50)).amount).to.be.equal(0);
            expect((await xLaunchpad.depositInfo(user.address, stakingTokenCA, 40)).amount).to.be.equal(parseEther("10000"));
        });

    });
    
    describe("Calculate rewards", () => {
        beforeEach(async () => {
            await xLaunchpad.setMiningPeriod(startMiningBlock, endMiningBlock);
            await xLaunchpad.setBonusMiningMultiplierBatch(miningMultiplierParams);
            await xLaunchpad.setBonusRewardSupply(bonusMiningSupply);
            await xLaunchpad.setPool({
                stakingToken: stakingTokenCA,
                allocation: totalRewardPerBlock
            });
            await stakingToken.transfer(user.address, BigInt(10000 * 1e18));
        });

        for (let i = 0; i < miningMultiplierParams.length; i++) {
            it(`Should be rewards for ${miningMultiplierParams[i].refundOption} % refund option equal expected value`, async () => {
                const refundOption = miningMultiplierParams[i].refundOption;
                const depositParams = {
                    token: stakingTokenCA,
                    amount: parseEther("10000"),
                    refundOption: refundOption
                };

                await mine(startMiningBlock - await ethers.provider.getBlockNumber() - 2);
                await stakingToken.connect(user).approve(xLaunchpadCA, parseEther("10000"));
                await xLaunchpad.connect(user).deposit(depositParams);
                await mine(endMiningBlock - startMiningBlock);

                const manuallyRewardPerToken = totalRewardPerBlock * BigInt(endMiningBlock - startMiningBlock) * BigInt(1e18) / parseEther("10000")
                const expectedValue = (parseEther("10000") * manuallyRewardPerToken) / BigInt(1e18) * miningMultiplierParams[i].multiplier / BigInt(1000);
                expect(await xLaunchpad.earned(user.address, stakingTokenCA, refundOption)).to.be.equal(expectedValue);
            });
        }
    });

    describe("Withdraw refund", () => {
        beforeEach(async () => {
            await xLaunchpad.setMiningPeriod(startMiningBlock, endMiningBlock);
            await xLaunchpad.setBonusMiningMultiplierBatch(miningMultiplierParams);
            await xLaunchpad.setBonusRewardSupply(bonusMiningSupply);
            await xLaunchpad.setPool({
                stakingToken: stakingTokenCA,
                allocation: totalRewardPerBlock
            });
            await stakingToken.transfer(user.address, BigInt(10000 * 1e18));
            await xLaunchpad.setClaimSchedule({
                countLimit: countLimit,
                startBlock: await ethers.provider.getBlockNumber() + 10, 
                cycle: cycle
            })
            await mine(startMiningBlock - await ethers.provider.getBlockNumber() - 1);
        });

        it('Must execute after end mining protocol', async () => {
            await expect(xLaunchpad.connect(user).withdrawRefund(stakingToken)).to.be.revertedWithCustomError(xLaunchpad, 'NotYetStarted').withArgs(endMiningBlock + 1);
            await mine(endMiningBlock - startMiningBlock);
            await expect(xLaunchpad.connect(user).withdrawRefund(stakingToken)).to.not.be.reverted;
        });

        it('Invalid deposited pool', async () => {
            await mine(endMiningBlock - startMiningBlock + 1);
            await xLaunchpad.connect(user).withdrawRefund(stakingToken);
            await expect(xLaunchpad.connect(user).withdrawRefund(stakingToken)).to.be.revertedWithCustomError(xLaunchpad, 'InvalidDepositedPool').withArgs(user.address, stakingTokenCA);
        });

        for (let i = 0; i < miningMultiplierParams.length; i++) {
            it(`Should be refund for ${miningMultiplierParams[i].refundOption} % refund option equal expected value`, async () => {
                const refundOption = miningMultiplierParams[i].refundOption;
                const depositParams = {
                    token: stakingTokenCA,
                    amount: parseEther("10000"),
                    refundOption: refundOption
                };

                await stakingToken.connect(user).approve(xLaunchpadCA, parseEther("10000"));
                await xLaunchpad.connect(user).deposit(depositParams);
                await mine(endMiningBlock - startMiningBlock);

                const expectedValue = depositParams.amount * refundOption / BigInt(100);
                expect(await xLaunchpad.connect(user).withdrawRefund(stakingTokenCA)).to.not.be.reverted;
                expect(await stakingToken.balanceOf(user.address)).to.be.equal(expectedValue);
            });
        }

        it('Should be equal to reward', async () => {
            const depositParams = {
                token: stakingTokenCA,
                amount: parseEther("10000"),
                refundOption: 100
            };

            await stakingToken.connect(user).approve(xLaunchpadCA, parseEther("10000"));
            await xLaunchpad.connect(user).deposit(depositParams);
            await mine(endMiningBlock - startMiningBlock);

            const totalReward = await xLaunchpad.earned(user.address, stakingToken, 100);
            await xLaunchpad.connect(user).withdrawRefund(stakingTokenCA);

            expect(await xLaunchpad.totalUserRewards(user.address)).to.be.equal(totalReward);
        });
    });

    describe("Claim", () => {
        beforeEach(async () => {
            await xLaunchpad.setMiningPeriod(startMiningBlock, endMiningBlock);
            await xLaunchpad.setBonusMiningMultiplierBatch(miningMultiplierParams);
            await xLaunchpad.setBonusRewardSupply(bonusMiningSupply);
            await xLaunchpad.setPool({
                stakingToken: stakingTokenCA,
                allocation: totalRewardPerBlock
            });
            await xLaunchpad.setClaimSchedule(claimSchedule)

            await mine(startMiningBlock - await ethers.provider.getBlockNumber() - 2);

            for (let i = 0; i < miningMultiplierParams.length; i++) {
                const refundOption = miningMultiplierParams[i].refundOption;
                const depositParams = {
                    token: stakingTokenCA,
                    amount: parseEther("10000"),
                    refundOption: refundOption
                };

                await stakingToken.transfer(user.address, BigInt(10000 * 1e18));
                await stakingToken.connect(user).approve(xLaunchpadCA, parseEther("10000"));
                await xLaunchpad.connect(user).deposit(depositParams);
            }

            await mine(endMiningBlock - startMiningBlock);
        });

        it("Should be execute after withdraw refund", async () => {
            await expect(xLaunchpad.connect(user).claim()).to.be.revertedWithCustomError(xLaunchpad, 'ClaimUnauthorized').withArgs(user.address);
            await xLaunchpad.connect(user).withdrawRefund(stakingToken);
            await mine(cycle);
            await expect(xLaunchpad.connect(user).claim()).to.not.be.reverted;
        });

        it('Claim limit', async() => {
            await xLaunchpad.connect(user).withdrawRefund(stakingToken);
            for (let i = 1; i <= 10; i++) {
                if(i > 1) await mine(cycle);
                await xLaunchpad.connect(user).claim();
            }

            await expect(xLaunchpad.connect(user).claim()).to.be.revertedWithCustomError(xLaunchpad, 'OverTheLimit').withArgs(countLimit, 11);
        });

        it('Not Yet Claim', async() => {
            await xLaunchpad.connect(user).withdrawRefund(stakingToken);
            await xLaunchpad.connect(user).claim();
            const nearestClaimableBlock = await xLaunchpad.claimableBlock(2);

            await expect(xLaunchpad.connect(user).claim()).to.be.revertedWithCustomError(xLaunchpad, 'NotYetStarted').withArgs(nearestClaimableBlock);
        });        

        it("Should be equal user's reward token balance", async () => {
            await xLaunchpad.connect(user).withdrawRefund(stakingToken);
            for (let i = 1; i <= 10; i++) {
                if(i > 1) await mine(cycle);
                await xLaunchpad.connect(user).claim();
                expect(await xLaunchpad.totalUserRewards(user.address) / BigInt(countLimit) * BigInt(i)).to.be.equal(await rewardToken.balanceOf(user.address));
            }
        });
    });

    describe('Emerency', () => {
        beforeEach(async () => {
            await xLaunchpad.setMiningPeriod(startMiningBlock, endMiningBlock);
            await xLaunchpad.setBonusMiningMultiplierBatch(miningMultiplierParams);
            await xLaunchpad.setBonusRewardSupply(bonusMiningSupply);
            await xLaunchpad.setPool({
                stakingToken: stakingTokenCA,
                allocation: totalRewardPerBlock
            });
            await xLaunchpad.setClaimSchedule(claimSchedule)

            await mine(startMiningBlock - await ethers.provider.getBlockNumber() - 2);

            for (let i = 0; i < miningMultiplierParams.length; i++) {
                const refundOption = miningMultiplierParams[i].refundOption;
                const depositParams = {
                    token: stakingTokenCA,
                    amount: parseEther("10000"),
                    refundOption: refundOption
                };

                await stakingToken.transfer(user.address, BigInt(10000 * 1e18));
                await stakingToken.connect(user).approve(xLaunchpadCA, parseEther("10000"));
                await xLaunchpad.connect(user).deposit(depositParams);
            }
        });

        it('success', async () => {
            await xLaunchpad.pause();
            await xLaunchpad.emergencyWithdrawRefund(user.address, stakingToken);
        })
    });
});