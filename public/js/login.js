/* eslint-disable */
import axios from 'axios';
import showAlert from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    // console.log(res);
    // if user login go to /
    if (res.data.status === 'success') {
      showAlert('success', `${res.data.status} 👍`);
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    // console.log(err.response.data.message);
    showAlert('error', `❌ ${err.response.data.message}`);
  }
};

export const logout = async () => {
  try{
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout',
    });
    if(res.data.status === 'success'){
      showAlert('success' , 'Loggedout 👍');
      setTimeout(()=>{
        location.reload(true);
      },1500)
    }
  } catch(err){
    showAlert('error' , 'Error Logingout, please try again')
  }
};
