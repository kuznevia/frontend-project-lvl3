import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
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
    axios.get(url)
      .then((response) => {
        const contentType = response.headers['content-type'].split(';')[0];
        if (!contentType.includes('rss')) {
          throw new Error('HI THERE!');
        }
        const parser = new DOMParser();
        const xmlString = response.data;
        const doc1 = parser.parseFromString(xmlString, 'application/xml');
        console.log(doc1);
      })
      .catch(console.log);
  });
};

export default init;
