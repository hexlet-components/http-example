// Пользователи демонстрационного сервера.
//
// Первые три приведены дословно в уроке example курса http-api, включая адреса
// и имена: урок печатает их как ответ `/users` и как пример работы параметра
// select. Менять эти три записи нельзя, не правя урок.
//
// Всего их десять, и это тоже из урока: он объясняет пагинацию на том, что
// `total` равен 10, а `?skip=30` отдаёт пустую страницу.
export default [
  { id: 1, email: 'max@hotmail.com', firstName: 'Allison', lastName: 'Bernier' },
  { id: 2, email: 'Colt97@yahoo.com', firstName: 'Hudson', lastName: 'Schowalter' },
  { id: 3, email: 'Landen50@gmail.com', firstName: 'Reinhold', lastName: 'Langosh' },
  { id: 4, email: 'Marcus.Kunde@hotmail.com', firstName: 'Marcus', lastName: 'Kunde' },
  { id: 5, email: 'Elena_Padberg@yahoo.com', firstName: 'Elena', lastName: 'Padberg' },
  { id: 6, email: 'Oscar.Runolfsson@gmail.com', firstName: 'Oscar', lastName: 'Runolfsson' },
  { id: 7, email: 'Nadia_Hessel@outlook.com', firstName: 'Nadia', lastName: 'Hessel' },
  { id: 8, email: 'Felix.Wiegand@yahoo.com', firstName: 'Felix', lastName: 'Wiegand' },
  { id: 9, email: 'Iris_Turcotte@gmail.com', firstName: 'Iris', lastName: 'Turcotte' },
  { id: 10, email: 'Damian.Volkman@hotmail.com', firstName: 'Damian', lastName: 'Volkman' },
];
