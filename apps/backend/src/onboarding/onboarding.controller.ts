import {
  AuthGuard,
  Session,
  UserSession,
} from '@mguay/nestjs-better-auth';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';

@Controller('onboarding')
@UseGuards(AuthGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('complete')
  async complete(
    @Session() session: UserSession,
    @Body() dto: CompleteOnboardingDto,
  ) {
    const userId = session?.user?.id;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    if (
      !dto.firstName ||
      !dto.lastName ||
      !dto.timeZone ||
      !dto.organizationName ||
      !dto.organizationSize ||
      !dto.organizationType ||
      !dto.discoveryChannel
    ) {
      return { error: 'Missing required fields' };
    }

    try {
      const result = await this.onboardingService.complete(userId, dto);
      return { organizationId: result.organizationId };
    } catch (error) {
      console.error('Onboarding completion failed:', error);
      return { error: 'Failed to complete onboarding' };
    }
  }
}
