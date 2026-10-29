import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class GetUsersQueryDto {
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

    @IsOptional()
    @IsString()
    login?: string
}