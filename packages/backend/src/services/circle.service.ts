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
      // Validate all wallet addresses
      for (const wallet of [input.organizerAddress, ...input.memberWallets]) {
        if (!StellarService.validatePublicKey(wallet)) {
          throw new Error(`Invalid Stellar public key: ${wallet}`);
        }
      }

      // Upsert all users
      const allWallets = [input.organizerAddress, ...input.memberWallets];
      for (const wallet of allWallets) {
        await prisma.user.upsert({
          where: { walletAddress: wallet },
          update: {},
          create: { walletAddress: wallet },
        });
      }

      // Create circle
      const circle = await prisma.circle.create({
        data: {
          name: input.name,
          organizerAddress: input.organizerAddress,
          contributionAmount: input.contributionAmount,
          escrowAsset: input.escrowAsset,
          cycleLengthDays: input.cycleLengthDays,
          totalMembers: input.memberWallets.length,
          status: 'PENDING' as CircleStatus,
          inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        },
      });

      // Create circle members with payout positions
      for (let i = 0; i < input.memberWallets.length; i++) {
        const payoutIndex = input.payoutOrder.indexOf(input.memberWallets[i]);
        await prisma.circleMember.create({
          data: {
            circleId: circle.id,
            walletAddress: input.memberWallets[i],
            payoutPosition: payoutIndex >= 0 ? payoutIndex : i,
          },
        });
      }

      // Fetch with relations
      return await this.getCircleById(circle.id);
    } catch (err) {
      throw new Error(`Failed to create circle: ${err}`);
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

      // Add member
      await prisma.circleMember.create({
        data: {
          circleId: circle.id,
          walletAddress,
          payoutPosition: circle.members.length,
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
        include: { members: true },
      });

      if (circle.organizerAddress !== organizerAddress) {
        throw new Error('Unauthorized');
      }

      if (circle.status !== 'PENDING') {
        throw new Error('Circle must be in PENDING status');
      }

      // Only enforce security deposits in production mode
      const isDemoMode = process.env.NODE_ENV !== 'production';
      if (!isDemoMode && !circle.members.every((m) => m.securityDepositPaid)) {
        throw new Error('Not all members have paid security deposit');
      }

      // Update circle status
      const updated = await prisma.circle.update({
        where: { id: circleId },
        data: {
          status: 'ACTIVE' as CircleStatus,
          startedAt: new Date(),
        },
      });

      // Create first cycle
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + circle.cycleLengthDays);

      await prisma.cycle.create({
        data: {
          circleId,
          cycleIndex: 0,
          recipientAddress: circle.members[0].walletAddress,
          deadline,
          status: 'OPEN',
        },
      });

      return await this.getCircleById(circleId);
    } catch (err) {
      throw new Error(`Failed to start circle: ${err}`);
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

      return member;
    } catch (err) {
      throw new Error(`Failed to record security deposit: ${err}`);
    }
  }
}
