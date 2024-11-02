model NewCourseDto {
  @minLength(1)
  title: string;

  @minLength(1)
  description: string;

}

model EditCourseDto {
  @minLength(1)
  title?: string;

  @minLength(1)
  description?: string;
}

model Course {
  @key
  id: uint16;

  @minLength(1)
  title: string;

  @minLength(1)
  description: string;

}

model Courses {
  courses: Course[];
  total: uint16;
  skip: uint16 = 0;
  limit: uint16 = 30;
}
