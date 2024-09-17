@example(
  #{
    email: "max@yahoo.com",
    firstName: "Max",
    lastName: "Maxwell"
  },
  #{ title: "New User" }
)
model NewUserDto {
  @minLength(1)
  email: string;

  @minLength(1)
  firstName: string;

  @minLength(1)
  lastName: string;
}

@example(
  #{
    email: "maria@yahoo.com",
    firstName: "Maria",
    lastName: "Marvel"
  },
  #{ title: "Edit User" }
)
model EditUserDto {
  @minLength(1)
  email?: string;

  @minLength(1)
  firstName?: string;

  @minLength(1)
  lastName?: string;
}

@example(
  #{
    id: "a788f3fc-0d47-4d55-b18b-09bae52dac7b",
    email: "max@yahoo.com",
    firstName: "Max",
    lastName: "Maxwell"
  },
  #{ title: "User" }
)
model User {
  @key
  id: string;

  @minLength(1)
  email: string;

  @minLength(1)
  firstName: string;

  @minLength(1)
  lastName: string;
}

model Users {
  users: User[];
  total: integer;
  skip: integer = 0;
  limit: integer = 30;
}
