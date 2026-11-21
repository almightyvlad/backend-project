import {
  IsEmail,
  IsInt,
  IsOptional,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'New username without whitespace',
    example: 'vlad123',
    minLength: 3,
    maxLength: 30,
  })
  @IsOptional()
  @Matches(/^\S+$/)
  @MaxLength(30)
  @MinLength(3)
  login?: string

  @ApiPropertyOptional({
    description: 'New email address',
    example: 'vlad@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiPropertyOptional({
    description: 'New password',
    example: 'newsecurepass123',
    minLength: 8,
  })
  @IsOptional()
  @MinLength(8)
  password?: string

  @ApiPropertyOptional({
    description: 'New user age',
    example: 21,
    minimum: 18,
  })
  @IsOptional()
  @IsInt()
  @Min(18)
  age?: number

  @ApiPropertyOptional({
    description: 'New user description',
    example: 'Experienced backend developer',
    maxLength: 1000,
  })
  @IsOptional()
  @MaxLength(1000)
  description?: string
}
