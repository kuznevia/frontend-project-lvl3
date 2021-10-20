import * as yup from 'yup';
import i18next from 'i18next';
import watch from './view.js';

const schema = yup.string().url('Ссылка должна быть валидным URL');

const init = () => {
  i18next.init({
    lng: 'ru',
    debug: true,
  });

  const form = document.getElementById('rss-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    try {
      schema.validateSync(url);
      watch.urls.push(url);
    } catch (error) {
      watch.errors = error.errors;
    }
  });
};

export default init;
