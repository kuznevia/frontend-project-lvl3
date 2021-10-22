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
            notRSS: 'Ресурс не содержит валидный RSS',
            alreadyExists: 'RSS уже существует',
            added: 'RSS успешно добавлен',
          },
        },
      },
    },
  });

  const form = document.getElementById('rss-form');
  let id = 1;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    try {
      schema.validateSync(url);
      axios.get(url)
        .then((response) => {
          const contentType = response.headers['content-type'].split(';')[0];
          if (!contentType.includes('rss')) {
            throw new Error(i18next.t('submitForm.notRSS'));
          }
          const parser = new DOMParser();
          const xmlString = response.data;
          const doc1 = parser.parseFromString(xmlString, 'application/xml');
          const feedTitle = doc1.firstElementChild.firstElementChild.firstElementChild.textContent;
          const feedDescription = doc1
            .firstElementChild.firstElementChild.children[1].textContent;
          const feed = {
            feedTitle,
            feedDescription,
            id,
          };
          const items = doc1.querySelectorAll('item');
          const postList = Array.from(items).map((item) => {
            const postTitle = item.querySelector('title').textContent;
            const postLink = item.querySelector('link').textContent;
            const postDescription = item.querySelector('description').textContent;
            return {
              postTitle,
              postLink,
              postDescription,
            };
          });
          const post = {
            postList,
            id,
          };
          watch.urls.push(url);
          watch.feeds.push(feed);
          watch.posts.push(post);
          id += 1;
        })
        .catch((error) => {
          watch.errors.notRSS = error.message;
          console.log(error.message);
        });
    } catch (error) {
      watch.errors.notURL = error.errors;
    }
  });
};

export default init;
