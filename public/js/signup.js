import axios from 'axios';
import showAlert from './alerts';

export const signup = async (name, email, password, passwordConfirm) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirm,
      },
    });
    // console.log(res);
    if(res.data.status === 'success'){
        showAlert('success' , 'signed up 👍');
        window.setTimeout(()=>{
            location.assign('/');
        },1500);
    }
  } catch (err) {
    // console.log(err.response.data.message);
    showAlert('error' , 'Duplaction Error. There is email already exist ❌')
  }
};


