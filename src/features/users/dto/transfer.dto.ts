import { IsInt, IsNotEmpty, IsString, Matches, Min } from 'class-validator'

export class TransferDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  recipientId: number

  @IsNotEmpty()
  @IsString()
  @Matches(/^(?!0+(?:\.0{1,2})?$)\d+(?:\.\d{1,2})?$/)
  amount: string
}
