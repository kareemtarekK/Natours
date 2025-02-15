export const hideAlert = () => {
  const ele = document.querySelector('.alert');
  if (ele) ele.parentElement.removeChild(ele);
};
const showAlert = (type, msg) => {
  hideAlert();
  const marker = `<div class='alert alert--${type}'>${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', marker);
  window.setTimeout(() => {
    hideAlert();
  }, 5000);
};

export default showAlert;
