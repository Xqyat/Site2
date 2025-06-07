// Filters

const filtersSection = document.querySelector('.filters');
  const type = filtersSection ? filtersSection.dataset.type : 'character';
  const containerSelector = `section.${type}s.cards`;
  const loadMoreBtn = document.querySelector(`.loadmore[data-type="${type}"]`);
  const baseUrl = loadMoreBtn ? loadMoreBtn.dataset.url : '';
  const searchInput = filtersSection.querySelector('input[type="text"]');
  const selects = filtersSection.querySelectorAll('select[data-filter]');




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
  if (type === 'character') {
    const speciesSet = await getAllUniqueFieldValues(baseUrl, 'species');
    const genderSet = await getAllUniqueFieldValues(baseUrl, 'gender');
    const statusSet = await getAllUniqueFieldValues(baseUrl, 'status');
    fillSelectOptions(filtersSection.querySelector('select[data-filter="species"]'), speciesSet);
    fillSelectOptions(filtersSection.querySelector('select[data-filter="gender"]'), genderSet);
    fillSelectOptions(filtersSection.querySelector('select[data-filter="status"]'), statusSet);
  } else if (type === 'location') {
    const typeSet = await getAllUniqueFieldValues(baseUrl, 'type');
    const dimensionSet = await getAllUniqueFieldValues(baseUrl, 'dimension');
    fillSelectOptions(filtersSection.querySelector('select[data-filter="type"]'), typeSet);
    fillSelectOptions(filtersSection.querySelector('select[data-filter="dimension"]'), dimensionSet);
  }
}


function getFilterParams() {
  const params = new URLSearchParams();
  const value = searchInput.value.trim();

  if (type === 'episode') {
    if (value) {
      if (/^S\d{2}E\d{2}$/i.test(value) || /^S\d{2}$/i.test(value)) {
        params.append('episode', value);
      } else {
        params.append('name', value);
      }
    }
  } else {
    if (value) params.append('name', value);
    selects.forEach(select => {
      const val = select.value;
      const filterType = select.dataset.filter;
      const defaultOption = select.querySelector('option[disabled]').textContent;
      if (filterType && val && val !== defaultOption) {
        params.append(filterType, val);
      }
    });
  }
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
