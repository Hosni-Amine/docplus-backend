import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../common/database/database.module';
import { User, UserSchema } from '../user/entities/user.entity';
import { UserRepository } from '../user/user.repository';
import { AuthGuard, RolesGuard } from './auth.guard';

@Global()
@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [UserRepository, AuthGuard, RolesGuard],
  exports: [AuthGuard, RolesGuard],
})
export class GuardsModule {}
