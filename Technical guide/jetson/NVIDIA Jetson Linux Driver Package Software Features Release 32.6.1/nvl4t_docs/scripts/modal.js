// Modal behavior
//

var Modal = {};

Modal.Close = function () {
  'use strict';

  Connect.modal_container_div.style.display = "none";
};

Modal.Retry = function () {
  'use strict';

  location.reload();
};