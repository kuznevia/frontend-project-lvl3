import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import watch from './view.js';

const schema = yup.string().url();

const getRSSFeed = (url) => axios.get(`https://hexlet-allorigins.herokuapp.com/raw?disableCache=true&url=${url}`);

const parseRSS = (response) => {
  const parser = new DOMParser();
  const xmlString = response.data;
  return parser.parseFromString(xmlString, 'application/xml');
};

const getFeed = (parsedRSS, url) => {
  const feedTitle = parsedRSS.firstElementChild.firstElementChild.firstElementChild.textContent;
  const feedDescription = parsedRSS
    .firstElementChild.firstElementChild.children[1].textContent;
  return {
    feedTitle,
    feedDescription,
    url,
  };
};

const getPost = (parsedRSS, url) => {
  const items = parsedRSS.querySelectorAll('item');
  const postList = Array.from(items).map((item) => {
    const postTitle = item.querySelector('title').textContent;
    const postLink = item.querySelector('link').textContent;
    const postDescription = item.querySelector('description').textContent;
    return {
      postTitle,
      postLink,
      postDescription,
      read: false,
    };
  });
  return {
    postList,
    url,
  };
};

const createInfoButtonsEvent = (state) => {
  const infoButtons = document.querySelectorAll('.btn-info');
  infoButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const parentRaw = button.parentNode.parentNode;
      const link = parentRaw.querySelector('a');
      const title = link.textContent;
      state.posts.forEach((post) => {
        post.postList.forEach((list) => {
          if (list.postTitle === title) {
            console.log(list.read);
            list.read = true;
            console.log(list.read);
            const modalHeader = document.getElementById('exampleModalLabel');
            const modalBody = document.querySelector('.modal-body');
            const modalLink = document.querySelector('.modal-link');
            modalHeader.textContent = list.postTitle;
            modalBody.textContent = list.postDescription;
            modalLink.href = list.postLink;
          }
        });
      });
    });
  });
};

const refreshRSSFeed = (state) => {
  state.urls.forEach((url) => {
    getRSSFeed(url)
      .then((response) => {
        const parsedRSS = parseRSS(response);
        const post = getPost(parsedRSS, url);
        const targetPost = state.posts.filter((node) => node.url === post.url);
        const uniquePosts = post.postList.reduce((acc, node) => {
          const newPost = targetPost[0].postList
            .filter((targetNode) => targetNode.postTitle === node.postTitle);
          if (newPost.length === 0) {
            acc.push(node);
          }
          return acc;
        }, []);
        if (uniquePosts.length > 0) {
          const newPosts = { postList: uniquePosts, url };
          state.posts.unshift(newPosts);
        } else {
          console.log('nothing to refresh');
        }
        createInfoButtonsEvent(state);
        console.log('refresh finished');
      })
      .then(() => setTimeout(() => refreshRSSFeed(state), 5000));
  });
};

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

  const state = {
    errors: {
      notRSS: null,
      notURL: null,
      exists: false,
    },
    urls: [],
    feeds: [],
    posts: [],
  };

  const watchedState = watch(state);

  const form = document.getElementById('rss-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    if (state.urls.includes(url)) {
      watchedState.errors.exists = true;
      return;
    }
    try {
      schema.validateSync(url);
      getRSSFeed(url)
        .then((response) => {
          const contentType = response.headers['content-type'].split(';')[0];
          if (!contentType.includes('rss')) {
            throw new Error(i18next.t('submitForm.notRSS'));
          }
          const parsedRSS = parseRSS(response);
          const feed = getFeed(parsedRSS, url);
          const post = getPost(parsedRSS, url);
          watchedState.urls.push(url);
          watchedState.feeds.push(feed);
          watchedState.posts.push(post);
          createInfoButtonsEvent(watchedState);
        })
        .then(() => setTimeout(() => refreshRSSFeed(watchedState), 5000))
        .catch((error) => {
          watchedState.errors.notRSS = error.message;
        });
    } catch (error) {
      watchedState.errors.notURL = error.errors;
    }
  });
};

export default init;
