import { Controller, Get, Post, Body, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new review' })
  create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(createReviewDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews' })
  findAll() {
    return this.reviewsService.findAll();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Find all reviews by a specific user (for administrators only)' })
  findByUserId(@Param('userId') userId: string) {
    return this.reviewsService.findByUserId(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a review by its ID (for administrators only)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.remove(id);
  }
}
