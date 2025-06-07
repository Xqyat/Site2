// Filters


const loadMoreBtn = document.querySelector('.loadmore');

const searchInput = document.querySelector('.filters input[type="text"]');
const selects = document.querySelectorAll('select[data-filter]');


const baseUrl = loadMoreBtn.dataset.url;
const containerSelector = 'section.characters.cards'; 
const type = 'character';



async function getAllUniqueFieldValues(apiUrl, field) {
  const valueSet = new Set();
  let url = apiUrl;

  while (url) {
    const response = await fetch(url);
    const data = await response.json();

    data.results.forEach(item => {
      if (item[field]) valueSet.add(item[field]);
    });

    url = data.info.next;
  }

  return valueSet;
}

function fillSelectOptions(selectElement, valuesSet) {
  valuesSet.forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    selectElement.appendChild(option);
  });
}

async function loadFilterOptions() {
  try {
    const speciesSet = await getAllUniqueFieldValues(baseUrl, 'species');
    const genderSet = await getAllUniqueFieldValues(baseUrl, 'gender');
    const statusSet = await getAllUniqueFieldValues(baseUrl, 'status');

    fillSelectOptions(document.querySelector('select[data-filter="species"]'), speciesSet);
    fillSelectOptions(document.querySelector('select[data-filter="gender"]'), genderSet);
    fillSelectOptions(document.querySelector('select[data-filter="status"]'), statusSet);
  } catch (err) {
    console.error('Ошибка загрузки фильтров:', err);
  }
}


function getFilterParams() {
  const params = new URLSearchParams();

  const name = searchInput.value.trim();
  if (name) params.append('name', name);

  selects.forEach(select => {
    const value = select.value;
    const filterType = select.dataset.filter;
    const defaultOption = select.querySelector('option[disabled]').textContent;
    if (filterType && value && value !== defaultOption) {
      params.append(filterType, value);
    }
  });

  return params.toString();
}


function loadAndRenderFiltered(url, containerSelector, type, loadMoreBtn, filters = '', clearContainer = true) {
  const fullUrl = filters ? `${url}?${filters}` : url;
  const container = document.querySelector(containerSelector);

  fetch(fullUrl)
    .then(response => response.json())
    .then(data => {
      if (clearContainer) {
        container.innerHTML = '';
      }

      data.results.forEach(item => {
        const card = createCard(item, type);
        container.appendChild(card);
      });

      loadMoreBtn.dataset.url = data.info.next;

      if (!data.info.next) {
        loadMoreBtn.style.display = 'none';
      } else {
        loadMoreBtn.style.display = 'block';
      }
    })
    .catch(error => {
      console.error('Ошибка:', error);
      container.innerHTML = '<p>Ничего не найдено.</p>';
      loadMoreBtn.style.display = 'none';
    });
}




function updateResults() {
  const filters = getFilterParams();
  loadAndRenderFiltered(baseUrl, containerSelector, type, loadMoreBtn, filters);
}

let debounceTimeout;
if(searchInput) {
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(updateResults, 500);
  });
}


selects.forEach(select => {
  select.addEventListener('change', updateResults);
});


if (loadMoreBtn) {
  loadMoreBtn.addEventListener('click', () => {
    const nextUrl = loadMoreBtn.dataset.url;
    if (nextUrl) {
      fetch(nextUrl)
        .then(response => response.json())
        .then(data => {
          const container = document.querySelector(containerSelector);
          data.results.forEach(item => {
            const card = createCard(item, type);
            container.appendChild(card);
          });
  
          loadMoreBtn.dataset.url = data.info.next;
  
          if (!data.info.next) {
            loadMoreBtn.style.display = 'none';
          }
        })
        .catch(error => console.error('Ошибка:', error));
      }
  });
}

document.querySelectorAll('.reset-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    const filterType = btn.dataset.reset;
    const select = document.querySelector(`select[data-filter="${filterType}"]`);
    if (select) {
      select.selectedIndex = 0;
      updateResults();
    }
  });
});


document.addEventListener('DOMContentLoaded', () => {
  loadFilterOptions();
});



// Cards
let nextUrl = 'https://rickandmortyapi.com/api/character';

function createCard(data, type) {
  let card, info, name;

  if (type === 'character') {
    card = document.createElement('article');
    card.className = 'characters__card card';

    const imageBox = document.createElement('div');
    imageBox.className = 'characters__card-image-box';

    const img = document.createElement('img');
    img.className = 'characters__card-image';
    img.src = data.image;
    img.alt = data.name;
    imageBox.appendChild(img);

    info = document.createElement('div');
    info.className = 'characters__card-info';

    name = document.createElement('h3');
    name.className = 'characters__card-name';
    name.textContent = data.name;

    const specie = document.createElement('span');
    specie.className = 'characters__card-other';
    specie.textContent = data.species;

    info.appendChild(name);
    info.appendChild(specie);

    card.appendChild(imageBox);
    card.appendChild(info);

  } else if (type === 'location') {
    card = document.createElement('article');
    card.className = 'locations__card card';

    info = document.createElement('div');
    info.className = 'locations__card-info';

    name = document.createElement('h3');
    name.className = 'locations__card-name';
    name.textContent = data.name;

    const dimension = document.createElement('span');
    dimension.className = 'locations__card-other';
    dimension.textContent = data.dimension;

    info.appendChild(name);
    info.appendChild(dimension);

    card.appendChild(info);

  } else if (type === 'episode') {
    card = document.createElement('article');
    card.className = 'episodes__card card';

    info = document.createElement('div');
    info.className = 'episodes__card-info';

    name = document.createElement('h3');
    name.className = 'episodes__card-name';
    name.textContent = data.name;

    const date = document.createElement('span');
    date.className = 'episodes__card-other';
    date.textContent = data.air_date;

    const serie = document.createElement('p');
    serie.className = 'episodes__card-serie';
    serie.textContent = data.episode;

    info.appendChild(name);
    info.appendChild(date);
    info.appendChild(serie);

    card.appendChild(info);
  }

  return card;
}


function loadAndRender(url, containerSelector, type, loadMoreBtn) {
  const container = document.querySelector(containerSelector);

  fetch(url)
    .then(response => response.json())
    .then(data => {
      data.results.forEach(item => {
        const card = createCard(item, type);
        container.appendChild(card);
      });

      loadMoreBtn.dataset.url = data.info.next;

      if (!loadMoreBtn.dataset.url) {
        loadMoreBtn.style.display = 'none';
      }
    })
    .catch(error => console.error('Ошибка:', error));
}


document.querySelectorAll('.loadmore').forEach(loadMoreBtn => {
  const type = loadMoreBtn.dataset.type;
  const containerSelector = `section.${type}s.cards`;
  let url = loadMoreBtn.dataset.url;

  loadAndRender(url, containerSelector, type, loadMoreBtn);

  loadMoreBtn.addEventListener('click', () => {
    const nextUrl = loadMoreBtn.dataset.url;
    if (nextUrl) {
      loadAndRender(nextUrl, containerSelector, type, loadMoreBtn);
    }
  });
});





// loader


// goback-btn
const goback = document.querySelector(".goback-btn");

if (goback) {
  goback.addEventListener("click", function () {
    history.back(); 
  });
}
