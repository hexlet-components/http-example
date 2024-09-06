model User {
  @key
  id: int32;

  @minLength(1)
  email: string;

  @minLength(1)
  password: string;

  @minLength(1)
  firstName: string;

  @minValue(0)
  age: int32;
}
