model NewCommentDto {
  postId: uint16;

  @minLength(1)
  body: string;
}

model EditCommentDto {
  postId?: uint16;

  @minLength(1)
  body?: string;
}

model Comment {
  @key
  id: uint16;

  authorId: uint16;
  postId: uint16;

  @minLength(1)
  body: string;
}

model Comments {
  comments: Comment[];
  total: uint16;
  skip: uint16;
  limit: uint16 = 30;
}
