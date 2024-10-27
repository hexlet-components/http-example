import "../../examples/comments.tsp";

@example(
  newCommentDtoExample,
  #{ title: "New comment" }
)
model NewCommentDto {
  postId: string;

  @minLength(1)
  body: string;
}

@example(
  editCommentDtoExample,
  #{ title: "Edit comment" }
)
model EditCommentDto {
  postId?: string;

  @minLength(1)
  body?: string;
}

@example(
  commentExample,
  #{ title: "Comment" }
)
model Comment {
  @key
  id: string;

  authorId: string;
  postId: string;

  @minLength(1)
  body: string;
}

@example(
  #{
    comments: commentsExample,
    total: totalCommentsExample,
    skip: skipCommentsExample,
    limit: limitCommentsExample,
 },
  #{ title: "Comments" }
)
model Comments {
  comments: Comment[];
  total: integer;
  skip: integer;
  limit: integer = 30;
}
