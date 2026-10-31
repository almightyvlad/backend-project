import { Body, Controller, Delete, Get, Patch, Post, Query, Req } from '@nestjs/common'
import { UsersService } from './users.service.js'
import { CreateUserDto } from './dto/create-user.dto.js'
import { UpdateUserDto } from './dto/update-user.dto.js'
import type { AuthenticatedRequest } from '../../auth/types/authenticated-request.js'
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiUnauthorizedResponse } from '@nestjs/swagger'
import { GetUsersQueryDto } from './dto/get-users-query.dto.js'
import { Public } from '../../auth/decorators/public.decorator.js'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

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
  @Get()
  getUsers(@Query() query: GetUsersQueryDto) {
    return this.usersService.getUsers(
      query.page,
      query.limit,
      query.login,
    )
  }


  @ApiOperation({ summary: 'Register a user' })
  @ApiCreatedResponse({ description: 'User registered successfully' })
  @ApiBadRequestResponse({ description: 'Invalid registration data' })
  @ApiConflictResponse({ description: 'Login or email is already in use' })
  @Post()
  @Public()
  createUser(@Body() user: CreateUserDto) {
    return this.usersService.createUser(user)
  }

  @ApiOperation({ summary: 'Update user profile' })
  @ApiOkResponse({ description: 'User profile updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid update data' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiConflictResponse({ description: 'Login or email is already in use' })
  @ApiBearerAuth()
  @Patch('me')
  updateUser(
    @Body() user: UpdateUserDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.usersService.updateUser(user, request.user.sub)
  }

  @ApiOperation({ summary: 'Soft-delete a user' })
  @ApiOkResponse({ description: 'User soft-deleted successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiBearerAuth()
  @Delete('me')
  softDeleteUser(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.usersService.softDeleteUser(request.user.sub)
  }
}
