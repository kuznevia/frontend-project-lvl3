import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import watch from './view.js';

const schema = yup.string().url();

const addProxy = (url) => new URL(`https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${url}`);

const getRSSFeedData = (url) => axios.get(addProxy(url));

const getPostData = (parsedRSS, url) => {
  const items = parsedRSS.querySelectorAll('item');
  const postList = Array.from(items).map((item) => {
    const title = item.querySelector('title').textContent;
    const link = item.querySelector('link').textContent;
    const description = item.querySelector('description').textContent;
    return {
      title,
      link,
      description,
    };
  });
  const post = {
    postList,
    url,
  };
  const feedTitle = parsedRSS.querySelector('title').textContent;
  const feedDescription = parsedRSS
    .firstElementChild.firstElementChild.children[1].textContent;
  const feed = {
    feedTitle,
    feedDescription,
    url,
  };
  return { post, feed };
};

const getParseRSSdata = (response, url) => {
  const parser = new DOMParser();
  const xmlString = response.data.contents;
  const parsedRSS = parser.parseFromString(xmlString, 'application/xml');
  if (parsedRSS.querySelector('parsererror') !== null) {
    throw new Error('this link does not contain RSS');
  }
  const { post, feed } = getPostData(parsedRSS, url);
  return { post, feed };
};

const getUniquePosts = (oldPost, newPost, url) => {
  const uniquePosts = newPost.postList.reduce((acc, node) => {
    const post = oldPost.postList
      .filter((targetNode) => targetNode.title === node.title);
    if (post.length === 0) {
      acc.push(node);
    }
    return acc;
  }, []);
  if (uniquePosts.length > 0) {
    return { postList: uniquePosts, url };
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
    state.feeds.unshift(feed);
    state.posts.unshift(post);
  })
  .then(() => {
    state.data.dataReceivingState = 'success';
  });

const refreshFeed = (url, state) => {
  getRSSFeedData(url)
    .then((response) => {
      const parsedRSSdata = getParseRSSdata(response, url);
      const { post } = parsedRSSdata;
      const [oldPost] = state.posts.filter((node) => node.url === post.url);
      const uniquePosts = getUniquePosts(oldPost, post, url);
      if (uniquePosts !== null) {
        state.posts.unshift(uniquePosts);
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
      error: null,
    },
    data: {
      dataReceivingState: 'waiting',
      error: null,
    },
    feeds: [],
    posts: [],
    readedPostTitles: [],
    activePostTitle: null,
  };

  const watchedState = watch(state, i18nextInstance);

  const posts = document.getElementById('posts');
  posts.addEventListener('click', (e) => {
    if (e.target.className === 'btn btn-outline-primary') {
      const parentRaw = e.target.parentNode.parentNode;
      const link = parentRaw.querySelector('a');
      if (!state.readedPostTitles.includes(link.title)) {
        watchedState.readedPostTitles.push(link.title);
      }
      watchedState.activePostTitle = link.title;
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
      watchedState.form.error = 'submitForm.alreadyExists';
      return;
    }
    getRSSFeed(url, watchedState)
      .then(() => setTimeout(() => refreshFeed(url, watchedState), 5000))
      .catch((error) => {
        switch (error.message) {
          case 'this link does not contain RSS':
            watchedState.data.dataReceivingState = 'error';
            watchedState.form.error = 'submitForm.notRSS';
            break;
          case 'this must be a valid URL':
            watchedState.form.formState = 'invalid';
            watchedState.form.error = 'submitForm.urlError';
            break;
          default:
            watchedState.data.dataReceivingState = 'error';
            watchedState.form.error = 'submitForm.networkError';
        }
      });
  });
};

export default init;
