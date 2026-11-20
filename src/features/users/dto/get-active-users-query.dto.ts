import { Type } from 'class-transformer'
import { IsInt, Max, Min } from 'class-validator'

export class GetActiveUsersQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  minAge: number

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  maxAge: number

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page = 1

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10
}
