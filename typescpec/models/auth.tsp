model AuthData {
  @minLength(1)
  login: string;

  @minLength(1)
  password: string;
}

model AuthToken {
  @minLength(1)
  token: string;
}
