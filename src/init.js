import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import _ from 'lodash';
import watch from './view.js';

const schema = yup.string().url();

const addProxy = (url) => `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${url}`;

const getRSSFeedData = (url) => axios.get(addProxy(url));

const getFeed = (parsedRSS, url) => {
  const feedTitle = parsedRSS.firstElementChild.firstElementChild.firstElementChild.textContent;
  const feedDescription = parsedRSS
    .firstElementChild.firstElementChild.children[1].textContent;
  const feed = {
    feedTitle,
    feedDescription,
    url,
  };
  return feed;
};

const getPost = (parsedRSS, url) => {
  const items = parsedRSS.querySelectorAll('item');
  const postList = Array.from(items).map((item) => {
    const title = item.querySelector('title').textContent;
    const link = item.querySelector('link').textContent;
    const description = item.querySelector('description').textContent;
    return {
      title,
      link,
      description,
      id: _.uniqueId(),
      read: false,
      activated: false,
    };
  });
  const post = {
    postList,
    url,
  };
  return post;
};

const getParseRSSdata = (response, url) => {
  const parser = new DOMParser();
  const xmlString = response.data.contents;
  const parsedRSS = parser.parseFromString(xmlString, 'application/xml');
  if (parsedRSS.querySelector('parsererror') === null) {
    const post = getPost(parsedRSS, url);
    const feed = getFeed(parsedRSS, url);
    return { post, feed };
  }
  throw new Error('notRSS');
};

const getUniquePosts = (post, state, url) => {
  const targetPost = state.posts.filter((node) => node.url === post.url);
  if (targetPost.length === 0) {
    return post;
  }
  const uniquePosts = post.postList.reduce((acc, node) => {
    const newPost = targetPost[0].postList
      .filter((targetNode) => targetNode.title === node.title);
    if (newPost.length === 0) {
      acc.push(node);
    }
    return acc;
  }, []);
  if (uniquePosts.length > 0) {
    const newPosts = { postList: uniquePosts, url };
    return newPosts;
  }
  return null;
};

const getRSSFeed = (url, state) => schema.validate(url)
  .then(() => {
    state.data.dataReceivingState = 'receiving';
  })
  .then(() => getRSSFeedData(url))
  .then((response) => {
    const parsedRSSdata = getParseRSSdata(response, url);
    const { post, feed } = parsedRSSdata;
    const uniquePosts = getUniquePosts(post, state, url);
    if (uniquePosts !== null) {
      state.posts.unshift(uniquePosts);
    }
    const urls = state.feeds.map((item) => item.url);
    if (!urls.includes(url)) {
      state.feeds.unshift(feed);
    }
  })
  .then(() => {
    state.data.dataReceivingState = 'success';
  });

const refreshFeed = (url, state) => {
  getRSSFeedData(url)
    .then((response) => {
      const parsedRSSdata = getParseRSSdata(response, url);
      const { post, feed } = parsedRSSdata;
      const uniquePosts = getUniquePosts(post, state, url);
      if (uniquePosts !== null) {
        state.feeds.unshift(uniquePosts);
      }
      const urls = state.feeds.map((item) => item.url);
      if (!urls.includes(url)) {
        state.feeds.unshift(feed);
      }
    })
    .then(() => setTimeout(() => refreshFeed(url, state), 5000));
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
      formState: 'filling',
      error: '',
    },
    data: {
      dataReceivingState: 'waiting',
      error: '',
    },
    feeds: [],
    posts: [],
    postRead: [],
    postActivated: null,
  };

  const watchedState = watch(state, i18nextInstance);

  const posts = document.getElementById('posts');
  posts.addEventListener('click', (e) => {
    if (e.target.className === 'btn btn-outline-primary') {
      const parentRaw = e.target.parentNode.parentNode;
      const link = parentRaw.querySelector('a');
      if (!state.postRead.includes(link.id)) {
        watchedState.postRead.push(link.id);
      }
      watchedState.postActivated = link.id;
    }
  });

  const form = document.body.querySelector('#rss-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    const urls = state.feeds.map((feed) => feed.url);
    if (urls.includes(url)) {
      watchedState.form.formState = 'invalid';
      watchedState.form.error = i18nextInstance.t('submitForm.alreadyExists');
      return;
    }
    getRSSFeed(url, watchedState)
      .then(() => setTimeout(() => refreshFeed(url, watchedState), 5000))
      .catch((error) => {
        switch (error.message) {
          case 'notRSS':
            watchedState.data.dataReceivingState = 'error';
            watchedState.form.error = i18nextInstance.t('submitForm.notRSS');
            break;
          case 'this must be a valid URL':
            watchedState.form.formState = 'invalid';
            watchedState.form.error = i18nextInstance.t('submitForm.urlError');
            break;
          default:
            watchedState.data.dataReceivingState = 'error';
            watchedState.form.error = i18nextInstance.t('submitForm.networkError');
        }
      });
  });
};

export default init;
