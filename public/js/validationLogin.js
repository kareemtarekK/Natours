export const validationLogin = () => {
  const password = document.querySelector('#password');
  const email = document.querySelector('input[type=email]');
  password.oninput = () => {
    if (password.value.length >= 8) {
      password.style.borderBottom = '3px solid #55c57a';
    } else {
      password.style.borderBottom = '3px solid orangered';
    }
  };
  email.oninput = () => {
    let regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.value)
      ? (email.style.borderBottom = '3px solid #55c57a')
      : (email.style.borderBottom = '3px solid orangered');
  };
};
