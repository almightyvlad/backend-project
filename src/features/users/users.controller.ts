import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { UsersService } from './users.service.js'
import { CreateUserDto } from './dto/create-user.dto/create-user.dto.js'
import { AuthGuard } from '../../auth/auth.guard.js'
import { UpdateUserDto } from './dto/update-user.dto/update-user.dto.js'
import type { AuthenticatedRequest } from '../../auth/types/authenticated-request.js'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get users' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'From 1 to 100',
  })
  @ApiQuery({ name: 'login', required: false, type: String, example: 'vlad' })
  @ApiOkResponse({ description: 'Users retrieved successfully' })
  @ApiBadRequestResponse({ description: 'Invalid pagination parameters' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get()
  getUsers(
    @Query(
      'page',
      new DefaultValuePipe(1),
      new ParseIntPipe({
        exceptionFactory: () =>
          new BadRequestException('page must be an integer'),
      }),
    )
    page: number,

    @Query(
      'limit',
      new DefaultValuePipe(10),
      new ParseIntPipe({
        exceptionFactory: () =>
          new BadRequestException('limit must be an integer'),
      }),
    )
    limit: number,

    @Query('login') login?: string,
  ) {
    if (page < 1) {
      throw new BadRequestException('page must be greater than or equal to 1')
    }

    if (limit < 1 || limit > 100) {
      throw new BadRequestException('limit must be between 1 and 100')
    }

    return this.usersService.getUsers(page, limit, login)
  }

  @ApiOperation({ summary: 'Register a user' })
  @ApiCreatedResponse({ description: 'User registered successfully' })
  @ApiBadRequestResponse({ description: 'Invalid registration data' })
  @ApiConflictResponse({ description: 'Login or email is already in use' })
  @Post()
  createUser(@Body() user: CreateUserDto) {
    return this.usersService.createUser(user)
  }

  @ApiOperation({ summary: 'Update user profile' })
  @ApiOkResponse({ description: 'User profile updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid user ID or update data' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiConflictResponse({ description: 'Login or email is already in use' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Patch(':id')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() user: UpdateUserDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.usersService.updateUser(id, user, request.user.sub)
  }

  @ApiOperation({ summary: 'Soft-delete a user' })
  @ApiOkResponse({ description: 'User soft-deleted successfully' })
  @ApiBadRequestResponse({ description: 'Invalid user ID' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete(':id')
  softDeleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.usersService.softDeleteUser(id, request.user.sub)
  }
}
