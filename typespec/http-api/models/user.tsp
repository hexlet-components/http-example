model NewUserDto {
  @minLength(1)
  email: string;

  @minLength(1)
  firstName: string;

  @minLength(1)
  lastName: string;

  @minLength(1)
  password: string;
}

model EditUserDto {
  @minLength(1)
  email?: string;

  @minLength(1)
  firstName?: string;

  @minLength(1)
  lastName?: string;
}

// Пользователь 1 это max@hotmail.com, тот же, под которым логинятся в уроке
// authentication. Первые два пользователя списка приведены в уроке example
// дословно, поэтому имена и адреса здесь менять нельзя.
@example(#{
  id: 1,
  email: "max@hotmail.com",
  firstName: "Allison",
  lastName: "Bernier",
})
model User {
  @key
  id: uint16;

  @minLength(1)
  email: string;

  @minLength(1)
  firstName: string;

  @minLength(1)
  lastName: string;
}

@example(#{
  users: #[
    #{ id: 1, email: "max@hotmail.com", firstName: "Allison", lastName: "Bernier" },
    #{ id: 2, email: "Colt97@yahoo.com", firstName: "Hudson", lastName: "Schowalter" },
    #{ id: 3, email: "Reyna_Bahringer@gmail.com", firstName: "Reyna", lastName: "Bahringer" },
    #{ id: 4, email: "Marcus.Kunde@hotmail.com", firstName: "Marcus", lastName: "Kunde" },
    #{ id: 5, email: "Elena_Padberg@yahoo.com", firstName: "Elena", lastName: "Padberg" },
    #{ id: 6, email: "Oscar.Runolfsson@gmail.com", firstName: "Oscar", lastName: "Runolfsson" },
    #{ id: 7, email: "Nadia_Hessel@outlook.com", firstName: "Nadia", lastName: "Hessel" },
    #{ id: 8, email: "Felix.Wiegand@yahoo.com", firstName: "Felix", lastName: "Wiegand" },
    #{ id: 9, email: "Iris_Turcotte@gmail.com", firstName: "Iris", lastName: "Turcotte" },
    #{ id: 10, email: "Damian.Volkman@hotmail.com", firstName: "Damian", lastName: "Volkman" }
  ],
  total: 10,
  skip: 0,
  limit: 30,
})
model Users {
  users: User[];
  total: uint16;
  skip: uint16 = 0;
  limit: uint16 = 30;
}
