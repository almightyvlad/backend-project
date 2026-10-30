
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({
    description: 'Unique username without whitespace',
    example: 'vlad123',
    minLength: 3,
    maxLength: 30,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\S+$/)
  @MinLength(3)
  @MaxLength(30)
  login: string

  @ApiProperty({
    description: 'User password',
    example: 'securepass123',
    minLength: 1,
    maxLength: 128,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string
}
