import {
  IsEmail,
  IsInt,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'New username without whitespace',
    example: 'vlad123',
    minLength: 3,
    maxLength: 30,
  })
  @ValidateIf((_, value) => value !== undefined)
  @Matches(/^\S+$/)
  @MaxLength(30)
  @MinLength(3)
  login?: string

  @ApiPropertyOptional({
    description: 'New email address',
    example: 'vlad@example.com',
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsEmail()
  email?: string

  @ApiPropertyOptional({
    description: 'New password',
    example: 'newsecurepass123',
    minLength: 8,
  })
  @ValidateIf((_, value) => value !== undefined)
  @MinLength(8)
  password?: string

  @ApiPropertyOptional({
    description: 'New user age',
    example: 21,
    minimum: 18,
    maximum: 120,
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Max(120)
  @Min(18)
  age?: number

  @ApiPropertyOptional({
    description: 'New user description',
    example: 'Experienced backend developer',
    maxLength: 1000,
  })
  @ValidateIf((_, value) => value !== undefined)
  @MaxLength(1000)
  description?: string
}
