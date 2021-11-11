import onChange from 'on-change';
import i18next from 'i18next';

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

const changeElementsAttributes = (id, attribute, status) => {
  const element = document.getElementById(id);
  if (status === false) {
    element.removeAttribute(attribute);
  }
  if (status === true) {
    element.setAttribute(attribute, '');
  }
};

export default (state) => onChange(state, (path, value) => {
  if (path === 'errors.notURL') {
    const feedback = document.querySelector('.feedback');
    changeFeedBack.danger(feedback);
    feedback.textContent = i18next.t('submitForm.urlError');
  }

  if (path === 'errors.notRSS') {
    const feedback = document.querySelector('.feedback');
    changeFeedBack.danger(feedback);
    feedback.textContent = i18next.t('submitForm.notRSS');
  }

  if (path === 'errors.exists') {
    const feedback = document.querySelector('.feedback');
    changeFeedBack.danger(feedback);
    feedback.textContent = i18next.t('submitForm.alreadyExists');
  }

  if (path === 'errors.networkError') {
    const feedback = document.querySelector('.feedback');
    changeFeedBack.danger(feedback);
    feedback.textContent = i18next.t('submitForm.networkError');
  }

  if (path === 'urls') {
    const feedback = document.querySelector('.feedback');
    changeFeedBack.succsess(feedback);
    feedback.textContent = i18next.t('submitForm.added');
    const form = document.getElementById('rss-form');
    const input = document.getElementById('url-input');
    form.reset();
    input.focus();
  }

  if (path === 'feeds') {
    const feeds = document.getElementById('feeds');
    feeds.innerHTML = '';
    const header = document.createElement('h3');
    header.textContent = 'Фиды';
    feeds.append(header);
    value.forEach((element) => {
      const title = document.createElement('p');
      const description = document.createElement('p');
      title.classList.add('m-0');
      description.classList.add('m-0');
      title.innerHTML = `<b>${element.feedTitle}</b>`;
      description.textContent = element.feedDescription;
      feeds.append(title);
      feeds.append(description);
    });
  }

  if (path === 'posts') {
    const posts = document.getElementById('posts');
    posts.innerHTML = '';
    const header = document.createElement('h3');
    header.textContent = 'Посты';
    posts.append(header);
    value.forEach((values) => {
      values.postList.forEach((post) => {
        const link = document.createElement('a');
        link.textContent = post.postTitle;
        link.href = post.postLink;
        if (post.read === false) {
          link.classList.add('fw-bold');
          link.classList.remove('fw-normal');
        } else {
          link.classList.add('fw-normal');
          link.classList.remove('fw-bold');
        }
        const button = document.createElement('button');
        button.type = 'button';
        button.classList.add('btn');
        button.classList.add('btn-outline-primary');
        button.dataset.bsToggle = 'modal';
        button.dataset.bsTarget = '#exampleModal';
        button.textContent = 'Просмотр';
        const divRow = document.createElement('div');
        divRow.classList.add('row');
        divRow.classList.add('my-3');
        const divCol1 = document.createElement('div');
        divCol1.classList.add('col-10');
        const divCol2 = document.createElement('div');
        divCol2.classList.add('col-2');
        divCol1.append(link);
        divCol2.append(button);
        divRow.append(divCol1, divCol2);
        posts.append(divRow);
      });
    });
  }

  if (path === 'attributes.urlInputReadonly') {
    changeElementsAttributes('url-input', 'disabled', value);
  }

  if (path === 'attributes.addButtonDisabled') {
    changeElementsAttributes('add', 'readonly', value);
  }
});
