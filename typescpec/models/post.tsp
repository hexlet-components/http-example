model Post {
  @key
  id: int32;

  userId: int32;

  @minLength(1)
  title: string;

  @minLength(1)
  body: string;
}
