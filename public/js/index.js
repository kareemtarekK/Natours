import { mapbox } from './mapbox';
import { login, logout } from './login';
import { signup } from './signup';
import { validationLogin } from './validationLogin';
import { validationSignup } from './validationSignup';
import { updateSettings } from './settings';
import { chargeCreditcard } from './stripe';
import '@babel/polyfill';

const map = document.getElementById('map');
if (map) {
  const locations = JSON.parse(map.dataset.locations);
  mapbox(locations);
}

const form = document.querySelector('.form__content');
const name = document.getElementById('name');

if (form) {
  if (!name) {
    validationLogin();
  } else {
    validationSignup();
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if (!name) {
      login(email, password);
    } else {
      const name = document.getElementById('name').value;
      const passwordConfirm = document.getElementById('confirm-password').value;
      signup(name, email, password, passwordConfirm);
    }
  });
}

const logoutBtn = document.querySelector('.logout');
if (logoutBtn) logoutBtn.addEventListener('click', logout);

const dataForm = document.querySelector('.right_details');
if (dataForm)
  dataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    updateSettings(form, 'data');
  });

const passwordForm = document.querySelector('.password_change');
if (passwordForm)
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('current_password').value;
    const password = document.getElementById('new_pasword').value;
    const passwordConfirm = document.getElementById('confirm_password').value;
    document.querySelector('.save_password').textContent = 'UPDATING.....';
    await updateSettings(
      { currentPassword, password, passwordConfirm },
      'password',
    );
    document.getElementById('current_password').value = '';
    document.getElementById('new_pasword').value = '';
    document.getElementById('confirm_password').value = '';
    document.querySelector('.save_password').textContent = 'SAVE PASSWORD';
  });

const buyBtn = document.querySelector('.book__tour');
// console.log(buyBtn);
if (buyBtn)
  buyBtn.addEventListener('click', (e) => {
    e.target.textContent = 'processing.....';
    const { tourId } = e.target.dataset;
    console.log(tourId);
    chargeCreditcard(tourId);
  });
