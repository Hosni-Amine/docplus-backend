import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Doctor, Patient, Secretary, User } from '@src/schemas';
import { CreatePatientDTO } from './dto/patient.dto';
import { ERole } from '../../../libs/common/src/enums'; 
import { GetUserResDTO } from '@app/common/responses.dto';
import { v4 as uuidv4 } from 'uuid';
import { CreateDoctorDTO } from './dto/doctor.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepository: UserRepository,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Doctor.name) private readonly doctorModel: Model<Doctor>,
    @InjectModel(Patient.name) private readonly patientModel: Model<Patient>,
    @InjectModel(Secretary.name) private readonly secretaryModel: Model<Secretary>
  ) { }

  async createPatient(createPatientDto: CreatePatientDTO): Promise<GetUserResDTO> {
    try{
      if(createPatientDto.email){
        const current_user = await this.userRepository.findOne({ email: createPatientDto.email });
        if (current_user) {
          console.log(`This mail address ${createPatientDto.email} is already existed!`);
          return {
            user: null,
            message: `This mail address ${createPatientDto.email} is already existed!`,
            status: 400
          }
        }
      }
      const newPatient = await this.patientModel.create({
        _id: new Types.ObjectId(),
        thumbnail: createPatientDto.thumbnail,
        doctor: new Types.ObjectId(createPatientDto.doctor_id),
      });
    
    console.log(newPatient)
    const confirmationToken = uuidv4();
    const newUser = await this.userModel.create({
        _id: new Types.ObjectId(),
        email: createPatientDto.email,
        phone_number: createPatientDto.phone_number,
        username: createPatientDto.email,
        fullname: createPatientDto.fullname,
        role: ERole.PATIENT,
        is_verified: false,
        is_completed: false,
        patient: newPatient,
        confirmation_token: confirmationToken,
    });

    return {
        user: newUser,
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
        const current_user = await this.userRepository.findOne({ email: createDoctorDto.email });

        if (current_user) {
          console.log(`This mail address ${createDoctorDto.email} is already existed!`);
          return {
            user: null,
            message: `This mail address ${createDoctorDto.email} is already existed!`,
            status: 400
          }

        }
      }
      const newDoctor = await this.doctorModel.create({
        _id: new Types.ObjectId(),
        thumbnail: createDoctorDto.thumbnail,
        doctor: new Types.ObjectId(createDoctorDto.doctor_id),

      });
    
    console.log(newDoctor)
    const confirmationToken = uuidv4();
    const newUser = await this.userModel.create({
        _id: new Types.ObjectId(),
        email: createDoctorDto.email,
        phone_number: createDoctorDto.phone_number,
        username: createDoctorDto.email,
        fullname: createDoctorDto.fullname,
        role: ERole.DOCTOR,
        is_verified: false,
        is_completed: false,
        doctor: newDoctor,
        confirmation_token: confirmationToken,

    });

    return {
        user: newUser,
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
}