import onChange from 'on-change';
import _ from 'lodash';

const state = {
  errors: null,
  urls: [],
};

const changeFeedBack = {
  danger: (elem) => {
    elem.classList.remove('text-success');
    elem.classList.add('text-danger');
  },
  succsess: (elem) => {
    elem.classList.remove('text-danger');
    elem.classList.add('text-success');
  },
};

const watchedState = onChange(state, (path, value, previousValue, applyData) => {
  if (path === 'errors') {
    console.log(value);
    const feedback = document.querySelector('.feedback');
    changeFeedBack.danger(feedback);
    feedback.textContent = value;
  }
  if (path === 'urls') {
    if (previousValue.includes(...applyData.args)) {
      const feedback = document.querySelector('.feedback');
      changeFeedBack.danger(feedback);
      feedback.textContent = 'RSS уже существует';
      state.urls = _.sortedUniq(state.urls);
    } else {
      const feedback = document.querySelector('.feedback');
      changeFeedBack.succsess(feedback);
      feedback.textContent = 'RSS успешно добавлен';
      const form = document.getElementById('rss-form');
      const input = document.getElementById('url-input');
      form.reset();
      input.focus();
    }
  }
});

export default watchedState;
