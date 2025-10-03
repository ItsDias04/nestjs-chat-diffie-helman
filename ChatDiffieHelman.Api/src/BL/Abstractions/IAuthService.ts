import { LoginDto } from "src/DTO/LoginDto";

export interface IAuthService {
    login(loginDto: LoginDto): Promise<any>;
}