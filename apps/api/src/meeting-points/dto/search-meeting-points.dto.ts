import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  Equals,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class CoordinatesDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;
}

export class RiderInputDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ValidateNested()
  @Type(() => CoordinatesDto)
  location!: CoordinatesDto;

  @IsString()
  @IsOptional()
  label?: string;
}

export class SearchPreferencesDto {
  @Equals('balanced_arrival')
  @IsOptional()
  priority = 'balanced_arrival' as const;

  @IsInt()
  @Min(0)
  @Max(60)
  @IsOptional()
  maxDetourMinutes: number = 15;

  @IsInt()
  @Min(1)
  @Max(3)
  @IsOptional()
  limit: number = 3;
}

export class SearchMeetingPointsDto {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @ValidateNested({ each: true })
  @Type(() => RiderInputDto)
  riders!: [RiderInputDto, RiderInputDto];

  @ValidateNested()
  @Type(() => CoordinatesDto)
  destination!: CoordinatesDto;

  @ValidateNested()
  @Type(() => SearchPreferencesDto)
  @IsOptional()
  preferences?: SearchPreferencesDto;
}
