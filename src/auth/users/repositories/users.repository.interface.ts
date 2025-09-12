//ARCHIVO: users.repository.interface.ts
import { UserEntity } from "src/auth/entities/user.entity";

export interface IUserRepository {
    findByEmail(email: string): Promise<UserEntity | null>;
    findAll(): Promise<UserEntity[]>;
    save(user: UserEntity): Promise<UserEntity>;
    update(id: number, user: Partial<UserEntity>): Promise<UserEntity | null>;
    delete(id: number): Promise<boolean>;
}