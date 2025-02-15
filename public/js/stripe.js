import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51QpBlX6LKyuAYvJiGsoTSXM8iBfIVc98Wei26OLBgz32r5MsLgFYgQpkW9M3V7PKRzo1X7pGsn0IGMqzuxtuL5qU00GLItjde3',
);

export const chargeCreditcard = async (tourId) => {
  try {
    // get session
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`,
    );
    console.log(session);
    // // charge creditcard number and send form
    console.log(session.data.data.session.id);
    await stripe.redirectToCheckout({
      sessionId: session.data.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err.message);
  }
};
