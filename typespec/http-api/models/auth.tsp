model AuthData {
  @minLength(1)
  email: string;

  @minLength(1)
  password: string;
}

// Этот же токен приведён в уроке authentication как пример ответа /login.
// Сервер демонстрационный и значение не проверяет, важна только форма.
@example(#{
  token: "r4AR4Fo0j29s9mFk4IUVA2rGTQmIrHWlioifaJLSQQYHbTXHxtSLFUVp8PANrRoAb7fgkSsbN7lt4a86pcJ07ivUpxBLyyCHaY4Pp9I7hRPphCHM7xpZ1om1",
})
model AuthToken {
  @minLength(1)
  token: string;
}
