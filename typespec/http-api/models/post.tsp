model NewPostDto {
  @minLength(1)
  title: string;

  @minLength(1)
  body: string;
}

model EditPostDto {
  @minLength(1)
  title?: string;

  @minLength(1)
  body?: string;
}

// Все посты принадлежат автору 1. Мок статичный и не умеет отбирать записи по
// пути, поэтому /posts и /users/1/posts отдают один и тот же список, и общий
// автор не даёт им противоречить друг другу. Урок authentication показывает,
// что сервер подставляет authorId сам, узнав пользователя по токену.
@example(#{
  id: 1,
  authorId: 1,
  title: "How HTTP works",
  body: "Taking a request and a response apart: request line, headers, body",
})
model Post {
  @key
  id: uint16;

  authorId: uint16;

  @minLength(1)
  title: string;

  @minLength(1)
  body: string;
}

@example(#{
  posts: #[
    #{
      id: 1,
      authorId: 1,
      title: "How HTTP works",
      body: "Taking a request and a response apart: request line, headers, body",
    },
    #{
      id: 2,
      authorId: 1,
      title: "Status codes in practice",
      body: "How 401 differs from 403 and why 404 shows up more often than the rest",
    },
    #{
      id: 3,
      authorId: 1,
      title: "REST and RPC",
      body: "The same list of tasks served in two different ways",
    }
  ],
  total: 40,
  skip: 0,
  limit: 3,
})
model Posts {
  posts: Post[];
  total: uint16;
  skip: uint16;
  limit: uint16 = 30;
}
