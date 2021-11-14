import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import watch from './view.js';

const schema = yup.string().url();

const addProxy = (url) => `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${url}`;

const getRSSFeedData = (url) => axios.get(addProxy(url));

const parseRSS = (response) => {
  const parser = new DOMParser();
  const xmlString = response.data.contents;
  const parsedRSS = parser.parseFromString(xmlString, 'application/xml');
  if (parsedRSS.querySelector('parsererror') === null) {
    return parsedRSS;
  }
  throw new Error('notRSS');
};

const getFeed = (parsedRSS, url, state) => {
  if (state.urls.includes(url)) {
    return;
  }
  const feedTitle = parsedRSS.firstElementChild.firstElementChild.firstElementChild.textContent;
  const feedDescription = parsedRSS
    .firstElementChild.firstElementChild.children[1].textContent;
  const feed = {
    feedTitle,
    feedDescription,
    url,
  };
  state.feeds.unshift(feed);
  state.urls.unshift(url);
};

const getPost = (parsedRSS, url, state) => {
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
      activated: false,
    };
  });
  const post = {
    postList,
    url,
  };
  const targetPost = state.posts.filter((node) => node.url === post.url);
  if (targetPost.length === 0) {
    state.posts.unshift(post);
  } else {
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
    }
  }
};

const createInfoButtonsEvent = (state) => {
  const posts = document.getElementById('posts');
  posts.addEventListener('click', (e) => {
    if (e.target.className === 'btn btn-outline-primary') {
      const parentRaw = e.target.parentNode.parentNode;
      const link = parentRaw.querySelector('a');
      const title = link.textContent;
      state.posts.forEach((post) => {
        post.postList.forEach((list) => {
          if (list.postTitle === title) {
            list.read = true;
            list.activated = true;
          } else {
            list.activated = false;
          }
        });
      });
    }
  });
};

const getRSSFeed = (url, state) => schema.validate(url)
  .then(() => {
    state.form.processState = 'submitting';
  })
  .then(() => getRSSFeedData(url))
  .then((response) => {
    const parsedRSS = parseRSS(response);
    getPost(parsedRSS, url, state);
    getFeed(parsedRSS, url, state);
    createInfoButtonsEvent(state);
  })
  .then(() => {
    state.form.processState = 'success';
  });

const refreshFeed = (state) => {
  if (state.form.processState === 'success') {
    state.urls.forEach((url) => {
      getRSSFeed(url, state);
    });
    setTimeout(() => refreshFeed(state), 5000);
  }
};

const init = () => {
  const i18nextInstance = i18next.createInstance();

  i18nextInstance.init({
    lng: 'ru',
    debug: true,
    resources: {
      ru: {
        translation: {
          submitForm: {
            urlError: 'Ссылка должна быть валидным URL',
            notRSS: 'Ресурс не содержит валидный RSS',
            alreadyExists: 'RSS уже существует',
            networkError: 'Ошибка сети',
            added: 'RSS успешно загружен',
          },
        },
      },
    },
  });

  const state = {
    form: {
      processState: 'waiting',
      errors: {
        notRSS: null,
        notURL: null,
        exists: false,
      },
    },
    urls: [],
    feeds: [],
    posts: [],
  };

  const watchedState = watch(state, i18nextInstance);

  const form = document.body.querySelector('#rss-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    if (state.urls.includes(url)) {
      watchedState.form.errors.exists = true;
      return;
    }
    getRSSFeed(url, watchedState)
      .then(() => setTimeout(() => refreshFeed(watchedState), 5000))
      .catch((error) => {
        watchedState.form.processState = 'error';
        console.log(error.message);
        switch (error.message) {
          case 'notRSS':
            watchedState.form.errors.notRSS = error.message;
            break;
          case 'this must be a valid URL':
            watchedState.form.errors.notURL = error.message;
            break;
          default:
            console.log(error.message);
            watchedState.form.errors.networkError = error.message;
        }
      });
  });
};

export default init;
