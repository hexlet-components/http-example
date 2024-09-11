model Comment {
  @key
  id: string;

  userId: string;
  postId: string;

  @minLength(1)
  body: string;
}

model Comments {
  comments: Comment[];
  total: integer;
  skip: integer;
  limit: integer;
}
