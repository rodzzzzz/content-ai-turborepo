import {
  AuthGuard,
  Session,
  UserSession,
} from '@mguay/nestjs-better-auth';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Controller('organization')
@UseGuards(AuthGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) { }

  @Get()
  async list(@Session() session: UserSession) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    return this.organizationService.findAll(userId);
  }

  @Get(':id')
  async getOne(@Session() session: UserSession, @Param('id') id: string) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    return this.organizationService.findOne(id, userId);
  }

  @Post()
  async create(
    @Session() session: UserSession,
    @Body() dto: CreateOrganizationDto,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!dto.name?.trim()) return { error: 'Organization name is required' };
    return this.organizationService.create(dto.name.trim(), userId);
  }

  @Patch(':id')
  async update(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    if (!dto.name?.trim()) return { error: 'Organization name is required' };
    return this.organizationService.update(id, dto.name.trim(), userId);
  }

  @Delete(':id')
  async delete(@Session() session: UserSession, @Param('id') id: string) {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    return this.organizationService.delete(id, userId);
  }
}
