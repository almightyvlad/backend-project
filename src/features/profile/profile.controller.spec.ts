import { Test, TestingModule } from '@nestjs/testing'
import { ProfileController } from './profile.controller.js'
import { UsersService } from '../users/users.service.js'
import { JwtService } from '@nestjs/jwt'
import { AuthenticatedRequest } from '../../auth/types/authenticated-request.js'

describe('ProfileController', () => {
  let controller: ProfileController
  let usersService: UsersService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findById: vi.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: vi.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<ProfileController>(ProfileController)
    usersService = module.get<UsersService>(UsersService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it(`should return the current user's profile`, async () => {
    const profile = { id: 1, login: 'vlad' }
    vi.mocked(usersService.findById).mockResolvedValueOnce(
      profile as Awaited<ReturnType<UsersService['findById']>>,
    )

    const request = { user: { sub: 1 } } as AuthenticatedRequest

    const response = await controller.getUserProfile(request)

    expect(usersService.findById).toHaveBeenCalledWith(1)
    expect(response).toEqual(profile)
  })
})
