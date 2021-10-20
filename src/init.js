import * as yup from 'yup';
import i18next from 'i18next';
import watch from './view.js';

const schema = yup.string().url();

const init = () => {
  i18next.init({
    lng: 'ru',
    debug: true,
    resources: {
      ru: {
        translation: {
          submitForm: {
            urlError: 'Ссылка должна быть валидным URL',
            alreadyExists: 'RSS уже существует',
            added: 'RSS успешно добавлен',
          },
        },
      },
    },
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
