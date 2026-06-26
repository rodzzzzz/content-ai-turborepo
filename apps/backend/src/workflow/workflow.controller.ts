import { Controller, HttpCode, Post } from '@nestjs/common';

/**
 * QStash / cron entrypoints for daily analytics and scheduled posting.
 * Implementations land in Phase 6–7 (QStash verification, platform APIs).
 */
@Controller('workflow')
export class WorkflowController {
  @Post('daily-analytics')
  @HttpCode(501)
  dailyAnalytics() {
    return {
      status: 'not_implemented',
      message:
        'Daily analytics workflow will be ported from content-ai (QStash + analytics lib).',
    };
  }

  @Post('post-scheduled-posts')
  @HttpCode(501)
  postScheduledPosts() {
    return {
      status: 'not_implemented',
      message:
        'Scheduled posting workflow will be ported from content-ai (QStash + FB/LI posting).',
    };
  }
}
