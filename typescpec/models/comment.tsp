model CommentDto {
  authorId: string;
  postId: string;

  @minLength(1)
  body: string;
}

model Comment {
  @key
  id: string;

  authorId: string;
  postId: string;

  @minLength(1)
  body: string;
}

model Comments {
  comments: Comment[];
  total: integer;
  skip: integer;
  limit: integer = 30;
}
