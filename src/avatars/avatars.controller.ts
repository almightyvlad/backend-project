import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import type { AuthenticatedRequest } from '../auth/types/authenticated-request.js'
import { AvatarsService } from './avatars.service.js'
import { AvatarCleanupService } from './avatar-cleanup.service.js'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger'
import {
  AVATAR_MAX_FILE_SIZE_BYTES,
  isAllowedAvatarMimeType,
} from './avatars.constants.js'

@Controller('avatars')
export class AvatarsController {
  constructor(
    private readonly avatarsService: AvatarsService,
    private readonly avatarCleanupService: AvatarCleanupService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload an avatar image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'JPEG or PNG image, up to 10 MB',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Avatar uploaded' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: AVATAR_MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!isAllowedAvatarMimeType(file.mimetype)) {
          return callback(
            new BadRequestException('Only JPEG and PNG files are allowed'),
            false,
          )
        }

        callback(null, true)
      },
    }),
  )
  uploadAvatar(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required')
    }

    return this.avatarsService.uploadAvatar(request.user.sub, file)
  }

  @Post('cleanup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Queue expired avatar cleanup' })
  @ApiOkResponse({ description: 'Cleanup job queued' })
  queueCleanup() {
    return this.avatarCleanupService.enqueueCleanup()
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete own avatar' })
  deleteAvatar(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.avatarsService.deleteAvatar(id, request.user.sub)
  }
}
