import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reviews } from './entities/review.entity'; // Asume que tu entidad se llama Reviews
import { Users } from '../users/entities/user.entity'; // Asume que tu entidad se llama Users

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Reviews)
    private reviewsRepository: Repository<Reviews>,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<Reviews> {
    const user = await this.usersRepository.findOne({ where: { id: createReviewDto.userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${createReviewDto.userId} not found`);
    }

    const newReview = this.reviewsRepository.create({
      comment: createReviewDto.comment,
      rating: createReviewDto.rating,
      user: user,
    });

    return this.reviewsRepository.save(newReview);
  }

  async findAll(): Promise<Reviews[]> {
    return this.reviewsRepository.find({ relations: ['user'] });
  }

  async findByUserId(userId: string): Promise<Reviews[]> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return this.reviewsRepository.find({ where: { user: { id: userId } }, relations: ['user'] });
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.reviewsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    return { message: `Review with ID ${id} successfully deleted` };
  }
}
