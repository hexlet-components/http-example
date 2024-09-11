model User {
  @key
  id: string;

  @minLength(1)
  email: string;

  @minLength(1)
  firstName: string;

  @minLength(1)
  lastName: string;
}

model Users {
  users: User[];
  total: integer;
  skip: integer;
  limit: integer;
}
