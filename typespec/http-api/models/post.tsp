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
  title: "Как устроен HTTP",
  body: "Разбираем запрос и ответ по частям: строка запроса, заголовки, тело",
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
      title: "Как устроен HTTP",
      body: "Разбираем запрос и ответ по частям: строка запроса, заголовки, тело",
    },
    #{
      id: 2,
      authorId: 1,
      title: "Коды ответов на практике",
      body: "Чем 401 отличается от 403 и почему 404 приходит чаще остальных",
    },
    #{
      id: 3,
      authorId: 1,
      title: "REST и RPC",
      body: "Один и тот же список задач двумя разными способами",
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
