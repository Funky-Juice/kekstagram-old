'use strict';

(function() {

  var filtersForm = document.querySelector('.filters');

  filtersForm.classList.add('hidden');

  var picturesContainer = document.querySelector('.pictures');

  var templateElement = document.querySelector('#picture-template');

  if ('content' in templateElement) {
    var elementToClone = templateElement.content.querySelector('.picture');
  } else {
    elementToClone = templateElement.querySelector('.picture');
  }

  /** @constant {number} */
  var IMAGE_LOAD_TIMEOUT = 10000;

  /** @constant {string} */
  var PICTURES_LOAD_URL = '//o0.github.io/assets/json/pictures.json';

  /** @type {Array.<Object>} */
  var pictures = [];

  /** @enum {number} */
  var Filter = {
    'POPULAR': 'filter-popular',
    'NEW': 'filter-new',
    'DISCUSSED': 'filter-discussed'
  };

  /** @constant {Filter} */
  var DEFAULT_FILTER = Filter.POPULAR;

  /** @constant {number} */
  var DAYS_FILTER_COUNT = 14;

  /**
   * @param {Object} data
   * @param {HTMLElement} container
   * @return {HTMLElement}
   */
  var getPictureElement = function(data, container) {
    var pictureElement = elementToClone.cloneNode(true);

    var contentImage = new Image();
    var contentLoadTimeout;

    /** @param {ProgressEvent} evt */
    contentImage.onload = function() {
      clearTimeout(contentLoadTimeout);

      pictureElement.querySelector('img').src = data.url;
    };

    contentImage.onerror = function() {
      pictureElement.classList.add('picture-load-failure');
    };

    contentImage.src = data.url;

    contentLoadTimeout = setTimeout(function() {
      contentImage.src = '';
      pictureElement.classList.add('picture-load-failure');
    }, IMAGE_LOAD_TIMEOUT);

    container.appendChild(pictureElement);
    return pictureElement;
  };

  picturesContainer.classList.add('pictures-loading');

  /** @param {Array.<Object>} filteredPictures */
  var renderPictures = function(filteredPictures) {
    picturesContainer.innerHTML = '';

    filteredPictures.forEach(function(picture) {
      getPictureElement(picture, picturesContainer);
    });
  };

  /**
   * @param {Array.<Object>} sortPictures
   * @param {Filter} filter
   */
  var getFilteredPictures = function(sortPictures, filter) {
    var picturesToFilter = sortPictures.slice(0);

    switch (filter) {
      case Filter.POPULAR:
        picturesToFilter.sort(function(a, b) {
          return b.likes - a.likes;
        });
        break;

      case Filter.NEW:
        var a = new Date();
        a.setDate(a.getDate() - DAYS_FILTER_COUNT);
        picturesToFilter = picturesToFilter.filter(function(b) {
          return Date.parse(b.date) - a > 0;
        }).sort(function(x, y) {
          return Date.parse(y.date) - Date.parse(x.date);
        });
        break;

      case Filter.DISCUSSED:
        picturesToFilter.sort(function(a, b) {
          return b.comments - a.comments;
        });
        break;
    }

    return picturesToFilter;
  };

  /** @param {Filter} filter */
  var setFilterEnabled = function(filter) {
    var filteredPictures = getFilteredPictures(pictures, filter);
    renderPictures(filteredPictures);
  };

  /** @param {boolean} enabled */
  var setFiltersEnabled = function() {
    var filters = filtersForm.querySelectorAll('.filters-radio');
    for (var i = 0; i < filters.length; i++) {
      filters[i].onclick = function() {
        setFilterEnabled(this.id);
      };
    }
  };

  /** @param {function(Array.<Object>)} callback */
  var getPictures = function(callback) {
    var xhr = new XMLHttpRequest();

    xhr.timeout = IMAGE_LOAD_TIMEOUT;

    /** @param {ProgressEvent} */
    xhr.onload = function(evt) {
      var loadedData = JSON.parse(evt.target.response);
      callback(loadedData);
    };

    xhr.onerror = function() {
      picturesContainer.classList.add('pictures-failure');
    };

    xhr.ontimeout = function() {
      picturesContainer.classList.add('pictures-failure');
    };

    xhr.open('GET', PICTURES_LOAD_URL, true);
    xhr.send();
  };

  getPictures(function(loadedPictures) {
    pictures = loadedPictures;
    setFiltersEnabled(true);
    setFilterEnabled(DEFAULT_FILTER);
  });

  picturesContainer.classList.remove('pictures-loading');

  filtersForm.classList.remove('hidden');
})();
