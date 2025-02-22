import { ERole } from "@app/common";
import { IsOptional, IsString , IsNumber } from "class-validator";

export class GetUserInput {
    
    @IsOptional()
    @IsString()
    fullname?: string;

    @IsOptional()
    @IsString()
    role?: ERole;
  
    @IsOptional()
    @IsNumber()
    limit?: number;

    @IsOptional()
    @IsNumber()
    skip?: number;
}