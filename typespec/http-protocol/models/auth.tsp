model AuthData {
  @minLength(1)
  email: string;

  @minLength(1)
  password: string;
}

model AuthToken {
  @minLength(1)
  token: string;
}
