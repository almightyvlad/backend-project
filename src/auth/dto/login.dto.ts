import { IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({
    description: 'User login',
    example: 'vlad123',
  })
  @IsNotEmpty()
  @IsString()
  login: string

  @ApiProperty({
    description: 'User password',
    example: 'securepass123',
    minLength: 1,
  })
  @IsNotEmpty()
  @IsString()
  password: string
}
