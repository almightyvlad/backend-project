import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateUserDto {
  @ApiProperty({
    description: 'Unique username without whitespace',
    example: 'vlad123',
    minLength: 3,
    maxLength: 30,
  })
  @IsNotEmpty()
  @Matches(/^\S+$/)
  @MaxLength(30)
  @MinLength(3)
  login: string

  @ApiProperty({
    description: 'User email address',
    example: 'vlad@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string

  @ApiProperty({
    description: 'User password',
    example: 'securepass123',
    minLength: 8,
  })
  @IsNotEmpty()
  @MinLength(8)
  password: string

  @ApiProperty({
    description: 'User age',
    example: 20,
    minimum: 18,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(18)
  age: number

  @ApiProperty({
    description: 'User description',
    example: 'Backend developer',
    maxLength: 1000,
  })
  @IsNotEmpty()
  @MaxLength(1000)
  description: string
}
