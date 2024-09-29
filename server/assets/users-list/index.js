async function fetchUsers() {
  const response = await fetch('/users');

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('403');
    }
    throw new Error('Ошибка при загрузке данных');
  }

  const data = await response.json();
  return data.users;
}

async function loadUsers() {
  const loadDataBtn = document.getElementById('loadDataBtn');
  const userList = document.getElementById('userList');
  const loadingMessage = document.createElement('p');
  loadingMessage.textContent = 'Загрузка пользователей...';
  document.body.appendChild(loadingMessage);

  loadDataBtn.disabled = true;
  loadDataBtn.textContent = 'Загрузка...';

  try {
    const users = await fetchUsers();
    userList.innerHTML = '';
    const fragment = document.createDocumentFragment();

    users.forEach(user => {
      const listItem = document.createElement('li');
      listItem.textContent = `${user.firstName} ${user.lastName} (${user.email})`;
      fragment.appendChild(listItem);
    });

    userList.appendChild(fragment);
  } catch (error) {
    handleError(error);
  } finally {
    if (loadingMessage.parentNode) {
      document.body.removeChild(loadingMessage);
    }
    loadDataBtn.disabled = false;
    loadDataBtn.textContent = 'Загрузить пользователей';
  }
}

function handleError(error) {
  console.error('Ошибка при загрузке пользователей:', error);
  if (error.message === '403') {
    const header = document.createElement('h2');
    header.textContent = 'Доступ ограничен';
    document.body.appendChild(header);
  }
}

window.addEventListener('DOMContentLoaded', loadUsers);
document.getElementById('loadDataBtn').addEventListener('click', loadUsers);
