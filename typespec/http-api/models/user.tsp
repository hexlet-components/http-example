model NewUserDto {
  @minLength(1)
  email: string;

  @minLength(1)
  firstName: string;

  @minLength(1)
  lastName: string;

  @minLength(1)
  password: string;
}

model EditUserDto {
  @minLength(1)
  email?: string;

  @minLength(1)
  firstName?: string;

  @minLength(1)
  lastName?: string;
}

model User {
  @key
  id: uint16;

  @minLength(1)
  email: string;

  @minLength(1)
  firstName: string;

  @minLength(1)
  lastName: string;
}

model Users {
  users: User[];
  total: uint16;
  skip: uint16 = 0;
  limit: uint16 = 30;
}
