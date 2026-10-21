import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../common/database/database.module';
import { PatientController } from './patient.controller';
import { PatientRepository } from './patient.repository';
import { PatientService } from './patient.service';
import { Patient, PatientSchema } from './entities/patient.entity';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([{ name: Patient.name, schema: PatientSchema }]),
  ],
  controllers: [PatientController],
  providers: [PatientService, PatientRepository],
  exports: [PatientRepository],
})
export class PatientModule {}
