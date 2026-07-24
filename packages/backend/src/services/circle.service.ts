import { prisma } from '../config/db';
import {
  CreateCircleInput,
  Circle,
  CircleMember,
  CircleStatus,
} from '../types/shared';
import { StellarService } from './stellar.service';

export class CircleService {
  static async createCircle(
    input: CreateCircleInput & { organizerAddress: string }
  ): Promise<Circle> {
    try {
      // Combine organizer + member wallets, deduplicating
      const allMemberWallets = [
        input.organizerAddress,
        ...input.memberWallets.filter((w) => w !== input.organizerAddress),
      ];

      // Validate all wallet addresses
      for (const wallet of allMemberWallets) {
        if (!StellarService.validatePublicKey(wallet)) {
          throw new Error(`Invalid Stellar public key: ${wallet}`);
        }
      }

      // Upsert all users
      for (const wallet of allMemberWallets) {
        await prisma.user.upsert({
          where: { walletAddress: wallet },
          update: {},
          create: { walletAddress: wallet },
        });
      }

      // Create circle — totalMembers includes organizer
      const circle = await prisma.circle.create({
        data: {
          name: input.name,
          organizerAddress: input.organizerAddress,
          contributionAmount: input.contributionAmount,
          escrowAsset: input.escrowAsset,
          cycleLengthDays: input.cycleLengthDays,
          totalMembers: allMemberWallets.length,
          status: 'PENDING' as CircleStatus,
          inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        },
      });

      // Add all members with sequential payout positions
      for (let i = 0; i < allMemberWallets.length; i++) {
        await prisma.circleMember.create({
          data: {
            circleId: circle.id,
            walletAddress: allMemberWallets[i],
            payoutPosition: i,
            securityDepositPaid: true, // auto-approved on testnet
          },
        });
      }

      return await this.getCircleById(circle.id);
    } catch (err) {
      throw err instanceof Error ? err : new Error(`Failed to create circle: ${err}`);
    }
  }

  static async getCircleById(id: string): Promise<Circle> {
    try {
      const circle = await prisma.circle.findUniqueOrThrow({
        where: { id },
        include: {
          members: true,
          cycles: {
            include: { contributions: true },
            orderBy: { cycleIndex: 'asc' },
          },
        },
      });

      return circle as Circle;
    } catch (err) {
      throw new Error(`Circle not found: ${err}`);
    }
  }

  static async getUserCircles(walletAddress: string): Promise<Circle[]> {
    try {
      const circles = await prisma.circle.findMany({
        where: {
          OR: [
            { organizerAddress: walletAddress },
            { members: { some: { walletAddress } } },
          ],
        },
        include: {
          members: true,
          cycles: { orderBy: { cycleIndex: 'asc' } },
        },
      });

      return circles as Circle[];
    } catch (err) {
      throw new Error(`Failed to get user circles: ${err}`);
    }
  }

  static async joinCircle(inviteCode: string, walletAddress: string): Promise<Circle> {
    try {
      if (!StellarService.validatePublicKey(walletAddress)) {
        throw new Error('Invalid wallet address');
      }

      // Find circle by invite code
      const circle = await prisma.circle.findUniqueOrThrow({
        where: { inviteCode },
        include: { members: true },
      });

      if (circle.status !== 'PENDING') {
        throw new Error('Circle is not open for joining');
      }

      if (circle.members.length >= circle.totalMembers) {
        throw new Error('Circle is full');
      }

      if (circle.members.some((m) => m.walletAddress === walletAddress)) {
        throw new Error('Already a member of this circle');
      }

      // Ensure user exists
      await prisma.user.upsert({
        where: { walletAddress },
        update: {},
        create: { walletAddress },
      });

      // Add member with auto-approved deposit on testnet
      await prisma.circleMember.create({
        data: {
          circleId: circle.id,
          walletAddress,
          payoutPosition: circle.members.length,
          securityDepositPaid: true, // auto-approved on testnet
        },
      });

      return await this.getCircleById(circle.id);
    } catch (err) {
      throw new Error(`Failed to join circle: ${err}`);
    }
  }

  static async startCircle(circleId: string, organizerAddress: string): Promise<Circle> {
    try {
      const circle = await prisma.circle.findUniqueOrThrow({
        where: { id: circleId },
        include: { members: { orderBy: { payoutPosition: 'asc' } } },
      });

      if (circle.organizerAddress !== organizerAddress) {
        throw new Error('Only the organizer can start the circle');
      }

      if (circle.status !== 'PENDING') {
        throw new Error('Circle is already started or completed');
      }

      if (circle.members.length < 2) {
        throw new Error('Circle needs at least 2 members before starting');
      }

      // Security deposits not required in testnet mode — skip this check
      // In mainnet, uncomment: if (!circle.members.every(m => m.securityDepositPaid)) throw ...

      // Update circle status
      await prisma.circle.update({
        where: { id: circleId },
        data: {
          status: 'ACTIVE' as CircleStatus,
          startedAt: new Date(),
        },
      });

      // Create first cycle — recipient is member with payoutPosition 0
      const firstRecipient = circle.members[0];
      if (!firstRecipient) throw new Error('No members found');

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + circle.cycleLengthDays);

      await prisma.cycle.create({
        data: {
          circleId,
          cycleIndex: 0,
          recipientAddress: firstRecipient.walletAddress,
          deadline,
          status: 'OPEN',
        },
      });

      return await this.getCircleById(circleId);
    } catch (err) {
      // Re-throw with original message so routes can surface it
      throw err instanceof Error ? err : new Error(`Failed to start circle: ${err}`);
    }
  }

  static async recordSecurityDeposit(
    circleId: string,
    memberAddress: string,
    txHash: string
  ): Promise<CircleMember> {
    try {
      const member = await prisma.circleMember.update({
        where: {
          circleId_walletAddress: { circleId, walletAddress: memberAddress },
        },
        data: {
          securityDepositPaid: true,
          securityDepositTxHash: txHash,
        },
      });

      return member as unknown as CircleMember;
    } catch (err) {
      throw new Error(`Failed to record security deposit: ${err}`);
    }
  }
}
