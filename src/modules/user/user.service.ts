import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Doctor, Patient, Secretary, User } from '@src/schemas';
import { CreatePatientDTO } from './dto/patient.dto';
import { ERole } from '../../../libs/common/src/enums'; 
import { GetUserResDTO } from '@app/common/responses.dto';
import { v4 as uuidv4 } from 'uuid';
import { CreateDoctorDTO } from './dto/doctor.dto';
import { CreateSecretaryDTO } from './dto/secretary.dto';
import * as argon from 'argon2';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Doctor.name) private readonly doctorModel: Model<Doctor>,
    @InjectModel(Patient.name) private readonly patientModel: Model<Patient>,
    @InjectModel(Secretary.name) private readonly secretaryModel: Model<Secretary>
  ) { }

  async createPatient(createPatientDto: CreatePatientDTO): Promise<GetUserResDTO> {
    try{
      if(createPatientDto.email){
        const current_user = await this.userModel.findOne({ email: createPatientDto.email });
        if (current_user) {
          this.logger.error(`This mail address ${createPatientDto.email} is already existed!`);
          return {
            user: null,
            message: `This mail address ${createPatientDto.email} is already existed!`,
            status: 400
          }
        }
      }
      /* for test
      const hashPassword = await argon.hash(body.password) */
      const hashPassword = await argon.hash('testtest')
      const confirmationToken = uuidv4();
      const newPatient = await this.patientModel.create({
        ...createPatientDto,
        _id: new Types.ObjectId(),
        role: ERole.PATIENT,
        is_verified: false,
        is_completed: false,
        confirmation_token: confirmationToken,
        doctor: new Types.ObjectId(createPatientDto.doctor_id),
        password: hashPassword
      });
    

    return {
        user: newPatient,
        status: 201,
        message: 'Patient created successfully'
    };}
    catch(error){
      this.logger.error(error);
      return{
        message: error.message, 
        status: 500,
        user: null
      }
    }
  }

  async createDoctor(createDoctorDto: CreateDoctorDTO): Promise<GetUserResDTO> {
    try{
      if(createDoctorDto.email){
        const current_user = await this.userModel.findOne({ email: createDoctorDto.email });
        if (current_user) {
          this.logger.error(`This mail address ${createDoctorDto.email} is already existed!`);
          return {
            user: null,
            message: `This mail address ${createDoctorDto.email} is already existed!`,
            status: 400
          }
        }
      }
      /* for test
      const hashPassword = await argon.hash(body.password) */
      const hashPassword = await argon.hash('testtest')
      const confirmationToken = uuidv4();
      const newDoctor = await this.doctorModel.create({
        ...createDoctorDto,

        _id: new Types.ObjectId(),
        role: ERole.DOCTOR,
        is_verified: false,
        is_completed: false,
        confirmation_token: confirmationToken,
        password: hashPassword
      });
    return {
        user: newDoctor,

        status: 201,
        message: 'Doctor created successfully'
    };}
    catch(error){
      this.logger.error(error);
      return{
        message: error.message, 
        status: 500,
        user: null
      }
    }
  }

  async createSecretary(createSecretaryDto: CreateSecretaryDTO): Promise<GetUserResDTO> {
    try{
      if(createSecretaryDto.email){
        const current_user = await this.userModel.findOne({ email: createSecretaryDto.email });
        if (current_user) {
          this.logger.error(`This mail address ${createSecretaryDto.email} is already existed!`);
          return {
            user: null,
            message: `This mail address ${createSecretaryDto.email} is already existed!`,
            status: 400
          }
        }
      }
      /* for test
      const hashPassword = await argon.hash(body.password) */
      const hashPassword = await argon.hash('testtest')
      const confirmationToken = uuidv4();
      const newSecretary = await this.secretaryModel.create({
        _id: new Types.ObjectId(),
        ...createSecretaryDto,
        role: ERole.SECRETARY,
        is_verified: false,
        is_completed: false,
        confirmation_token: confirmationToken,
        password: hashPassword
      });
    

    return {
        user: newSecretary,
        status: 201,
        message: 'Secretary created successfully'
    };}

    catch(error){
      this.logger.error(error);
      return{
        message: error.message, 
        status: 500,
        user: null
      }
    }
  }
}